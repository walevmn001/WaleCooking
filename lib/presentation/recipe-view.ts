import type { RecipeStatus } from "@prisma/client";

import type {
  Allergen,
  DifficultyLevel,
  NutritionFact,
  RecipeIngredient,
  RecipeStep,
  RecipeSummary,
} from "@/components/recipe/types";
import type {
  RecipeAdminSummaryDto,
  RecipeAllergenDto,
  RecipeDetailDto,
  RecipeIngredientDto,
  RecipeNutritionDto,
  RecipeSourceDto,
  RecipeStepDto,
  RecipeSummaryDto,
} from "@/lib/db/repositories/recipe.repository";

/**
 * Ánh xạ DTO (tầng dữ liệu) → view-model (tầng trình bày) cho module Recipe (P07 §16).
 *
 * Nguyên tắc:
 * - Hàm THUẦN (pure): không phụ thuộc DB/React/`server-only` → client & server dùng chung, dễ kiểm thử.
 * - Component KHÔNG biết DTO Prisma; chỉ biết view-model trong `components/recipe/types`.
 * - KHÔNG suy diễn/bịa số liệu: chỉ định dạng lại dữ liệu đã có (P07 §17).
 * - Chỉ `import type` → mọi import bị xoá khi biên dịch (an toàn cho bundle client).
 */

// -----------------------------------------------------------------------------
// View-model
// -----------------------------------------------------------------------------

export interface RecipeSourceView {
  id: string;
  name: string;
  authorOrOrg: string | null;
  url: string | null;
  license: string | null;
  note: string | null;
  isPrimary: boolean;
}

export interface NutritionViewModel {
  facts: NutritionFact[];
  note?: string;
}

/** View-model đầy đủ cho trang chi tiết công thức. */
export interface RecipeDetailViewModel {
  id: string;
  slug: string;
  title: string;
  summary?: string;
  description?: string;
  imageUrl?: string | null;
  imageAlt: string;
  prepMinutes?: number;
  cookMinutes?: number;
  totalMinutes?: number;
  servings?: number;
  difficulty?: DifficultyLevel;
  /** Tên các term phân loại (để hiển thị dạng thẻ). */
  categories: string[];
  ingredients: RecipeIngredient[];
  steps: RecipeStep[];
  nutrition: NutritionViewModel;
  allergens: Allergen[];
  sources: RecipeSourceView[];
  publishedAt: Date | null;
}

/** Dòng công thức cho bảng quản trị. */
export interface AdminRecipeRowViewModel {
  id: string;
  slug: string;
  title: string;
  summary?: string;
  status: RecipeStatus;
  difficulty: DifficultyLevel;
  updatedAt: Date;
}

// -----------------------------------------------------------------------------
// Nhãn tiếng Việt (hiển thị)
// -----------------------------------------------------------------------------

export const RECIPE_STATUS_LABEL: Record<RecipeStatus, string> = {
  draft: "Bản nháp",
  in_review: "Chờ duyệt",
  published: "Đã xuất bản",
  archived: "Đã lưu trữ",
};

export const RECIPE_STATUS_VARIANT: Record<
  RecipeStatus,
  "neutral" | "info" | "success" | "warning"
> = {
  draft: "neutral",
  in_review: "warning",
  published: "success",
  archived: "info",
};

const NUTRITION_BASIS_LABEL: Record<RecipeNutritionDto["basis"], string> = {
  per_serving: "1 khẩu phần",
  per_100g: "100 g",
  total: "toàn bộ công thức",
};

const NUTRITION_SOURCE_LABEL: Record<RecipeNutritionDto["dataSourceType"], string> = {
  measured: "đo lường",
  calculated: "tính toán",
  estimated: "ước tính",
  unknown: "chưa xác định nguồn",
};

// -----------------------------------------------------------------------------
// Định dạng định lượng (P02 §D-P02-07: numeric là nguồn, phân số chỉ để hiển thị)
// -----------------------------------------------------------------------------

/** Bỏ số 0 thừa ở phần thập phân ("200.000" → "200", "0.500" → "0.5"). */
function trimDecimal(value: string | null): string | null {
  if (!value) return null;
  const n = Number(value);
  if (!Number.isFinite(n)) return value;
  return String(Number(n.toFixed(3)));
}

