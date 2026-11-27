import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { PrismaIngredientRepository } from "@/lib/db/repositories/prisma-ingredient.repository";
import { PrismaMediaRepository } from "@/lib/db/repositories/prisma-media.repository";
import { PrismaRecipeRepository } from "@/lib/db/repositories/prisma-recipe.repository";
import { PrismaTaxonomyRepository } from "@/lib/db/repositories/prisma-taxonomy.repository";
import { PrismaUnitRepository } from "@/lib/db/repositories/prisma-unit.repository";
import type { Repositories } from "@/lib/db/repositories";
import type { Actor } from "@/lib/auth/authorization";
import { ForbiddenError, NotFoundError, UnauthorizedError, ValidationError } from "@/lib/errors/app-error";
import { RecipeService } from "@/lib/services/recipe.service";
import type { RecipeDetailDto } from "@/lib/db/repositories/recipe.repository";
import { runSystemSeed } from "@/prisma/seed/run";

import { testDb, uniqueSlug } from "./helpers/db";

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
let user: Actor;
let admin: Actor;
let foodTypeSlug: string;
let cuisineSlug: string;

function createInput(overrides: Record<string, unknown> = {}) {
  return {
    slug: uniqueSlug("service-recipe"),
    locale: "vi",
    title: "Công thức dịch vụ",
    summary: "Mô tả ngắn cho công thức dịch vụ.",
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
    ...overrides,
  };
}

beforeAll(async () => {
  await runSystemSeed(testDb);

  const [editorRow, userRow, adminRow] = await Promise.all([
    testDb.user.create({
      data: { name: "Editor", email: `svc-editor-${uniqueSlug("x")}@example.test`, role: "editor" },
      select: { id: true },
    }),
    testDb.user.create({
      data: { name: "User", email: `svc-user-${uniqueSlug("x")}@example.test`, role: "user" },
      select: { id: true },
    }),
    testDb.user.create({
      data: { name: "Admin", email: `svc-admin-${uniqueSlug("x")}@example.test`, role: "admin" },
      select: { id: true },
    }),
  ]);
  createdUserIds.push(editorRow.id, userRow.id, adminRow.id);
  editor = { id: editorRow.id, role: "editor" };
  user = { id: userRow.id, role: "user" };
  admin = { id: adminRow.id, role: "admin" };

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
    data: { name: "WALE COOKING (tự biên soạn, test)" },
    select: { id: true },
  });
  sourceId = source.id;

  const media = await testDb.mediaAsset.create({
    data: { storageKey: uniqueSlug("media"), mimeType: "image/jpeg", sizeBytes: 1024, publicUrl: "https://cdn.test/x.jpg" },
    select: { id: true },
  });
  mediaAssetId = media.id;
});

afterAll(async () => {
  await testDb.recipe.deleteMany({ where: { id: { in: createdRecipeIds } } });
  await testDb.contentSource.deleteMany({ where: { id: sourceId } });
  await testDb.mediaAsset.deleteMany({ where: { id: mediaAssetId } });
  await testDb.user.deleteMany({ where: { id: { in: createdUserIds } } });
});

describe("P07 — RecipeService: authorization khi tạo", () => {
  it("guest bị từ chối (401)", async () => {
    await expect(service.create(null, createInput())).rejects.toBeInstanceOf(UnauthorizedError);
  });

  it("user (không phải editor) bị từ chối (403)", async () => {
    await expect(service.create(user, createInput())).rejects.toBeInstanceOf(ForbiddenError);
  });

  it("editor tạo công thức ở trạng thái draft", async () => {
    const detail = await service.create(editor, createInput());
    createdRecipeIds.push(detail.id);
    expect(detail.status).toBe("draft");
    expect(detail.authorId).toBe(editor.id);
  });

  it("từ chối slug trùng (ValidationError)", async () => {
    const created = await service.create(editor, createInput({ slug: uniqueSlug("dup") }));
    createdRecipeIds.push(created.id);
    await expect(service.create(editor, createInput({ slug: created.slug }))).rejects.toBeInstanceOf(ValidationError);
  });

  it("từ chối dữ liệu sai (thiếu tiêu đề) — ValidationError", async () => {
    await expect(service.create(editor, createInput({ title: "" }))).rejects.toBeInstanceOf(ValidationError);
  });
});

describe("P07 — RecipeService: đọc công khai", () => {
  it("draft KHÔNG truy cập được công khai (404)", async () => {
    const detail = await service.create(editor, createInput());
    createdRecipeIds.push(detail.id);
    await expect(service.getPublicBySlug(detail.slug)).rejects.toBeInstanceOf(NotFoundError);
  });

  it("công thức published truy cập được công khai", async () => {
    const detail = await service.create(
      editor,
      createInput({
        sourceIds: [sourceId],
        images: [{ mediaAssetId, role: "hero" }],
      }),
    );
    createdRecipeIds.push(detail.id);
    const published = await service.publish(editor, detail.id);
    expect(published.status).toBe("published");

    const publicDetail = await service.getPublicBySlug(detail.slug);
    expect(publicDetail.status).toBe("published");
  });
});

describe("P07 — RecipeService: workflow trạng thái", () => {
  it("submitForReview: user bị từ chối, editor thành công", async () => {
    const detail = await service.create(editor, createInput());
    createdRecipeIds.push(detail.id);

    await expect(service.submitForReview(user, detail.id)).rejects.toBeInstanceOf(ForbiddenError);
    const reviewed = await service.submitForReview(editor, detail.id);
    expect(reviewed.status).toBe("in_review");
  });

  it("publish thiếu điều kiện BR-01 → ValidationError kèm chi tiết", async () => {
    // Không có nguồn và ảnh đại diện.
    const detail = await service.create(editor, createInput());
    createdRecipeIds.push(detail.id);
    await expect(service.publish(editor, detail.id)).rejects.toBeInstanceOf(ValidationError);
  });

  it("archive ẩn khỏi danh sách công khai", async () => {
    const detail = await service.create(
      editor,
      createInput({ sourceIds: [sourceId], images: [{ mediaAssetId, role: "hero" }] }),
    );
    createdRecipeIds.push(detail.id);
    await service.publish(editor, detail.id);
    const archived = await service.archive(editor, detail.id);
    expect(archived.status).toBe("archived");
    await expect(service.getPublicBySlug(detail.slug)).rejects.toBeInstanceOf(NotFoundError);
  });

  it("remove: editor không có quyền xóa (403), admin xóa mềm thành công", async () => {
    const detail = await service.create(editor, createInput());
    createdRecipeIds.push(detail.id);
    await expect(service.remove(editor, detail.id)).rejects.toBeInstanceOf(ForbiddenError);
    await expect(service.remove(admin, detail.id)).resolves.toBeUndefined();
  });
});

describe("P07 — RecipeService: danh sách quản trị", () => {
  it("guest không xem được danh sách nháp (401)", async () => {
    await expect(service.listAdmin(null, {})).rejects.toBeInstanceOf(UnauthorizedError);
  });

  it("editor xem được danh sách quản trị", async () => {
    const page = await service.listAdmin(editor, { page: "1", pageSize: "5" });
    expect(page.pageSize).toBe(5);
    expect(Array.isArray(page.items)).toBe(true);
  });

  it("getAdminDetail trả về bản ghi theo id", async () => {
    const detail = await service.create(editor, createInput());
    createdRecipeIds.push(detail.id);
    const fetched: RecipeDetailDto = await service.getAdminDetail(editor, detail.id);
    expect(fetched.id).toBe(detail.id);
  });
});
