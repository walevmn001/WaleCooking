/**
 * Yêu thích bằng cookie — tầng THUẦN (P07.1 §7.1.4).
 *
 * Nguyên tắc:
 * - Sản phẩm KHÔNG có tài khoản khách → yêu thích không gắn User/bảng `favorites`.
 * - CHỈ lưu danh sách slug công thức (định danh) — KHÔNG lưu nội dung công thức.
 * - Dữ liệu cookie có VERSION để đổi định dạng về sau mà không vỡ dữ liệu cũ.
 * - Mọi hàm ở đây là pure (không phụ thuộc React/DB/`next/headers`) → dễ kiểm thử,
 *   dùng chung cho tầng server (đọc/ghi cookie) và tầng kiểm thử.
 *
 * Định dạng cookie (chuỗi JSON):
 *   { "v": 1, "items": ["pho-bo", "banh-mi"] }
 */

export const FAVORITES_COOKIE_NAME = "wale_favorites";
export const FAVORITES_VERSION = 1;

/** Giới hạn số công thức lưu được (tránh cookie phình to). */
export const MAX_FAVORITES = 50;

/** Thời hạn cookie: 180 ngày. */
export const FAVORITES_COOKIE_MAX_AGE = 60 * 60 * 24 * 180;

/**
 * Ngưỡng an toàn cho giá trị cookie (~4 KB theo chuẩn trình duyệt).
 * Để dư biên cho tên/attribute khác, cắt ở 3800 ký tự.
 */
export const MAX_COOKIE_VALUE_LENGTH = 3800;

export interface FavoritesPayload {
  v: number;
  items: string[];
}

export interface FavoritesParseResult {
  /** Danh sách slug đã chuẩn hoá (dedupe, lọc hợp lệ, giới hạn số lượng). */
  items: string[];
  /** Phiên bản định dạng đọc được (mặc định = phiên bản hiện tại khi cookie trống). */
  version: number;
  /** Cookie hỏng / sai định dạng (đã bỏ qua an toàn). */
  invalid: boolean;
  /** Phiên bản không được hỗ trợ (dữ liệu từ định dạng tương lai). */
  unsupportedVersion: boolean;
}

/**
 * Slug công thức hợp lệ: chữ thường, số, gạch ngang/gạch dưới, tối đa 200 ký tự.
 * Tolerant với `_` vì slug nội dung có thể chứa; việc lọc "công thức public" thật
 * được thực hiện ở tầng server (đối chiếu DB).
 */
const RECIPE_SLUG_RE = /^[a-z0-9]+(?:[-_][a-z0-9]+)*$/;

export function isRecipeSlug(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.length > 0 &&
    value.length <= 200 &&
    RECIPE_SLUG_RE.test(value)
  );
}

/** Chuẩn hoá danh sách slug: chỉ giữ hợp lệ, dedupe, giữ thứ tự, cắt theo giới hạn. */
export function normalizeFavorites(input: unknown): string[] {
  if (!Array.isArray(input)) return [];
  const seen = new Set<string>();
  const result: string[] = [];
  for (const value of input) {
    if (!isRecipeSlug(value)) continue;
    if (seen.has(value)) continue;
    seen.add(value);
    result.push(value);
    if (result.length >= MAX_FAVORITES) break;
  }
  return result;
}

/**
 * Đọc dữ liệu cookie. KHÔNG ném lỗi: mọi trường hợp sai đều trả kết quả an toàn
 * (danh sách rỗng + cờ `invalid`/`unsupportedVersion`).
 */
export function parseFavoritesCookie(raw: string | null | undefined): FavoritesParseResult {
  if (raw == null || raw === "") {
    return { items: [], version: FAVORITES_VERSION, invalid: false, unsupportedVersion: false };
  }

  // Cookie quá lớn bị coi là không hợp lệ (phòng thủ; trình duyệt thường đã cắt).
  if (raw.length > MAX_COOKIE_VALUE_LENGTH) {
    return { items: [], version: FAVORITES_VERSION, invalid: true, unsupportedVersion: false };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { items: [], version: FAVORITES_VERSION, invalid: true, unsupportedVersion: false };
  }

  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    return { items: [], version: FAVORITES_VERSION, invalid: true, unsupportedVersion: false };
  }

  const record = parsed as Record<string, unknown>;
  const version = typeof record.v === "number" && Number.isInteger(record.v) ? record.v : NaN;

  if (!Number.isInteger(version)) {
    return { items: [], version: FAVORITES_VERSION, invalid: true, unsupportedVersion: false };
  }

  if (version !== FAVORITES_VERSION) {
    return { items: [], version, invalid: false, unsupportedVersion: true };
  }

  if (!Array.isArray(record.items)) {
    return { items: [], version, invalid: true, unsupportedVersion: false };
  }

  return { items: normalizeFavorites(record.items), version, invalid: false, unsupportedVersion: false };
}

/** Tuần tự hoá danh sách slug thành giá trị cookie. */
export function serializeFavoritesCookie(items: string[]): string {
  const payload: FavoritesPayload = {
    v: FAVORITES_VERSION,
    items: normalizeFavorites(items),
  };
  return JSON.stringify(payload);
}

/** Thêm slug vào danh sách (bỏ trùng, tôn trọng giới hạn). Trả về danh sách mới. */
export function addFavorite(items: string[], slug: string): string[] {
  if (!isRecipeSlug(slug)) return normalizeFavorites(items);
  const normalized = normalizeFavorites(items);
  if (normalized.includes(slug)) return normalized;
  return normalizeFavorites([...normalized, slug]);
}

/** Xoá slug khỏi danh sách. Trả về danh sách mới. */
export function removeFavorite(items: string[], slug: string): string[] {
  return normalizeFavorites(items).filter((item) => item !== slug);
}

/** Xoá toàn bộ. */
export function clearFavorites(): string[] {
  return [];
}

/** Danh sách có chứa slug? */
export function hasFavorite(items: string[], slug: string): boolean {
  return isRecipeSlug(slug) && normalizeFavorites(items).includes(slug);
}

/** Hai danh sách khác nhau (để tránh ghi cookie vô ích)? */
export function isFavoritesPayloadChanged(a: string[], b: string[]): boolean {
  const left = normalizeFavorites(a);
  const right = normalizeFavorites(b);
  if (left.length !== right.length) return true;
  return left.some((value, index) => value !== right[index]);
}
