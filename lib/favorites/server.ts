import "server-only";

import { cookies } from "next/headers";

import type { RecipeSummaryDto } from "@/lib/db/repositories/recipe.repository";
import { recipeService } from "@/lib/services";

import {
  FAVORITES_COOKIE_MAX_AGE,
  FAVORITES_COOKIE_NAME,
  parseFavoritesCookie,
  serializeFavoritesCookie,
} from "./cookie";

/**
 * Yêu thích cookie — tầng SERVER (P07.1 §7.1.4).
 *
 * Dùng cookie HttpOnly + Server Action (xem `docs/P07_1/COOKIE_FAVORITES.md`):
 * - `httpOnly`: JavaScript trên trang KHÔNG đọc/ghi được → giảm rủi ro XSS.
 * - `sameSite=lax`: chống gửi cookie trong request cross-site (CSRF cơ bản).
 * - `secure` khi production; `path=/`; `maxAge` 180 ngày.
 * - KHÔNG lưu thông tin nhạy cảm: chỉ danh sách slug công thức.
 */

const isProd = process.env.NODE_ENV === "production";

/** Đọc danh sách slug yêu thích từ cookie (đã chuẩn hoá; an toàn với cookie hỏng). */
export async function readFavorites(): Promise<string[]> {
  const store = await cookies();
  const raw = store.get(FAVORITES_COOKIE_NAME)?.value;
  return parseFavoritesCookie(raw).items;
}

/** Slug này có trong yêu thích? */
export async function isFavorite(slug: string): Promise<boolean> {
  const items = await readFavorites();
  return items.includes(slug);
}

/**
 * Danh sách công thức yêu thích đã ánh xạ sang tóm tắt công khai.
 * CHỈ trả công thức `published` — slug đã bị xoá/đổi trạng thái tự động bị loại.
 */
export async function getFavoriteRecipes(): Promise<RecipeSummaryDto[]> {
  const slugs = await readFavorites();
  if (slugs.length === 0) return [];
  return recipeService.getPublicSummariesBySlugs(slugs);
}

/**
 * Ghi danh sách yêu thích vào cookie. Gọi trong Server Action / Route Handler.
 * Danh sách rỗng → xoá cookie.
 */
export async function persistFavorites(items: string[]): Promise<void> {
  const store = await cookies();
  if (items.length === 0) {
    store.delete(FAVORITES_COOKIE_NAME);
    return;
  }
  store.set(FAVORITES_COOKIE_NAME, serializeFavoritesCookie(items), {
    httpOnly: true,
    sameSite: "lax",
    secure: isProd,
    path: "/",
    maxAge: FAVORITES_COOKIE_MAX_AGE,
  });
}

/** Xoá toàn bộ yêu thích (xoá cookie). */
export async function clearFavoritesCookie(): Promise<void> {
  const store = await cookies();
  store.delete(FAVORITES_COOKIE_NAME);
}
