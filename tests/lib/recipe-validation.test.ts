import { describe, expect, it } from "vitest";

import {
  createRecipeSchema,
  listRecipesQuerySchema,
  recipeIngredientInputSchema,
  recipeStepInputSchema,
  updateRecipeSchema,
} from "@/lib/validation/recipe";

describe("P07 — createRecipeSchema", () => {
  it("nhận công thức tối thiểu và áp giá trị mặc định", () => {
    const parsed = createRecipeSchema.parse({
      slug: "pho-bo",
      title: "Phở bò",
      baseServings: "4",
    });
    expect(parsed.locale).toBe("vi");
    expect(parsed.difficulty).toBe("easy");
    expect(parsed.ingredients).toEqual([]);
    expect(parsed.steps).toEqual([]);
  });

  it("chuẩn hoá baseServings dạng số thành chuỗi (giữ chính xác)", () => {
    const parsed = createRecipeSchema.parse({
      slug: "x",
      title: "X",
      baseServings: 2.5,
    });
    expect(parsed.baseServings).toBe("2.5");
  });

  it("từ chối slug không hợp lệ", () => {
    const bad = createRecipeSchema.safeParse({
      slug: "Phở Bò",
      title: "X",
      baseServings: "1",
    });
    expect(bad.success).toBe(false);
  });

  it("từ chối số khẩu phần không hợp lệ", () => {
    const bad = createRecipeSchema.safeParse({
      slug: "x",
      title: "X",
      baseServings: "abc",
    });
    expect(bad.success).toBe(false);
  });

  it("loại bỏ trường lạ (ngăn mass assignment)", () => {
    const parsed = createRecipeSchema.parse({
      slug: "x",
      title: "X",
      baseServings: "1",
      status: "published",
      authorId: "00000000-0000-0000-0000-000000000000",
    } as unknown);
    expect(parsed).not.toHaveProperty("status");
    expect(parsed).not.toHaveProperty("authorId");
  });
});

describe("P07 — định dạng slug từ vựng (regression seed P06)", () => {
  it("chấp nhận slug taxonomy/nguyên liệu có gạch dưới", () => {
    const parsed = createRecipeSchema.parse({
      slug: "pho-bo",
      title: "Phở bò",
      baseServings: "2",
      foodTypeSlug: "main_dish",
      cuisineSlug: "vietnamese",
      allergenSlugs: ["gluten_free"],
      taxonomyTerms: [{ typeCode: "cooking_method", slug: "stir_fry" }],
      ingredients: [
        { displayName: "Bánh phở", ingredientSlug: "pho-noodle", quantityNumeric: "200", unitCode: "g" },
      ],
    });
    expect(parsed.foodTypeSlug).toBe("main_dish");
    expect(parsed.allergenSlugs).toEqual(["gluten_free"]);
    expect(parsed.taxonomyTerms?.[0].slug).toBe("stir_fry");
  });

  it("slug URL công thức vẫn chỉ nhận gạch ngang (không gạch dưới)", () => {
    expect(createRecipeSchema.safeParse({ slug: "pho_bo", title: "X", baseServings: "1" }).success).toBe(
      false,
    );
  });
});

describe("P07 — recipeIngredientInputSchema (định lượng)", () => {
  it("decimal cần có số lượng", () => {
    const bad = recipeIngredientInputSchema.safeParse({
      displayName: "Thịt bò",
      quantityType: "decimal",
    });
    expect(bad.success).toBe(false);
    expect(recipeIngredientInputSchema.safeParse({ displayName: "Thịt bò", quantityNumeric: "200" }).success).toBe(true);
  });

  it("text cần có nội dung văn bản", () => {
    expect(recipeIngredientInputSchema.safeParse({ displayName: "Muối", quantityType: "text" }).success).toBe(false);
    expect(
      recipeIngredientInputSchema.safeParse({ displayName: "Muối", quantityType: "text", quantityText: "vừa đủ" })
        .success,
    ).toBe(true);
  });

  it("range cần cả giá trị nhỏ nhất và lớn nhất", () => {
    expect(
      recipeIngredientInputSchema.safeParse({ displayName: "Nước", quantityType: "range", quantityNumeric: "1" })
        .success,
    ).toBe(false);
    expect(
      recipeIngredientInputSchema.safeParse({
        displayName: "Nước",
        quantityType: "range",
        quantityNumeric: "1",
        quantityNumericMax: "2",
      }).success,
    ).toBe(true);
  });

  it("từ chối định lượng vượt quá 3 chữ số thập phân", () => {
    expect(
      recipeIngredientInputSchema.safeParse({ displayName: "X", quantityNumeric: "1.2345" }).success,
    ).toBe(false);
  });
});

describe("P07 — recipeStepInputSchema", () => {
  it("cần nội dung bước", () => {
    expect(recipeStepInputSchema.safeParse({ instruction: "" }).success).toBe(false);
  });

  it("chấp nhận nhiệt độ và thời gian hợp lệ", () => {
    const parsed = recipeStepInputSchema.parse({
      instruction: "Nướng",
      durationSeconds: 600,
      temperatureC: "180",
    });
    expect(parsed.durationSeconds).toBe(600);
    expect(parsed.temperatureC).toBe("180");
  });

  it("từ chối nhiệt độ không hợp lệ", () => {
    expect(recipeStepInputSchema.safeParse({ instruction: "Nướng", temperatureC: "nóng" }).success).toBe(false);
  });
});

describe("P07 — updateRecipeSchema", () => {
  it("cho phép cập nhật cục bộ (mọi trường tùy chọn)", () => {
    const parsed = updateRecipeSchema.parse({ title: "Tên mới" });
    expect(parsed.title).toBe("Tên mới");
    expect(parsed).not.toHaveProperty("ingredients");
  });

  it("từ chối baseServings không hợp lệ", () => {
    expect(updateRecipeSchema.safeParse({ baseServings: "x" }).success).toBe(false);
  });
});

describe("P07 — listRecipesQuerySchema", () => {
  it("áp mặc định phân trang và ép kiểu số", () => {
    const parsed = listRecipesQuerySchema.parse({ page: "3", pageSize: "10" });
    expect(parsed.page).toBe(3);
    expect(parsed.pageSize).toBe(10);
  });

  it("chấp nhận status 'any' (trang quản trị) và từ chối status lạ", () => {
    expect(listRecipesQuerySchema.safeParse({ status: "any" }).success).toBe(true);
    expect(listRecipesQuerySchema.safeParse({ status: "published" }).success).toBe(true);
    expect(listRecipesQuerySchema.safeParse({ status: "deleted" }).success).toBe(false);
  });

  it("từ chối difficulty không hợp lệ", () => {
    expect(listRecipesQuerySchema.safeParse({ difficulty: "extreme" }).success).toBe(false);
  });
});
