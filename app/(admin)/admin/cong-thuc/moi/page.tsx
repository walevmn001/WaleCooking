import type { Metadata } from "next";

import { AdminAccessNotice } from "@/components/admin/admin-access-notice";
import { RecipeForm, type RecipeFormOption } from "@/components/admin/recipe-form";
import { Link } from "@/components/ui/link";
import { can } from "@/lib/auth/authorization";
import { getCurrentActor } from "@/lib/auth/session";
import { catalogService } from "@/lib/services";
import type { TaxonomyTermDto } from "@/lib/db/repositories/taxonomy.repository";

export const metadata: Metadata = {
  title: "Tạo công thức",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

/** Chuyển taxonomy term → option cho biểu mẫu. */
function toTermOptions(terms: TaxonomyTermDto[]): RecipeFormOption[] {
  return terms.map((term) => ({ value: term.slug, label: term.name }));
}

/**
 * Trang tạo công thức mới (P07 §13/§16).
 *
 * YÊU CẦU quyền `recipe:create` (Editor/Admin). Khi Auth.js chưa nối, guest bị từ chối
 * — hiển thị thông báo quyền truy cập (KHÔNG giả lập người dùng).
 */
export default async function CreateRecipePage() {
  const actor = await getCurrentActor();
  if (!can(actor, "recipe:create")) {
    return <AdminAccessNotice title="Tạo công thức" />;
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
        <h1 className="text-h2 text-ink">Tạo công thức</h1>
        <Link href="/admin/cong-thuc" appearance="inline">
          ← Danh sách công thức
        </Link>
      </div>

      <RecipeForm
        mode="create"
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
