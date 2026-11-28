/**
 * Hợp đồng kiểm tra URL cho URL Import — I2.1 `URL_IMPORT_FLOW.md` bước 2
 * và `SSRF_SECURITY_DESIGN.md` lớp L1/L5/L7.
 *
 * Đây là DTO *kết quả*; phần triển khai kiểm tra (SSRF validator) thuộc I2.3.
 */

/** Lý do URL bị từ chối — mã AN TOÀN, không chứa thông tin nội bộ (IP/DNS). */
export type UrlRejectionReason =
  | "MALFORMED_URL" // không parse được bằng `URL`
  | "UNSUPPORTED_SCHEME" // không phải http/https
  | "MISSING_HOSTNAME" // hostname rỗng
  | "URL_HAS_CREDENTIALS" // chứa `user:pass@`
  | "URL_TOO_LONG" // vượt trần ký tự
  | "DISALLOWED_PORT" // ngoài allow-list port
  | "DISALLOWED_IP_LITERAL" // IP literal thuộc dải bị cấm
  | "DISALLOWED_HOSTNAME"; // hostname metadata/nội bộ

/** Thông tin URL đã chuẩn hoá (an toàn để dùng tra registry + dedupe). */
export interface NormalizedUrlInfo {
  /** Chuỗi URL gốc admin nhập (không dùng làm khoá). */
  raw: string;
  /** URL đã chuẩn hoá (lowercase host, bỏ fragment/query tracking). */
  normalized: string;
  protocol: "http:" | "https:";
  /** Hostname đã hạ chữ thường, bỏ dấu chấm cuối (KHÔNG kèm port). */
  hostname: string;
  /** eTLD+1 (best-effort) — dùng tra Source Registry. */
  domain: string;
  /** Port hiệu dụng theo URL (null = mặc định theo scheme). */
  port: number | null;
  /** Đường dẫn (bao gồm query đã lọc) — dùng cho dedupe/idempotency. */
  path: string;
}

/** Kết quả kiểm tra URL (discriminated union). */
export type UrlValidationResult =
  | { ok: true; info: NormalizedUrlInfo }
  | { ok: false; reason: UrlRejectionReason; message: string };
