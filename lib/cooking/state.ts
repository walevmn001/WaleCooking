/**
 * Trạng thái phiên nấu & checklist nguyên liệu — lưu CỤC BỘ phía client (P09.2/P09.4).
 *
 * Lý do không dùng DB: `CookingSession`/`CookingProgress` (schema P06) yêu cầu `userId`
 * trong khi sản phẩm KHÔNG có tài khoản khách (P07.1) → xem `docs/P09/RECIPE_DATA_AUDIT.md` §4.
 *
 * Nguyên tắc (giống module yêu thích-cookie P07.1):
 * - Có VERSION để đổi định dạng về sau mà không vỡ dữ liệu cũ.
 * - Hàm THUẦN (không phụ thuộc React) → dễ kiểm thử; phần đọc/ghi `localStorage` tách riêng.
 * - KHÔNG lưu dữ liệu nhạy cảm: chỉ mã công thức (slug), chỉ số bước, danh sách id
 *   nguyên liệu đã chuẩn bị, số khẩu phần, mốc thời gian bắt đầu.
 * - Dữ liệu hỏng / version lạ / sai công thức → bỏ qua an toàn (trả trạng thái mặc định).
 */

export const COOKING_STATE_VERSION = 1;
export const COOKING_STORAGE_PREFIX = "wale_cooking_v1:";

/** Trạng thái vòng đời phiên nấu. */
export type CookingStatus = "idle" | "active" | "completed";

export interface CookingState {
  v: number;
  /** Slug công thức (định danh — không lưu nội dung). */
  slug: string;
  /** Số khẩu phần người dùng đang chọn. */
  servings: number;
  /** Id các nguyên liệu đã đánh dấu chuẩn bị. */
  checkedIds: string[];
  /** Chỉ số bước hiện tại (0-based) trong chế độ nấu. */
  stepIndex: number;
  /** Mốc epoch ms bắt đầu phiên nấu (null khi chưa bắt đầu). */
  startedAt: number | null;
  status: CookingStatus;
}

export function storageKey(slug: string): string {
  return `${COOKING_STORAGE_PREFIX}${slug}`;
}

/** Trạng thái khởi tạo cho một công thức. */
export function createCookingState(slug: string, baseServings: number): CookingState {
  return {
    v: COOKING_STATE_VERSION,
    slug,
    servings: baseServings > 0 ? baseServings : 1,
    checkedIds: [],
    stepIndex: 0,
    startedAt: null,
    status: "idle",
  };
}

/** Loại trùng + chỉ giữ id hợp lệ (nếu có danh sách hợp lệ). */
export function normalizeCheckedIds(input: unknown, validIds?: readonly string[]): string[] {
  if (!Array.isArray(input)) return [];
  const valid = validIds ? new Set(validIds) : null;
  const seen = new Set<string>();
  const result: string[] = [];
  for (const value of input) {
    if (typeof value !== "string" || value.length === 0) continue;
    if (valid && !valid.has(value)) continue;
    if (seen.has(value)) continue;
    seen.add(value);
    result.push(value);
  }
  return result;
}

export interface ParseCookingStateOptions {
  /** Số bước của công thức hiện tại (để kẹp `stepIndex`; bỏ nguyên liệu/bước đã mất). */
  stepCount: number;
  /** Id nguyên liệu hợp lệ hiện tại (lọc checklist theo công thức hiện tại). */
  validIngredientIds?: readonly string[];
  /** Số khẩu phần gốc — dùng cho giá trị mặc định. */
  baseServings: number;
}

/**
 * Đọc trạng thái từ chuỗi JSON. KHÔNG ném lỗi: mọi trường hợp sai/hỏng đều trả
 * trạng thái mặc định. Xử lý công thức đổi phiên bản: `stepIndex` được kẹp lại và
 * các id nguyên liệu không còn tồn tại bị loại bỏ.
 */
export function parseCookingState(
  raw: string | null | undefined,
  slug: string,
  options: ParseCookingStateOptions,
): CookingState {
  const fallback = createCookingState(slug, options.baseServings);
  if (raw == null || raw === "") return fallback;

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return fallback;
  }
  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) return fallback;

  const record = parsed as Record<string, unknown>;

  // Version không khớp (dữ liệu cũ/tương lai) → bỏ, dùng mặc định.
  if (record.v !== COOKING_STATE_VERSION) return fallback;
  // Dữ liệu thuộc công thức khác → bỏ (tránh lẫn tiến độ giữa các món).
  if (record.slug !== slug) return fallback;

  const maxStep = Math.max(0, options.stepCount - 1);
  const rawStep = typeof record.stepIndex === "number" ? record.stepIndex : 0;
  const stepIndex = Number.isFinite(rawStep) ? Math.min(maxStep, Math.max(0, Math.round(rawStep))) : 0;

  const servings =
    typeof record.servings === "number" && Number.isFinite(record.servings) && record.servings > 0
      ? record.servings
      : fallback.servings;

  const startedAt =
    typeof record.startedAt === "number" && Number.isFinite(record.startedAt)
      ? record.startedAt
      : null;

  const status: CookingStatus =
    record.status === "active" || record.status === "completed" || record.status === "idle"
      ? record.status
      : "idle";

  return {
    v: COOKING_STATE_VERSION,
    slug,
    servings,
    checkedIds: normalizeCheckedIds(record.checkedIds, options.validIngredientIds),
    stepIndex,
    startedAt,
    status,
  };
}

export function serializeCookingState(state: CookingState): string {
  return JSON.stringify({ ...state, v: COOKING_STATE_VERSION });
}

export interface ChecklistProgress {
  done: number;
  total: number;
  ratio: number;
}

/** Tiến độ checklist: số đã chuẩn bị / tổng (chỉ tính id hợp lệ). */
export function checklistProgress(
  validIngredientIds: readonly string[],
  checkedIds: readonly string[],
): ChecklistProgress {
  const valid = new Set(validIngredientIds);
  const done = checkedIds.filter((id) => valid.has(id)).length;
  const total = validIngredientIds.length;
  return { done, total, ratio: total === 0 ? 0 : done / total };
}

// ---------------------------------------------------------------------------
// Truy cập localStorage (có kiểm tra môi trường — an toàn khi SSR)
// ---------------------------------------------------------------------------

function getStorage(): Storage | null {
  try {
    if (typeof window === "undefined" || !window.localStorage) return null;
    return window.localStorage;
  } catch {
    // Trình duyệt chặn storage (chế độ riêng tư) → chạy không lưu, không lỗi.
    return null;
  }
}

/** Đọc trạng thái đã lưu; trả mặc định nếu không có/không đọc được. */
export function loadCookingState(
  slug: string,
  options: ParseCookingStateOptions,
): CookingState {
  const storage = getStorage();
  if (!storage) return createCookingState(slug, options.baseServings);
  let raw: string | null = null;
  try {
    raw = storage.getItem(storageKey(slug));
  } catch {
    raw = null;
  }
  return parseCookingState(raw, slug, options);
}

/** Ghi trạng thái; bỏ qua an toàn nếu không có storage. */
export function saveCookingState(state: CookingState): void {
  const storage = getStorage();
  if (!storage) return;
  try {
    storage.setItem(storageKey(state.slug), serializeCookingState(state));
  } catch {
    // Hết dung lượng / bị chặn → bỏ qua, không làm hỏng UI.
  }
}

/** Xoá trạng thái của một công thức (kết thúc phiên nấu). */
export function clearCookingState(slug: string): void {
  const storage = getStorage();
  if (!storage) return;
  try {
    storage.removeItem(storageKey(slug));
  } catch {
    // bỏ qua
  }
}
