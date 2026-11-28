/**
 * Helper đường dẫn cho khu vực Danh mục (P08 §P08.3).
 * Hàm THUẦN — dùng chung cho Server/Client Component.
 */

export const CATEGORY_BASE = "/danh-muc";

/** Trang tổng quan tất cả danh mục. */
export function categoryIndexHref(): string {
  return CATEGORY_BASE;
}

/** Trang một trục phân loại (`/danh-muc/{segment}`). */
export function categoryTypeHref(segment: string): string {
  return `${CATEGORY_BASE}/${segment}`;
}

/** Trang chi tiết một danh mục (`/danh-muc/{segment}/{slug}`), kèm số trang tùy chọn. */
export function categoryTermHref(segment: string, slug: string, page = 1): string {
  const base = `${CATEGORY_BASE}/${segment}/${slug}`;
  return page > 1 ? `${base}?page=${page}` : base;
}
