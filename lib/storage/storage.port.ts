import "server-only";

/**
 * Cổng lưu trữ tệp (StoragePort) — tầng Domain/Infrastructure (P02 §MEDIA_STORAGE).
 *
 * - Postgres CHỈ lưu metadata (`media_assets`); bytes nằm ở nhà cung cấp lưu trữ.
 * - MVP dùng phương án (A) server-proxy (D-P02-06): client → route handler → adapter.
 * - Triển khai mục tiêu: Cloudflare R2 (tương thích S3). Thay nhà cung cấp = đổi
 *   adapter, KHÔNG đổi application/domain.
 */

export interface PutObjectInput {
  /** Khóa do SERVER sinh (không dùng tên tệp của client — chống path traversal/ghi đè). */
  key: string;
  body: Uint8Array;
  /** MIME thật đã kiểm bằng magic bytes (không tin `Content-Type` từ client). */
  contentType: string;
}

export interface StoredObject {
  key: string;
  /** URL công khai (hoặc URL nội bộ do server proxy) để hiển thị ảnh. */
  url: string;
}

export interface StoragePort {
  /** Nhà cung cấp đang hoạt động — để quan sát/kiểm thử, KHÔNG dùng cho logic nghiệp vụ. */
  readonly provider: "r2" | "local";

  /** Ghi một đối tượng; trả về khóa + URL công khai. */
  put(input: PutObjectInput): Promise<StoredObject>;

  /** Xóa một đối tượng theo khóa. */
  delete(key: string): Promise<void>;

  /** URL công khai của đối tượng theo khóa (không kiểm tra tồn tại). */
  publicUrl(key: string): string;

  /**
   * URL có chữ ký, thời hạn ngắn — dùng cho asset nháp/chưa xuất bản (P02 §11).
   * Tùy chọn: provider đơn giản (local) có thể không hỗ trợ.
   */
  getSignedUrl?(key: string, ttlSeconds: number): Promise<string>;
}
