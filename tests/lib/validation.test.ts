import { describe, expect, it } from "vitest";

import { ValidationError } from "@/lib/errors/app-error";
import { createIngredientSchema, createTaxonomyTermSchema } from "@/lib/validation/catalog";
import { paginate, paginationSchema, parseInput, slugSchema, toOffset } from "@/lib/validation/common";

describe("validation/common", () => {
  it("pagination có giá trị mặc định và ép kiểu số", () => {
    expect(paginationSchema.parse({})).toEqual({ page: 1, pageSize: 20 });
    expect(paginationSchema.parse({ page: "3", pageSize: "50" })).toEqual({ page: 3, pageSize: 50 });
  });

  it("pagination từ chối pageSize vượt ngưỡng", () => {
    expect(paginationSchema.safeParse({ pageSize: 500 }).success).toBe(false);
  });

  it("slug chỉ nhận chữ thường, số, gạch ngang", () => {
    expect(slugSchema.safeParse("nuoc-mam").success).toBe(true);
    expect(slugSchema.safeParse("Nước Mắm").success).toBe(false);
    expect(slugSchema.safeParse("trailing-").success).toBe(false);
  });

  it("parseInput ném ValidationError kèm details theo trường", () => {
    try {
      parseInput(createTaxonomyTermSchema, { typeCode: "", slug: "BAD", name: "" });
      throw new Error("đáng lẽ phải ném lỗi");
    } catch (error) {
      expect(error).toBeInstanceOf(ValidationError);
      const details = (error as ValidationError).details ?? {};
      expect(Object.keys(details)).toContain("slug");
    }
  });

  it("paginate tính totalPages đúng", () => {
    const result = paginate([1, 2], 21, { page: 1, pageSize: 10 });
    expect(result.totalPages).toBe(3);
    expect(toOffset({ page: 3, pageSize: 10 })).toBe(20);
  });
});

describe("validation/catalog", () => {
  it("default locale là 'vi'", () => {
    const parsed = createIngredientSchema.parse({ slug: "gao", name: "Gạo" });
    expect(parsed.locale).toBe("vi");
  });

  it("từ chối slug không hợp lệ", () => {
    expect(createIngredientSchema.safeParse({ slug: "Gạo!", name: "Gạo" }).success).toBe(false);
  });
});
