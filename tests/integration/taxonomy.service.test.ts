import { afterAll, beforeAll, describe, expect, it } from "vitest";

import type { Actor } from "@/lib/auth/authorization";
import type { Repositories } from "@/lib/db/repositories";
import { PrismaIngredientRepository } from "@/lib/db/repositories/prisma-ingredient.repository";
import { PrismaMediaRepository } from "@/lib/db/repositories/prisma-media.repository";
import { PrismaRecipeRepository } from "@/lib/db/repositories/prisma-recipe.repository";
import { PrismaTaxonomyRepository } from "@/lib/db/repositories/prisma-taxonomy.repository";
import { PrismaUnitRepository } from "@/lib/db/repositories/prisma-unit.repository";
import { ForbiddenError, ValidationError } from "@/lib/errors/app-error";
import { RecipeService } from "@/lib/services/recipe.service";
import { TaxonomyService } from "@/lib/services/taxonomy.service";
import { runSystemSeed } from "@/prisma/seed/run";

import { testDb, uniqueSlug } from "./helpers/db";

/**
 * P08 §P08.6 — Integration: CRUD taxonomy, gắn danh mục vào công thức, lọc theo
 * danh mục, và chặn xoá danh mục đang được sử dụng (giữ liên kết dữ liệu).
 *
 * Yêu cầu TEST_DATABASE_URL (xem `pnpm test:integration`).
 */
const deps: Repositories = {
  unit: new PrismaUnitRepository(testDb),
  taxonomy: new PrismaTaxonomyRepository(testDb),
  ingredient: new PrismaIngredientRepository(testDb),
  recipe: new PrismaRecipeRepository(testDb),
  media: new PrismaMediaRepository(testDb),
};
const taxonomyService = new TaxonomyService(deps);
const recipeService = new RecipeService(deps);

const createdRecipeIds: string[] = [];
const createdTermIds: string[] = [];
const createdUserIds: string[] = [];
const createdSourceIds: string[] = [];
const createdMediaIds: string[] = [];

let editor: Actor;
let admin: Actor;
let foodTypeSlug: string;
let cuisineSlug: string;
let sourceId: string;
let mediaAssetId: string;

function recipeInput(overrides: Record<string, unknown> = {}) {
  return {
    slug: uniqueSlug("tax-recipe"),
    locale: "vi",
    title: "Công thức phân loại",
    summary: "Mô tả ngắn cho công thức phân loại.",
    difficulty: "easy",
    baseServings: "2",
    prepMinutes: 10,
    cookMinutes: 20,
    totalMinutes: 30,
    foodTypeSlug,
    cuisineSlug,
    ingredients: [
      { displayName: "Nguyên liệu A", quantityType: "decimal", quantityNumeric: "100", unitCode: "g" },
    ],
    steps: [{ instruction: "Bước một." }],
    sourceIds: [sourceId],
    images: [{ mediaAssetId, role: "hero" }],
    ...overrides,
  };
}

beforeAll(async () => {
  await runSystemSeed(testDb);

  const author = await testDb.user.create({
    data: { name: "Taxonomy editor", email: `tax-${uniqueSlug("x")}@example.test`, role: "editor" },
    select: { id: true },
  });
  createdUserIds.push(author.id);
  editor = { id: author.id, role: "editor" };
  admin = { id: author.id, role: "admin" };

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

  const source = await testDb.contentSource.create({
    data: { name: "WALE COOKING (tự biên soạn, test taxonomy)" },
    select: { id: true },
  });
  sourceId = source.id;
  createdSourceIds.push(source.id);

  const media = await testDb.mediaAsset.create({
    data: {
      storageKey: uniqueSlug("media"),
      mimeType: "image/jpeg",
      sizeBytes: 1024,
      publicUrl: "https://cdn.test/tax.jpg",
    },
    select: { id: true },
  });
  mediaAssetId = media.id;
  createdMediaIds.push(media.id);
});

afterAll(async () => {
  await testDb.recipe.deleteMany({ where: { id: { in: createdRecipeIds } } });
  await testDb.taxonomyTerm.deleteMany({ where: { id: { in: createdTermIds } } });
  await testDb.contentSource.deleteMany({ where: { id: { in: createdSourceIds } } });
  await testDb.mediaAsset.deleteMany({ where: { id: { in: createdMediaIds } } });
  await testDb.user.deleteMany({ where: { id: { in: createdUserIds } } });
});

async function createMealTypeTerm(name = "Bữa thử nghiệm"): Promise<{ id: string; slug: string }> {
  const term = await taxonomyService.createTerm(admin, {
    typeCode: "meal_type",
    slug: uniqueSlug("bua"),
    name,
  });
  createdTermIds.push(term.id);
  return { id: term.id, slug: term.slug };
}

