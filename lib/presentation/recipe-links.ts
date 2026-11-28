/**
 * Helper đường dẫn cho module Recipe (P07 §16, P08 §P08.2).
 *
 * Hàm THUẦN (pure) — dùng chung cho Server Component (phân trang) và Client Component
 * (bộ lọc). Không phụ thuộc React/DB/`server-only`.
 */

export const RECIPE_LIST_BASE = "/cong-thuc";

/** Tham số danh sách công thức công khai (khớp `listRecipesQuerySchema`). */
export interface RecipeListParams {
  q?: string;
  foodType?: string;
  cuisine?: string;
  difficulty?: string;
  sort?: string;
  /** Trục khám phá (P08 §P08.2). */
  mealType?: string;
  cookingMethod?: string;
  dietary?: string;
  ingredient?: string;
  ingredientCategory?: string;
  maxMinutes?: number;
  page?: number;
}

type RawSearchParams = Record<string, string | string[] | undefined>;

function firstValue(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

const TEXT_KEYS = [
  "q",
  "foodType",
  "cuisine",
  "difficulty",
  "sort",
  "mealType",
  "cookingMethod",
  "dietary",
  "ingredient",
  "ingredientCategory",
] as const;

/** Chuẩn hoá `searchParams` thô (Next.js) thành tham số đã gọn. */
export function parseRecipeListParams(searchParams: RawSearchParams = {}): RecipeListParams {
  const params: RecipeListParams = {};

  for (const key of TEXT_KEYS) {
    const value = firstValue(searchParams[key])?.trim();
    if (value) params[key] = value;
  }

  const maxRaw = firstValue(searchParams.maxMinutes);
  if (maxRaw) {
    const max = Number.parseInt(maxRaw, 10);
    if (Number.isInteger(max) && max > 0) params.maxMinutes = max;
  }

  const pageRaw = firstValue(searchParams.page);
  if (pageRaw) {
    const page = Number.parseInt(pageRaw, 10);
    if (Number.isInteger(page) && page > 1) params.page = page;
  }

  return params;
}

/**
 * Dựng href cho danh sách công thức. Bỏ các giá trị mặc định (sort "newest", page 1)
 * để URL gọn. `overrides` ghi đè lên `params` hiện tại. `basePath` cho phép dùng lại
 * helper ở trang tìm kiếm (`/tim-kiem`) mà không đổi mặc định `/cong-thuc`.
 */
export function buildRecipeListHref(
  params: RecipeListParams = {},
  overrides: Partial<RecipeListParams> = {},
  basePath: string = RECIPE_LIST_BASE,
): string {
  const merged: RecipeListParams = { ...params, ...overrides };
  const search = new URLSearchParams();

  for (const key of TEXT_KEYS) {
    const value = merged[key];
    if (!value) continue;
    if (key === "sort" && value === "newest") continue;
    search.set(key, value);
  }
  if (merged.maxMinutes) search.set("maxMinutes", String(merged.maxMinutes));
  if (merged.page && merged.page > 1) search.set("page", String(merged.page));

  const qs = search.toString();
  return qs ? `${basePath}?${qs}` : basePath;
}

/** Đường dẫn trang chi tiết công thức. */
export function recipeDetailHref(slug: string): string {
  return `${RECIPE_LIST_BASE}/${slug}`;
}
