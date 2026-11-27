import { describe, expect, it } from "vitest";

import type {
  RecipeDetailDto,
  RecipeIngredientDto,
} from "@/lib/db/repositories/recipe.repository";
import { toRecipeFormValues } from "@/lib/presentation/recipe-form-values";
import { parseRecipeListParams, buildRecipeListHref, recipeDetailHref } from "@/lib/presentation/recipe-links";
import { slugify } from "@/lib/presentation/slug";
import {
  formatIngredientAmount,
  toNutritionViewModel,
  toRecipeDetail,
  toRecipeJsonLd,
  toRecipeSummary,
} from "@/lib/presentation/recipe-view";

function ingredient(overrides: Partial<RecipeIngredientDto>): RecipeIngredientDto {
  return {
    id: "ing",
    displayName: "Nguyên liệu",
    quantityType: "decimal",
    quantityNumeric: null,
    quantityNumericMax: null,
    quantityText: null,
    unitCode: null,
    unitName: null,
    unitSymbol: null,
    isRequired: true,
    preparationNote: null,
    groupLabel: null,
    sortOrder: 0,
    ...overrides,
  };
}

const detail: RecipeDetailDto = {
  id: "r1",
  slug: "pho-bo",
  title: "Phở bò",
  summary: "Món nước truyền thống.",
  imageUrl: null,
  imageAlt: null,
  prepMinutes: 20,
  cookMinutes: 90,
  totalMinutes: null,
  baseServings: 4,
  difficulty: "medium",
  foodTypeSlug: "mon-nuoc",
  cuisineSlug: "viet-nam",
  publishedAt: new Date("2026-01-01T00:00:00Z"),
  status: "published",
  verificationStatus: "tested",
  defaultLocale: "vi",
  description: "Mô tả chi tiết.",
  seoTitle: null,
  seoDescription: null,
  authorId: "u1",
  editorId: null,
  primaryImage: { id: "m1", url: "https://example.com/pho.jpg", altText: "Phở bò" },
  images: [],
  ingredients: [
    ingredient({
      id: "i1",
      displayName: "Bánh phở",
      quantityNumeric: "400.000",
      unitCode: "g",
      unitSymbol: "g",
    }),
    ingredient({
      id: "i2",
      displayName: "Muối",
      quantityType: "text",
      quantityText: "vừa đủ",
      isRequired: false,
    }),
  ],
  steps: [
    {
      id: "s1",
      stepNo: 1,
      sortOrder: 0,
      instruction: "Đun nước dùng.",
      tip: null,
      timers: [{ label: "Bước 1", durationSeconds: 1800, temperatureC: null, temperatureNote: null }],
      images: [],
    },
  ],
  nutrition: [
    {
      basis: "per_serving",
      calories: "350.00",
      proteinG: "20.00",
      carbsG: null,
      fatG: null,
      fiberG: null,
      sugarG: null,
      sodiumMg: null,
      dataSourceType: "estimated",
      sourceNote: null,
    },
  ],
  allergens: [{ termId: "t1", slug: "gluten", name: "Gluten", source: "declared" }],
  sources: [],
  taxonomy: [{ typeCode: "meal_type", slug: "mon-chinh", name: "Món chính" }],
  createdAt: new Date("2026-01-01T00:00:00Z"),
  updatedAt: new Date("2026-01-02T00:00:00Z"),
};

describe("P07 — formatIngredientAmount", () => {
  it("decimal: gộp số với ký hiệu đơn vị, bỏ số 0 thừa", () => {
    expect(formatIngredientAmount(ingredient({ quantityNumeric: "400.000", unitSymbol: "g" }))).toBe("400 g");
  });

  it("range: hiển thị min–max", () => {
    expect(
      formatIngredientAmount(ingredient({ quantityType: "range", quantityNumeric: "1", quantityNumericMax: "2" })),
    ).toBe("1–2");
  });

  it("text: trả về nguyên văn", () => {
    expect(formatIngredientAmount(ingredient({ quantityType: "text", quantityText: "vừa đủ" }))).toBe("vừa đủ");
  });

  it("thiếu định lượng: trả undefined (không bịa)", () => {
    expect(formatIngredientAmount(ingredient({ quantityNumeric: null }))).toBeUndefined();
  });
});

describe("P07 — toRecipeSummary", () => {
  it("ánh xạ DTO sang view-model danh sách", () => {
    const vm = toRecipeSummary(detail);
    expect(vm.title).toBe("Phở bò");
    expect(vm.servings).toBe(4);
    expect(vm.difficulty).toBe("medium");
    // `imageUrl` của summary lấy từ trường summary (không phải primaryImage).
    expect(vm.imageUrl).toBeNull();
  });
});

