import type {
  RecipeAllergenDto,
  RecipeDetailDto,
  RecipeIngredientDto,
  RecipeNutritionDto,
  RecipeStepDto,
  RecipeSummaryDto,
} from "@/lib/db/repositories/recipe.repository";
import type {
  Allergen,
  NutritionFact,
  RecipeIngredient,
  RecipeStep,
  RecipeSummary,
} from "@/components/recipe/types";

/**
 * Ánh xạ DTO (tầng dữ liệu/ứng dụng) → kiểu hiển thị (presentation) của P05.
 *
 * - Hàm thuần (pure): không truy cập DB, không gọi mạng → dễ kiểm thử.
 * - KHÔNG bịa dữ liệu: trường thiếu thì lược bỏ (undefined), không sinh giá trị giả.
 * - Định lượng (`quantity*`) giữ chính xác từ chuỗi DTO; định dạng chỉ ở lớp hiển thị.
 */

const FRACTION_GLYPHS: [number, string][] = [
  [0.125, "⅛"],
  [0.25, "¼"],
  [1 / 3, "⅓"],
  [0.375, "⅜"],
  [0.5, "½"],
  [0.625, "⅝"],
  [2 / 3, "⅔"],
  [0.75, "¾"],
  [0.875, "⅞"],
];

/** Chuyển số thập phân sang phân số hiển thị (½, 1¼…) khi khớp giá trị thông dụng. */
function formatFractionValue(value: string): string {
  const num = Number(value);
  if (!Number.isFinite(num) || num <= 0) return value;
  const whole = Math.floor(num + 1e-9);
  const frac = num - whole;
  if (frac < 1e-6) return String(whole);
  const match = FRACTION_GLYPHS.find(([base]) => Math.abs(base - frac) < 0.02);
  if (!match) return value;
  return whole > 0 ? `${whole}${match[1]}` : match[1];
}

function joinAmount(amount: string, unit: string): string {
  return unit ? `${amount} ${unit}` : amount;
}

/**
 * Định dạng định lượng của một nguyên liệu thành chuỗi hiển thị.
 * Trả `undefined` khi không có định lượng nào (không bịa "vừa đủ").
 */
export function formatRecipeQuantity(dto: RecipeIngredientDto): string | undefined {
  const unit = dto.unitSymbol ?? dto.unitName ?? "";

  if (dto.quantityType === "text") {
    return dto.quantityText ?? undefined;
  }

  if (dto.quantityType === "range" && dto.quantityNumeric && dto.quantityNumericMax) {
    return joinAmount(`${dto.quantityNumeric}–${dto.quantityNumericMax}`, unit);
  }

  if (dto.quantityText) return joinAmount(dto.quantityText, unit);

  if (dto.quantityNumeric) {
    const value =
      dto.quantityType === "fraction"
        ? formatFractionValue(dto.quantityNumeric)
        : dto.quantityNumeric;
    return joinAmount(value, unit);
  }

  return undefined;
}

/** DTO tóm tắt → `RecipeSummary` cho thẻ công thức. */
export function toRecipeSummary(dto: RecipeSummaryDto): RecipeSummary {
  return {
    id: dto.id,
    slug: dto.slug,
    title: dto.title,
    description: dto.summary ?? undefined,
    imageUrl: dto.imageUrl,
    imageAlt: dto.imageAlt ?? undefined,
    prepMinutes: dto.prepMinutes ?? undefined,
    cookMinutes: dto.cookMinutes ?? undefined,
    totalMinutes: dto.totalMinutes ?? undefined,
    servings: dto.baseServings,
    difficulty: dto.difficulty,
  };
}

/** DTO nguyên liệu → `RecipeIngredient`. */
export function toRecipeIngredient(dto: RecipeIngredientDto): RecipeIngredient {
  return {
    id: dto.id,
    name: dto.displayName,
    amount: formatRecipeQuantity(dto),
    note: dto.preparationNote ?? undefined,
    optional: !dto.isRequired,
  };
}

