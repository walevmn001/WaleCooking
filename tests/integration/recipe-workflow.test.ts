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
 * Kiểm thử luồng công thức end-to-end (P07.1 §7):
 * tạo draft → sửa → gửi duyệt → xuất bản (editor) → lưu trữ.
 *
 * Kiểm tra: trạng thái, quyền, dữ liệu nguyên liệu/bước được bảo toàn,
 * public visibility (draft/in_review không hiển thị công khai).
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
let sourceId: string;
let mediaAssetId: string;
let editor: Actor;
let foodTypeSlug: string;
let cuisineSlug: string;

function baseInput(overrides: Record<string, unknown> = {}) {
  return {
    slug: uniqueSlug("wf-recipe"),
    locale: "vi",
    title: "Công thức luồng E2E",
    summary: "Mô tả ngắn cho luồng E2E.",
    difficulty: "easy",
    baseServings: "2",
    prepMinutes: 5,
    cookMinutes: 15,
    totalMinutes: 20,
    foodTypeSlug,
    cuisineSlug,
    ingredients: [
      { displayName: "Nguyên liệu chính", quantityType: "decimal", quantityNumeric: "200", unitCode: "g" },
    ],
    steps: [{ instruction: "Bước một: chuẩn bị." }],
    sourceIds: [sourceId],
    images: [{ mediaAssetId, role: "hero", altText: "Ảnh đại diện" }],
    ...overrides,
  };
}

beforeAll(async () => {
  await runSystemSeed(testDb);

  const editorRow = await testDb.user.create({
    data: { name: "Editor WF", email: `wf-editor-${uniqueSlug("x")}@example.test`, role: "editor" },
    select: { id: true },
  });
  createdUserIds.push(editorRow.id);
  editor = { id: editorRow.id, role: "editor" };

  const foodType = await testDb.taxonomyTerm.findFirst({ where: { type: { code: "food_type" } }, select: { slug: true } });
  foodTypeSlug = foodType!.slug;
  const cuisine = await testDb.taxonomyTerm.findFirst({ where: { type: { code: "cuisine" } }, select: { slug: true } });
  cuisineSlug = cuisine!.slug;

  const source = await testDb.contentSource.findFirst({ select: { id: true } });
  sourceId = source!.id;

  const media = await testDb.mediaAsset.create({
    data: {
      storageKey: `test/${uniqueSlug("m")}.png`,
      mimeType: "image/png",
      sizeBytes: 1024,
      status: "active",
    },
    select: { id: true },
  });
  mediaAssetId = media.id;
});

afterAll(async () => {
  await testDb.recipe.deleteMany({ where: { id: { in: createdRecipeIds } } });
  await testDb.mediaAsset.deleteMany({ where: { id: mediaAssetId } });
  await testDb.user.deleteMany({ where: { id: { in: createdUserIds } } });
});

describe("Recipe workflow E2E", () => {
  it("tạo công thức → trạng thái draft", async () => {
    const detail = await service.create(editor, baseInput());
    expect(detail.status).toBe("draft");
    expect(detail.ingredients).toHaveLength(1);
    expect(detail.steps).toHaveLength(1);
    createdRecipeIds.push(detail.id);
  });

  it("draft KHÔNG hiển thị ở danh sách công khai", async () => {
    const list = await service.listPublic({ q: "luồng E2E" });
    expect(list.items.length).toBe(0);
  });

  it("gửi duyệt → in_review, vẫn KHÔNG công khai", async () => {
    const id = createdRecipeIds[0];
    const detail = await service.submitForReview(editor, id);
    expect(detail.status).toBe("in_review");
    const list = await service.listPublic({ q: "luồng E2E" });
    expect(list.items.length).toBe(0);
  });

  it("editor được phép xuất bản (editor có recipe:publish)", async () => {
    const id = createdRecipeIds[0];
    const detail = await service.publish(editor, id, { reason: "Xuất bản lần đầu" });
    expect(detail.status).toBe("published");
    expect(detail.primaryImage).not.toBeNull();
  });

  it("published hiển thị ở danh sách công khai", async () => {
    const list = await service.listPublic({ q: "luồng E2E" });
    expect(list.items.length).toBeGreaterThanOrEqual(1);
    expect(list.items.some((r) => r.title.includes("luồng E2E"))).toBe(true);
  });

  it("lưu trữ → archived, ẩn khỏi công khai", async () => {
    const id = createdRecipeIds[0];
    const detail = await service.archive(editor, id, { reason: "Lưu trữ" });
    expect(detail.status).toBe("archived");
    const list = await service.listPublic({ q: "luồng E2E" });
    expect(list.items.length).toBe(0);
  });

  it("guest (null) KHÔNG được tạo công thức → 401", async () => {
    await expect(service.create(null, baseInput())).rejects.toThrow(
      /đăng nhập/,
    );
  });

  it("guest KHÔNG được xuất bản → 401", async () => {
    const id = createdRecipeIds[0];
    await expect(service.publish(null, id)).rejects.toThrow(/đăng nhập/);
  });
});
