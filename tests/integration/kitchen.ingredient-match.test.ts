import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { PrismaIngredientRepository } from "@/lib/db/repositories/prisma-ingredient.repository";
import { PrismaMediaRepository } from "@/lib/db/repositories/prisma-media.repository";
import { PrismaRecipeRepository } from "@/lib/db/repositories/prisma-recipe.repository";
import { PrismaTaxonomyRepository } from "@/lib/db/repositories/prisma-taxonomy.repository";
import { PrismaUnitRepository } from "@/lib/db/repositories/prisma-unit.repository";
import type { Repositories } from "@/lib/db/repositories";
import type { Actor } from "@/lib/auth/authorization";
import { RecipeService } from "@/lib/services/recipe.service";
import { runSystemSeed } from "@/prisma/seed/run";

import { testDb, uniqueSlug } from "./helpers/db";

/**
 * P10.3 — Tìm công thức theo nguyên liệu (integration với lớp discovery/repository P08).
 *
 * Kiểm tra: chỉ công thức `published` được xét; khớp theo tên nguyên liệu đã chuẩn hoá;
 * nguyên liệu còn thiếu (tách nhóm bắt buộc) tính từ dữ liệu THỰC; không tạo công thức giả.
 */
const deps: Repositories = {
  unit: new PrismaUnitRepository(testDb),
  taxonomy: new PrismaTaxonomyRepository(testDb),
  ingredient: new PrismaIngredientRepository(testDb),
  recipe: new PrismaRecipeRepository(testDb),
  media: new PrismaMediaRepository(testDb),
};
const service = new RecipeService(deps);

const createdRecipeIds: string[] = [];
const createdUserIds: string[] = [];
const createdSourceIds: string[] = [];
const createdMediaIds: string[] = [];

let editor: Actor;
let foodTypeSlug: string;
let cuisineSlug: string;

function createInput(overrides: Record<string, unknown> = {}) {
  return {
    slug: uniqueSlug("match-recipe"),
    locale: "vi",
    title: "Công thức khớp nguyên liệu",
    summary: "Mô tả cho công thức kiểm thử tìm theo nguyên liệu.",
    difficulty: "easy",
    baseServings: "2",
    prepMinutes: 10,
    cookMinutes: 20,
    totalMinutes: 30,
    foodTypeSlug,
    cuisineSlug,
    ingredients: [
      { displayName: "Trứng", quantityType: "decimal", quantityNumeric: "2", unitCode: "piece", isRequired: true },
    ],
    steps: [{ instruction: "Bước một." }],
    ...overrides,
  };
}

async function publishRecipe(overrides: Record<string, unknown> = {}) {
  const source = await testDb.contentSource.create({
    data: { name: "WALE COOKING (tự biên soạn, test)" },
    select: { id: true },
  });
  createdSourceIds.push(source.id);
  const media = await testDb.mediaAsset.create({
    data: {
      storageKey: uniqueSlug("media"),
      mimeType: "image/jpeg",
      sizeBytes: 1024,
      publicUrl: "https://cdn.test/match.jpg",
    },
    select: { id: true },
  });
  createdMediaIds.push(media.id);

  const detail = await service.create(
    editor,
    createInput({
      sourceIds: [source.id],
      images: [{ mediaAssetId: media.id, role: "hero" }],
      ...overrides,
    }),
  );
  createdRecipeIds.push(detail.id);
  await service.publish(editor, detail.id);
  return detail;
}

beforeAll(async () => {
  await runSystemSeed(testDb);

  const editorRow = await testDb.user.create({
    data: { name: "Editor", email: `match-editor-${uniqueSlug("x")}@example.test`, role: "editor" },
    select: { id: true },
  });
  createdUserIds.push(editorRow.id);
  editor = { id: editorRow.id, role: "editor" };

  const foodType = await testDb.taxonomyTerm.findFirst({
    where: { type: { code: "food_type" } },
    select: { slug: true },
  });
  const cuisine = await testDb.taxonomyTerm.findFirst({
    where: { type: { code: "cuisine" } },
    select: { slug: true },
  });
  foodTypeSlug = foodType!.slug;
  cuisineSlug = cuisine!.slug;
});

afterAll(async () => {
  await testDb.recipe.deleteMany({ where: { id: { in: createdRecipeIds } } });
  await testDb.contentSource.deleteMany({ where: { id: { in: createdSourceIds } } });
  await testDb.mediaAsset.deleteMany({ where: { id: { in: createdMediaIds } } });
  await testDb.user.deleteMany({ where: { id: { in: createdUserIds } } });
});

describe("P10 — RecipeService.matchByIngredients", () => {
  it("trả công thức published khớp nguyên liệu, kèm nguyên liệu còn thiếu", async () => {
    const detail = await publishRecipe({
      ingredients: [
        { displayName: "Trứng", quantityType: "decimal", quantityNumeric: "2", unitCode: "piece", isRequired: true },
        { displayName: "Cà chua", quantityType: "decimal", quantityNumeric: "3", unitCode: "piece", isRequired: true },
        { displayName: "Hành lá", quantityType: "text", quantityText: "một ít", isRequired: false },
      ],
    });

    const results = await service.matchByIngredients(["Trứng", "Cà chua"]);
    const hit = results.find((r) => r.candidate.slug === detail.slug);

    expect(hit).toBeDefined();
    expect(hit!.matched).toEqual(expect.arrayContaining(["Trứng", "Cà chua"]));
    expect(hit!.missing).toEqual(expect.arrayContaining(["Hành lá"]));
    expect(hit!.matchedCount).toBe(2);
    expect(hit!.totalIngredients).toBe(3);
    expect(hit!.coverage).toBeCloseTo(2 / 3, 5);
  });

  it("chuẩn hoá & loại trùng nguyên liệu đầu vào (hoa/thường, dấu)", async () => {
    const detail = await publishRecipe({
      ingredients: [
        { displayName: "Trứng", quantityType: "decimal", quantityNumeric: "2", unitCode: "piece", isRequired: true },
      ],
    });
    const results = await service.matchByIngredients(["trứng", "TRỨNG", "  Trứng "]);
    const hit = results.find((r) => r.candidate.slug === detail.slug);
    expect(hit).toBeDefined();
    expect(hit!.userMatchedCount).toBe(1);
  });

  it("KHÔNG trả công thức không khớp nguyên liệu nào", async () => {
    const detail = await publishRecipe({
      ingredients: [
        { displayName: "Trứng", quantityType: "decimal", quantityNumeric: "2", unitCode: "piece", isRequired: true },
      ],
    });
    const results = await service.matchByIngredients(["Nguyên liệu hoàn toàn không tồn tại"]);
    expect(results.find((r) => r.candidate.slug === detail.slug)).toBeUndefined();
  });

  it("danh sách nguyên liệu rỗng → không kết quả", async () => {
    expect(await service.matchByIngredients([])).toEqual([]);
  });
});
