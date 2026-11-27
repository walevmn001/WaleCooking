import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { PrismaIngredientRepository } from "@/lib/db/repositories/prisma-ingredient.repository";
import { runSystemSeed } from "@/prisma/seed/run";

import { testDb, uniqueSlug } from "./helpers/db";

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

describe("P06 — transaction", () => {
  it("rollback khi có lỗi giữa transaction (không để dữ liệu nửa vời)", async () => {
    const slug = uniqueSlug("tx-rollback");
    createdSlugs.push(slug);

    await expect(
      testDb.$transaction(async (tx) => {
        await tx.ingredient.create({ data: { slug } });
        throw new Error("lỗi cố ý để kiểm thử rollback");
      }),
    ).rejects.toThrow("lỗi cố ý");

    const found = await testDb.ingredient.findUnique({ where: { slug } });
    expect(found).toBeNull();
  });

  it("commit khi transaction thành công", async () => {
    const slug = uniqueSlug("tx-commit");
    createdSlugs.push(slug);

    await testDb.$transaction(async (tx) => {
      await tx.ingredient.create({
        data: { slug, translations: { create: { locale: "vi", name: "Commit OK" } } },
      });
    });

    const found = await testDb.ingredient.findUnique({
      where: { slug },
      include: { translations: true },
    });
    expect(found?.translations).toHaveLength(1);
  });

  it("createWithTranslation atomic: FK sai → không tạo bản ghi nào", async () => {
    const slug = uniqueSlug("tx-atomic");
    createdSlugs.push(slug);

    await expect(
      ingredientRepo.createWithTranslation({
        slug,
        name: "FK sai",
        locale: "vi",
        categoryTermId: "00000000-0000-0000-0000-000000000000",
      }),
    ).rejects.toBeTruthy();

    const found = await testDb.ingredient.findUnique({ where: { slug } });
    expect(found).toBeNull();
  });
});
