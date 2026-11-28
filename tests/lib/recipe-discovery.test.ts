import { describe, expect, it, vi } from "vitest";

// Chặn nạp Prisma ở unit test (module repositories tạo PrismaClient khi import).
vi.mock("@/lib/db/repositories", () => ({ repositories: {} }));

import type { Repositories } from "@/lib/db/repositories";
import type { RecipeListFilters } from "@/lib/db/repositories/recipe.repository";
import { buildRecipeListHref, parseRecipeListParams } from "@/lib/presentation/recipe-links";
import { RecipeService } from "@/lib/services/recipe.service";

/**
 * P08 §P08.2 — Bộ lọc khám phá công thức.
 * Kiểm tra RecipeService quy đổi tham số query → bộ lọc repository,
 * và phân nhánh trang danh mục (`direct` vs `ingredient_category`).
 */
function makeService() {
  const listPublic = vi.fn(async (filters: RecipeListFilters) => ({
    items: [] as never[],
    total: 0,
    page: filters.pagination.page,
    pageSize: filters.pagination.pageSize,
    totalPages: 1,
  }));
  const deps = {
    recipe: { listPublic },
    taxonomy: {},
    unit: {},
    ingredient: {},
    media: {},
  } as unknown as Repositories;
  return { service: new RecipeService(deps), listPublic };
}

function filtersOf(listPublic: ReturnType<typeof vi.fn>, call = 0): RecipeListFilters {
  return listPublic.mock.calls[call][0] as RecipeListFilters;
}

describe("P08 — listPublic: quy đổi bộ lọc khám phá", () => {
  it("không có tham số → không tạo điều kiện rỗng", async () => {
    const { service, listPublic } = makeService();
    await service.listPublic({});
    const filters = filtersOf(listPublic);
    expect(filters.taxonomy).toBeUndefined();
    expect(filters.ingredientSlug).toBeUndefined();
    expect(filters.ingredientCategorySlug).toBeUndefined();
    expect(filters.maxTotalMinutes).toBeUndefined();
  });

  it("mealType/cookingMethod/dietary → mảng taxonomy (kết hợp AND)", async () => {
    const { service, listPublic } = makeService();
    await service.listPublic({ mealType: "an-sang", cookingMethod: "hap", dietary: "chay" });
    const filters = filtersOf(listPublic);
    expect(filters.taxonomy).toEqual([
      { typeCode: "meal_type", slug: "an-sang" },
      { typeCode: "cooking_method", slug: "hap" },
      { typeCode: "dietary_preference", slug: "chay" },
    ]);
  });

  it("ingredient / ingredientCategory / maxMinutes", async () => {
    const { service, listPublic } = makeService();
    await service.listPublic({ ingredient: "gao", ingredientCategory: "ngu-coc", maxMinutes: "30" });
    const filters = filtersOf(listPublic);
    expect(filters.ingredientSlug).toBe("gao");
    expect(filters.ingredientCategorySlug).toBe("ngu-coc");
    expect(filters.maxTotalMinutes).toBe(30);
  });

  it("từ khoá tìm kiếm + phân trang ép kiểu", async () => {
    const { service, listPublic } = makeService();
    await service.listPublic({ q: "pho", page: "3", pageSize: "10" });
    const filters = filtersOf(listPublic);
    expect(filters.search).toBe("pho");
    expect(filters.pagination).toEqual({ page: 3, pageSize: 10 });
  });
});

describe("P08 — listPublicForCategory: phân nhánh theo filterKind", () => {
  it("direct → lọc theo taxonomy term (pageSize mặc định 12, sort newest)", async () => {
    const { service, listPublic } = makeService();
    await service.listPublicForCategory({
      typeCode: "food_type",
      slug: "mon-nuoc",
      filterKind: "direct",
    });
    const filters = filtersOf(listPublic);
    expect(filters.taxonomy).toEqual([{ typeCode: "food_type", slug: "mon-nuoc" }]);
    expect(filters.ingredientCategorySlug).toBeUndefined();
    expect(filters.pagination).toEqual({ page: 1, pageSize: 12 });
    expect(filters.sort).toBe("newest");
  });

  it("ingredient_category → lọc theo nhóm nguyên liệu (bỏ taxonomy)", async () => {
    const { service, listPublic } = makeService();
    await service.listPublicForCategory({
      typeCode: "ingredient_category",
      slug: "thit",
      filterKind: "ingredient_category",
    });
    const filters = filtersOf(listPublic);
    expect(filters.ingredientCategorySlug).toBe("thit");
    expect(filters.taxonomy).toBeUndefined();
  });

  it("tôn trọng page/pageSize/sort truyền vào", async () => {
    const { service, listPublic } = makeService();
    await service.listPublicForCategory({
      typeCode: "cuisine",
      slug: "viet-nam",
      filterKind: "direct",
      page: 2,
      pageSize: 5,
      sort: "az",
    });
    const filters = filtersOf(listPublic);
    expect(filters.pagination).toEqual({ page: 2, pageSize: 5 });
    expect(filters.sort).toBe("az");
  });
});

describe("P08 — parseRecipeListParams / buildRecipeListHref", () => {
  it("đọc các tham số khám phá mới", () => {
    expect(
      parseRecipeListParams({ mealType: "an-sang", maxMinutes: "30", page: "3", sort: "az" }),
    ).toEqual({ mealType: "an-sang", sort: "az", maxMinutes: 30, page: 3 });
  });

  it("bỏ page=1 và maxMinutes không hợp lệ", () => {
    expect(parseRecipeListParams({ page: "1" })).toEqual({});
    expect(parseRecipeListParams({ maxMinutes: "abc" })).toEqual({});
  });

  it("dựng href với tham số khám phá, bỏ giá trị mặc định (sort newest)", () => {
    expect(buildRecipeListHref({ mealType: "an-sang", sort: "newest", maxMinutes: 30 })).toBe(
      "/cong-thuc?mealType=an-sang&maxMinutes=30",
    );
  });
});
