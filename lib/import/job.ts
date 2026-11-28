/**
 * Hợp đồng API/hiển thị cho URL Import — I2.1 `API_AUTH_DESIGN.md` §6, §8
 * và `URL_IMPORT_FLOW.md` (các bước 1–3, 8).
 *
 * Nguyên tắc an toàn áp cho mọi DTO ở đây:
 * - KHÔNG chứa trường do client tự đặt (`createdById`, `status`, `role`, `recipeId`,
 *   `attempts`…) — các trường đó luôn server-set.
 * - KHÔNG lộ IP/DNS/stack; `lastError` phải đã được làm sạch.
 * - Phân biệt rõ RAW SOURCE (URL gốc), NORMALIZED (đã chuẩn hoá) và REVIEWED (admin duyệt).
 */

import type { ImportJobItemStatus } from "@prisma/client";

import type { FieldState, FieldTier } from "./field-state";
import type { SourceIdentificationResult } from "./source";

/**
 * Yêu cầu gửi 1 URL để import (MVP: đúng 1 URL).
 * `jobId` nằm ở path param (`POST /api/v1/admin/import/jobs/:jobId/items`), KHÔNG trong body.
 */
export interface SubmitUrlImportRequest {
  url: string;
}

/** Kết quả thêm 1 URL vào job. */
export interface ImportItemResult {
  /** Định danh item nếu đã lưu nháp; `null` khi chỉ lên kế hoạch (chưa persist). */
  itemId: string | null;
  /** URL đã chuẩn hoá (khác `sourceUrl` gốc — phân biệt raw vs normalized). */
  normalizedUrl: string;
  domain: string;
  /** Trạng thái item (khởi tạo `queued`; quá trình fetch/extract diễn ra ở phase sau). */
  status: ImportJobItemStatus;
  /** Nhận diện nguồn đã resolve. */
  source: SourceIdentificationResult;
  /** Cảnh báo mã chuẩn (SOURCES_UNREGISTERED, CONTENT_POLICY_MANUAL_ONLY, …). */
  warnings: readonly string[];
}

/** Kết quả một lượt import (nhiều item). */
export interface ImportJobResult {
  jobId: string;
  items: ImportItemResult[];
}

/** Một trường công thức dạng hiển thị cho admin xem trước (đã lọc an toàn). */
export interface AdminImportFieldPreview {
  field: string;
  state: FieldState;
  tier: FieldTier;
  value: unknown;
  evidence?: string;
}

/**
 * Dữ liệu xem trước/duyệt cho admin (item detail — I2.1 §6.3).
 * `fields` là dữ liệu ĐÃ TRÍCH (chưa qua review) — tách khỏi dữ liệu đã duyệt.
 */
export interface AdminImportItemPreview {
  id: string;
  jobId: string;
  status: ImportJobItemStatus;
  processingStage: string | null;
  attempts: number;
  maxAttempts: number;
  sourceUrl: string;
  normalizedUrl: string;
  warnings: readonly string[];
  fields: AdminImportFieldPreview[];
  recipeId: string | null;
  duplicateOfItemId: string | null;
  /** Lỗi gần nhất ĐÃ LÀM SẠCH (mã nghiệp vụ) — không chứa chi tiết kỹ thuật. */
  lastError: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/** Quyết định duyệt item (I2.1 §6.4). `publish` KHÔNG nằm ở đây (đi một cửa riêng). */
export type ImportReviewDecision = "approved" | "rejected" | "changes_requested";

/** Yêu cầu duyệt item. */
export interface ImportReviewRequest {
  decision: ImportReviewDecision;
  notes?: string;
}
