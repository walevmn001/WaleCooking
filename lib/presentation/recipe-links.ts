/**
 * Helper đường dẫn cho module Recipe (P07 §16).
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
  page?: number;
}

type RawSearchParams = Record<string, string | string[] | undefined>;

function firstValue(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

/** Chuẩn hoá `searchParams` thô (Next.js) thành tham số đã gọn. */
export function parseRecipeListParams(searchParams: RawSearchParams = {}): RecipeListParams {
  const params: RecipeListParams = {};

  const q = firstValue(searchParams.q)?.trim();
  if (q) params.q = q;

  const foodType = firstValue(searchParams.foodType)?.trim();
  if (foodType) params.foodType = foodType;

  const cuisine = firstValue(searchParams.cuisine)?.trim();
  if (cuisine) params.cuisine = cuisine;

  const difficulty = firstValue(searchParams.difficulty)?.trim();
  if (difficulty) params.difficulty = difficulty;

  const sort = firstValue(searchParams.sort)?.trim();
  if (sort) params.sort = sort;

  const pageRaw = firstValue(searchParams.page);
  if (pageRaw) {
    const page = Number.parseInt(pageRaw, 10);
    if (Number.isInteger(page) && page > 1) params.page = page;
  }

  return params;
}

/**
 * Dựng href cho danh sách công thức. Bỏ các giá trị mặc định (sort "newest", page 1)
 * để URL gọn. `overrides` ghi đè lên `params` hiện tại.
 */
export function buildRecipeListHref(
  params: RecipeListParams = {},
  overrides: Partial<RecipeListParams> = {},
): string {
  const merged: RecipeListParams = { ...params, ...overrides };
  const search = new URLSearchParams();

  if (merged.q) search.set("q", merged.q);
  if (merged.foodType) search.set("foodType", merged.foodType);
  if (merged.cuisine) search.set("cuisine", merged.cuisine);
  if (merged.difficulty) search.set("difficulty", merged.difficulty);
  if (merged.sort && merged.sort !== "newest") search.set("sort", merged.sort);
  if (merged.page && merged.page > 1) search.set("page", String(merged.page));

  const qs = search.toString();
  return qs ? `${RECIPE_LIST_BASE}?${qs}` : RECIPE_LIST_BASE;
}

/** Đường dẫn trang chi tiết công thức. */
export function recipeDetailHref(slug: string): string {
  return `${RECIPE_LIST_BASE}/${slug}`;
}