/** DTO bước nấu → `RecipeStep` (thời gian lấy từ timer đầu tiên nếu có). */
export function toRecipeStep(dto: RecipeStepDto): RecipeStep {
  const seconds = dto.timers[0]?.durationSeconds;
  return {
    id: dto.id,
    order: dto.stepNo,
    instruction: dto.instruction,
    durationMinutes:
      typeof seconds === "number" && seconds > 0 ? Math.round(seconds / 60) : undefined,
    tip: dto.tip ?? undefined,
  };
}

const NUTRIENT_LABELS: { key: keyof RecipeNutritionDto; label: string; suffix: string }[] = [
  { key: "calories", label: "Năng lượng", suffix: "kcal" },
  { key: "proteinG", label: "Đạm", suffix: "g" },
  { key: "carbsG", label: "Carbohydrate", suffix: "g" },
  { key: "fatG", label: "Chất béo", suffix: "g" },
  { key: "fiberG", label: "Chất xơ", suffix: "g" },
  { key: "sugarG", label: "Đường", suffix: "g" },
  { key: "sodiumMg", label: "Natri", suffix: "mg" },
];

const BASIS_LABELS: Record<RecipeNutritionDto["basis"], string> = {
  per_serving: "mỗi khẩu phần",
  per_100g: "mỗi 100 g",
  total: "toàn công thức",
};

/**
 * DTO dinh dưỡng → danh sách `NutritionFact`. Chọn bản ghi phù hợp nhất (ưu tiên
 * `per_serving`); chỉ hiển thị trường có dữ liệu (không suy diễn số liệu).
 */
export function toNutritionFacts(list: RecipeNutritionDto[]): NutritionFact[] {
  if (list.length === 0) return [];
  const row = list.find((r) => r.basis === "per_serving") ?? list[0];
  const basis = BASIS_LABELS[row.basis] ?? "";
  return NUTRIENT_LABELS.flatMap(({ key, label, suffix }) => {
    const raw = row[key];
    if (raw == null || raw === "") return [];
    return [{ label: basis ? `${label} (${basis})` : label, value: `${raw} ${suffix}` }];
  });
}

/** Nguồn dữ liệu dinh dưỡng (dùng cho ghi chú minh bạch). */
export function nutritionNote(list: RecipeNutritionDto[]): string | undefined {
  if (list.length === 0) return undefined;
  const row = list.find((r) => r.basis === "per_serving") ?? list[0];
  if (row.sourceNote) return row.sourceNote;
  const sourceLabel: Record<RecipeNutritionDto["dataSourceType"], string> = {
    calculated: "Do WALE COOKING tính toán.",
    official_label: "Lấy từ nhãn sản phẩm chính thức.",
    external_reference: "Tham chiếu từ nguồn ngoài.",
    user_provided: "Do người dùng cung cấp.",
    estimated: "Số liệu ước tính — chỉ mang tính tham khảo.",
  };
  return sourceLabel[row.dataSourceType];
}

/** DTO dị ứng → `Allergen` cho `AllergenBadges`. */
export function toAllergens(list: RecipeAllergenDto[]): Allergen[] {
  return list.map((item) => ({ id: item.termId, label: item.name }));
}

/** Tiện ích: chuyển toàn bộ công thức chi tiết thành các kiểu hiển thị. */
export interface RecipeDetailView {
  summary: RecipeSummary;
  ingredients: RecipeIngredient[];
  steps: RecipeStep[];
  nutrition: NutritionFact[];
  nutritionNote?: string;
  allergens: Allergen[];
  description?: string;
  detail: RecipeDetailDto;
}

export function toRecipeDetailView(dto: RecipeDetailDto): RecipeDetailView {
  return {
    summary: toRecipeSummary(dto),
    ingredients: dto.ingredients.map(toRecipeIngredient),
    steps: dto.steps.map(toRecipeStep),
    nutrition: toNutritionFacts(dto.nutrition),
    nutritionNote: nutritionNote(dto.nutrition),
    allergens: toAllergens(dto.allergens),
    description: dto.description ?? dto.summary ?? undefined,
    detail: dto,
  };
}
