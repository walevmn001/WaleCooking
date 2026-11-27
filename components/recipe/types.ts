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

export interface RecipeIngredient {
  id: string;
  name: string;
  /** Định lượng dạng chuỗi ("200 g", "2 thìa canh"). */
  amount?: string;
  note?: string;
  optional?: boolean;
}

export interface RecipeStep {
  id: string;
  /** Thứ tự bước (1-based). */
  order: number;
  instruction: string;
  durationMinutes?: number;
  tip?: string;
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
