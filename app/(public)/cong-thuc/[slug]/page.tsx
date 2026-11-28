import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Container } from "@/components/layout/container";
import { Breadcrumb } from "@/components/navigation/breadcrumb";
import { AllergenBadges } from "@/components/recipe/allergen-badges";
import { CookingStepCard } from "@/components/recipe/cooking-step-card";
import { FavoriteButton } from "@/components/recipe/favorite-button";
import { IngredientList } from "@/components/recipe/ingredient-row";
import { NutritionSummary } from "@/components/recipe/nutrition-summary";
import {
  CookingTime,
  DifficultyBadge,
  PreparationTime,
  ServingsBadge,
} from "@/components/recipe/recipe-meta";
import { RecipeImage } from "@/components/recipe/recipe-image";
import { ShareRecipeButton } from "@/components/recipe/share-recipe-button";
import { Badge } from "@/components/ui/badge";
import { Card, CardBody, CardTitle } from "@/components/ui/card";
import { Link } from "@/components/ui/link";
import { getDiscoveryTaxonomyByCode } from "@/lib/constants/taxonomy";
import { isFavorite } from "@/lib/favorites/server";
import { categoryTermHref } from "@/lib/presentation/category-links";
import { toRecipeDetail, toRecipeJsonLd } from "@/lib/presentation/recipe-view";
import { NotFoundError } from "@/lib/errors/app-error";
import { recipeService } from "@/lib/services";
import type { RecipeDetailDto } from "@/lib/db/repositories/recipe.repository";

interface RecipeDetailPageProps {
  params: Promise<{ slug: string }>;
}

/** Lấy chi tiết công thức công khai; 404 nếu không tồn tại/không xuất bản. */
async function loadRecipe(slug: string): Promise<RecipeDetailDto> {
  try {
    return await recipeService.getPublicBySlug(slug);
  } catch (error) {
    if (error instanceof NotFoundError) notFound();
    throw error;
  }
}

export async function generateMetadata({ params }: RecipeDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  try {
    const detail = await recipeService.getPublicBySlug(slug);
    return {
      title: detail.seoTitle ?? detail.title,
      description: detail.seoDescription ?? detail.summary ?? undefined,
      openGraph: {
        type: "article",
        title: detail.seoTitle ?? detail.title,
        description: detail.seoDescription ?? detail.summary ?? undefined,
        ...(detail.primaryImage?.url
          ? {
              images: [
                {
                  url: detail.primaryImage.url,
                  alt: detail.primaryImage.altText ?? detail.title,
                },
              ],
            }
          : {}),
      },
    };
  } catch {
    return { title: "Công thức" };
  }
}

/**
 * Trang chi tiết công thức (P07 §16).
 * CHỈ hiển thị công thức `published`; thiếu dữ liệu → không bịa (bỏ qua mục đó).
 */
