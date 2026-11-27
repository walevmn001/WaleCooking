import type { PrismaClient } from "@prisma/client";

import { NotFoundError } from "@/lib/errors/app-error";
import type {
  CreateTermInput,
  ListTermsOptions,
  TaxonomyRepository,
  TaxonomyTermDto,
  TaxonomyTypeDto,
} from "./taxonomy.repository";

/** Triển khai Prisma cho `TaxonomyRepository`. */
export class PrismaTaxonomyRepository implements TaxonomyRepository {
  constructor(private readonly db: PrismaClient) {}

  async listTypes(): Promise<TaxonomyTypeDto[]> {
    const rows = await this.db.taxonomyType.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
    });
    return rows.map((row) => ({
      id: row.id,
      code: row.code,
      isHierarchical: row.isHierarchical,
      isMultiSelect: row.isMultiSelect,
      isRequired: row.isRequired,
      sortOrder: row.sortOrder,
    }));
  }

  async findType(code: string): Promise<TaxonomyTypeDto | null> {
    const row = await this.db.taxonomyType.findUnique({ where: { code } });
    if (!row) return null;
    return {
      id: row.id,
      code: row.code,
      isHierarchical: row.isHierarchical,
      isMultiSelect: row.isMultiSelect,
      isRequired: row.isRequired,
      sortOrder: row.sortOrder,
    };
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
    return rows.map((row) => this.toDto(row, typeCode, locale));
  }

  async findTerm(typeCode: string, slug: string, locale: string): Promise<TaxonomyTermDto | null> {
    const row = await this.db.taxonomyTerm.findUnique({
      where: { taxonomyTypeId_slug: { taxonomyTypeId: await this.requireTypeId(typeCode), slug } },
      include: { translations: { where: { locale } } },
    });
    if (!row) return null;
    return this.toDto(row, typeCode, locale);
  }

  async countTerms(typeCode: string): Promise<number> {
    return this.db.taxonomyTerm.count({ where: { type: { code: typeCode } } });
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
        translations: { create: { locale: input.locale, name: input.name } },
      },
      include: { translations: { where: { locale: input.locale } } },
    });
    return this.toDto(created, input.typeCode, input.locale);
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

  private async requireTypeId(typeCode: string): Promise<string> {
    const type = await this.db.taxonomyType.findUnique({
      where: { code: typeCode },
      select: { id: true },
    });
    if (!type) throw new NotFoundError(`Không tìm thấy trục phân loại \`${typeCode}\`.`);
    return type.id;
  }

  private toDto(
    row: { id: string; slug: string; parentId: string | null; icon: string | null; sortOrder: number; translations: { name: string }[] },
    typeCode: string,
    _locale: string,
  ): TaxonomyTermDto {
    return {
      id: row.id,
      slug: row.slug,
      typeCode,
      parentId: row.parentId,
      icon: row.icon,
      sortOrder: row.sortOrder,
      name: row.translations[0]?.name ?? row.slug,
    };
  }
}
