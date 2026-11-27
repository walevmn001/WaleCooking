import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { PrismaRecipeRepository } from "@/lib/db/repositories/prisma-recipe.repository";
import { runSystemSeed } from "@/prisma/seed/run";

import { testDb, uniqueSlug } from "./helpers/db";

const repo = new PrismaRecipeRepository(testDb);

let authorId: string;
let foodTypeSlug: string;
let cuisineSlug: string;
let allergenSlug: string;
let sourceId: string;

const createdRecipeIds: string[] = [];

/** Tạo công thức tối thiểu để kiểm thử, trả về id. */
async function createRecipe(overrides: Partial<Parameters<PrismaRecipeRepository["create"]>[0]> = {}) {
  const id = await repo.create({
    slug: uniqueSlug("recipe"),
    authorId,
    defaultLocale: "vi",
    title: "Công thức thử nghiệm",
    difficulty: "easy",
    baseServings: "4",
    foodTypeSlug,
    cuisineSlug,
    ingredients: [
      { displayName: "Nguyên liệu A", quantityType: "decimal", quantityNumeric: "200", unitCode: "g", sortOrder: 1 },
      { displayName: "Nguyên liệu B", quantityType: "decimal", quantityNumeric: "0.500", unitCode: "l", sortOrder: 0 },
    ],
    steps: [
      { instruction: "Bước một.", sortOrder: 0 },
      { instruction: "Bước hai.", durationSeconds: 600, temperatureC: "180", sortOrder: 1 },
    ],
    ...overrides,
  });
  createdRecipeIds.push(id);
  return id;
}

beforeAll(async () => {
  await runSystemSeed(testDb);

  const author = await testDb.user.create({
    data: { name: "Biên tập viên test", email: `editor-${uniqueSlug("x")}@example.test`, role: "editor" },
    select: { id: true },
  });
  authorId = author.id;

  const foodType = await testDb.taxonomyTerm.findFirst({
    where: { type: { code: "food_type" } },
    select: { slug: true },
  });
  const cuisine = await testDb.taxonomyTerm.findFirst({
    where: { type: { code: "cuisine" } },
    select: { slug: true },
  });
  const allergen = await testDb.taxonomyTerm.findFirst({
    where: { type: { code: "allergen" } },
    select: { slug: true },
  });
  foodTypeSlug = foodType!.slug;
  cuisineSlug = cuisine!.slug;
  allergenSlug = allergen!.slug;

  const source = await testDb.contentSource.create({
    data: { name: "Nguồn thử nghiệm", authorOrOrg: "WALE COOKING (test)" },
    select: { id: true },
  });
  sourceId = source.id;
});

afterAll(async () => {
  await testDb.recipe.deleteMany({ where: { id: { in: createdRecipeIds } } });
  await testDb.contentSource.deleteMany({ where: { id: sourceId } });
  await testDb.user.deleteMany({ where: { id: authorId } });
});

describe("P07 — RecipeRepository: tạo & đọc chi tiết", () => {
  it("lưu và đọc lại công thức kèm quan hệ, giữ đúng thứ tự nguyên liệu/bước", async () => {
    const id = await createRecipe({
      allergenSlugs: [allergenSlug],
      sourceIds: [sourceId],
    });

    const detail = await repo.findDetailById(id, "vi");
    expect(detail).not.toBeNull();
    expect(detail!.title).toBe("Công thức thử nghiệm");
    expect(detail!.foodTypeSlug).toBe(foodTypeSlug);
    expect(detail!.cuisineSlug).toBe(cuisineSlug);
    expect(detail!.baseServings).toBe(4);
    expect(detail!.status).toBe("draft");

    // Thứ tự nguyên liệu theo sortOrder (B:0 trước A:1) và số lượng chính xác.
    expect(detail!.ingredients.map((i) => i.displayName)).toEqual(["Nguyên liệu B", "Nguyên liệu A"]);
    expect(Number(detail!.ingredients[0].quantityNumeric)).toBe(0.5);
    expect(detail!.ingredients[0].unitSymbol).toBe("l");

    // Thứ tự bước theo stepNo.
    expect(detail!.steps.map((s) => s.stepNo)).toEqual([1, 2]);
    expect(detail!.steps[1].timers[0].durationSeconds).toBe(600);

    // Quan hệ dị ứng + nguồn.
    expect(detail!.allergens.map((a) => a.slug)).toContain(allergenSlug);
    expect(detail!.sources.map((s) => s.id)).toContain(sourceId);
  });
});