export default async function RecipeDetailPage({ params }: RecipeDetailPageProps) {
  const { slug } = await params;
  const dto = await loadRecipe(slug);
  const recipe = toRecipeDetail(dto);
  const jsonLd = toRecipeJsonLd(recipe, `/cong-thuc/${dto.slug}`);
  const favorited = await isFavorite(dto.slug).catch(() => false);

  // Liên kết tới trang danh mục cho các term phân loại thuộc khu vực khám phá (P08 §P08.5).
  const categoryLinks = dto.taxonomy.map((term) => {
    const taxonomy = getDiscoveryTaxonomyByCode(term.typeCode);
    return {
      name: term.name,
      href: taxonomy ? categoryTermHref(taxonomy.segment, term.slug) : null,
    };
  });

  const totalMinutes =
    recipe.totalMinutes ?? (recipe.prepMinutes != null || recipe.cookMinutes != null
      ? (recipe.prepMinutes ?? 0) + (recipe.cookMinutes ?? 0)
      : undefined);

  return (
    <Container className="py-8 sm:py-12">
      <script
        type="application/ld+json"
        // Dữ liệu có cấu trúc phục vụ SEO; chỉ chứa dữ liệu thật của công thức.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <Breadcrumb
        items={[
          { label: "Trang chủ", href: "/" },
          { label: "Công thức", href: "/cong-thuc" },
          { label: recipe.title },
        ]}
      />

      <div className="mt-6 grid gap-8 lg:grid-cols-2">
        <RecipeImage
          src={recipe.imageUrl}
          alt={recipe.imageAlt}
          ratio="4/3"
          priority
          sizes="(max-width: 1024px) 100vw, 50vw"
        />

        <div className="flex flex-col gap-4">
          <h1 className="text-h1 text-ink">{recipe.title}</h1>

          {recipe.summary ? (
            <p className="text-body-lg text-ink-muted">{recipe.summary}</p>
          ) : null}

          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <PreparationTime minutes={recipe.prepMinutes} />
            <CookingTime minutes={recipe.cookMinutes ?? totalMinutes} />
            <ServingsBadge servings={recipe.servings} />
            <DifficultyBadge level={recipe.difficulty} />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <FavoriteButton slug={dto.slug} initialFavorite={favorited} variant="button" />
            <ShareRecipeButton title={recipe.title} path={`/cong-thuc/${dto.slug}`} />
          </div>

          {categoryLinks.length > 0 ? (
            <ul className="flex flex-wrap gap-1.5" aria-label="Phân loại">
              {categoryLinks.map((category) => (
                <li key={`${category.name}-${category.href ?? ""}`}>
                  {category.href ? (
                    <Link href={category.href} appearance="unstyled" className="rounded-pill">
                      <Badge variant="brand" size="sm">
                        {category.name}
                      </Badge>
                    </Link>
                  ) : (
                    <Badge variant="brand" size="sm">
                      {category.name}
                    </Badge>
                  )}
                </li>
              ))}
            </ul>
          ) : null}

          {recipe.description && recipe.description !== recipe.summary ? (
            <div className="prose-sm max-w-prose text-body text-ink-muted">
              {recipe.description}
            </div>
          ) : null}
        </div>
      </div>

      <div className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="flex flex-col gap-10">
          <section aria-labelledby="ingredients-heading" className="flex flex-col gap-4">
            <h2 id="ingredients-heading" className="text-h2 text-ink">
              Nguyên liệu
            </h2>
            {recipe.ingredients.length > 0 ? (
              <Card>
                <CardBody>
                  <IngredientList
                    ingredients={recipe.ingredients}
                    aria-label={`Nguyên liệu cho ${recipe.title}`}
                  />
                </CardBody>
              </Card>
            ) : (
              <p className="text-body text-ink-muted">Chưa có thông tin nguyên liệu.</p>
            )}
          </section>

          <section aria-labelledby="steps-heading" className="flex flex-col gap-4">
            <h2 id="steps-heading" className="text-h2 text-ink">
              Các bước nấu
            </h2>
            {recipe.steps.length > 0 ? (
              <ol className="flex flex-col gap-3">
                {recipe.steps.map((step) => (
                  <CookingStepCard key={step.id} step={step} />
                ))}
              </ol>
            ) : (
              <p className="text-body text-ink-muted">Chưa có các bước chế biến.</p>
            )}
          </section>

          {recipe.sources.length > 0 ? (
            <section aria-labelledby="sources-heading" className="flex flex-col gap-4">
              <h2 id="sources-heading" className="text-h2 text-ink">
                Nguồn tham khảo
              </h2>
              <ul className="flex flex-col gap-2">
                {recipe.sources.map((source) => (
                  <li key={source.id} className="text-body-sm text-ink-muted">
                    {source.url ? (
                      <Link href={source.url} external>
                        {source.name}
                      </Link>
                    ) : (
                      <span className="font-semibold text-ink">{source.name}</span>
                    )}
                    {source.authorOrOrg ? <span> — {source.authorOrOrg}</span> : null}
                    {source.license ? (
                      <span className="block text-caption text-ink-subtle">
                        Giấy phép: {source.license}
                      </span>
                    ) : null}
                    {source.note ? (
                      <span className="block text-caption text-ink-subtle">{source.note}</span>
                    ) : null}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>

        <aside className="flex flex-col gap-6">
          <NutritionSummary
            facts={recipe.nutrition.facts}
            note={recipe.nutrition.note}
          />

          <Card>
            <CardBody className="flex flex-col gap-3">
              <CardTitle as="h3" className="text-h4">
                Chất gây dị ứng
              </CardTitle>
              <AllergenBadges allergens={recipe.allergens} hideLabel />
            </CardBody>
          </Card>
        </aside>
      </div>
    </Container>
  );
}
