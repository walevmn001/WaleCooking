import type { Metadata } from "next";

import { Container } from "@/components/layout/container";
import { Breadcrumb } from "@/components/navigation/breadcrumb";
import { ClearFavoritesButton } from "@/components/recipe/clear-favorites-button";
import { FavoriteButton } from "@/components/recipe/favorite-button";
import { RecipeCard } from "@/components/recipe/recipe-card";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Link } from "@/components/ui/link";
import { getFavoriteRecipes } from "@/lib/favorites/server";
import { recipeDetailHref } from "@/lib/presentation/recipe-links";
import { toRecipeSummary } from "@/lib/presentation/recipe-view";
import type { RecipeSummaryDto } from "@/lib/db/repositories/recipe.repository";

export const metadata: Metadata = {
  title: "Yêu thích",
  description: "Danh sách công thức bạn đã lưu trên WALE COOKING.",
  robots: { index: false, follow: true },
};

/** Trang đọc cookie yêu thích → luôn render động. */
export const dynamic = "force-dynamic";

/**
 * Trang Yêu thích (P07.1 §7.1.4).
 *
 * Yêu thích lưu bằng cookie (không cần tài khoản). Danh sách đọc từ cookie rồi đối
 * chiếu DB — slug đã bị xoá/ngừng xuất bản tự động bị loại khỏi kết quả.
 */
export default async function FavoritesPage() {
  let favorites: RecipeSummaryDto[];
  try {
    favorites = await getFavoriteRecipes();
  } catch {
    return (
      <Container className="py-8 sm:py-12">
        <Breadcrumb items={[{ label: "Trang chủ", href: "/" }, { label: "Yêu thích" }]} />
        <ErrorState
          className="mt-6"
          title="Chưa tải được danh sách yêu thích"
          description="Rất tiếc, danh sách yêu thích đang tạm thời không phản hồi. Vui lòng thử lại sau."
        />
      </Container>
    );
  }

  return (
    <Container className="py-8 sm:py-12">
      <Breadcrumb items={[{ label: "Trang chủ", href: "/" }, { label: "Yêu thích" }]} />

      <header className="mt-6 flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-2">
          <h1 className="text-h1 text-ink">Yêu thích</h1>
          <p className="max-w-prose text-body text-ink-muted">
            Công thức bạn đã lưu. Danh sách được lưu trên trình duyệt này — không cần tài khoản.
          </p>
        </div>
        {favorites.length > 0 ? <ClearFavoritesButton /> : null}
      </header>

      {favorites.length === 0 ? (
        <EmptyState
          className="mt-8"
          title="Chưa có công thức yêu thích"
          description="Hãy đánh dấu công thức bạn thích bằng nút trái tim để xem lại nhanh tại đây."
          action={
            <Link href="/cong-thuc" appearance="button" variant="primary" size="md">
              Khám phá công thức
            </Link>
          }
        />
      ) : (
        <ul className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {favorites.map((dto, index) => (
            <li key={dto.id}>
              <RecipeCard
                recipe={toRecipeSummary(dto)}
                href={recipeDetailHref(dto.slug)}
                priority={index < 3}
                favoriteSlot={<FavoriteButton slug={dto.slug} initialFavorite variant="icon" />}
                className="h-full"
              />
            </li>
          ))}
        </ul>
      )}
    </Container>
  );
}