describe("P07 — RecipeRepository: ràng buộc & transaction", () => {
  it("slugExists phản ánh đúng và chặn trùng slug (unique)", async () => {
    const slug = uniqueSlug("unique-slug");
    const id = await createRecipe({ slug });
    expect(await repo.slugExists(slug)).toBe(true);
    expect(await repo.slugExists(slug, id)).toBe(false);

    await expect(
      repo.create({
        slug,
        authorId,
        defaultLocale: "vi",
        title: "Trùng slug",
        difficulty: "easy",
        baseServings: "2",
        ingredients: [],
        steps: [],
      }),
    ).rejects.toBeTruthy();
  });

  it("rollback khi tham chiếu đơn vị không tồn tại — KHÔNG tạo công thức", async () => {
    const slug = uniqueSlug("rollback");
    await expect(
      repo.create({
        slug,
        authorId,
        defaultLocale: "vi",
        title: "Sẽ không tồn tại",
        difficulty: "easy",
        baseServings: "2",
        ingredients: [
          { displayName: "X", quantityType: "decimal", quantityNumeric: "1", unitCode: "khong-ton-tai" },
        ],
        steps: [{ instruction: "Bước." }],
      }),
    ).rejects.toBeTruthy();

    expect(await repo.slugExists(slug)).toBe(false);
  });
});

describe("P07 — RecipeRepository: cập nhật", () => {
  it("thay thế nguyên liệu và bước trong một transaction", async () => {
    const id = await createRecipe();
    await repo.update(id, {
      title: "Tên đã đổi",
      ingredients: [
        { displayName: "Chỉ còn một", quantityType: "text", quantityText: "vừa đủ", sortOrder: 0 },
      ],
      steps: [{ instruction: "Bước duy nhất.", sortOrder: 0 }],
    });

    const detail = await repo.findDetailById(id, "vi");
    expect(detail!.title).toBe("Tên đã đổi");
    expect(detail!.ingredients).toHaveLength(1);
    expect(detail!.ingredients[0].quantityText).toBe("vừa đủ");
    expect(detail!.steps).toHaveLength(1);
  });
});

describe("P07 — RecipeRepository: danh sách & lọc", () => {
  it("listPublic chỉ trả công thức 'published'", async () => {
    const id = await createRecipe({ title: "Công thức công khai" });
    await repo.setStatus(id, "published");

    const page = await repo.listPublic({ locale: "vi", pagination: { page: 1, pageSize: 50 } });
    expect(page.items.every((r) => r.publishedAt !== null)).toBe(true);
    const found = page.items.find((r) => r.id === id);
    expect(found).toBeTruthy();

    // Công thức draft khác KHÔNG xuất hiện.
    const draftId = await createRecipe({ title: "Bản nháp" });
    const page2 = await repo.listPublic({ locale: "vi", pagination: { page: 1, pageSize: 50 } });
    expect(page2.items.find((r) => r.id === draftId)).toBeUndefined();
  });

  it("lọc theo foodType và phân trang có totalPages", async () => {
    const page = await repo.listPublic({
      locale: "vi",
      pagination: { page: 1, pageSize: 1 },
      foodTypeSlug,
      sort: "newest",
    });
    expect(page.pageSize).toBe(1);
    expect(page.items.length).toBeLessThanOrEqual(1);
    expect(page.totalPages).toBeGreaterThanOrEqual(1);
  });

  it("listAdmin lọc theo trạng thái", async () => {
    const id = await createRecipe({ title: "Chờ duyệt" });
    await repo.setStatus(id, "in_review");

    const page = await repo.listAdmin({
      locale: "vi",
      pagination: { page: 1, pageSize: 50 },
      status: "in_review",
    });
    expect(page.items.every((r) => r.status === "in_review")).toBe(true);
    expect(page.items.find((r) => r.id === id)).toBeTruthy();
  });
});

describe("P07 — RecipeRepository: xóa mềm", () => {
  it("softDelete ẩn khỏi truy vấn công khai nhưng giữ dữ liệu", async () => {
    const id = await createRecipe({ title: "Sẽ bị xóa mềm" });
    await repo.setStatus(id, "published");
    await repo.softDelete(id);

    // Ẩn khỏi truy vấn thông thường (findDetailById lọc deletedAt=null).
    const detail = await repo.findDetailById(id, "vi");
    expect(detail).toBeNull();

    const page = await repo.listPublic({ locale: "vi", pagination: { page: 1, pageSize: 50 } });
    expect(page.items.find((r) => r.id === id)).toBeUndefined();

    // Nhưng dữ liệu vẫn được giữ: còn nguyên bản ghi, đã đánh dấu xóa mềm + archived.
    const row = await testDb.recipe.findUnique({
      where: { id },
      select: { deletedAt: true, status: true },
    });
    expect(row).not.toBeNull();
    expect(row!.deletedAt).not.toBeNull();
    expect(row!.status).toBe("archived");
  });
});
