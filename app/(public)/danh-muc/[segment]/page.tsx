import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Container } from "@/components/layout/container";
import { Breadcrumb } from "@/components/navigation/breadcrumb";
import { CategoryTile } from "@/components/recipe/category-tile";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Link } from "@/components/ui/link";
import {
  getDiscoveryTaxonomyBySegment,
  DISCOVERY_TAXONOMIES,
} from "@/lib/constants/taxonomy";
import { categoryTermHref } from "@/lib/presentation/category-links";
import { taxonomyService } from "@/lib/services";

interface CategoryTypePageProps {
  params: Promise<{ segment: string }>;
}

/** Các đoạn URL trục hợp lệ — dùng để chặn sớm trục không thuộc khu vực khám phá. */
export function generateStaticParams(): { segment: string }[] {
  return DISCOVERY_TAXONOMIES.map((taxonomy) => ({ segment: taxonomy.segment }));
}

export async function generateMetadata({ params }: CategoryTypePageProps): Promise<Metadata> {
  const { segment } = await params;
  const taxonomy = getDiscoveryTaxonomyBySegment(segment);
  if (!taxonomy) return { title: "Danh mục" };
  return {
    title: taxonomy.label,
    description: taxonomy.description,
  };
}

/**
 * Trang một trục phân loại (P08 §P08.3) — liệt kê toàn bộ danh mục của trục.
 * Trục phân cấp hiển thị danh mục gốc kèm danh mục con.
 */
export default async function CategoryTypePage({ params }: CategoryTypePageProps) {
  const { segment } = await params;
  const taxonomy = getDiscoveryTaxonomyBySegment(segment);
  if (!taxonomy) notFound();

  let terms;
  try {
    ({ terms } = await taxonomyService.listTypeTerms(taxonomy.code));
  } catch {
    return (
      <Container className="py-8 sm:py-12">
        <Breadcrumb
          items={[
            { label: "Trang chủ", href: "/" },
            { label: "Danh mục", href: "/danh-muc" },
            { label: taxonomy.label },
          ]}
        />
        <ErrorState
          className="mt-6"
          title="Chưa tải được danh mục"
          description="Rất tiếc, dữ liệu danh mục đang tạm thời không phản hồi. Vui lòng thử lại sau."
        />
      </Container>
    );
  }

  const roots = terms.filter((term) => term.parentId === null);
  const childrenOf = (parentId: string) => terms.filter((term) => term.parentId === parentId);

  return (
    <Container className="py-8 sm:py-12">
      <Breadcrumb
        items={[
          { label: "Trang chủ", href: "/" },
          { label: "Danh mục", href: "/danh-muc" },
          { label: taxonomy.label },
        ]}
      />

      <header className="mt-6 flex flex-col gap-2">
        <h1 className="text-h1 text-ink">{taxonomy.label}</h1>
        <p className="max-w-prose text-body text-ink-muted">{taxonomy.description}</p>
      </header>

      {roots.length === 0 ? (
        <EmptyState
          className="mt-8"
          title="Chưa có danh mục"
          description="Trục phân loại này chưa có danh mục nào. Vui lòng quay lại sau."
        />
      ) : (
        <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {roots.map((term) => {
            const children = childrenOf(term.id);
            return (
              <li key={term.id} className="flex flex-col gap-3">
                <CategoryTile
                  name={term.name}
                  description={term.description}
                  recipeCount={term.recipeCount}
                  href={categoryTermHref(taxonomy.segment, term.slug)}
                />
                {children.length > 0 ? (
                  <ul className="flex flex-wrap gap-2 pl-1" aria-label={`Danh mục con của ${term.name}`}>
                    {children.map((child) => (
                      <li key={child.id}>
                        <Link
                          href={categoryTermHref(taxonomy.segment, child.slug)}
                          appearance="unstyled"
                          className="inline-flex rounded-pill border border-line-subtle px-3 py-1 text-body-sm text-ink hover:bg-surface-muted focus-visible:outline-none focus-visible:focus-ring"
                        >
                          {child.name}
                          <span className="ml-1 text-ink-subtle">({child.recipeCount})</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </Container>
  );
}
