import type { Metadata } from "next";
import { Compass, Library, Search, Sparkles } from "lucide-react";

import { Container } from "@/components/layout/container";
import { Breadcrumb } from "@/components/navigation/breadcrumb";
import { Pagination } from "@/components/navigation/pagination";
import { FavoriteButton } from "@/components/recipe/favorite-button";
import { RecipeCard } from "@/components/recipe/recipe-card";
import { RecipeFilters } from "@/components/recipe/recipe-filters";
import { Card, CardBody } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Link } from "@/components/ui/link";
import type { RecipeSummaryDto } from "@/lib/db/repositories/recipe.repository";
import { readFavorites } from "@/lib/favorites/server";
import {
  buildRecipeListHref,
  parseRecipeListParams,
  recipeDetailHref,
} from "@/lib/presentation/recipe-links";
import { toRecipeSummary } from "@/lib/presentation/recipe-view";
import { catalogService } from "@/lib/services/catalog.service";
import { recipeService } from "@/lib/services/recipe.service";
import type { Paginated } from "@/lib/validation/common";
import { sanitizeRecipeListQuery, type RawQueryParams } from "@/lib/validation/recipe";

export const metadata: Metadata = {
  title: "Tìm kiếm",
  description:
    "Tìm công thức nấu ăn theo tên món, nguyên liệu, loại món, xuất xứ, bữa ăn, phương pháp và nhiều tiêu chí khác.",
};

export const dynamic = "force-dynamic";

/** Trang tìm kiếm công khai (FR-05, P15.3) — dùng chung cơ sở hạ tầng với `/cong-thuc`. */
const SEARCH_BASE = "/tim-kiem";

/** Lối vào khám phá khi chưa nhập từ khoá — liên kết thật, không bịa dữ liệu. */
const discoveryLinks = [
  {
    title: "Toàn bộ công thức",
    description: "Duyệt kho công thức đã xuất bản trên WALE COOKING.",
    href: "/cong-thuc",
    icon: Library,
  },
  {
    title: "Khám phá danh mục",
    description: "Tìm món theo nhóm món, nền ẩm thực, bữa ăn và nhiều cách phân loại khác.",
    href: "/danh-muc",
    icon: Compass,
  },
  {
    title: "Tìm món theo nguyên liệu",
    description: "Nhập những nguyên liệu bạn đang có để tìm công thức phù hợp.",
    href: "/cong-cu/tim-theo-nguyen-lieu",
    icon: Search,
  },
  {
    title: "Công cụ nhà bếp",
    description: "Đồng hồ đếm ngược, quy đổi đơn vị và các công cụ hỗ trợ nấu ăn.",
    href: "/cong-cu",
    icon: Sparkles,
  },
] as const;

/**
 * Trang tìm kiếm công khai (FR-05, P15.3).
 *
 * - Thay hoàn toàn PlaceholderPage; tái sử dụng `RecipeFilters`, `RecipeCard`,
 *   `Pagination`, `EmptyState`, `ErrorState` và tầng service hiện có.
 * - Nhận `q` + các bộ lọc đã có; đồng bộ URL (chia sẻ được); KHÔNG đổi semantics
 *   tìm kiếm, KHÔNG autocomplete/FTS.
 * - Tham số URL không hợp lệ bị loại bỏ (`sanitizeRecipeListQuery`) thay vì gây lỗi.
 * - CHỈ hiển thị số kết quả đếm THẬT từ dữ liệu (BR-02) — không con số giả.
 */
