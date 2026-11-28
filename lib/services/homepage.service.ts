import "server-only";

import type { RecipeSummaryDto } from "@/lib/db/repositories/recipe.repository";
import { recipeService, type RecipeService } from "./recipe.service";
import { taxonomyService, type CategoryGroup, type TaxonomyService } from "./taxonomy.service";

/**
 * Số công thức "món mới" hiển thị ở trang chủ (P15.1).
 * Giới hạn để trang chủ gọn và kiểm soát chi phí truy vấn.
 */
export const HOMEPAGE_NEWEST_LIMIT = 6;

/** Khối "Món mới" của trang chủ. */
export interface HomepageNewestSection {
  /** Danh sách công thức `published` mới nhất (đã giới hạn số lượng). */
  recipes: RecipeSummaryDto[];
  /** Tổng số công thức `published` (số liệu THẬT từ DB — không bịa). */
  total: number;
}

/**
 * Dữ liệu trang chủ (P15.1).
 *
 * Mỗi khối là `null` khi truy vấn của khối đó LỖI → tầng UI ẩn khối thay vì làm
 * hỏng toàn trang (FR-01 luồng lỗi). Lỗi KHÔNG bị nuốt âm thầm — được ghi log.
 */
export interface HomepageData {
  newest: HomepageNewestSection | null;
  categories: CategoryGroup[] | null;
}

/** Cổng phụ thuộc cho `HomepageService` (thuận tiện kiểm thử, tái sử dụng service P07/P08). */
export interface HomepageServiceDeps {
  recipe: Pick<RecipeService, "listPublic">;
  taxonomy: Pick<TaxonomyService, "listDiscoveryGroups">;
}

const defaultDeps: HomepageServiceDeps = {
  recipe: recipeService,
  taxonomy: taxonomyService,
};

/**
 * HomepageService — tổng hợp dữ liệu THẬT cho trang chủ (FR-01).
 *
 * Nguyên tắc:
 * - CHỈ dùng lại hạ tầng sẵn có: `recipeService.listPublic` (đã lọc `published` — BR-13)
 *   và `taxonomyService.listDiscoveryGroups` (danh mục khám phá có số công thức thật).
 * - KHÔNG thêm bảng/cột/truy vấn mới; KHÔNG bịa dữ liệu (BR-02).
 * - Tách lỗi độc lập từng khối: một truy vấn lỗi trả `null` cho khối đó, các khối khác
 *   vẫn chạy; lỗi được ghi lại (không nuốt âm thầm).
 */
export class HomepageService {
  constructor(private readonly deps: HomepageServiceDeps = defaultDeps) {}

  async load(): Promise<HomepageData> {
    const [newest, categories] = await Promise.all([
      this.loadSection("món mới", () => this.loadNewest()),
      this.loadSection("danh mục", () => this.deps.taxonomy.listDiscoveryGroups()),
    ]);
    return { newest, categories };
  }

  /** Món mới nhất: `published`, sắp theo `publishedAt` giảm dần, giới hạn số lượng. */
  private async loadNewest(): Promise<HomepageNewestSection> {
    const page = await this.deps.recipe.listPublic({
      sort: "newest",
      page: "1",
      pageSize: String(HOMEPAGE_NEWEST_LIMIT),
    });
    return { recipes: page.items, total: page.total };
  }

  /** Chạy một khối, giữ lỗi cục bộ (khối lỗi → `null`) nhưng vẫn ghi log. */
  private async loadSection<T>(label: string, fn: () => Promise<T>): Promise<T | null> {
    try {
      return await fn();
    } catch (error) {
      // Ghi nhận lỗi theo cơ chế hiện có (console) — không giả lập dữ liệu thay thế.
      console.error(`[homepage] Không tải được khối "${label}":`, error);
      return null;
    }
  }
}

export const homepageService = new HomepageService();
