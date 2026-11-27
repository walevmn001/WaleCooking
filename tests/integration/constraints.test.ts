import { Prisma } from "@prisma/client";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { PrismaIngredientRepository } from "@/lib/db/repositories/prisma-ingredient.repository";
import { PrismaTaxonomyRepository } from "@/lib/db/repositories/prisma-taxonomy.repository";
import { ConflictError } from "@/lib/errors/app-error";
import { runSystemSeed } from "@/prisma/seed/run";

import { testDb, uniqueSlug } from "./helpers/db";

const taxonomyRepo = new PrismaTaxonomyRepository(testDb);
const ingredientRepo = new PrismaIngredientRepository(testDb);

const createdTermIds: string[] = [];
const createdSlugs: string[] = [];

beforeAll(async () => {
  await runSystemSeed(testDb);
});

afterAll(async () => {
  if (createdSlugs.length > 0) {
    await testDb.ingredient.deleteMany({ where: { slug: { in: createdSlugs } } });
  }
  if (createdTermIds.length > 0) {
    await testDb.taxonomyTerm.deleteMany({ where: { id: { in: createdTermIds } } });
  }
});

describe("P06 — ràng buộc duy nhất (unique constraint)", () => {
  it("ingredient.slug là duy nhất → ném ConflictError", async () => {
    const slug = uniqueSlug("unique-ingredient");
    createdSlugs.push(slug);
    await ingredientRepo.createWithTranslation({ slug, name: "Duy nhất", locale: "vi" });

    await expect(
      ingredientRepo.createWithTranslation({ slug, name: "Trùng slug", locale: "vi" }),
    ).rejects.toBeInstanceOf(ConflictError);
  });

  it("taxonomy_terms(type, slug) là duy nhất → vi phạm P2002", async () => {
    const slug = uniqueSlug("dup-term");
    const first = await taxonomyRepo.createTerm({ typeCode: "cuisine", slug, name: "Trùng", locale: "vi" });
    createdTermIds.push(first.id);

    await expect(
      taxonomyRepo.createTerm({ typeCode: "cuisine", slug, name: "Trùng lần 2", locale: "vi" }),
    ).rejects.toMatchObject({ code: "P2002" });
  });

  it("unit.code là duy nhất", async () => {
    await expect(
      testDb.unit.create({ data: { code: "g", dimension: "mass" } }),
    ).rejects.toBeInstanceOf(Prisma.PrismaClientKnownRequestError);
  });
});

describe("P06 — toàn vẹn tham chiếu (FK RESTRICT)", () => {
  it("không xóa được taxonomy term đang được nguyên liệu tham chiếu", async () => {
    const term = await taxonomyRepo.findTerm("ingredient_category", "seafood", "vi");
    expect(term).toBeTruthy();

    await expect(testDb.taxonomyTerm.delete({ where: { id: term!.id } })).rejects.toBeInstanceOf(
      Prisma.PrismaClientKnownRequestError,
    );
  });

  it("không xóa được taxonomy type khi còn term con", async () => {
    const type = await taxonomyRepo.findType("cuisine");
    expect(type).toBeTruthy();
    await expect(testDb.taxonomyType.delete({ where: { id: type!.id } })).rejects.toBeInstanceOf(
      Prisma.PrismaClientKnownRequestError,
    );
  });

  it("không tạo nguyên liệu với category term không tồn tại (FK)", async () => {
    const slug = uniqueSlug("bad-fk");
    await expect(
      testDb.ingredient.create({
        data: {
          slug,
          categoryTermId: "00000000-0000-0000-0000-000000000000",
        },
      }),
    ).rejects.toBeInstanceOf(Prisma.PrismaClientKnownRequestError);

    const found = await testDb.ingredient.findUnique({ where: { slug } });
    expect(found).toBeNull();
  });
});
