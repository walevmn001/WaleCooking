/**
 * SSRF URL validator (I2.3) — triển khai `UrlValidator` (cổng `lib/import/ports.ts`).
 *
 * Áp các lớp TĨNH của `SSRF_SECURITY_DESIGN.md` (không mạng, đồng bộ):
 * - L1: chỉ http/https; chặn credentials; giới hạn độ dài; chuẩn hoá host.
 * - L2: chặn IP literal thuộc dải cấm (kể cả IPv4-mapped IPv6).
 * - L5: chặn hostname metadata/nội bộ.
 * - L7: chỉ cho phép port 80/443.
 *
 * Các lớp cần mạng (resolve DNS, pin IP, redirect) KHÔNG thuộc validator này —
 * chúng do SafeFetcher đảm nhiệm (M4/M5), vẫn PHẢI gọi lại validator cho mỗi hop.
 *
 * Biến thể biểu diễn IP (thập phân/octal/hex như `2130706433`) được WHATWG `URL`
 * chuẩn hoá về dotted-quad trước khi kiểm ⇒ bị chặn đúng theo L2.
 */

import { isIP } from "node:net";

import type { NormalizedUrlInfo, UrlRejectionReason, UrlValidationResult } from "../url";
import { MAX_URL_LENGTH } from "../validation";
import type { UrlValidator } from "../ports";
import { isDeniedHostname, normalizeHostname, registrableDomain } from "./hostname";
import { classifyIp } from "./ip";

const ALLOWED_PROTOCOLS: ReadonlySet<string> = new Set(["http:", "https:"]);
const ALLOWED_PORTS: ReadonlySet<string> = new Set(["80", "443"]);

/** Tham số truy vấn theo dõi (tracking) bị loại khi chuẩn hoá URL. */
const TRACKING_PARAMS: ReadonlySet<string> = new Set([
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
  "fbclid",
  "gclid",
  "gclsrc",
  "dclid",
  "msclkid",
  "mc_cid",
  "mc_eid",
  "igshid",
]);

function reject(reason: UrlRejectionReason, message: string): UrlValidationResult {
  return { ok: false, reason, message };
}

export class SsrfUrlValidator implements UrlValidator {
  validate(rawUrl: string): UrlValidationResult {
    if (typeof rawUrl !== "string" || rawUrl.trim() === "") {
      return reject("MALFORMED_URL", "URL không hợp lệ.");
    }
    if (rawUrl.length > MAX_URL_LENGTH) {
      return reject("URL_TOO_LONG", `URL vượt quá ${MAX_URL_LENGTH} ký tự.`);
    }

    let url: URL;
    try {
      url = new URL(rawUrl);
    } catch {
      return reject("MALFORMED_URL", "URL không hợp lệ.");
    }

    // L1 — scheme.
    if (!ALLOWED_PROTOCOLS.has(url.protocol)) {
      return reject("UNSUPPORTED_SCHEME", "Chỉ chấp nhận URL http/https.");
    }
    // L1 — credentials.
    if (url.username !== "" || url.password !== "") {
      return reject("URL_HAS_CREDENTIALS", "URL không được chứa thông tin đăng nhập.");
    }
    // L7 — port.
    if (url.port !== "" && !ALLOWED_PORTS.has(url.port)) {
      return reject("DISALLOWED_PORT", "Cổng không được phép (chỉ 80/443).");
    }

    const hostname = normalizeHostname(url.hostname);
    if (hostname === "") {
      return reject("MISSING_HOSTNAME", "URL thiếu hostname.");
    }

    // L2 — IP literal (bóc ngoặc IPv6 do WHATWG giữ lại).
    const bare = hostname.startsWith("[") && hostname.endsWith("]")
      ? hostname.slice(1, -1)
      : hostname;
    const literalFamily = isIP(bare);

    if (literalFamily !== 0) {
      const classification = classifyIp(bare);
      if (!classification || classification.blocked) {
        return reject("DISALLOWED_IP_LITERAL", "URL trỏ tới địa chỉ không được phép.");
      }
    } else if (isDeniedHostname(hostname)) {
      // L5 — hostname metadata/nội bộ.
      return reject("DISALLOWED_HOSTNAME", "Hostname không được phép.");
    }

    // Chuẩn hoá (bỏ fragment + query tracking) để dùng cho dedupe/idempotency.
    const normalized = new URL(url.toString());
    normalized.hash = "";
    for (const key of [...normalized.searchParams.keys()]) {
      if (TRACKING_PARAMS.has(key.toLowerCase())) normalized.searchParams.delete(key);
    }

    const info: NormalizedUrlInfo = {
      raw: rawUrl,
      normalized: normalized.toString(),
      protocol: url.protocol as "http:" | "https:",
      hostname,
      domain: literalFamily !== 0 ? bare : registrableDomain(hostname),
      port: url.port === "" ? null : Number(url.port),
      path: `${normalized.pathname}${normalized.search}`,
    };
    return { ok: true, info };
  }
}