function joinUnit(quantity: string, unit: string | null): string {
  return unit ? `${quantity} ${unit}` : quantity;
}

/** Định dạng định lượng của một nguyên liệu thành chuỗi hiển thị (không bịa đơn vị). */
export function formatIngredientAmount(ing: RecipeIngredientDto): string | undefined {
  const unit = ing.unitSymbol ?? ing.unitName ?? null;
  const textFallback = ing.quantityText?.trim() || null;

  switch (ing.quantityType) {
    case "text":
      return textFallback ?? undefined;
    case "range": {
      const min = trimDecimal(ing.quantityNumeric);
      const max = trimDecimal(ing.quantityNumericMax);
      if (min && max) return joinUnit(`${min}–${max}`, unit);
      if (min) return joinUnit(min, unit);
      return textFallback ?? undefined;
    }
    case "fraction":
    case "decimal":
    default: {
      const qty = trimDecimal(ing.quantityNumeric);
      if (qty) return joinUnit(qty, unit);
      return textFallback ?? undefined;
    }
  }
}

// -----------------------------------------------------------------------------
// Ánh xạ thành phần
// -----------------------------------------------------------------------------

export function toRecipeSummary(dto: RecipeSummaryDto): RecipeSummary {
  return {
    id: dto.id,
    slug: dto.slug,
    title: dto.title,
    description: dto.summary ?? undefined,
    imageUrl: dto.imageUrl,
    imageAlt: dto.imageAlt ?? dto.title,
    prepMinutes: dto.prepMinutes ?? undefined,
    cookMinutes: dto.cookMinutes ?? undefined,
    totalMinutes: dto.totalMinutes ?? undefined,
    servings: dto.baseServings,
    difficulty: dto.difficulty,
  };
}

export function toRecipeIngredient(dto: RecipeIngredientDto): RecipeIngredient {
  const unit = dto.unitSymbol ?? dto.unitName ?? null;
  return {
    id: dto.id,
    name: dto.displayName,
    amount: formatIngredientAmount(dto),
    note: dto.preparationNote ?? undefined,
    optional: !dto.isRequired,
    // Số gốc + đơn vị để client nhân theo khẩu phần (P09 §P09.3) — không hiển thị trực tiếp.
    quantityData: {
      type: dto.quantityType,
      numeric: dto.quantityNumeric,
      numericMax: dto.quantityNumericMax,
      text: dto.quantityText,
      unit,
    },
  };
}

export function toRecipeStep(dto: RecipeStepDto): RecipeStep {
  const durationSeconds = dto.timers[0]?.durationSeconds;
  const image = dto.images[0];
  return {
    id: dto.id,
    order: dto.stepNo,
    instruction: dto.instruction,
    // Làm tròn lên tối thiểu 1 phút để không hiển thị "0 phút" khi có bộ đếm ngắn.
    durationMinutes:
      durationSeconds != null && durationSeconds > 0
        ? Math.max(1, Math.round(durationSeconds / 60))
        : undefined,
    tip: dto.tip ?? undefined,
    imageUrl: image?.url ?? null,
    imageAlt: image?.altText ?? `Bước ${dto.stepNo}`,
  };
}

export function toAllergenView(dto: RecipeAllergenDto): Allergen {
  return { id: dto.termId, label: dto.name };
}

export function toRecipeSourceView(dto: RecipeSourceDto): RecipeSourceView {
  return {
    id: dto.id,
    name: dto.name,
    authorOrOrg: dto.authorOrOrg,
    url: dto.url,
    license: dto.license,
    note: dto.note,
    isPrimary: dto.isPrimary,
  };
}

/**
 * Bảng dinh dưỡng — CHỈ hiển thị chỉ số có dữ liệu (không tạo số liệu giả).
 * Kèm ghi chú cơ sở tính (1 khẩu phần / 100 g) và nguồn dữ liệu.
 */
