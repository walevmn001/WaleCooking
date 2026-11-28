/**
 * Hợp đồng trích xuất dữ liệu công thức — I2.1 `EXTRACTION_DESIGN.md` §4/§7.
 *
 * I2 chỉ chạy bậc E1 (JSON-LD); các bậc E2–E5 là chỗ cắm cho phase sau.
 * Đây là DTO; engine trích xuất thực tế KHÔNG được triển khai ở I2.2.
 */

import type { FieldCategory, FieldTier, ProvenancedField } from "./field-state";

/**
 * Mã cảnh báo chuẩn (I2.1 §8). `FIELD_UNREADABLE:<field>` / `FIELD_CONFLICT:<field>`
 * giữ hậu tố tên trường để truy vết.
 */
export type ExtractionWarningCode =
  | "JSONLD_NOT_FOUND"
  | "JSONLD_INVALID"
  | "MULTIPLE_RECIPE_NODES"
  | "NO_INGREDIENTS"
  | "NO_INSTRUCTIONS"
  | "SOURCES_UNREGISTERED"
  | "CONTENT_POLICY_MANUAL_ONLY"
  | "IMAGE_POLICY_DO_NOT_COPY"
  | `FIELD_UNREADABLE:${string}`
  | `FIELD_CONFLICT:${string}`;

/** Kết quả trích xuất một tài liệu (chưa lưu DB). */
export interface ExtractionResult {
  /** Bản đồ trường → giá trị có nguồn gốc (state/tier/evidence). */
  fields: Record<string, ProvenancedField<unknown>>;
  /** Các bậc đã dùng (I2: `["E1"]`). */
  tiersUsed: readonly FieldTier[];
  /** Phiên bản extractor (ghi vào `RecipeExtraction.extractorVersion`). */
  extractorVersion: string;
  warnings: readonly ExtractionWarningCode[];
  /** JSON AN TOÀN để lưu `RecipeExtraction.rawExtraction` (không chứa HTML thô). */
  raw: unknown;
}

/**
 * Kết quả mức cao của bước trích xuất (ánh xạ yêu cầu D).
 * `failed` = E1 lỗi hoàn toàn (không có node Recipe và không trích được gì).
 */
export type ExtractionOutcome = FieldCategory;
