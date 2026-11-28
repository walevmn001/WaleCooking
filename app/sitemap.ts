import type { MetadataRoute } from "next";

import { DISCOVERY_TAXONOMIES } from "@/lib/constants/taxonomy";
import { categoryTermHref } from "@/lib/presentation/category-links";
import { catalogService, recipeService } from "@/lib/services";

/**
 * `sitemap.xml` (P11 — bổ sung SEO, trước đây thiếu → 404).
 *
 * Nguyên tắc:
 * - CHỈ liệt kê nội dung CÔNG KHAI: công thức `published` (BR-13) + trang danh mục.
 *   KHÔNG đưa công thức draft/archived vào sitemap.
 * - Sinh động theo yêu cầu (không prerender ở build) để phản ánh dữ liệu thật.
 * - Mọi truy vấn DB được bọc try/catch: DB không sẵn sàng → chỉ trả các trang tĩnh,
 *   KHÔNG làm hỏng sitemap.
 */

export const dynamic = "force-dynamic";

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/+$/, "");

function absolute(path: string): string {
  return path === "/" ? SITE_URL : `${SITE_URL}${path}`;
}

const STATIC_PAGES: { path: string; priority: number; changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"] }[] = [
  { path: "/", priority: 1, changeFrequency: "weekly" },
  { path: "/cong-thuc", priority: 0.9, changeFrequency: "daily" },
  { path: "/danh-muc", priority: 0.7, changeFrequency: "weekly" },
  { path: "/cong-cu", priority: 0.6, changeFrequency: "monthly" },
  { path: "/cong-cu/do-ng-ho", priority: 0.5, changeFrequency: "monthly" },
  { path: "/cong-cu/quy-doi-don-vi", priority: 0.5, changeFrequency: "monthly" },
  { path: "/cong-cu/tim-theo-nguyen-lieu", priority: 0.5, changeFrequency: "monthly" },
  { path: "/kien-thuc", priority: 0.5, changeFrequency: "monthly" },
  { path: "/gioi-thieu", priority: 0.4, changeFrequency: "monthly" },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticEntries: MetadataRoute.Sitemap = STATIC_PAGES.map((page) => ({
    url: absolute(page.path),
    lastModified: now,
    changeFrequency: page.changeFrequency,
    priority: page.priority,
  }));

  const recipeEntries: MetadataRoute.Sitemap = [];
  try {
    let page = 1;
    // Phân trang tới hết (giới hạn an toàn 50 trang × 100 = 5000 công thức).
    for (;;) {
      const data = await recipeService.listPublic({ page: String(page), pageSize: "100", sort: "newest" });
      for (const item of data.items) {
        recipeEntries.push({
          url: absolute(`/cong-thuc/${item.slug}`),
          lastModified: item.publishedAt ?? now,
          changeFrequency: "monthly",
          priority: 0.8,
        });
      }
      if (page >= data.totalPages || page >= 50) break;
      page += 1;
    }
  } catch {
    // DB không khả dụng → bỏ phần động.
  }

  const categoryEntries: MetadataRoute.Sitemap = [];
  for (const taxonomy of DISCOVERY_TAXONOMIES) {
    try {
      const terms = await catalogService.listTaxonomyTerms(taxonomy.code);
      for (const term of terms) {
        categoryEntries.push({
          url: absolute(categoryTermHref(taxonomy.segment, term.slug)),
          changeFrequency: "weekly",
          priority: 0.6,
        });
      }
    } catch {
      // Trục phân loại lỗi/không tồn tại → bỏ qua, không làm hỏng sitemap.
    }
  }

  return [...staticEntries, ...categoryEntries, ...recipeEntries];
}
