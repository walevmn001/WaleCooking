import type { PrismaClient } from "@prisma/client";

import {
  equipment as equipmentSeed,
  ingredients as ingredientSeed,
  taxonomyTypes as taxonomyTypeSeed,
  unitConversions as unitConversionSeed,
  units as unitSeed,
} from "./data";

/**
 * Logic seed (tách khỏi CLI để có thể kiểm thử bằng PrismaClient của test DB).
 *
 * Idempotent: dùng `upsert` theo khóa duy nhất.
 * Phân tách: SEED HỆ THỐNG vs DỮ LIỆU PHÁT TRIỂN.
 */

const LOCALE_VI = "vi";
const LOCALE_EN = "en";

export async function runSystemSeed(prisma: PrismaClient, log: (msg: string) => void = () => {}): Promise<void> {
  log("[seed:system] bắt đầu…");
  await seedTaxonomy(prisma);
  await seedUnits(prisma);
  await seedEquipment(prisma);
  await seedIngredients(prisma);
  await seedSystemSource(prisma);
  log("[seed:system] hoàn tất.");
}

export async function runDevSeed(prisma: PrismaClient, log: (msg: string) => void = () => {}): Promise<void> {
  const email = "dev-editor@wale.invalid";
  const user = await prisma.user.upsert({
    where: { email },
    update: { role: "editor", name: "Dev Editor (seed)" },
    create: { email, name: "Dev Editor (seed)", role: "editor", preferredLocale: LOCALE_VI },
  });
  log(`[seed:dev] tài khoản tác giả dev: ${user.id}`);
}

async function seedTaxonomy(prisma: PrismaClient): Promise<void> {
  for (const type of taxonomyTypeSeed) {
    const taxonomyType = await prisma.taxonomyType.upsert({
      where: { code: type.code },
      update: {
        isHierarchical: type.isHierarchical ?? false,
        isMultiSelect: type.isMultiSelect ?? false,
        isRequired: type.isRequired ?? false,
        sortOrder: type.sortOrder,
        isActive: true,
      },
      create: {
        code: type.code,
        isHierarchical: type.isHierarchical ?? false,
        isMultiSelect: type.isMultiSelect ?? false,
        isRequired: type.isRequired ?? false,
        sortOrder: type.sortOrder,
      },
    });

    for (const term of type.terms) {
      const stored = await prisma.taxonomyTerm.upsert({
        where: { taxonomyTypeId_slug: { taxonomyTypeId: taxonomyType.id, slug: term.slug } },
        update: { icon: term.icon ?? null, sortOrder: term.sortOrder ?? 0, isActive: true },
        create: {
          taxonomyTypeId: taxonomyType.id,
          slug: term.slug,
          icon: term.icon ?? null,
          sortOrder: term.sortOrder ?? 0,
        },
      });

      await prisma.taxonomyTermTranslation.upsert({
        where: { termId_locale: { termId: stored.id, locale: LOCALE_VI } },
        update: { name: term.vi },
        create: { termId: stored.id, locale: LOCALE_VI, name: term.vi },
      });
      await prisma.taxonomyTermTranslation.upsert({
        where: { termId_locale: { termId: stored.id, locale: LOCALE_EN } },
        update: { name: term.en },
        create: { termId: stored.id, locale: LOCALE_EN, name: term.en },
      });

      for (const alias of term.aliases ?? []) {
        await prisma.taxonomyTermAlias.upsert({
          where: { termId_alias_locale: { termId: stored.id, alias, locale: LOCALE_VI } },
          update: {},
          create: { termId: stored.id, alias, locale: LOCALE_VI },
        });
      }
    }
  }
}

