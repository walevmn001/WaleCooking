import type { PrismaClient } from "@prisma/client";

import { NotFoundError } from "@/lib/errors/app-error";
import type {
  CreateTermInput,
  ListTermsOptions,
  TaxonomyRepository,
  TaxonomyTermDto,
  TaxonomyTermWithCountDto,
  TaxonomyTypeDto,
  UpdateTermInput,
} from "./taxonomy.repository";

/** Bộ lọc mô tả liên kết công thức ↔ term (dùng cho đếm và kiểm tra đang dùng). */
function recipeLinkedToTerm(termId: string) {
  return {
    OR: [
      { foodTypeTermId: termId },
      { cuisineTermId: termId },
      { taxonomyTerms: { some: { taxonomyTermId: termId } } },
    ],
  };
}

/** Triển khai Prisma cho `TaxonomyRepository`. */
export class PrismaTaxonomyRepository implements TaxonomyRepository {
  constructor(private readonly db: PrismaClient) {}

  async listTypes(): Promise<TaxonomyTypeDto[]> {
    const rows = await this.db.taxonomyType.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
    });
    return rows.map(toTypeDto);
  }

  async findType(code: string): Promise<TaxonomyTypeDto | null> {
    const row = await this.db.taxonomyType.findUnique({ where: { code } });
    return row ? toTypeDto(row) : null;
  }

  async listTerms(
    typeCode: string,
    locale: string,
    options: ListTermsOptions = {},
  ): Promise<TaxonomyTermDto[]> {
    const rows = await this.db.taxonomyTerm.findMany({
      where: {
        type: { code: typeCode },
        ...(options.includeInactive ? {} : { isActive: true }),
        ...(options.parentSlug !== undefined
          ? options.parentSlug === null
            ? { parentId: null }
            : { parent: { slug: options.parentSlug } }
          : {}),
      },
      orderBy: { sortOrder: "asc" },
      include: { translations: { where: { locale } } },
    });
    return rows.map((row) => this.toDto(row, typeCode));
  }

  async listTermsWithCounts(
    typeCode: string,
    locale: string,
    options: ListTermsOptions = {},
  ): Promise<TaxonomyTermWithCountDto[]> {
    const rows = await this.db.taxonomyTerm.findMany({
      where: {
        type: { code: typeCode },
        ...(options.includeInactive ? {} : { isActive: true }),
        ...(options.parentSlug !== undefined
          ? options.parentSlug === null
            ? { parentId: null }
            : { parent: { slug: options.parentSlug } }
          : {}),
      },
      orderBy: { sortOrder: "asc" },
      include: {
        translations: { where: { locale } },
        _count: { select: { children: true } },
      },
    });

    const counts = await Promise.all(rows.map((row) => this.countPublishedRecipesByTerm(row.id)));

    return rows.map((row, index) => ({
      ...this.toDto(row, typeCode),
      recipeCount: counts[index] ?? 0,
      childCount: row._count.children,
    }));
  }

  async findTerm(typeCode: string, slug: string, locale: string): Promise<TaxonomyTermDto | null> {
    const row = await this.db.taxonomyTerm.findUnique({
      where: { taxonomyTypeId_slug: { taxonomyTypeId: await this.requireTypeId(typeCode), slug } },
      include: { translations: { where: { locale } } },
    });
    return row ? this.toDto(row, typeCode) : null;
  }

  async findTermById(id: string, locale: string): Promise<TaxonomyTermDto | null> {
    const row = await this.db.taxonomyTerm.findUnique({
      where: { id },
      include: { translations: { where: { locale } }, type: { select: { code: true } } },
    });
    return row ? this.toDto(row, row.type.code) : null;
  }

  async countTerms(typeCode: string): Promise<number> {
    return this.db.taxonomyTerm.count({ where: { type: { code: typeCode } } });
  }

  async countActiveTermsByType(): Promise<Record<string, number>> {
    const grouped = await this.db.taxonomyTerm.groupBy({
      by: ["taxonomyTypeId"],
      where: { isActive: true },
      _count: { _all: true },
    });
    if (grouped.length === 0) return {};

    const types = await this.db.taxonomyType.findMany({
      select: { id: true, code: true },
    });
    const codeById = new Map(types.map((type) => [type.id, type.code]));

    const result: Record<string, number> = {};
    for (const row of grouped) {
      const code = codeById.get(row.taxonomyTypeId);
      if (code) result[code] = row._count._all;
    }
    return result;
  }

  async countRecipeUsage(termId: string): Promise<number> {
    return this.db.recipe.count({
      where: { deletedAt: null, ...recipeLinkedToTerm(termId) },
    });
  }

  async createTerm(input: CreateTermInput): Promise<TaxonomyTermDto> {
    const typeId = await this.requireTypeId(input.typeCode);
    const created = await this.db.taxonomyTerm.create({
      data: {
        taxonomyTypeId: typeId,
        slug: input.slug,
        icon: input.icon ?? null,
        sortOrder: input.sortOrder ?? 0,
        parentId: input.parentId ?? null,
        translations: {
          create: { locale: input.locale, name: input.name, description: input.description ?? null },
        },
      },
      include: { translations: { where: { locale: input.locale } } },
    });
    return this.toDto(created, input.typeCode);
  }

  async updateTerm(id: string, input: UpdateTermInput): Promise<TaxonomyTermDto> {
    const existing = await this.db.taxonomyTerm.findUnique({
      where: { id },
      include: { type: { select: { code: true } } },
    });
    if (!existing) throw new NotFoundError("Không tìm thấy danh mục.");

    const data: Record<string, unknown> = {};
    if (input.icon !== undefined) data.icon = input.icon;
    if (input.sortOrder !== undefined) data.sortOrder = input.sortOrder;
    if (input.parentId !== undefined) data.parentId = input.parentId;
    if (input.isActive !== undefined) data.isActive = input.isActive;

    if (input.name !== undefined || input.description !== undefined) {
      data.translations = {
        upsert: {
          where: { termId_locale: { termId: id, locale: input.locale } },
          update: {
            ...(input.name !== undefined ? { name: input.name } : {}),
            ...(input.description !== undefined ? { description: input.description } : {}),
          },
          create: {
            locale: input.locale,
            name: input.name ?? existing.slug,
            description: input.description ?? null,
          },
        },
      };
    }

    const updated = await this.db.taxonomyTerm.update({
      where: { id },
      data,
      include: { translations: { where: { locale: input.locale } } },
    });
    return this.toDto(updated, existing.type.code);
  }

  async setTermActive(id: string, isActive: boolean): Promise<void> {
    await this.db.taxonomyTerm.update({ where: { id }, data: { isActive } });
  }

  async deleteTermById(id: string): Promise<void> {
    await this.db.taxonomyTerm.delete({ where: { id } });
  }

  async findTermIdsBySlugs(typeCode: string, slugs: string[]): Promise<Map<string, string>> {
    if (slugs.length === 0) return new Map();
    const rows = await this.db.taxonomyTerm.findMany({
      where: { type: { code: typeCode }, slug: { in: slugs } },
      select: { id: true, slug: true },
    });
    return new Map(rows.map((row) => [row.slug, row.id]));
  }

  private countPublishedRecipesByTerm(termId: string): Promise<number> {
    return this.db.recipe.count({
      where: { status: "published", deletedAt: null, ...recipeLinkedToTerm(termId) },
    });
  }

  private async requireTypeId(typeCode: string): Promise<string> {
    const type = await this.db.taxonomyType.findUnique({
      where: { code: typeCode },
      select: { id: true },
    });
    if (!type) throw new NotFoundError(`Không tìm thấy trục phân loại \`${typeCode}\`.`);
    return type.id;
  }

  private toDto(
    row: {
      id: string;
      slug: string;
      parentId: string | null;
      icon: string | null;
      sortOrder: number;
      isActive: boolean;
      translations: { name: string; description: string | null }[];
    },
    typeCode: string,
  ): TaxonomyTermDto {
    const translation = row.translations[0];
    return {
      id: row.id,
      slug: row.slug,
      typeCode,
      parentId: row.parentId,
      icon: row.icon,
      sortOrder: row.sortOrder,
      isActive: row.isActive,
      name: translation?.name ?? row.slug,
      description: translation?.description ?? null,
    };
  }
}

function toTypeDto(row: {
  id: string;
  code: string;
  isHierarchical: boolean;
  isMultiSelect: boolean;
  isRequired: boolean;
  sortOrder: number;
}): TaxonomyTypeDto {
  return {
    id: row.id,
    code: row.code,
    isHierarchical: row.isHierarchical,
    isMultiSelect: row.isMultiSelect,
    isRequired: row.isRequired,
    sortOrder: row.sortOrder,
  };
}
