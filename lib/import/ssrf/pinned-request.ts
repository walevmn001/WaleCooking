/**
 * HTTP request "pin IP" (I2.3, lớp L4) — hạ tầng thô cho SafeFetcher.
 *
 * Cơ chế: dùng `lookup` tuỳ biến trả **đúng IP đã xác minh**, nên tầng socket
 * KHÔNG tự resolve hostname lần nữa ⇒ chống DNS rebinding (TOCTOU).
 * - `host` = hostname gốc ⇒ HTTP `Host` header đúng virtual host.
 * - https: `servername` = hostname gốc ⇒ **SNI** + xác minh chứng chỉ theo hostname gốc.
 *
 * Trả về cả `remoteAddress` (địa chỉ socket thực tế) để kiểm chứng pin bằng test.
 * KHÔNG follow redirect ở đây (L6 do SafeFetcher quản lý).
 */

import http from "node:http";
import https from "node:https";
import type { LookupFunction } from "node:net";

import type { IpFamily } from "./ip";

export interface PinnedRequestOptions {
  hostname: string;
  /** IP đã xác minh để kết nối (pin). */
  address: string;
  family: IpFamily;
  port: number;
  protocol: "http:" | "https:";
  /** Path + query (bắt đầu bằng `/`). */
  path: string;
  method?: string;
  headers?: Record<string, string>;
  timeoutMs: number;
  maxBytes: number;
  /** Chỉ dùng cho test (tin cậy CA self-signed). */
  ca?: string | Buffer;
}

export interface PinnedResponse {
  status: number;
  headers: http.IncomingHttpHeaders;
  body: Buffer;
  /** Địa chỉ peer thực tế của socket (dùng để kiểm chứng pin). */
  remoteAddress: string | null;
}

export type PinnedRequestFailure =
  | "TIMEOUT"
  | "BODY_TOO_LARGE"
  | "CONNECT_FAILED"
  | "TLS_FAILED";

export type PinnedRequestResult =
  | { ok: true; response: PinnedResponse }
  | { ok: false; reason: PinnedRequestFailure };

const TLS_ERROR_CODES: ReadonlySet<string> = new Set([
  "ERR_TLS_CERT_ALTNAME_INVALID",
  "UNABLE_TO_VERIFY_LEAF_SIGNATURE",
  "SELF_SIGNED_CERT_IN_CHAIN",
  "DEPTH_ZERO_SELF_SIGNED_CERT",
  "CERT_HAS_EXPIRED",
  "ERR_SSL_WRONG_VERSION_NUMBER",
  "ERR_SSL_SSLV3_ALERT_HANDSHAKE_FAILURE",
  "EPROTO",
]);

/** Tạo hàm `lookup` luôn trả đúng IP đã pin (bỏ qua resolver hệ thống). */
export function createPinnedLookup(address: string, family: IpFamily): LookupFunction {
  return ((_hostname, options, callback) => {
    if (options && typeof options === "object" && "all" in options && options.all) {
      callback(null, [{ address, family }]);
    } else {
      callback(null, address, family);
    }
  }) as LookupFunction;
}

function mapSocketError(error: NodeJS.ErrnoException): PinnedRequestFailure {
  const code = error.code ?? "";
  if (code === "ETIMEDOUT" || code === "ERR_SOCKET_CONNECTION_TIMEOUT") return "TIMEOUT";
  if (TLS_ERROR_CODES.has(code) || code.startsWith("ERR_TLS") || code.startsWith("ERR_SSL")) {
    return "TLS_FAILED";
  }
  return "CONNECT_FAILED";
}

/** Thực hiện MỘT request tới đúng IP đã pin; giữ Host/SNI là hostname gốc. */
export function pinnedRequest(options: PinnedRequestOptions): Promise<PinnedRequestResult> {
  return new Promise<PinnedRequestResult>((resolve) => {
    let settled = false;
    const finish = (result: PinnedRequestResult): void => {
      if (settled) return;
      settled = true;
      resolve(result);
    };

    const isHttps = options.protocol === "https:";
    const transport = isHttps ? https : http;

    const request = transport.request(
      {
        host: options.hostname,
        port: options.port,
        path: options.path,
        method: options.method ?? "GET",
        headers: options.headers,
        lookup: createPinnedLookup(options.address, options.family),
        timeout: options.timeoutMs,
        ...(isHttps
          ? { servername: options.hostname, ca: options.ca, rejectUnauthorized: true }
          : {}),
      },
      (res) => {
        // Chụp địa chỉ peer NGAY khi có response (sau khi stream `end`, socket có
        // thể đã đóng ⇒ `remoteAddress` trở thành null).
        const remoteAddress = res.socket?.remoteAddress ?? null;
        const chunks: Buffer[] = [];
        let size = 0;
        res.on("data", (chunk: Buffer) => {
          size += chunk.length;
          if (size > options.maxBytes) {
            res.destroy();
            request.destroy();
            finish({ ok: false, reason: "BODY_TOO_LARGE" });
            return;
          }
          chunks.push(chunk);
        });
        res.on("end", () => {
          finish({
            ok: true,
            response: {
              status: res.statusCode ?? 0,
              headers: res.headers,
              body: Buffer.concat(chunks),
              remoteAddress,
            },
          });
        });
        res.on("error", () => finish({ ok: false, reason: "CONNECT_FAILED" }));
      },
    );

    request.on("timeout", () => {
      request.destroy();
      finish({ ok: false, reason: "TIMEOUT" });
    });
    request.on("error", (error: NodeJS.ErrnoException) => {
      finish({ ok: false, reason: mapSocketError(error) });
    });
    request.end();
  });
}
