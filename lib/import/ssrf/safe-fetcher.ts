/**
 * SafeFetcher (I2.3, M5) — triển khai `SafeFetcher` (cổng `lib/import/ports.ts`).
 *
 * Ghép các lớp bảo vệ SSRF cho luồng tải nội dung:
 * - L1/L2/L5/L7: gọi lại `UrlValidator` cho **mỗi** hop (không tin URL client/nguồn).
 * - L3/L4: `resolveAndVerify` (resolve-once, kiểm MỌI địa chỉ) + `pinnedRequest` (pin IP).
 * - L6: **KHÔNG** auto-follow redirect; tự theo ≤ `maxRedirects`, kiểm lại + pin lại mỗi hop,
 *   phát hiện loop, chặn hạ cấp scheme.
 * - L8: timeout (ngân sách tổng), trần body theo **byte sau giải nén** (chống compression
 *   bomb), allow-list content-type.
 * - L10: KHÔNG gửi `Cookie`/`Authorization`/header nhạy cảm (kể cả khi redirect khác domain).
 * - L11: mọi lỗi trả mã AN TOÀN — không lộ IP/DNS/stack.
 *
 * KHÔNG thực thi JavaScript, KHÔNG tải ảnh/tài nguyên phụ (chỉ tài liệu HTML).
 */

import zlib from "node:zlib";

import type { SafeFetcher, UrlValidator } from "../ports";
import type { SafeFetchFailureReason, SafeFetchRequest, SafeFetchResult } from "../fetch";
import { SystemDnsResolver, resolveAndVerify, type DnsResolver, type DnsVerificationResult } from "./dns";
import {
  pinnedRequest,
  type PinnedRequestOptions,
  type PinnedRequestResult,
} from "./pinned-request";
import { SsrfUrlValidator } from "./url-validator";

/** Cổng resolve+xác minh đích (tiêm được) — mặc định dùng `resolveAndVerify`. */
export type TargetResolver = (hostname: string) => Promise<DnsVerificationResult>;
/** Cổng HTTP request đã pin IP (tiêm được) — mặc định `pinnedRequest`. */
export type PinnedRequester = (options: PinnedRequestOptions) => Promise<PinnedRequestResult>;

export interface SafeFetcherDeps {
  validator?: UrlValidator;
  resolver?: DnsResolver;
  targetResolver?: TargetResolver;
  requester?: PinnedRequester;
  maxRedirects?: number;
  timeoutMs?: number;
  maxBytes?: number;
  allowedContentTypes?: readonly string[];
  requireHttps?: boolean;
}

const DEFAULT_MAX_REDIRECTS = 5;
const DEFAULT_TIMEOUT_MS = 10_000;
const DEFAULT_MAX_BYTES = 2 * 1024 * 1024; // 2 MiB sau giải nén
const DEFAULT_ALLOWED_CONTENT_TYPES: readonly string[] = ["text/html", "application/xhtml+xml"];

/**
 * Header gửi đi — CHỈ các header trung tính. Tuyệt đối không `Cookie`/`Authorization`.
 * `Accept-Encoding: identity` để chủ động từ chối nén (giảm bề mặt compression bomb).
 */
const SAFE_REQUEST_HEADERS: Readonly<Record<string, string>> = Object.freeze({
  accept: "text/html,application/xhtml+xml;q=0.9,*/*;q=0.1",
  "accept-encoding": "identity",
  "user-agent": "WALECookingBot/0.1 (+https://wale-cooking.local/bot)",
});

/** Các mã lỗi `pinnedRequest` → mã lỗi `SafeFetch` (ánh xạ 1-1, an toàn). */
const PINNED_FAILURE_MAP: Readonly<Record<string, SafeFetchFailureReason>> = {
  TIMEOUT: "TIMEOUT",
  BODY_TOO_LARGE: "BODY_TOO_LARGE",
  CONNECT_FAILED: "CONNECT_FAILED",
  TLS_FAILED: "TLS_FAILED",
};

function fail(reason: SafeFetchFailureReason, message: string): SafeFetchResult {
  return { ok: false, reason, message };
}

type DecodeOutcome = { ok: true; body: Buffer } | { ok: false; reason: SafeFetchFailureReason };

/**
 * Giải nén theo `content-encoding` với **trần byte sau giải nén** (chống compression bomb).
 * Không rõ encoding ⇒ fail-closed (`UNSUPPORTED_CONTENT_TYPE`). Dữ liệu hỏng/vượt trần
 * ⇒ `DECOMPRESSION_LIMIT`.
 */
export function decodeBody(
  raw: Buffer,
  contentEncoding: string | undefined,
  maxBytes: number,
): DecodeOutcome {
  const encoding = (contentEncoding ?? "").split(",")[0]!.trim().toLowerCase();
  if (encoding === "" || encoding === "identity" || encoding === "none") {
    return raw.length > maxBytes
      ? { ok: false, reason: "DECOMPRESSION_LIMIT" }
      : { ok: true, body: raw };
  }
  const options = { maxOutputLength: maxBytes };
  try {
    if (encoding === "gzip" || encoding === "x-gzip") return { ok: true, body: zlib.gunzipSync(raw, options) };
    if (encoding === "deflate") return { ok: true, body: zlib.inflateSync(raw, options) };
    if (encoding === "br") return { ok: true, body: zlib.brotliDecompressSync(raw, options) };
    return { ok: false, reason: "UNSUPPORTED_CONTENT_TYPE" };
  } catch {
    // Vượt `maxOutputLength` hoặc dữ liệu nén hỏng ⇒ fail-closed.
    return { ok: false, reason: "DECOMPRESSION_LIMIT" };
  }
}