describe("P08 — CRUD taxonomy (tích hợp)", () => {
  it("admin tạo term; editor bị từ chối", async () => {
    await expect(
      taxonomyService.createTerm(editor, { typeCode: "meal_type", slug: uniqueSlug("bua"), name: "X" }),
    ).rejects.toBeInstanceOf(ForbiddenError);

    const term = await createMealTypeTerm("Bữa sáng test");
    expect(term.slug).toContain("bua");

    const { terms } = await taxonomyService.listTypeTerms("meal_type");
    expect(terms.some((t) => t.id === term.id && t.name === "Bữa sáng test")).toBe(true);
  });

  it("cập nhật tên term và lưu trữ/khôi phục", async () => {
    const term = await createMealTypeTerm("Tên gốc");

    const updated = await taxonomyService.updateTerm(admin, term.id, { name: "Tên đã sửa" });
    expect(updated.name).toBe("Tên đã sửa");

    await taxonomyService.archiveTerm(admin, term.id);
    const publicTerms = await taxonomyService.listTypeTerms("meal_type");
    expect(publicTerms.terms.some((t) => t.id === term.id)).toBe(false);

    const adminTerms = await taxonomyService.listTermsForAdmin(admin, "meal_type");
    expect(adminTerms.terms.some((t) => t.id === term.id && t.isActive === false)).toBe(true);

    await taxonomyService.restoreTerm(admin, term.id);
    const restored = await taxonomyService.listTypeTerms("meal_type");
    expect(restored.terms.some((t) => t.id === term.id)).toBe(true);
  });

  it("danh mục cha/con: chi tiết trả về term con; chặn xoá khi còn con", async () => {
    const parent = await taxonomyService.createTerm(admin, {
      typeCode: "ingredient_category",
      slug: uniqueSlug("nhom"),
      name: "Nhóm cha",
    });
    createdTermIds.push(parent.id);
    const child = await taxonomyService.createTerm(admin, {
      typeCode: "ingredient_category",
      slug: uniqueSlug("con"),
      name: "Nhóm con",
      parentSlug: parent.slug,
    });
    createdTermIds.push(child.id);

    const detail = await taxonomyService.getCategoryBySegment("nguyen-lieu", parent.slug);
    expect(detail.children.map((t) => t.id)).toEqual([child.id]);

    await expect(taxonomyService.deleteTerm(admin, parent.id)).rejects.toBeInstanceOf(ValidationError);

    // Xoá con trước, sau đó xoá cha thành công.
    await taxonomyService.deleteTerm(admin, child.id);
    await expect(taxonomyService.deleteTerm(admin, parent.id)).resolves.toBeUndefined();
  });
});

describe("P08 — Gắn danh mục vào công thức & lọc (tích hợp)", () => {
  it("công thức published hiển thị theo danh mục; chặn xoá term đang dùng", async () => {
    const term = await createMealTypeTerm("Bữa cho công thức");

    const created = await recipeService.create(
      editor,
      recipeInput({ taxonomyTerms: [{ typeCode: "meal_type", slug: term.slug }] }),
    );
    createdRecipeIds.push(created.id);
    const published = await recipeService.publish(editor, created.id);
    expect(published.status).toBe("published");

    // Lọc công thức công khai theo term (filterKind `direct`).
    const page = await recipeService.listPublicForCategory({
      typeCode: "meal_type",
      slug: term.slug,
      filterKind: "direct",
    });
    expect(page.items.some((item) => item.id === created.id)).toBe(true);

    // Trang danh mục chi tiết đếm đúng số công thức.
    const detail = await taxonomyService.getCategoryBySegment("bua-an", term.slug);
    expect(detail.term.recipeCount).toBeGreaterThanOrEqual(1);

    // Không xoá được khi còn công thức sử dụng.
    await expect(taxonomyService.deleteTerm(admin, term.id)).rejects.toBeInstanceOf(ValidationError);
  });

  it("xoá công thức xong mới xoá được danh mục", async () => {
    const term = await createMealTypeTerm("Bữa xoá được");
    const created = await recipeService.create(
      editor,
      recipeInput({ taxonomyTerms: [{ typeCode: "meal_type", slug: term.slug }] }),
    );
    createdRecipeIds.push(created.id);
    await recipeService.publish(editor, created.id);

    await expect(taxonomyService.deleteTerm(admin, term.id)).rejects.toBeInstanceOf(ValidationError);

    await testDb.recipe.deleteMany({ where: { id: created.id } });
    await expect(taxonomyService.deleteTerm(admin, term.id)).resolves.toBeUndefined();
  });
});
