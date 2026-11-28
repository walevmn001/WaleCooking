"use server";

import { revalidatePath } from "next/cache";

import {
  addFavorite,
  clearFavorites,
  isRecipeSlug,
  removeFavorite,
} from "@/lib/favorites/cookie";
import { persistFavorites, readFavorites } from "@/lib/favorites/server";

/**
 * Server Actions cho yêu thích cookie (P07.1 §7.1.4).
 *
 * Vì cookie HttpOnly chỉ đọc/ghi được ở server, mọi thao tác thêm/xoá/xoá-hết đi
 * qua các action này. Client gọi action rồi `router.refresh()`/revalidate để cập nhật UI.
 */

export interface FavoritesActionResult {
  ok: boolean;
  items: string[];
}

/** Làm mới các trang hiển thị trạng thái yêu thích. */
function revalidateFavorites(): void {
  revalidatePath("/yeu-thich");
  revalidatePath("/cong-thuc");
}

export async function addFavoriteAction(slug: string): Promise<FavoritesActionResult> {
  const current = await readFavorites();
  if (!isRecipeSlug(slug)) return { ok: false, items: current };
  const next = addFavorite(current, slug);
  await persistFavorites(next);
  revalidateFavorites();
  return { ok: true, items: next };
}

export async function removeFavoriteAction(slug: string): Promise<FavoritesActionResult> {
  const current = await readFavorites();
  const next = removeFavorite(current, slug);
  await persistFavorites(next);
  revalidateFavorites();
  return { ok: true, items: next };
}

/** Bật/tắt yêu thích theo trạng thái mong muốn (tiện cho nút toggle). */
export async function toggleFavoriteAction(
  slug: string,
  shouldFavorite: boolean,
): Promise<FavoritesActionResult> {
  return shouldFavorite ? addFavoriteAction(slug) : removeFavoriteAction(slug);
}

export async function clearFavoritesAction(): Promise<FavoritesActionResult> {
  await persistFavorites(clearFavorites());
  revalidateFavorites();
  return { ok: true, items: [] };
}
