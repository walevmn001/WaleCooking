import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Container } from "@/components/layout/container";
import { Breadcrumb, type BreadcrumbItem } from "@/components/navigation/breadcrumb";
import { Pagination } from "@/components/navigation/pagination";
import { FavoriteButton } from "@/components/recipe/favorite-button";
import { RecipeCard } from "@/components/recipe/recipe-card";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Link } from "@/components/ui/link";
import { getDiscoveryTaxonomyBySegment } from "@/lib/constants/taxonomy";
import { NotFoundError } from "@/lib/errors/app-error";
import { readFavorites } from "@/lib/favorites/server";
import { categoryTermHref, categoryTypeHref } from "@/lib/presentation/category-links";
import { toRecipeSummary } from "@/lib/presentation/recipe-view";
import { recipeService, taxonomyService, type CategoryDetail } from "@/lib/services";

const PAGE_SIZE = 12;

interface CategoryDetailPageProps {
  params: Promise<{ segment: string; slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

/** Đọc chi tiết danh mục; 404 nếu trục/term không tồn tại hoặc không hoạt động. */
async function loadCategory(segment: string, slug: string): Promise<CategoryDetail> {
  try {
    return await taxonomyService.getCategoryBySegment(segment, slug);
  } catch (error) {
    if (error instanceof NotFoundError) notFound();
    throw error;
  }
}

export async function generateMetadata({ params }: CategoryDetailPageProps): Promise<Metadata> {
  const { segment, slug } = await params;
  const taxonomy = getDiscoveryTaxonomyBySegment(segment);
  if (!taxonomy) return { title: "Danh mục" };
  try {
    const detail = await taxonomyService.getCategoryBySegment(segment, slug);
    return {
      title: detail.term.name,
      description:
        detail.term.description ??
        `Công thức thuộc ${detail.term.name} — ${taxonomy.label} tại WALE COOKING.`,
      alternates: { canonical: categoryTermHref(segment, slug) },
    };
  } catch {
    return { title: "Danh mục" };
  }
}

/** Dựng breadcrumb cho danh mục (Trang chủ → Danh mục → trục → tổ tiên → hiện tại). */
function buildBreadcrumb(detail: CategoryDetail): BreadcrumbItem[] {
  const items: BreadcrumbItem[] = [
    { label: "Trang chủ", href: "/" },
    { label: "Danh mục", href: "/danh-muc" },
    { label: detail.taxonomy.label, href: categoryTypeHref(detail.taxonomy.segment) },
  ];
  for (const ancestor of detail.ancestors) {
    items.push({
      label: ancestor.name,
      href: categoryTermHref(detail.taxonomy.segment, ancestor.slug),
    });
  }
  items.push({ label: detail.term.name });
  return items;
}

/**
 * Trang chi tiết danh mục (P08 §P08.3): danh sách công thức công khai thuộc danh mục,
 * breadcrumb, danh mục con, phân trang, SEO + structured data (BreadcrumbList).
 *
 * CHỈ hiển thị công thức `published` (service đảm bảo). Không bịa mô tả/ảnh danh mục.
 */
export default async function CategoryDetailPage({
  params,
  searchParams,
}: CategoryDetailPageProps) {
  const { segment, slug } = await params;
  const sp = await searchParams;
  const pageRaw = Array.isArray(sp.page) ? sp.page[0] : sp.page;
  const page = Number.parseInt(pageRaw ?? "1", 10);

  const detail = await loadCategory(segment, slug);

  let data;
  try {
    data = await recipeService.listPublicForCategory({
      typeCode: detail.taxonomy.code,
      slug: detail.term.slug,
      filterKind: detail.taxonomy.filterKind,
      page: Number.isInteger(page) && page > 0 ? page : 1,
      pageSize: PAGE_SIZE,
    });
  } catch {
    return (
      <Container className="py-8 sm:py-12">
        <Breadcrumb items={buildBreadcrumb(detail)} />
        <ErrorState
          className="mt-6"
          title="Chưa tải được công thức"
          description="Rất tiếc, danh sách công thức đang tạm thời không phản hồi. Vui lòng thử lại sau."
        />
      </Container>
    );
  }

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: buildBreadcrumb(detail).map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.label,
      ...(item.href
        ? { item: new URL(item.href, process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").toString() }
        : {}),
    })),
  };

  const favoriteSlugs = new Set(await readFavorites().catch(() => [] as string[]));

  return (
    <Container className="py-8 sm:py-12">
      <script
        type="application/ld+json"
        // Structured data dựng từ breadcrumb thật của danh mục.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      <Breadcrumb items={buildBreadcrumb(detail)} />

      <header className="mt-6 flex flex-col gap-2">
        <p className="text-caption uppercase tracking-wide text-ink-subtle">
          {detail.taxonomy.label}
        </p>
        <h1 className="text-h1 text-ink">{detail.term.name}</h1>
        {detail.term.description ? (
          <p className="max-w-prose text-body text-ink-muted">{detail.term.description}</p>
        ) : null}
      </header>

      {detail.children.length > 0 ? (
        <nav aria-label="Danh mục con" className="mt-5">
          <ul className="flex flex-wrap gap-2">
            {detail.children.map((child) => (
              <li key={child.id}>
                <Link
                  href={categoryTermHref(detail.taxonomy.segment, child.slug)}
                  appearance="unstyled"
                  className="inline-flex rounded-pill border border-line-subtle px-3 py-1 text-body-sm text-ink hover:bg-surface-muted focus-visible:outline-none focus-visible:focus-ring"
                >
                  {child.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      ) : null}

      {data.items.length === 0 ? (
        <EmptyState
          className="mt-8"
          title="Chưa có công thức"
          description="Danh mục này chưa có công thức nào được xuất bản. Hãy khám phá danh mục khác."
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
            hrefFor={(target) => categoryTermHref(detail.taxonomy.segment, detail.term.slug, target)}
          />
        </>
      )}
    </Container>
  );
}
