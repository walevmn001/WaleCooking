import type { Metadata } from "next";
import { Container } from "@/components/layout/container";
import { Breadcrumb } from "@/components/navigation/breadcrumb";
import { Pagination } from "@/components/navigation/pagination";
import { EmptyState } from "@/components/ui/empty-state";
import { Link } from "@/components/ui/link";
import { RecipeGrid } from "@/components/recipe/recipe-grid";
import { RecipeFilters } from "@/components/recipe/recipe-filters";
import type { SelectOption } from "@/components/forms";
import { catalogService, recipeService, type RawQuery } from "@/lib/services";

export const metadata: Metadata = {
  title: "Công thức",
  description: "Kho công thức nấu ăn WALE COOKING — tìm kiếm, lọc theo loại món, xuất xứ và độ khó.",
};

const PAGE_PATH = "/cong-thuc";

function toOptions(terms: { slug: string; name: string }[]): SelectOption[] {
  return terms.map((term) => ({ value: term.slug, label: term.name }));
}

/** Giữ nguyên bộ lọc hiện tại, chỉ đổi số trang. */
function buildPageHref(query: RawQuery, page: number): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (key === "page" || value == null) continue;
    const single = Array.isArray(value) ? value[0] : value;
    if (single) params.set(key, single);
  }
  if (page > 1) params.set("page", String(page));
  const qs = params.toString();
  return qs ? `${PAGE_PATH}?${qs}` : PAGE_PATH;
}

export default async function RecipesPage({
  searchParams,
}: {
  searchParams: Promise<RawQuery>;
}) {
  const query = await searchParams;

  const [result, foodTypes, cuisines] = await Promise.all([
    recipeService.listPublic(query),
    catalogService.listTaxonomyTerms("food_type"),
    catalogService.listTaxonomyTerms("cuisine"),
  ]);

  const recipes = result.items.map((item) => item);
  const hasFilters = Boolean(query.q || query.foodType || query.cuisine || query.difficulty);

  return (
    <Container className="py-8 sm:py-12">
      <Breadcrumb items={[{ label: "Trang chủ", href: "/" }, { label: "Công thức" }]} />

      <header className="mt-6 flex flex-col gap-2">
        <h1 className="text-h1 text-ink">Công thức</h1>
        <p className="max-w-[70ch] text-body text-ink-muted">
          Khám phá kho công thức nấu ăn của WALE COOKING.
        </p>
      </header>

      <RecipeFilters
        action={PAGE_PATH}
        className="mt-6"
        values={{
          q: typeof query.q === "string" ? query.q : undefined,
          foodType: typeof query.foodType === "string" ? query.foodType : undefined,
          cuisine: typeof query.cuisine === "string" ? query.cuisine : undefined,
          difficulty: typeof query.difficulty === "string" ? query.difficulty : undefined,
          sort: typeof query.sort === "string" ? query.sort : undefined,
        }}
        foodTypeOptions={toOptions(foodTypes)}
        cuisineOptions={toOptions(cuisines)}
      />

      <div className="mt-8">
        {recipes.length > 0 ? (
          <p className="mb-4 text-body-sm text-ink-muted">
            {result.total} công thức
          </p>
        ) : null}

        {recipes.length > 0 ? (
          <RecipeGrid
            recipes={recipes}
            hrefFor={(recipe) => `${PAGE_PATH}/${recipe.slug}`}
          />
        ) : hasFilters ? (
          <EmptyState
            title="Không tìm thấy công thức phù hợp"
            description="Thử bỏ một vài bộ lọc hoặc dùng từ khoá khác."
            illustrationSrc="/assets/illustrations/no-results.svg"
            action={
              <Link href={PAGE_PATH} appearance="button" variant="outline" size="md">
                Xoá bộ lọc
              </Link>
            }
          />
        ) : (
          <EmptyState
            title="Chưa có công thức nào"
            description="Kho công thức đang được xây dựng. Vui lòng quay lại sau."
          />
        )}
      </div>

      <Pagination
        page={result.page}
        totalPages={result.totalPages}
        hrefFor={(page) => buildPageHref(query, page)}
        className="mt-8"
      />
    </Container>
  );
}
