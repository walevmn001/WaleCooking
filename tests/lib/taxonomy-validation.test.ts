import { describe, expect, it } from "vitest";

import {
  createTaxonomyTermSchema,
  updateTaxonomyTermSchema,
} from "@/lib/validation/taxonomy";

/**
 * P08 §P08.4 — Validation quản trị taxonomy.
 * Mọi payload từ client đi qua schema này ở server (ngăn mass assignment).
 */
describe("P08 — createTaxonomyTermSchema", () => {
  it("nhận dữ liệu tối thiểu và áp locale mặc định", () => {
    const parsed = createTaxonomyTermSchema.parse({
      typeCode: "meal_type",
      slug: "an-sang",
      name: "Ăn sáng",
    });
    expect(parsed.locale).toBe("vi");
    expect(parsed.parentSlug).toBeUndefined();
    expect(parsed.description).toBeUndefined();
  });

  it("slug term cho phép gạch dưới (dữ liệu chuẩn P06)", () => {
    expect(
      createTaxonomyTermSchema.safeParse({
        typeCode: "dietary_preference",
        slug: "gluten_free",
        name: "Không gluten",
      }).success,
    ).toBe(true);
    expect(
      createTaxonomyTermSchema.safeParse({
        typeCode: "cooking_method",
        slug: "stir_fry",
        name: "Xào",
      }).success,
    ).toBe(true);
  });

  it("từ chối slug chứa khoảng trắng hoặc chữ hoa", () => {
    expect(
      createTaxonomyTermSchema.safeParse({ typeCode: "meal_type", slug: "An Sang", name: "X" }).success,
    ).toBe(false);
    expect(
      createTaxonomyTermSchema.safeParse({ typeCode: "meal_type", slug: "an sang", name: "X" }).success,
    ).toBe(false);
  });

  it("parentSlug nullable → danh mục gốc", () => {
    const parsed = createTaxonomyTermSchema.parse({
      typeCode: "ingredient_category",
      slug: "thit",
      name: "Thịt",
      parentSlug: null,
    });
    expect(parsed.parentSlug).toBeNull();
  });

  it("từ chối description vượt giới hạn", () => {
    expect(
      createTaxonomyTermSchema.safeParse({
        typeCode: "meal_type",
        slug: "x",
        name: "X",
        description: "a".repeat(1001),
      }).success,
    ).toBe(false);
  });

  it("loại bỏ trường lạ ngoài schema (chống mass assignment)", () => {
    const parsed = createTaxonomyTermSchema.parse({
      typeCode: "meal_type",
      slug: "x",
      name: "X",
      id: "hack",
      isActive: false,
    } as unknown);
    expect(parsed).not.toHaveProperty("id");
    expect(parsed).not.toHaveProperty("isActive");
  });
});

describe("P08 — updateTaxonomyTermSchema", () => {
  it("cho phép cập nhật cục bộ (mọi trường tùy chọn)", () => {
    const parsed = updateTaxonomyTermSchema.parse({ name: "Tên mới" });
    expect(parsed.name).toBe("Tên mới");
    expect(parsed).not.toHaveProperty("slug");
  });

  it("isActive phải là boolean", () => {
    expect(updateTaxonomyTermSchema.parse({ isActive: false }).isActive).toBe(false);
    expect(updateTaxonomyTermSchema.safeParse({ isActive: "no" }).success).toBe(false);
  });

  it("parentSlug=null được chấp nhận (bỏ danh mục cha)", () => {
    const parsed = updateTaxonomyTermSchema.parse({ parentSlug: null });
    expect(parsed.parentSlug).toBeNull();
  });
});