async function seedUnits(prisma: PrismaClient): Promise<void> {
  const codeToId = new Map<string, string>();

  for (const unit of unitSeed) {
    const stored = await prisma.unit.upsert({
      where: { code: unit.code },
      update: { dimension: unit.dimension, isBase: unit.isBase ?? false, sortOrder: unit.sortOrder },
      create: {
        code: unit.code,
        dimension: unit.dimension,
        isBase: unit.isBase ?? false,
        sortOrder: unit.sortOrder,
      },
    });
    codeToId.set(unit.code, stored.id);

    await prisma.unitTranslation.upsert({
      where: { unitId_locale: { unitId: stored.id, locale: LOCALE_VI } },
      update: { name: unit.vi, symbol: unit.viSymbol ?? null },
      create: { unitId: stored.id, locale: LOCALE_VI, name: unit.vi, symbol: unit.viSymbol ?? null },
    });
    await prisma.unitTranslation.upsert({
      where: { unitId_locale: { unitId: stored.id, locale: LOCALE_EN } },
      update: { name: unit.en, symbol: unit.enSymbol ?? null },
      create: { unitId: stored.id, locale: LOCALE_EN, name: unit.en, symbol: unit.enSymbol ?? null },
    });
  }

  for (const conversion of unitConversionSeed) {
    const fromUnitId = codeToId.get(conversion.from);
    const toUnitId = codeToId.get(conversion.to);
    if (!fromUnitId || !toUnitId) {
      throw new Error(`[seed] Thiếu đơn vị cho quy đổi ${conversion.from} → ${conversion.to}`);
    }
    await prisma.unitConversion.upsert({
      where: { fromUnitId_toUnitId: { fromUnitId, toUnitId } },
      update: { factor: conversion.factor },
      create: { fromUnitId, toUnitId, factor: conversion.factor },
    });
  }
}

async function seedEquipment(prisma: PrismaClient): Promise<void> {
  for (const item of equipmentSeed) {
    const stored = await prisma.equipment.upsert({
      where: { slug: item.slug },
      update: { name: item.vi, icon: item.icon ?? null, isActive: true },
      create: { slug: item.slug, name: item.vi, icon: item.icon ?? null },
    });
    await prisma.equipmentTranslation.upsert({
      where: { equipmentId_locale: { equipmentId: stored.id, locale: LOCALE_VI } },
      update: { name: item.vi },
      create: { equipmentId: stored.id, locale: LOCALE_VI, name: item.vi },
    });
    await prisma.equipmentTranslation.upsert({
      where: { equipmentId_locale: { equipmentId: stored.id, locale: LOCALE_EN } },
      update: { name: item.en },
      create: { equipmentId: stored.id, locale: LOCALE_EN, name: item.en },
    });
  }
}

async function seedIngredients(prisma: PrismaClient): Promise<void> {
  const categoryType = await prisma.taxonomyType.findUnique({ where: { code: "ingredient_category" } });
  if (!categoryType) throw new Error("[seed] Không tìm thấy taxonomy type `ingredient_category`");
  const terms = await prisma.taxonomyTerm.findMany({ where: { taxonomyTypeId: categoryType.id } });
  const categoryIdBySlug = new Map(terms.map((t) => [t.slug, t.id]));

  for (const item of ingredientSeed) {
    const categoryTermId = categoryIdBySlug.get(item.category);
    if (!categoryTermId) {
      throw new Error(`[seed] Nguyên liệu ${item.slug}: không có category term \`${item.category}\``);
    }
    const stored = await prisma.ingredient.upsert({
      where: { slug: item.slug },
      update: { categoryTermId, isCommon: item.isCommon ?? false },
      create: { slug: item.slug, categoryTermId, isCommon: item.isCommon ?? false },
    });
    await prisma.ingredientTranslation.upsert({
      where: { ingredientId_locale: { ingredientId: stored.id, locale: LOCALE_VI } },
      update: { name: item.vi },
      create: { ingredientId: stored.id, locale: LOCALE_VI, name: item.vi },
    });
    await prisma.ingredientTranslation.upsert({
      where: { ingredientId_locale: { ingredientId: stored.id, locale: LOCALE_EN } },
      update: { name: item.en },
      create: { ingredientId: stored.id, locale: LOCALE_EN, name: item.en },
    });
  }
}

/** Nguồn nội dung hệ thống (tự biên soạn) — phục vụ truy xuất nguồn ở P07. */
async function seedSystemSource(prisma: PrismaClient): Promise<void> {
  const name = "WALE COOKING (tự biên soạn)";
  const existing = await prisma.contentSource.findFirst({ where: { name } });
  if (existing) return;
  await prisma.contentSource.create({
    data: {
      name,
      authorOrOrg: "WALE COOKING",
      license: "Bản quyền WALE COOKING",
      usageConditions: "Nội dung do WALE COOKING tự biên soạn.",
      verifiedStatus: "verified",
      verifiedAt: new Date(),
      copyrightNote: "© WALE COOKING",
    },
  });
}
