import type { Metadata } from "next";

import { Container } from "@/components/layout/container";
import { Breadcrumb } from "@/components/navigation/breadcrumb";
import { CategoryTile } from "@/components/recipe/category-tile";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Link } from "@/components/ui/link";
import { categoryTermHref, categoryTypeHref } from "@/lib/presentation/category-links";
import { taxonomyService, type CategoryGroup } from "@/lib/services";

export const metadata: Metadata = {
  title: "Danh mục",
  description:
    "Khám phá công thức theo nhóm món, ẩm thực, bữa ăn, phương pháp chế biến, đặc điểm món và nguyên liệu chính.",
};

export const dynamic = "force-dynamic";

/**
 * Trang tổng quan danh mục (P08 §P08.3).
 *
 * Liệt kê mọi trục phân loại khám phá kèm các danh mục gốc. Trục không có dữ liệu sẽ
 * bị ẩn (không hiển thị khối rỗng). Danh sách trục là metadata thiết kế; danh mục
 * thực tế lấy từ database (linh hoạt, không hardcode term vào frontend).
 */
export default async function CategoriesPage() {
  let groups: CategoryGroup[];
  try {
    groups = await taxonomyService.listDiscoveryGroups();
  } catch {
    return (
      <Container className="py-8 sm:py-12">
        <Breadcrumb items={[{ label: "Trang chủ", href: "/" }, { label: "Danh mục" }]} />
        <ErrorState
          className="mt-6"
          title="Chưa tải được danh mục"
          description="Rất tiếc, dữ liệu danh mục đang tạm thời không phản hồi. Vui lòng thử lại sau."
        />
      </Container>
    );
  }

  return (
    <Container className="py-8 sm:py-12">
      <Breadcrumb items={[{ label: "Trang chủ", href: "/" }, { label: "Danh mục" }]} />

      <header className="mt-6 flex flex-col gap-2">
        <h1 className="text-h1 text-ink">Danh mục</h1>
        <p className="max-w-prose text-body text-ink-muted">
          Tìm món theo cách bạn đang nghĩ về bữa ăn: theo nhóm món, nền ẩm thực, bữa ăn,
          phương pháp chế biến, đặc điểm món hoặc nguyên liệu chính.
        </p>
      </header>

      {groups.length === 0 ? (
        <EmptyState
          className="mt-8"
          title="Chưa có danh mục"
          description="Hệ thống chưa có danh mục nào để khám phá. Vui lòng quay lại sau."
        />
      ) : (
        <div className="mt-8 flex flex-col gap-10">
          {groups.map((group) => (
            <section key={group.taxonomy.code} aria-labelledby={`cat-${group.taxonomy.segment}`}>
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <div className="flex flex-col gap-1">
                  <h2 id={`cat-${group.taxonomy.segment}`} className="text-h2 text-ink">
                    {group.taxonomy.label}
                  </h2>
                  <p className="max-w-prose text-body-sm text-ink-muted">
                    {group.taxonomy.description}
                  </p>
                </div>
                <Link href={categoryTypeHref(group.taxonomy.segment)} appearance="inline">
                  Xem tất cả
                </Link>
              </div>

              <ul className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {group.terms.map((term) => (
                  <li key={term.id} className="flex">
                    <CategoryTile
                      name={term.name}
                      description={term.description}
                      recipeCount={term.recipeCount}
                      href={categoryTermHref(group.taxonomy.segment, term.slug)}
                      className="w-full"
                    />
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </Container>
  );
}
