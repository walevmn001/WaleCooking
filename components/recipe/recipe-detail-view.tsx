import { ExternalLink, FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardBody, CardTitle } from "@/components/ui/card";
import { Link } from "@/components/ui/link";
import { Breadcrumb } from "@/components/navigation/breadcrumb";
import { Container } from "@/components/layout/container";
import { RecipeImage } from "./recipe-image";
import { IngredientList } from "./ingredient-row";
import { CookingStepCard } from "./cooking-step-card";
import { NutritionSummary } from "./nutrition-summary";
import { AllergenBadges } from "./allergen-badges";
import {
  CookingTime,
  DifficultyBadge,
  PreparationTime,
  ServingsBadge,
} from "./recipe-meta";
import { toRecipeDetailView } from "@/lib/recipe/recipe-view";
import type { RecipeDetailDto } from "@/lib/db/repositories/recipe.repository";

export interface RecipeDetailViewProps {
  recipe: RecipeDetailDto;
}

const NUTRITION_TITLE = "Dinh dưỡng (ước tính)";

/**
 * RecipeDetailView — trang chi tiết công thức (server component).
 * Tái sử dụng component trình bày P05; ánh xạ DTO → kiểu hiển thị bằng mapper thuần.
 * Chỉ hiển thị dữ liệu có thật; khối không có dữ liệu sẽ nêu rõ thay vì bịa số liệu.
 */
export function RecipeDetailView({ recipe }: RecipeDetailViewProps) {
  const view = toRecipeDetailView(recipe);
  const { summary, ingredients, steps, nutrition, nutritionNote, allergens, detail } = view;

  const taxonomyLabels = detail.taxonomy.map((term) => term.name);
  const stepsWithImages = detail.steps.filter((step) => step.images.length > 0);

  return (
    <Container className="py-8 sm:py-12">
      <Breadcrumb
        items={[
          { label: "Trang chủ", href: "/" },
          { label: "Công thức", href: "/cong-thuc" },
          { label: summary.title },
        ]}
      />

      <article className="mt-6 flex flex-col gap-8">
        <header className="flex flex-col gap-4">
          <RecipeImage
            src={summary.imageUrl}
            alt={summary.imageAlt ?? summary.title}
            ratio="16/9"
            priority
            sizes="(max-width: 1024px) 100vw, 960px"
          />
          <div className="flex flex-col gap-3">
            <h1 className="text-h1 text-ink">{summary.title}</h1>
            {summary.description ? (
              <p className="max-w-[70ch] text-body-lg text-ink-muted">{summary.description}</p>
            ) : null}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
              <PreparationTime minutes={summary.prepMinutes} />
              <CookingTime minutes={summary.cookMinutes ?? summary.totalMinutes} />
              <ServingsBadge servings={summary.servings} />
              <DifficultyBadge level={summary.difficulty} />
            </div>
            {taxonomyLabels.length > 0 ? (
              <ul className="flex flex-wrap gap-1.5" aria-label="Phân loại">
                {taxonomyLabels.map((label) => (
                  <li key={label}>
                    <Badge variant="info" size="sm">
                      {label}
                    </Badge>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        </header>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,20rem)_1fr]">
          <section aria-labelledby="ingredients-heading" className="flex flex-col gap-3">
            <h2 id="ingredients-heading" className="text-h3 text-ink">
              Nguyên liệu
            </h2>
            {ingredients.length > 0 ? (
              <IngredientList ingredients={ingredients} aria-label="Nguyên liệu" />
            ) : (
              <p className="text-body-sm text-ink-muted">Chưa có nguyên liệu.</p>
            )}

            <AllergenBadges allergens={allergens} className="mt-2" />
          </section>

          <div className="flex flex-col gap-8">
            <section aria-labelledby="steps-heading" className="flex flex-col gap-3">
              <h2 id="steps-heading" className="text-h3 text-ink">
                Các bước thực hiện
              </h2>
              {steps.length > 0 ? (
                <ol className="flex flex-col gap-3">
                  {steps.map((step) => (
                    <CookingStepCard key={step.id} step={step} />
                  ))}
                </ol>
              ) : (
                <p className="text-body-sm text-ink-muted">Chưa có bước chế biến.</p>
              )}
            </section>

            {stepsWithImages.length > 0 ? (
              <section aria-labelledby="step-media-heading" className="flex flex-col gap-3">
                <h2 id="step-media-heading" className="text-h3 text-ink">
                  Hình ảnh minh hoạ các bước
                </h2>
                <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {stepsWithImages.map((step) => (
                    <li key={step.id} className="flex flex-col gap-2">
                      <span className="text-label text-ink">Bước {step.stepNo}</span>
                      {step.images.map((image) => (
                        <RecipeImage
                          key={image.id}
                          src={image.url}
                          alt={image.altText ?? `Hình minh hoạ bước ${step.stepNo}`}
                          ratio="4/3"
                          sizes="(max-width: 640px) 100vw, 400px"
                        />
                      ))}
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          <NutritionSummary
            title={NUTRITION_TITLE}
            facts={nutrition}
            note={nutritionNote}
          />

          <section aria-labelledby="sources-heading" className="flex flex-col gap-3">
            <h2 id="sources-heading" className="text-h3 text-ink">
              Nguồn tham khảo
            </h2>
            {detail.sources.length > 0 ? (
              <Card>
                <CardBody>
                  <ul className="flex flex-col gap-3">
                    {detail.sources.map((source) => (
                      <li key={source.id} className="flex items-start gap-2">
                        <FileText className="mt-0.5 size-4 shrink-0 text-ink-muted" aria-hidden="true" />
                        <div className="flex flex-col">
                          <span className="text-body-sm text-ink">
                            {source.name}
                            {source.authorOrOrg ? ` — ${source.authorOrOrg}` : ""}
                            {source.isPrimary ? " (nguồn chính)" : ""}
                          </span>
                          {source.note ? (
                            <span className="text-caption text-ink-muted">{source.note}</span>
                          ) : null}
                          {source.url ? (
                            <Link href={source.url} external appearance="inline" className="text-body-sm">
                              {source.url}
                              <ExternalLink className="ml-1 inline size-3.5" aria-hidden="true" />
                            </Link>
                          ) : null}
                        </div>
                      </li>
                    ))}
                  </ul>
                </CardBody>
              </Card>
            ) : (
              <p className="text-body-sm text-ink-muted">
                Công thức này chưa ghi nguồn tham khảo.
              </p>
            )}
          </section>
        </div>
      </article>
    </Container>
  );
}
