import type { PrismaClient } from "@prisma/client";

import type { UnitConversionDto, UnitDto, UnitRepository } from "./unit.repository";

/** Triển khai Prisma cho `UnitRepository`. */
export class PrismaUnitRepository implements UnitRepository {
  constructor(private readonly db: PrismaClient) {}

  async list(locale: string): Promise<UnitDto[]> {
    const rows = await this.db.unit.findMany({
      orderBy: { sortOrder: "asc" },
      include: { translations: { where: { locale } } },
    });
    return rows.map((row) => ({
      id: row.id,
      code: row.code,
      dimension: row.dimension,
      isBase: row.isBase,
      sortOrder: row.sortOrder,
      name: row.translations[0]?.name ?? row.code,
      symbol: row.translations[0]?.symbol ?? null,
    }));
  }

  async findByCode(code: string, locale: string): Promise<UnitDto | null> {
    const row = await this.db.unit.findUnique({
      where: { code },
      include: { translations: { where: { locale } } },
    });
    if (!row) return null;
    return {
      id: row.id,
      code: row.code,
      dimension: row.dimension,
      isBase: row.isBase,
      sortOrder: row.sortOrder,
      name: row.translations[0]?.name ?? row.code,
      symbol: row.translations[0]?.symbol ?? null,
    };
  }

  async exists(code: string): Promise<boolean> {
    const found = await this.db.unit.findUnique({ where: { code }, select: { id: true } });
    return found !== null;
  }

  async listConversionsFrom(fromCode: string): Promise<UnitConversionDto[]> {
    const rows = await this.db.unitConversion.findMany({
      where: { fromUnit: { code: fromCode } },
      include: { toUnit: { select: { code: true } } },
    });
    return rows.map((row) => ({ toUnitCode: row.toUnit.code, factor: row.factor.toString() }));
  }
}
