/**
 * Khớp công thức theo nguyên liệu người dùng đang có (P10.3) — logic THUẦN.
 *
 * Nguyên tắc:
 * - CHUẨN HOÁ đầu vào: bỏ dấu, chữ thường, gộp khoảng trắng, bỏ ký tự thừa; loại trùng.
 * - KHÔNG tự đoán hai nguyên liệu khác tên là tương đương: chỉ so khớp theo tên/định danh
 *   đã có trong dữ liệu; không tự tạo công thức, không bịa kết quả.
 * - Điểm khớp tính từ dữ liệu THỰC: số nguyên liệu khớp, tỷ lệ khớp trên tổng nguyên liệu
 *   công thức, và số nguyên liệu còn thiếu (tách riêng nguyên liệu BẮT BUỘC để không khẳng
 *   định người dùng "nấu được" khi còn thiếu nguyên liệu thiết yếu).
 */

/** Một nguyên liệu trong công thức (tên hiển thị + định danh nếu có). */
export interface MatchIngredientRef {
  name: string;
  slug?: string | null;
  /** Bắt buộc (mặc định true nếu không rõ). */
  required?: boolean;
}

/** Ứng viên công thức để chấm điểm. */
export interface IngredientMatchCandidate {
  slug: string;
  title: string;
  imageUrl: string | null;
  imageAlt?: string | null;
  totalMinutes: number | null;
  cookMinutes: number | null;
  difficulty?: string | null;
  baseServings: number;
  ingredients: MatchIngredientRef[];
}

export interface IngredientMatchResult {
  candidate: IngredientMatchCandidate;
  /** Tên nguyên liệu của công thức ĐÃ có trong danh sách người dùng. */
  matched: string[];
  /** Tên nguyên liệu của công thức CÒN THIẾU. */
  missing: string[];
  /** Nguyên liệu thiếu thuộc nhóm bắt buộc (nếu còn ⇒ chưa đủ để nấu đủ vị). */
  missingRequired: string[];
  /** Số nguyên liệu người dùng (đã chuẩn hoá) khớp được với công thức này. */
  userMatchedCount: number;
  matchedCount: number;
  missingCount: number;
  totalIngredients: number;
  /** Tỷ lệ nguyên liệu công thức đã có (matched / total). */
  coverage: number;
  /** Tỷ lệ nguyên liệu người dùng dùng được (userMatched / tổng số nguyên liệu người dùng). */
  userCoverage: number;
  /** Đã có đủ mọi nguyên liệu bắt buộc chưa. */
  completeRequired: boolean;
}

/**
 * Chuẩn hoá văn bản để so khớp: bỏ dấu tiếng Việt, chữ thường, bỏ ký tự đặc biệt, gộp khoảng trắng.
 */
export function normalizeText(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[đĐ]/g, "d")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Loại trùng theo dạng chuẩn hoá, giữ nguyên hình thức hiển thị đầu tiên. */
export function dedupeIngredients(input: readonly string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const raw of input) {
    if (typeof raw !== "string") continue;
    const display = raw.trim().replace(/\s+/g, " ");
    if (!display) continue;
    const key = normalizeText(display);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    result.push(display);
  }
  return result;
}

/** `haystack` có chứa `needle` như một (nhóm) từ trọn vẹn không (đã chuẩn hoá). */
function containsWords(haystack: string, needle: string): boolean {
  if (!haystack || !needle) return false;
  if (haystack === needle) return true;
  return (
    haystack.startsWith(`${needle} `) ||
    haystack.endsWith(` ${needle}`) ||
    haystack.includes(` ${needle} `)
  );
}

/** Một nguyên liệu công thức có khớp với một từ khoá người dùng (đã chuẩn hoá) không. */
export function ingredientMatches(userNormalized: string, ing: MatchIngredientRef): boolean {
  if (!userNormalized) return false;
  const nameNorm = normalizeText(ing.name);
  if (nameNorm && (nameNorm === userNormalized || containsWords(nameNorm, userNormalized))) {
    return true;
  }
  // So khớp theo định danh (slug → dạng từ) khi có.
  if (ing.slug) {
    const slugNorm = normalizeText(ing.slug.replace(/[-_]/g, " "));
    if (slugNorm && slugNorm === userNormalized) return true;
  }
  return false;
}

export interface MatchOptions {
  /** Số nguyên liệu công thức khớp tối thiểu để đưa vào kết quả (mặc định 1). */
  minMatched?: number;
}

/**
 * Chấm điểm & xếp hạng công thức theo nguyên liệu người dùng.
 * Chỉ trả công thức khớp ≥ `minMatched` nguyên liệu người dùng; sắp xếp điểm giảm dần.
 */
export function matchRecipesByIngredients(
  userIngredients: readonly string[],
  candidates: readonly IngredientMatchCandidate[],
  options: MatchOptions = {},
): IngredientMatchResult[] {
  const minMatched = Math.max(1, options.minMatched ?? 1);
  const userNorms = dedupeIngredients(userIngredients).map(normalizeText).filter(Boolean);
  if (userNorms.length === 0) return [];

  const results: IngredientMatchResult[] = [];

  for (const candidate of candidates) {
    const matched: string[] = [];
    const missing: string[] = [];
    const missingRequired: string[] = [];

    for (const ing of candidate.ingredients) {
      const hit = userNorms.some((userNorm) => ingredientMatches(userNorm, ing));
      if (hit) {
        matched.push(ing.name);
      } else {
        missing.push(ing.name);
        if (ing.required !== false) missingRequired.push(ing.name);
      }
    }

    // Số nguyên liệu NGƯỜI DÙNG khớp được với công thức này (đếm theo phía người dùng).
    const userMatchedCount = userNorms.filter((userNorm) =>
      candidate.ingredients.some((ing) => ingredientMatches(userNorm, ing)),
    ).length;

    if (userMatchedCount < minMatched) continue;

    const totalIngredients = candidate.ingredients.length;
    results.push({
      candidate,
      matched,
      missing,
      missingRequired,
      userMatchedCount,
      matchedCount: matched.length,
      missingCount: missing.length,
      totalIngredients,
      coverage: totalIngredients === 0 ? 0 : matched.length / totalIngredients,
      userCoverage: userMatchedCount / userNorms.length,
      completeRequired: missingRequired.length === 0,
    });
  }

  results.sort((a, b) => {
    if (b.userMatchedCount !== a.userMatchedCount) return b.userMatchedCount - a.userMatchedCount;
    if (b.coverage !== a.coverage) return b.coverage - a.coverage;
    if (a.missingRequired.length !== b.missingRequired.length) {
      return a.missingRequired.length - b.missingRequired.length;
    }
    if (a.missingCount !== b.missingCount) return a.missingCount - b.missingCount;
    return a.candidate.title.localeCompare(b.candidate.title);
  });

  return results;
}
