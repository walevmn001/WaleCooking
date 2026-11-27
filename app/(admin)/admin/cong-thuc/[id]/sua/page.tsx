import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { AdminAccessNotice } from "@/components/admin/admin-access-notice";
import { RecipeForm, type RecipeFormOption } from "@/components/admin/recipe-form";
import { RecipeStatusActions } from "@/components/admin/recipe-status-actions";
import { Badge } from "@/components/ui/badge";
import { Link } from "@/components/ui/link";
import { can } from "@/lib/auth/authorization";
import { getCurrentActor } from "@/lib/auth/session";
import { NotFoundError } from "@/lib/errors/app-error";
import { toRecipeFormValues } from "@/lib/presentation/recipe-form-values";
import { RECIPE_STATUS_LABEL, RECIPE_STATUS_VARIANT } from "@/lib/presentation/recipe-view";
import { catalogService, recipeService } from "@/lib/services";
import type { RecipeDetailDto } from "@/lib/db/repositories/recipe.repository";
import type { TaxonomyTermDto } from "@/lib/db/repositories/taxonomy.repository";

export const metadata: Metadata = {
  title: "Sửa công thức",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

function toTermOptions(terms: TaxonomyTermDto[]): RecipeFormOption[] {
  return terms.map((term) => ({ value: term.slug, label: term.name }));
}

interface EditRecipePageProps {
  params: Promise<{ id: string }>;
}

/**
 * Trang sửa công thức (P07 §13/§16).
 *
 * YÊU CẦU quyền `recipe:update` (Editor/Admin) để vào trang, và `recipe:read:draft`
 * để đọc bản nháp (kiểm tra lại ở tầng service). Khi Auth.js chưa nối, guest bị từ chối.
 */
export default async function EditRecipePage({ params }: EditRecipePageProps) {
  const actor = await getCurrentActor();
  if (!can(actor, "recipe:update")) {
    return <AdminAccessNotice title="Sửa công thức" />;
  }

  const { id } = await params;

  let detail: RecipeDetailDto;
  try {
    detail = await recipeService.getAdminDetail(actor, id);
  } catch (error) {
    if (error instanceof NotFoundError) notFound();
    throw error;
  }

  const [units, foodTypes, cuisines, allergens] = await Promise.all([
    catalogService.listUnits().catch(() => []),
    catalogService.listTaxonomyTerms("food_type").catch(() => []),
    catalogService.listTaxonomyTerms("cuisine").catch(() => []),
    catalogService.listTaxonomyTerms("allergen").catch(() => []),
  ]);

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-h2 text-ink">Sửa công thức</h1>
          <Badge variant={RECIPE_STATUS_VARIANT[detail.status]}>
            {RECIPE_STATUS_LABEL[detail.status]}
          </Badge>
        </div>
        <Link href="/admin/cong-thuc" appearance="inline">
          ← Danh sách công thức
        </Link>
      </div>

      <RecipeStatusActions
        recipeId={detail.id}
        status={detail.status}
        canSubmitReview={can(actor, "recipe:submit_review")}
        canPublish={can(actor, "recipe:publish")}
        canArchive={can(actor, "recipe:archive")}
        canDelete={can(actor, "recipe:delete")}
      />

      <RecipeForm
        mode="edit"
        recipeId={detail.id}
        initialValues={toRecipeFormValues(detail)}
        units={units.map((unit) => ({
          value: unit.code,
          label: unit.symbol ? `${unit.name} (${unit.symbol})` : unit.name,
        }))}
        foodTypes={toTermOptions(foodTypes)}
        cuisines={toTermOptions(cuisines)}
        allergens={toTermOptions(allergens)}
      />
    </div>
  );
}