export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<RawQueryParams>;
}) {
  const rawParams = await searchParams;
  const safeQuery = sanitizeRecipeListQuery(rawParams);
  const params = parseRecipeListParams(safeQuery);

  const hasFilters = Boolean(
    params.foodType ||
      params.cuisine ||
      params.difficulty ||
      params.mealType ||
      params.cookingMethod ||
      params.dietary ||
      params.maxMinutes,
  );
  const hasQuery = Boolean(params.q) || hasFilters;

  // Từ vựng cho bộ lọc — lỗi riêng từng trục không làm hỏng cả trang.
  const [foodTypeTerms, cuisineTerms, mealTypeTerms, cookingMethodTerms, dietaryTerms] =
    await Promise.all([
      catalogService.listTaxonomyTerms("food_type").catch(() => []),
      catalogService.listTaxonomyTerms("cuisine").catch(() => []),
      catalogService.listTaxonomyTerms("meal_type").catch(() => []),
      catalogService.listTaxonomyTerms("cooking_method").catch(() => []),
      catalogService.listTaxonomyTerms("dietary_preference").catch(() => []),
    ]);

  const foodTypes = foodTypeTerms.map((term) => ({ value: term.slug, label: term.name }));
  const cuisines = cuisineTerms.map((term) => ({ value: term.slug, label: term.name }));
  const mealTypes = mealTypeTerms.map((term) => ({ value: term.slug, label: term.name }));
  const cookingMethods = cookingMethodTerms.map((term) => ({ value: term.slug, label: term.name }));
  const dietaryPreferences = dietaryTerms.map((term) => ({ value: term.slug, label: term.name }));

  let data: Paginated<RecipeSummaryDto> | null = null;
  let failed = false;
  if (hasQuery) {
    try {
      data = await recipeService.listPublic(safeQuery);
    } catch (error) {
      console.error("[tim-kiem] Không tải được kết quả tìm kiếm:", error);
      failed = true;
    }
  }

  // Trạng thái yêu thích (cookie) để tô sáng nút trái tim — không cần đăng nhập.
  const favoriteSlugs = new Set(await readFavorites().catch(() => [] as string[]));

  const retryHref = buildRecipeListHref(params, {}, SEARCH_BASE);

  return (
    <Container className="py-8 sm:py-12">
      <Breadcrumb items={[{ label: "Trang chủ", href: "/" }, { label: "Tìm kiếm" }]} />

      <header className="mt-6 flex flex-col gap-2">
        <h1 className="text-h1 text-ink">Tìm kiếm</h1>
        <p className="max-w-prose text-body text-ink-muted">
          {params.q
            ? `Kết quả cho “${params.q}”. Dùng bộ lọc để thu hẹp thêm.`
            : "Tìm công thức theo tên món, nguyên liệu hoặc chọn bộ lọc bên dưới."}
        </p>
      </header>

      <RecipeFilters
        className="mt-6"
        params={params}
        basePath={SEARCH_BASE}
        foodTypes={foodTypes}
        cuisines={cuisines}
        mealTypes={mealTypes}
        cookingMethods={cookingMethods}
        dietaryPreferences={dietaryPreferences}
      />

      {!hasQuery ? (
        <section aria-labelledby="search-intro-heading" className="mt-8 flex flex-col gap-8">
          <div className="flex flex-col gap-2">
            <h2 id="search-intro-heading" className="text-h2 text-ink">
              Bắt đầu tìm kiếm
            </h2>
            <p className="max-w-prose text-body text-ink-muted">
              Nhập tên món hoặc nguyên liệu vào ô tìm kiếm, hoặc chọn một bộ lọc. Bạn cũng có
              thể bắt đầu từ những gợi ý dưới đây.
            </p>
          </div>

          {foodTypes.length > 0 ? (
            <div className="flex flex-col gap-3">
              <h3 className="text-h4 text-ink">Gợi ý nhanh theo loại món</h3>
              <ul className="flex flex-wrap gap-2">
                {foodTypes.slice(0, 8).map((option) => (
                  <li key={option.value}>
                    <Link
                      href={buildRecipeListHref({ foodType: option.value }, {}, SEARCH_BASE)}
                      appearance="button"
                      variant="outline"
                      size="sm"
                    >
                      {option.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          <div className="flex flex-col gap-3">
            <h3 className="text-h4 text-ink">Khám phá</h3>
            <ul className="grid gap-5 sm:grid-cols-2">
              {discoveryLinks.map((item) => {
                const Icon = item.icon;
                return (
                  <li key={item.href}>
                    <Card as="article" interactive className="h-full">
                      <CardBody className="flex flex-col gap-3">
                        <span
                          className="inline-flex size-12 items-center justify-center rounded-lg bg-primary-subtle text-primary"
                          aria-hidden="true"
                        >
                          <Icon className="size-6" />
                        </span>
                        <h4 className="text-h4 text-ink">
                          <Link
                            href={item.href}
                            appearance="unstyled"
                            className="rounded-sm focus-visible:outline-none focus-visible:focus-ring after:absolute after:inset-0 after:content-['']"
                          >
                            {item.title}
                          </Link>
                        </h4>
                        <p className="text-body-sm text-ink-muted">{item.description}</p>
                      </CardBody>
                    </Card>
                  </li>
                );
              })}
            </ul>
          </div>
        </section>
      ) : failed ? (
        <ErrorState
          className="mt-8"
          title="Chưa tải được kết quả tìm kiếm"
          description="Rất tiếc, tìm kiếm đang tạm thời không phản hồi. Vui lòng thử lại hoặc xoá bớt bộ lọc."
          action={
            <Link href={retryHref} appearance="button" variant="primary">
              Thử lại
            </Link>
          }
        />
      ) : data && data.items.length > 0 ? (
        <>
          <p className="mt-8 text-body-sm text-ink-muted" aria-live="polite">
            {data.total} kết quả
          </p>
          <ul className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {data.items.map((dto, index) => (
              <li key={dto.id}>
                <RecipeCard
                  recipe={toRecipeSummary(dto)}
                  href={recipeDetailHref(dto.slug)}
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
            hrefFor={(page) => buildRecipeListHref(params, { page }, SEARCH_BASE)}
          />
        </>
      ) : (
        <EmptyState
          className="mt-8"
          title="Không tìm thấy công thức"
          description="Chưa có công thức nào khớp với từ khoá hoặc bộ lọc hiện tại. Hãy thử xoá bớt bộ lọc hoặc dùng từ khoá khác."
          action={
            <Link href={SEARCH_BASE} appearance="button" variant="outline">
              Xoá bộ lọc
            </Link>
          }
        />
      )}
    </Container>
  );
}