export function toNutritionViewModel(rows: RecipeNutritionDto[]): NutritionViewModel {
  const row = rows[0];
  if (!row) return { facts: [] };

  const facts: NutritionFact[] = [];
  const add = (label: string, value: string | null, unit: string) => {
    const trimmed = trimDecimal(value);
    if (trimmed) facts.push({ label, value: `${trimmed} ${unit}` });
  };

  add("Năng lượng", row.calories, "kcal");
  add("Đạm", row.proteinG, "g");
  add("Tinh bột", row.carbsG, "g");
  add("Chất béo", row.fatG, "g");
  add("Chất xơ", row.fiberG, "g");
  add("Đường", row.sugarG, "g");
  add("Natri", row.sodiumMg, "mg");

  if (facts.length === 0) return { facts: [] };

  const noteParts = [
    `Theo ${NUTRITION_BASIS_LABEL[row.basis]}`,
    `nguồn: ${NUTRITION_SOURCE_LABEL[row.dataSourceType]}`,
  ];
  if (row.sourceNote) noteParts.push(row.sourceNote);

  return { facts, note: `${noteParts.join(" · ")}.` };
}

export function toRecipeDetail(dto: RecipeDetailDto): RecipeDetailViewModel {
  return {
    id: dto.id,
    slug: dto.slug,
    title: dto.title,
    summary: dto.summary ?? undefined,
    description: dto.description ?? dto.summary ?? undefined,
    imageUrl: dto.primaryImage?.url ?? dto.imageUrl,
    imageAlt: dto.primaryImage?.altText ?? dto.imageAlt ?? dto.title,
    prepMinutes: dto.prepMinutes ?? undefined,
    cookMinutes: dto.cookMinutes ?? undefined,
    totalMinutes: dto.totalMinutes ?? undefined,
    servings: dto.baseServings,
    difficulty: dto.difficulty,
    categories: dto.taxonomy.map((term) => term.name),
    ingredients: dto.ingredients.map(toRecipeIngredient),
    steps: dto.steps.map(toRecipeStep),
    nutrition: toNutritionViewModel(dto.nutrition),
    allergens: dto.allergens.map(toAllergenView),
    sources: dto.sources.map(toRecipeSourceView),
    publishedAt: dto.publishedAt,
  };
}

export function toAdminRecipeRow(dto: RecipeAdminSummaryDto): AdminRecipeRowViewModel {
  return {
    id: dto.id,
    slug: dto.slug,
    title: dto.title,
    summary: dto.summary ?? undefined,
    status: dto.status,
    difficulty: dto.difficulty,
    updatedAt: dto.updatedAt,
  };
}

/**
 * Dựng dữ liệu có cấu trúc schema.org/Recipe (P07 §16/§17).
 *
 * CHỈ đưa vào các trường CÓ dữ liệu thật — không suy diễn, không bịa giá trị
 * (ví dụ không có thời gian nấu thì bỏ `cookTime`).
 */
const NUTRITION_SCHEMA_KEY: Record<string, string> = {
  "Năng lượng": "calories",
  "Đạm": "proteinContent",
  "Tinh bột": "carbohydrateContent",
  "Chất béo": "fatContent",
  "Chất xơ": "fiberContent",
  "Đường": "sugarContent",
  "Natri": "sodiumContent",
};

export function toRecipeJsonLd(
  vm: RecipeDetailViewModel,
  url: string,
): Record<string, unknown> {
  const data: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Recipe",
    name: vm.title,
    url,
  };

  if (vm.description) data.description = vm.description;
  if (vm.imageUrl) data.image = [vm.imageUrl];
  if (vm.prepMinutes != null) data.prepTime = `PT${vm.prepMinutes}M`;
  if (vm.cookMinutes != null) data.cookTime = `PT${vm.cookMinutes}M`;
  if (vm.totalMinutes != null) data.totalTime = `PT${vm.totalMinutes}M`;
  if (vm.servings != null) data.recipeYield = `${vm.servings} khẩu phần`;
  if (vm.categories.length > 0) data.recipeCategory = vm.categories;

  if (vm.ingredients.length > 0) {
    data.recipeIngredient = vm.ingredients.map((ing) =>
      ing.amount ? `${ing.amount} ${ing.name}` : ing.name,
    );
  }

  if (vm.steps.length > 0) {
    data.recipeInstructions = vm.steps.map((step) => ({
      "@type": "HowToStep",
      position: step.order,
      text: step.instruction,
    }));
  }

  if (vm.nutrition.facts.length > 0) {
    const nutrition: Record<string, unknown> = { "@type": "NutritionInformation" };
    for (const fact of vm.nutrition.facts) {
      const key = NUTRITION_SCHEMA_KEY[fact.label];
      if (key) nutrition[key] = fact.value;
    }
    data.nutrition = nutrition;
  }

  return data;
}
