import type { Metadata } from "next";
import { ArrowLeftRight, ArrowRight, ChefHat, Search, Sparkles, Timer } from "lucide-react";

import { SearchForm } from "@/components/forms/search-form";
import { Container } from "@/components/layout/container";
import { CategoryTile } from "@/components/recipe/category-tile";
import { FavoriteButton } from "@/components/recipe/favorite-button";
import { RecipeCard } from "@/components/recipe/recipe-card";
import { Card, CardBody } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Link } from "@/components/ui/link";
import { siteConfig } from "@/lib/constants/site";
import { readFavorites } from "@/lib/favorites/server";
import {
  categoryIndexHref,
  categoryTermHref,
  categoryTypeHref,
} from "@/lib/presentation/category-links";
import { recipeDetailHref } from "@/lib/presentation/recipe-links";
import { toRecipeSummary } from "@/lib/presentation/recipe-view";
import { homepageService } from "@/lib/services/homepage.service";

export const metadata: Metadata = {
  description: siteConfig.description,
};

export const dynamic = "force-dynamic";

/** Số trục danh mục & số danh mục mỗi trục hiển thị ở trang chủ (giữ trang gọn). */
const MAX_CATEGORY_GROUPS = 3;
const MAX_TERMS_PER_GROUP = 6;

const kitchenTools = [
  {
    title: "Tìm món theo nguyên liệu",
    description: "Nhập những nguyên liệu bạn đang có để tìm công thức phù hợp.",
    href: "/cong-cu/tim-theo-nguyen-lieu",
    icon: Search,
  },
  {
    title: "Đồng hồ đếm ngược",
    description: "Tạo nhiều đồng hồ cho các bước nấu khác nhau, có cảnh báo khi hết giờ.",
    href: "/cong-cu/do-ng-ho",
    icon: Timer,
  },
  {
    title: "Quy đổi đơn vị",
    description: "Quy đổi khối lượng, thể tích và nhiệt độ theo hệ số xác định.",
    href: "/cong-cu/quy-doi-don-vi",
    icon: ArrowLeftRight,
  },
  {
    title: "Công cụ nhà bếp",
    description: "Xem tất cả công cụ hỗ trợ chuẩn bị và nấu ăn.",
    href: "/cong-cu",
    icon: ChefHat,
  },
] as const;

/**
 * Trang chủ (FR-01, P15.2).
 *
 * - Dữ liệu THẬT từ `homepageService.load()`: món mới (`published` — BR-13) + danh mục khám phá.
 * - Mỗi khối tách lỗi độc lập ở tầng service: khối `null` (lỗi) sẽ KHÔNG làm hỏng toàn trang.
 * - Khối không có dữ liệu được ẩn; khi thư viện rỗng, trang vẫn giữ cấu trúc thân thiện.
 * - KHÔNG bịa món/rating/số lượng/popularity (BR-02).
 */
