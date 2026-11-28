/**
 * Hợp đồng tải nội dung an toàn (Safe Fetch) — I2.1 `SSRF_SECURITY_DESIGN.md`
 * lớp L4 (pin IP), L6 (redirect), L7 (port), L8 (timeout/kích thước/MIME).
 *
 * Phần triển khai (HTTP client + pin IP) thuộc I2.3; ở đây chỉ định nghĩa hợp đồng.
 * Bất biến: kết quả/lỗi KHÔNG chứa IP đã kết nối, tên resolver hay stack trace.
 */

/** Ngân sách tài nguyên cho một lần fetch (mặc định do adapter quyết định). */
export interface SafeFetchRequest {
  /** URL đã qua kiểm tra (validator) trước khi fetch. */
  url: string;
  /** Trần số redirect được theo (mặc định 5). */
  maxRedirects?: number;
  /** Timeout kết nối + tổng thời gian (ms). */
  timeoutMs?: number;
  /** Trần số byte body THỰC TẾ sau giải nén (chống compression bomb). */
  maxBytes?: number;
  /** Allow-list content-type (ví dụ `text/html`, `application/xhtml+xml`). */
  allowedContentTypes?: readonly string[];
  /** Bắt buộc HTTPS (chặn redirect hạ cấp về http) — mặc định true. */
  requireHttps?: boolean;
}

/** Tài liệu đã tải thành công (đầu vào cho bước trích xuất). */
export interface FetchResult {
  finalUrl: string;
  status: number;
  contentType: string;
  html: string;
  fetchedAt: Date;
  /** Chuỗi URL đã đi qua (mỗi hop đã kiểm lại + pin IP); rỗng nếu không redirect. */
  redirectChain: readonly string[];
}

/** Lý do fetch thất bại — mã AN TOÀN (fail-closed; không lộ chi tiết nội bộ). */
export type SafeFetchFailureReason =
  | "URL_REJECTED"
  | "DNS_FAILED"
  | "UNSAFE_ADDRESS"
  | "CONNECT_FAILED"
  | "TIMEOUT"
  | "TLS_FAILED"
  | "TOO_MANY_REDIRECTS"
  | "REDIRECT_LOOP"
  | "UNSUPPORTED_CONTENT_TYPE"
  | "BODY_TOO_LARGE"
  | "DECOMPRESSION_LIMIT"
  | "HTTP_ERROR_STATUS";

/** Kết quả fetch: thành công (tài liệu) hoặc thất bại (mã + mô tả an toàn). */
export type SafeFetchResult =
  | ({ ok: true } & FetchResult)
  | { ok: false; reason: SafeFetchFailureReason; message: string };