describe("P07 — toNutritionViewModel", () => {
  it("chỉ đưa vào chỉ số CÓ dữ liệu và kèm ghi chú cơ sở/nguồn", () => {
    const vm = toNutritionViewModel(detail.nutrition);
    expect(vm.facts.map((f) => f.label)).toEqual(["Năng lượng", "Đạm"]);
    expect(vm.note).toContain("1 khẩu phần");
    expect(vm.note).toContain("ước tính");
  });

  it("không có dữ liệu: trả danh sách rỗng", () => {
    expect(toNutritionViewModel([])).toEqual({ facts: [] });
  });
});

describe("P07 — toRecipeDetail", () => {
  it("ánh xạ đầy đủ nguyên liệu, bước và phân loại", () => {
    const vm = toRecipeDetail(detail);
    expect(vm.ingredients).toHaveLength(2);
    expect(vm.ingredients[1].optional).toBe(true);
    expect(vm.steps[0].durationMinutes).toBe(30);
    expect(vm.categories).toEqual(["Món chính"]);
    expect(vm.allergens[0].label).toBe("Gluten");
    expect(vm.imageUrl).toBe("https://example.com/pho.jpg");
  });
});

describe("P07 — toRecipeJsonLd", () => {
  it("chỉ chèn trường có dữ liệu thật (bỏ totalTime khi null)", () => {
    const vm = toRecipeDetail(detail);
    const data = toRecipeJsonLd(vm, "https://wale.example/cong-thuc/pho-bo");
    expect(data["@type"]).toBe("Recipe");
    expect(data.prepTime).toBe("PT20M");
    expect(data.cookTime).toBe("PT90M");
    expect(data).not.toHaveProperty("totalTime");
    expect(data.recipeYield).toBe("4 khẩu phần");
    expect(data.recipeIngredient).toEqual(["400 g Bánh phở", "vừa đủ Muối"]);
    expect(data.recipeInstructions).toHaveLength(1);
    expect((data.nutrition as Record<string, unknown>).calories).toBe("350 kcal");
  });
});

describe("P07 — toRecipeFormValues", () => {
  it("ánh xạ DTO sang giá trị form; bộ đếm thời gian → phút", () => {
    const values = toRecipeFormValues(detail);
    expect(values.slug).toBe("pho-bo");
    expect(values.difficulty).toBe("medium");
    expect(values.baseServings).toBe("4");
    expect(values.foodTypeSlug).toBe("mon-nuoc");
    expect(values.cookMinutes).toBe("90");
    expect(values.allergenSlugs).toEqual(["gluten"]);
    expect(values.ingredients[0].quantityNumeric).toBe("400.000");
    expect(values.ingredients[1].quantityType).toBe("text");
    expect(values.steps[0].durationMinutes).toBe("30");
  });
});

describe("P07 — recipe-links", () => {
  it("parseRecipeListParams bỏ giá trị mặc định", () => {
    expect(parseRecipeListParams({ sort: "newest", page: "1" })).toEqual({ sort: "newest" });
    expect(parseRecipeListParams({ q: " phở ", page: "3" })).toEqual({ q: "phở", page: 3 });
  });

  it("buildRecipeListHref bỏ sort=newest và page=1", () => {
    expect(buildRecipeListHref({ sort: "newest", page: 1 })).toBe("/cong-thuc");
    expect(buildRecipeListHref({ q: "pho", page: 2 })).toBe("/cong-thuc?q=pho&page=2");
  });

  it("buildRecipeListHref áp overrides (đưa về trang 1 khi đổi bộ lọc)", () => {
    expect(buildRecipeListHref({ page: 5 }, { page: undefined })).toBe("/cong-thuc");
  });

  it("recipeDetailHref", () => {
    expect(recipeDetailHref("pho-bo")).toBe("/cong-thuc/pho-bo");
  });
});

describe("P07 — slugify (tiếng Việt)", () => {
  it("chuẩn hoá dấu và ký tự đặc biệt", () => {
    expect(slugify("Phở bò Hà Nội")).toBe("pho-bo-ha-noi");
  });

  it("xử lý riêng ký tự đ/Đ", () => {
    expect(slugify("Đường đen")).toBe("duong-den");
  });

  it("cắt theo độ dài tối đa và bỏ gạch ngang thừa", () => {
    expect(slugify("a".repeat(250)).length).toBe(200);
    expect(slugify("Xin chào!!!")).toBe("xin-chao");
  });
});
