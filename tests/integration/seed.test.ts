import { describe, expect, it } from "vitest";

import { runSystemSeed } from "@/prisma/seed/run";

import { testDb } from "./helpers/db";

async function snapshot() {
  const [taxonomyTypes, taxonomyTerms, units, conversions, equipment, ingredients, sources] =
    await Promise.all([
      testDb.taxonomyType.count(),
      testDb.taxonomyTerm.count(),
      testDb.unit.count(),
      testDb.unitConversion.count(),
      testDb.equipment.count(),
      testDb.ingredient.count(),
      testDb.contentSource.count(),
    ]);
  return { taxonomyTypes, taxonomyTerms, units, conversions, equipment, ingredients, sources };
}

describe("P06 — seed hệ thống", () => {
  it("tạo đủ dữ liệu hệ thống tối thiểu", async () => {
    await runSystemSeed(testDb);
    const counts = await snapshot();
    expect(counts.taxonomyTypes).toBe(9);
    expect(counts.taxonomyTerms).toBeGreaterThanOrEqual(80);
    expect(counts.units).toBeGreaterThanOrEqual(20);
    expect(counts.conversions).toBeGreaterThanOrEqual(5);
    expect(counts.equipment).toBeGreaterThanOrEqual(10);
    expect(counts.ingredients).toBeGreaterThanOrEqual(40);
    expect(counts.sources).toBeGreaterThanOrEqual(1);
  });

  it("idempotent: chạy lần hai không tăng số bản ghi", async () => {
    await runSystemSeed(testDb);
    const before = await snapshot();
    await runSystemSeed(testDb);
    const after = await snapshot();
    expect(after).toEqual(before);
  });

  it("có bản dịch tiếng Việt và tiếng Anh cho term/đơn vị", async () => {
    await runSystemSeed(testDb);
    const viCount = await testDb.taxonomyTermTranslation.count({ where: { locale: "vi" } });
    const enCount = await testDb.taxonomyTermTranslation.count({ where: { locale: "en" } });
    expect(viCount).toBeGreaterThan(0);
    expect(viCount).toBe(enCount);

    const unitVi = await testDb.unitTranslation.count({ where: { locale: "vi" } });
    const unitEn = await testDb.unitTranslation.count({ where: { locale: "en" } });
    expect(unitVi).toBe(unitEn);
  });
});