export default async function HomePage() {
  const { newest, categories } = await homepageService.load();

  const newestRecipes = newest?.recipes ?? [];
  const categoryGroups = (categories ?? []).slice(0, MAX_CATEGORY_GROUPS);
  const hasNoData =
    newest !== null &&
    newestRecipes.length === 0 &&
    categories !== null &&
    categories.length === 0;

  // Trạng thái yêu thích (cookie) để tô sáng nút trái tim — không cần đăng nhập.
  const favoriteSlugs = new Set(await readFavorites().catch(() => [] as string[]));

  return (
    <>
      <Container className="py-8 sm:py-12">
        <section
          aria-labelledby="hero-heading"
          className="flex flex-col gap-6 rounded-xl border border-line-subtle bg-surface p-6 shadow-sm sm:p-10"
        >
          <span className="inline-flex w-fit items-center gap-2 rounded-full bg-primary-subtle px-3 py-1 text-caption font-semibold text-primary">
            <Sparkles className="size-4" aria-hidden="true" />
            Cẩm nang nấu ăn tiếng Việt
          </span>
          <h1 id="hero-heading" className="max-w-2xl text-display text-ink">
            {siteConfig.name}
          </h1>
          <p className="max-w-prose text-body-lg text-ink-muted">{siteConfig.description}</p>
          <div className="flex flex-wrap gap-3">
            <Link href="/tim-kiem" appearance="button" variant="primary" size="lg">
              Tìm công thức
            </Link>
            <Link href="/cong-thuc" appearance="button" variant="outline" size="lg">
              Khám phá thư viện
            </Link>
          </div>
          <SearchForm className="mt-2 max-w-2xl" />
        </section>
      </Container>

      {newestRecipes.length > 0 ? (
        <Container className="pb-12">
          <section aria-labelledby="newest-heading" className="flex flex-col gap-5">
            <div className="flex flex-col gap-1">
              <h2 id="newest-heading" className="text-h2 text-ink">
                Món mới
              </h2>
              <p className="max-w-prose text-body-sm text-ink-muted">
                Những công thức vừa được xuất bản trên WALE COOKING.
              </p>
            </div>
            <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {newestRecipes.map((dto, index) => (
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
            <div>
              <Link
                href="/cong-thuc"
                appearance="button"
                variant="outline"
                className="inline-flex items-center gap-2"
              >
                Xem toàn bộ công thức
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            </div>
          </section>
        </Container>
      ) : null}

      {categoryGroups.length > 0 ? (
        <Container className="pb-12">
          <section aria-labelledby="categories-heading" className="flex flex-col gap-8">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <div className="flex flex-col gap-1">
                <h2 id="categories-heading" className="text-h2 text-ink">
                  Khám phá theo danh mục
                </h2>
                <p className="max-w-prose text-body-sm text-ink-muted">
                  Tìm món theo nhóm món, nền ẩm thực, bữa ăn và nhiều cách phân loại khác.
                </p>
              </div>
              <Link href={categoryIndexHref()} appearance="inline">
                Xem tất cả danh mục
              </Link>
            </div>

            <div className="flex flex-col gap-8">
              {categoryGroups.map((group) => (
                <div key={group.taxonomy.code} className="flex flex-col gap-3">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <h3 className="text-h4 text-ink">{group.taxonomy.label}</h3>
                    <Link href={categoryTypeHref(group.taxonomy.segment)} appearance="inline">
                      Xem tất cả
                    </Link>
                  </div>
                  <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {group.terms.slice(0, MAX_TERMS_PER_GROUP).map((term) => (
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
                </div>
              ))}
            </div>
          </section>
        </Container>
      ) : null}

      {hasNoData ? (
        <Container className="pb-12">
          <EmptyState
            title="Thư viện đang được xây dựng"
            description="Các công thức đầu tiên sẽ sớm xuất hiện. Trong lúc chờ, bạn có thể khám phá bộ công cụ nhà bếp bên dưới."
          />
        </Container>
      ) : null}

      <Container className="pb-16">
        <section aria-labelledby="tools-heading" className="flex flex-col gap-5">
          <div className="flex flex-col gap-1">
            <h2 id="tools-heading" className="text-h2 text-ink">
              Công cụ nhà bếp
            </h2>
            <p className="max-w-prose text-body-sm text-ink-muted">
              Những công cụ nhỏ giúp bạn chuẩn bị nguyên liệu và nấu ăn thuận tiện hơn.
            </p>
          </div>
          <ul className="grid gap-5 sm:grid-cols-2">
            {kitchenTools.map((tool) => {
              const Icon = tool.icon;
              return (
                <li key={tool.href}>
                  <Card as="article" interactive className="h-full">
                    <CardBody className="flex flex-col gap-3">
                      <span
                        className="inline-flex size-12 items-center justify-center rounded-lg bg-primary-subtle text-primary"
                        aria-hidden="true"
                      >
                        <Icon className="size-6" />
                      </span>
                      <h3 className="text-h4 text-ink">
                        <Link
                          href={tool.href}
                          appearance="unstyled"
                          className="rounded-sm focus-visible:outline-none focus-visible:focus-ring after:absolute after:inset-0 after:content-['']"
                        >
                          {tool.title}
                        </Link>
                      </h3>
                      <p className="text-body-sm text-ink-muted">{tool.description}</p>
                    </CardBody>
                  </Card>
                </li>
              );
            })}
          </ul>
        </section>
      </Container>
    </>
  );
}
