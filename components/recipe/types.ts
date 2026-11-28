/**
 * Kiểu dữ liệu hiển thị cho component công thức.
 * Đây là kiểu ở tầng trình bày (presentation) — KHÔNG phải entity Prisma.
 * Việc map từ domain → kiểu này thuộc module Recipe (P06+).
 */

export type DifficultyLevel = "easy" | "medium" | "hard";

export interface RecipeSummary {
  id: string;
  slug: string;
  title: string;
  description?: string;
  imageUrl?: string | null;
  /** alt của ảnh; mặc định dùng title. */
  imageAlt?: string;
  /** Thời gian chuẩn bị (phút). */
  prepMinutes?: number;
  /** Thời gian nấu (phút). */
  cookMinutes?: number;
  /** Tổng thời gian (phút) nếu có sẵn. */
  totalMinutes?: number;
  servings?: number;
  difficulty?: DifficultyLevel;
  categories?: string[];
  tags?: string[];
}

/**
 * Dữ liệu định lượng GỐC (chưa nhân khẩu phần) — chỉ để tính toán, KHÔNG hiển thị trực tiếp.
 * Được điền từ DTO ở `toRecipeIngredient` (P09). Client dùng để nhân theo khẩu phần.
 */
export interface IngredientQuantityData {
  type: "decimal" | "fraction" | "range" | "text";
  /** Số gốc dạng chuỗi thập phân (giữ nguyên từ DB). */
  numeric?: string | null;
  /** Cận trên cho dạng khoảng. */
  numericMax?: string | null;
  /** Nội dung chữ cho dạng text (vừa đủ, tuỳ ý…). */
  text?: string | null;
  /** Ký hiệu/tên đơn vị hiển thị (gốc). */
  unit?: string | null;
}

export interface RecipeIngredient {
  id: string;
  name: string;
  /** Định lượng dạng chuỗi ("200 g", "2 thìa canh") tại khẩu phần gốc. */
  amount?: string;
  note?: string;
  optional?: boolean;
  /** Số gốc + đơn vị để nhân theo khẩu phần (P09). */
  quantityData?: IngredientQuantityData;
}

export interface RecipeStep {
  id: string;
  /** Thứ tự bước (1-based). */
  order: number;
  instruction: string;
  durationMinutes?: number;
  tip?: string;
  /** Ảnh của bước nếu có (P09 — Cooking Mode). */
  imageUrl?: string | null;
  imageAlt?: string;
}

export interface NutritionFact {
  label: string;
  value: string;
}

export interface Allergen {
  id: string;
  label: string;
}

export interface RecipeCategory {
  id: string;
  slug: string;
  name: string;
  description?: string;
  imageUrl?: string | null;
  recipeCount?: number;
}
