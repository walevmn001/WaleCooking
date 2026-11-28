import type { Metadata } from "next";
import { Container } from "@/components/layout/container";
import { Breadcrumb } from "@/components/navigation/breadcrumb";
import { Pagination } from "@/components/navigation/pagination";
import { FavoriteButton } from "@/components/recipe/favorite-button";
import { RecipeCard } from "@/components/recipe/recipe-card";
import { RecipeFilters } from "@/components/recipe/recipe-filters";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { readFavorites } from "@/lib/favorites/server";
import { buildRecipeListHref, parseRecipeListParams } from "@/lib/presentation/recipe-links";
import { toRecipeSummary } from "@/lib/presentation/recipe-view";
import { catalogService, recipeService } from "@/lib/services";
import type { Paginated } from "@/lib/validation/common";
import type { RecipeSummaryDto } from "@/lib/db/repositories/recipe.repository";

export const metadata: Metadata = {
  title: "Công thức",
  description: "Kho công thức nấu ăn WALE COOKING với tìm kiếm, lọc theo loại món và sắp xếp.",
};

export const dynamic = "force-dynamic";

interface RecipesPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

/**
 * Danh sách công thức công khai (P07 §16).
 *
 * - CHỈ hiển thị công thức `published` (service đảm bảo — BR-13).
 * - Lọc/tìm kiếm qua query string; phân trang phía server.
 * - Có trạng thái rỗng, lỗi và đang tải (loading.tsx cùng thư mục).
 */
export default async function RecipesPage({ searchParams }: RecipesPageProps) {
  const rawParams = await searchParams;
  const params = parseRecipeListParams(rawParams);

  let data: Paginated<RecipeSummaryDto>;
  try {
    data = await recipeService.listPublic(rawParams);
  } catch {
    return (
      <Container className="py-8 sm:py-12">
        <Breadcrumb items={[{ label: "Trang chủ", href: "/" }, { label: "Công thức" }]} />
        <ErrorState
          className="mt-6"
          title="Chưa tải được danh sách công thức"
          description="Rất tiếc, kho công thức đang tạm thời không phản hồi. Vui lòng thử lại sau."
        />
      </Container>
    );
  }

  const [foodTypeTerms, cuisineTerms] = await Promise.all([
    catalogService.listTaxonomyTerms("food_type").catch(() => []),
    catalogService.listTaxonomyTerms("cuisine").catch(() => []),
  ]);

  const foodTypes = foodTypeTerms.map((term) => ({ value: term.slug, label: term.name }));
  const cuisines = cuisineTerms.map((term) => ({ value: term.slug, label: term.name }));

  // Trạng thái yêu thích (cookie) để tô sáng nút trái tim — không cần đăng nhập.
  const favoriteSlugs = new Set(await readFavorites().catch(() => [] as string[]));

  return (
    <Container className="py-8 sm:py-12">
      <Breadcrumb items={[{ label: "Trang chủ", href: "/" }, { label: "Công thức" }]} />

      <header className="mt-6 flex flex-col gap-2">
        <h1 className="text-h1 text-ink">Công thức</h1>
        <p className="max-w-prose text-body text-ink-muted">
          Khám phá kho công thức nấu ăn. Dùng tìm kiếm và bộ lọc để tìm món phù hợp.
        </p>
      </header>

      <RecipeFilters
        className="mt-6"
        params={params}
        foodTypes={foodTypes}
        cuisines={cuisines}
      />

      {data.items.length === 0 ? (
        <EmptyState
          className="mt-8"
          title="Không tìm thấy công thức"
          description="Chưa có công thức nào khớp với bộ lọc hiện tại. Hãy thử xoá bộ lọc hoặc dùng từ khoá khác."
        />
      ) : (
        <>
          <p className="mt-8 text-body-sm text-ink-muted" aria-live="polite">
            {data.total} công thức
          </p>
          <ul className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {data.items.map((dto, index) => (
              <li key={dto.id}>
                <RecipeCard
                  recipe={toRecipeSummary(dto)}
                  href={`/cong-thuc/${dto.slug}`}
                  priority={index < 3}
                  favoriteSlot={
                    <FavoriteButton
                      slug={dto.slug}
                      initialFavorite={favoriteSlugs.has(dto.slug)}
                      variant="icon"
                    />
                  }
                  className="h-full"
                />
              </li>
            ))}
          </ul>
          <Pagination
            className="mt-10"
            page={data.page}
            totalPages={data.totalPages}
            hrefFor={(page) => buildRecipeListHref(params, { page })}
          />
        </>
      )}
    </Container>
  );
}
