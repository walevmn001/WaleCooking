import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { AdminAccessNotice } from "@/components/admin/admin-access-notice";
import {
  TaxonomyManager,
  type TaxonomyManagerTerm,
} from "@/components/admin/taxonomy-manager";
import { Link } from "@/components/ui/link";
import { can } from "@/lib/auth/authorization";
import { getCurrentActor } from "@/lib/auth/session";
import { getDiscoveryTaxonomyByCode } from "@/lib/constants/taxonomy";
import { taxonomyService } from "@/lib/services";

export const metadata: Metadata = {
  title: "Quản lý danh mục",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

interface AdminTaxonomyTypePageProps {
  params: Promise<{ type: string }>;
}

/**
 * Trang quản lý danh mục của MỘT trục phân loại (P08 §P08.4).
 * YÊU CẦU quyền `taxonomy:manage`; kiểm tra ở server, không chỉ ẩn nút.
 */
export default async function AdminTaxonomyTypePage({ params }: AdminTaxonomyTypePageProps) {
  const actor = await getCurrentActor();
  if (!can(actor, "taxonomy:manage")) {
    return <AdminAccessNotice title="Quản lý danh mục" />;
  }

  const { type } = await params;
  const taxonomy = getDiscoveryTaxonomyByCode(type);
  if (!taxonomy) notFound();

  const { terms } = await taxonomyService.listTypeTerms(taxonomy.code, "vi", {
    includeInactive: true,
  });

  const byId = new Map(terms.map((term) => [term.id, term]));
  const rows: TaxonomyManagerTerm[] = terms.map((term) => ({
    id: term.id,
    slug: term.slug,
    name: term.name,
    description: term.description,
    parentSlug: term.parentId ? byId.get(term.parentId)?.slug ?? null : null,
    sortOrder: term.sortOrder,
    isActive: term.isActive,
    recipeCount: term.recipeCount,
    childCount: term.childCount,
  }));

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-h2 text-ink">Quản lý danh mục · {taxonomy.label}</h1>
        <Link href="/admin/danh-muc" appearance="inline">
          ← Tất cả danh mục
        </Link>
      </div>

      <TaxonomyManager
        typeCode={taxonomy.code}
        typeLabel={taxonomy.label}
        isHierarchical={taxonomy.isHierarchical}
        terms={rows}
      />
    </div>
  );
}
