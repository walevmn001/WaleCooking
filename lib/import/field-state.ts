/**
 * Trạng thái từng trường công thức (FieldState) — I2.1 `EXTRACTION_DESIGN.md` §4.
 *
 * Mỗi giá trị trích xuất được bọc trong `ProvenancedField<T>` để luôn kèm:
 * trạng thái (`state`), bậc trích xuất (`tier`) và bằng chứng (`evidence`).
 *
 * Bất biến: KHÔNG bao giờ biến `MISSING`/`UNREADABLE` thành giá trị "đoán".
 * `DERIVED` chỉ dùng khi phép suy là xác định (ví dụ cộng thời gian đã có).
 */

/** Trạng thái một trường công thức (nguồn I2.1 §4 — enum 5 giá trị). */
export type FieldState =
  | "MISSING" // nguồn không có trường
  | "UNREADABLE" // có nhưng không parse được
  | "CONFIRMED" // trích trực tiếp, giá trị rõ
  | "DERIVED" // suy ra AN TOÀN từ dữ liệu có sẵn (không bịa)
  | "CONFLICT"; // nhiều nguồn/bậc mâu thuẫn

/** Bậc trích xuất (pipeline E1–E5) hoặc `support` (metadata phụ trợ như Open Graph). */
export type FieldTier = "E1" | "E2" | "E3" | "E4" | "E5" | "support";

/** Giá trị công thức có nguồn gốc — luôn có `state` + `tier`, `evidence` khi có thể. */
export interface ProvenancedField<T> {
  /** Giá trị đã trích/normalize; `null` khi `MISSING`/không có giá trị an toàn. */
  value: T | null;
  state: FieldState;
  tier: FieldTier;
  /** Trích đoạn nguồn / con trỏ (JSON-LD path, selector…) để admin kiểm lại. */
  evidence?: string;
}

/**
 * Phân loại thô theo yêu cầu thiết kế (mục D): `extracted / missing / uncertain / failed`.
 *
 * Đây là ánh xạ CHỈ để hiển thị/báo cáo — KHÔNG dùng để suy diễn giá trị.
 * `failed` là mức KẾT QUẢ (E1 lỗi hoàn toàn: không có node Recipe), không phải mức trường,
 * nên `toFieldCategory` không bao giờ trả `failed`.
 */
export type FieldCategory = "extracted" | "missing" | "uncertain" | "failed";

/** Phân loại mức trường (luôn ∈ {extracted, missing, uncertain}). */
export type FieldCategoryValue = Exclude<FieldCategory, "failed">;

/** Ánh xạ `FieldState` → phân loại mức trường (I2.1 §4). */
export function toFieldCategory(state: FieldState): FieldCategoryValue {
  switch (state) {
    case "CONFIRMED":
    case "DERIVED":
      return "extracted";
    case "MISSING":
      return "missing";
    case "UNREADABLE":
    case "CONFLICT":
      return "uncertain";
  }
}