/** Lấy content-type "gốc" (bỏ tham số như `; charset=...`), hạ chữ thường. */
export function baseContentType(value: string | undefined): string {
  return (value ?? "").split(";")[0]!.trim().toLowerCase();
}

export class SafeFetcherImpl implements SafeFetcher {
  private readonly validator: UrlValidator;
  private readonly targetResolver: TargetResolver;
  private readonly requester: PinnedRequester;
  private readonly maxRedirects: number;
  private readonly timeoutMs: number;
  private readonly maxBytes: number;
  private readonly allowedContentTypes: readonly string[];
  private readonly requireHttps: boolean;

  constructor(deps: SafeFetcherDeps = {}) {
    this.validator = deps.validator ?? new SsrfUrlValidator();
    const resolver = deps.resolver ?? new SystemDnsResolver();
    this.targetResolver = deps.targetResolver ?? ((hostname) => resolveAndVerify(hostname, resolver));
    this.requester = deps.requester ?? pinnedRequest;
    this.maxRedirects = deps.maxRedirects ?? DEFAULT_MAX_REDIRECTS;
    this.timeoutMs = deps.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    this.maxBytes = deps.maxBytes ?? DEFAULT_MAX_BYTES;
    this.allowedContentTypes = deps.allowedContentTypes ?? DEFAULT_ALLOWED_CONTENT_TYPES;
    this.requireHttps = deps.requireHttps ?? true;
  }

  async fetch(request: SafeFetchRequest): Promise<SafeFetchResult> {
    const maxRedirects = request.maxRedirects ?? this.maxRedirects;
    const timeoutMs = request.timeoutMs ?? this.timeoutMs;
    const maxBytes = request.maxBytes ?? this.maxBytes;
    const allowed = request.allowedContentTypes ?? this.allowedContentTypes;
    const requireHttps = request.requireHttps ?? this.requireHttps;

    const deadline = Date.now() + timeoutMs;
    const visited = new Set<string>();
    const redirectChain: string[] = [];
    let currentUrl = request.url;

    for (let hop = 0; hop <= maxRedirects; hop += 1) {
      // L1/L2/L5/L7 — kiểm lại ở MỖI hop (không tin URL do nguồn trả về).
      const validation = this.validator.validate(currentUrl);
      if (!validation.ok) return fail("URL_REJECTED", validation.message);
      const info = validation.info;

      // Chính sách HTTPS (chặn cả URL gốc lẫn redirect hạ cấp về http).
      if (requireHttps && info.protocol !== "https:") {
        return fail("URL_REJECTED", "Chỉ chấp nhận HTTPS theo chính sách.");
      }

      // L6 — phát hiện vòng lặp redirect.
      if (visited.has(info.normalized)) {
        return fail("REDIRECT_LOOP", "Phát hiện vòng lặp redirect.");
      }
      visited.add(info.normalized);

      // L3/L4 — resolve-once + pin IP.
      const resolved = await this.targetResolver(info.hostname);
      if (!resolved.ok) {
        return resolved.reason === "DNS_FAILED"
          ? fail("DNS_FAILED", "Không phân giải được hostname.")
          : fail("UNSAFE_ADDRESS", "Đích không an toàn (địa chỉ bị chặn).");
      }

      const remaining = deadline - Date.now();
      if (remaining <= 0) return fail("TIMEOUT", "Hết thời gian tải.");

      const port = info.port ?? (info.protocol === "https:" ? 443 : 80);
      const result = await this.requester({
        hostname: info.hostname,
        address: resolved.target.address,
        family: resolved.target.family,
        port,
        protocol: info.protocol,
        path: info.path,
        method: "GET",
        headers: { ...SAFE_REQUEST_HEADERS },
        timeoutMs: remaining,
        maxBytes,
      });

      if (!result.ok) {
        const reason = PINNED_FAILURE_MAP[result.reason] ?? "CONNECT_FAILED";
        return fail(reason, "Không tải được nội dung.");
      }

      const { status, headers, body } = result.response;
      const contentType = baseContentType(headers["content-type"]);

      // L6 — redirect (tự xử lý, KHÔNG auto-follow).
      if (status >= 300 && status < 400) {
        const location = headers.location;
        if (!location) return fail("HTTP_ERROR_STATUS", `Nguồn trả về mã ${status} không có Location.`);
        if (hop === maxRedirects) return fail("TOO_MANY_REDIRECTS", "Vượt quá số redirect cho phép.");
        let nextUrl: string;
        try {
          nextUrl = new URL(location, info.normalized).toString();
        } catch {
          return fail("URL_REJECTED", "Redirect không hợp lệ.");
        }
        redirectChain.push(info.normalized);
        currentUrl = nextUrl;
        continue;
      }

      if (status < 200 || status >= 300) {
        return fail("HTTP_ERROR_STATUS", `Trang nguồn trả về mã ${status}.`);
      }

      // L8 — allow-list content-type (chỉ áp cho response cuối cùng).
      if (!allowed.includes(contentType)) {
        return fail("UNSUPPORTED_CONTENT_TYPE", "Định dạng nội dung không được hỗ trợ.");
      }

      // L8 — trần byte SAU giải nén.
      const decoded = decodeBody(body, headers["content-encoding"], maxBytes);
      if (!decoded.ok) return fail(decoded.reason, "Nội dung vượt giới hạn cho phép.");

      return {
        ok: true,
        finalUrl: info.normalized,
        status,
        contentType,
        html: decoded.body.toString("utf-8"),
        fetchedAt: new Date(),
        redirectChain,
      };
    }

    return fail("TOO_MANY_REDIRECTS", "Vượt quá số redirect cho phép.");
  }
}
