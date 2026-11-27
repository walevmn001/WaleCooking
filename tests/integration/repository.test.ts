import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { PrismaIngredientRepository } from "@/lib/db/repositories/prisma-ingredient.repository";
import { PrismaTaxonomyRepository } from "@/lib/db/repositories/prisma-taxonomy.repository";
import { PrismaUnitRepository } from "@/lib/db/repositories/prisma-unit.repository";
import { runSystemSeed } from "@/prisma/seed/run";

import { testDb, uniqueSlug } from "./helpers/db";

const unitRepo = new PrismaUnitRepository(testDb);
const taxonomyRepo = new PrismaTaxonomyRepository(testDb);
const ingredientRepo = new PrismaIngredientRepository(testDb);

const createdSlugs: string[] = [];

beforeAll(async () => {
  await runSystemSeed(testDb);
});

afterAll(async () => {
  if (createdSlugs.length > 0) {
    await testDb.ingredient.deleteMany({ where: { slug: { in: createdSlugs } } });
  }
});

describe("P06 — UnitRepository", () => {
  it("liệt kê đơn vị với tên theo locale", async () => {
    const units = await unitRepo.list("vi");
    expect(units.length).toBeGreaterThanOrEqual(20);
    const gram = units.find((u) => u.code === "g");
    expect(gram?.name).toBe("gam");
    expect(gram?.dimension).toBe("mass");
    expect(gram?.isBase).toBe(true);
  });

  it("findByCode trả về đơn vị kèm bản dịch tiếng Anh", async () => {
    const unit = await unitRepo.findByCode("kg", "en");
    expect(unit?.name).toBe("kilogram");
  });

  it("quy đổi cùng chiều: kg → g = 1000", async () => {
    const conversions = await unitRepo.listConversionsFrom("kg");
    const toGram = conversions.find((c) => c.toUnitCode === "g");
    expect(toGram?.factor).toBe("1000");
  });
});

describe("P06 — TaxonomyRepository", () => {
  it("có đúng 9 trục phân loại", async () => {
    const types = await taxonomyRepo.listTypes();
    expect(types.map((t) => t.code).sort()).toEqual(
      [
        "allergen",
        "cooking_method",
        "country",
        "cuisine",
        "dietary_preference",
        "food_type",
        "ingredient_category",
        "meal_type",
        "region",
      ].sort(),
    );
  });

  it("lấy term theo trục + slug với tên tiếng Việt", async () => {
    const term = await taxonomyRepo.findTerm("cuisine", "vietnamese", "vi");
    expect(term?.name).toBe("Việt Nam");
    expect(term?.typeCode).toBe("cuisine");
  });

  it("đếm term theo trục", async () => {
    const count = await taxonomyRepo.countTerms("allergen");
    expect(count).toBeGreaterThanOrEqual(14);
  });
});

describe("P06 — IngredientRepository", () => {
  it("phân trang đúng", async () => {
    const page1 = await ingredientRepo.list({ locale: "vi", pagination: { page: 1, pageSize: 5 } });
    expect(page1.items).toHaveLength(5);
    expect(page1.total).toBeGreaterThanOrEqual(40);
    expect(page1.totalPages).toBe(Math.ceil(page1.total / 5));

    const page2 = await ingredientRepo.list({ locale: "vi", pagination: { page: 2, pageSize: 5 } });
    const ids1 = new Set(page1.items.map((i) => i.id));
    expect(page2.items.some((i) => ids1.has(i.id))).toBe(false);
  });

  it("quan hệ: nguyên liệu ánh xạ đúng nhóm (categorySlug)", async () => {
    const item = await ingredientRepo.findBySlug("fish-sauce", "vi");
    expect(item?.name).toBe("Nước mắm");
    expect(item?.categorySlug).toBe("seasoning");
  });

  it("tìm kiếm theo tên (không phân biệt hoa/thường)", async () => {
    const result = await ingredientRepo.list({
      locale: "vi",
      pagination: { page: 1, pageSize: 20 },
      search: "mắm",
    });
    expect(result.items.some((i) => i.slug === "fish-sauce")).toBe(true);
  });

  it("lọc theo nhóm nguyên liệu", async () => {
    const result = await ingredientRepo.list({
      locale: "vi",
      pagination: { page: 1, pageSize: 50 },
      categorySlug: "seafood",
    });
    expect(result.items.length).toBeGreaterThan(0);
    expect(result.items.every((i) => i.categorySlug === "seafood")).toBe(true);
  });

  it("createWithTranslation tạo nguyên liệu + bản dịch (marble test)", async () => {
    const slug = uniqueSlug("test-ingredient");
    createdSlugs.push(slug);
    const created = await ingredientRepo.createWithTranslation({
      slug,
      name: "Nguyên liệu kiểm thử",
      locale: "vi",
    });
    expect(created.slug).toBe(slug);
    expect(created.name).toBe("Nguyên liệu kiểm thử");

    const translations = await testDb.ingredientTranslation.count({
      where: { ingredientId: created.id },
    });
    expect(translations).toBe(1);
  });
});
