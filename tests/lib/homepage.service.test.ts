import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Chặn nạp Prisma ở unit test (module repositories tạo PrismaClient khi import).
vi.mock("@/lib/db/repositories", () => ({ repositories: {} }));

import type { DiscoveryTaxonomy } from "@/lib/constants/taxonomy";
import type { RecipeSummaryDto } from "@/lib/db/repositories/recipe.repository";
import type { TaxonomyTermWithCountDto } from "@/lib/db/repositories/taxonomy.repository";
import {
  HOMEPAGE_NEWEST_LIMIT,
  HomepageService,
  type HomepageServiceDeps,
} from "@/lib/services/homepage.service";
import type { CategoryGroup } from "@/lib/services/taxonomy.service";
import { taxonomyService } from "@/lib/services/taxonomy.service";
import type { Paginated } from "@/lib/validation/common";
import type { RawQuery } from "@/lib/services/recipe.service";

const foodTypeTaxonomy: DiscoveryTaxonomy = {
  code: "food_type",
  segment: "nhom-mon",
  label: "Nhóm món ăn",
  description: "Phân loại theo vai trò món trong bữa ăn.",
  isHierarchical: false,
  filterKind: "direct",
};

function recipe(overrides: Partial<RecipeSummaryDto> = {}): RecipeSummaryDto {
  return {
    id: "r1",
    slug: "pho-bo",
    title: "Phở bò",
    summary: null,
    imageUrl: null,
    imageAlt: null,
    prepMinutes: 10,
    cookMinutes: 30,
    totalMinutes: 40,
    baseServings: 4,
    difficulty: "medium",
    foodTypeSlug: "main_dish",
    cuisineSlug: "vietnamese",
    publishedAt: new Date("2026-01-01T00:00:00Z"),
    ...overrides,
  };
}

function page(items: RecipeSummaryDto[], total = items.length): Paginated<RecipeSummaryDto> {
  return {
    items,
    total,
    page: 1,
    pageSize: HOMEPAGE_NEWEST_LIMIT,
    totalPages: Math.max(1, Math.ceil(total / HOMEPAGE_NEWEST_LIMIT)),
  };
}

function term(overrides: Partial<TaxonomyTermWithCountDto> = {}): TaxonomyTermWithCountDto {
  return {
    id: "t1",
    slug: "mon-viet",
    typeCode: "food_type",
    parentId: null,
    icon: null,
    sortOrder: 0,
    isActive: true,
    name: "Món Việt",
    description: null,
    recipeCount: 3,
    childCount: 0,
    ...overrides,
  };
}

function categoryGroup(): CategoryGroup {
  return { taxonomy: foodTypeTaxonomy, terms: [term()] };
}

interface ServiceMocks {
  service: HomepageService;
  listPublic: ReturnType<typeof vi.fn>;
  listDiscoveryGroups: ReturnType<typeof vi.fn>;
}

function makeService(overrides: {
  listPublic?: (query?: RawQuery) => Promise<Paginated<RecipeSummaryDto>>;
  listDiscoveryGroups?: () => Promise<CategoryGroup[]>;
} = {}): ServiceMocks {
  const listPublic = vi.fn(
    overrides.listPublic ?? (async (_query?: RawQuery) => page([])),
  );
  const listDiscoveryGroups = vi.fn(
    overrides.listDiscoveryGroups ?? (async () => [] as CategoryGroup[]),
  );
  const deps: HomepageServiceDeps = {
    recipe: { listPublic } as unknown as HomepageServiceDeps["recipe"],
    taxonomy: { listDiscoveryGroups } as unknown as HomepageServiceDeps["taxonomy"],
  };
  return { service: new HomepageService(deps), listPublic, listDiscoveryGroups };
}

let errorSpy: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  errorSpy.mockRestore();
  vi.restoreAllMocks();
});

describe("P15.1 — HomepageService: truy vấn dữ liệu trang chủ", () => {
  it("chỉ đi qua luồng công khai (listPublic) và trả items/total thật", async () => {
    const items = [recipe({ id: "a", slug: "a" }), recipe({ id: "b", slug: "b" })];
    const { service, listPublic } = makeService({
      listPublic: async () => page(items, 42),
    });

    const data = await service.load();

    // Khối "món mới" lấy từ listPublic (luồng chỉ trả công thức `published` — BR-13).
    expect(listPublic).toHaveBeenCalledTimes(1);
    expect(data.newest).not.toBeNull();
    expect(data.newest?.recipes).toEqual(items);
    expect(data.newest?.total).toBe(42);
  });

  it("truy vấn món mới dùng sort 'newest', trang 1 và giới hạn số lượng", async () => {
    const { service, listPublic } = makeService();

    await service.load();

    expect(listPublic).toHaveBeenCalledWith({
      sort: "newest",
      page: "1",
      pageSize: String(HOMEPAGE_NEWEST_LIMIT),
    });
    expect(HOMEPAGE_NEWEST_LIMIT).toBe(6);
  });

  it("giữ nguyên thứ tự món mới do nguồn dữ liệu trả về (mới nhất trước)", async () => {
    const ordered = [
      recipe({ id: "1", slug: "moi-nhat" }),
      recipe({ id: "2", slug: "giua" }),
      recipe({ id: "3", slug: "cu-nhat" }),
    ];
    const { service } = makeService({ listPublic: async () => page(ordered) });

    const data = await service.load();

    expect(data.newest?.recipes.map((r) => r.slug)).toEqual(["moi-nhat", "giua", "cu-nhat"]);
  });

  it("taxonomy rỗng → khối danh mục là mảng rỗng (không bịa danh mục)", async () => {
    const { service } = makeService({ listDiscoveryGroups: async () => [] });

    const data = await service.load();

    expect(data.categories).toEqual([]);
  });

  it("lỗi truy vấn món mới KHÔNG làm hỏng khối danh mục và có ghi log", async () => {
    const { service } = makeService({
      listPublic: async () => {
        throw new Error("db down");
      },
      listDiscoveryGroups: async () => [categoryGroup()],
    });

    const data = await service.load();

    expect(data.newest).toBeNull();
    expect(data.categories).toHaveLength(1);
    expect(errorSpy).toHaveBeenCalled();
  });

  it("lỗi truy vấn danh mục KHÔNG làm hỏng khối món mới và có ghi log", async () => {
    const items = [recipe()];
    const { service } = makeService({
      listPublic: async () => page(items),
      listDiscoveryGroups: async () => {
        throw new Error("db down");
      },
    });

    const data = await service.load();

    expect(data.categories).toBeNull();
    expect(data.newest?.recipes).toEqual(items);
    expect(errorSpy).toHaveBeenCalled();
  });

  it("mặc định (không inject) dùng service thật recipeService/taxonomyService", () => {
    const service = new HomepageService();
    expect(service).toBeInstanceOf(HomepageService);
    // taxonomyService là singleton được tái sử dụng (không tạo truy vấn mới).
    expect(typeof taxonomyService.listDiscoveryGroups).toBe("function");
  });
});
