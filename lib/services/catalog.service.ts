import "server-only";

import { requirePermission, type Actor } from "@/lib/auth/authorization";
import { mapPrismaError } from "@/lib/db/prisma-errors";
import { repositories, type Repositories } from "@/lib/db/repositories";
import { NotFoundError, ValidationError } from "@/lib/errors/app-error";
import { createIngredientSchema, createTaxonomyTermSchema } from "@/lib/validation/catalog";
import { paginationSchema, parseInput, type Paginated } from "@/lib/validation/common";
import type { IngredientDto } from "@/lib/db/repositories/ingredient.repository";
import type { TaxonomyTermDto, TaxonomyTypeDto } from "@/lib/db/repositories/taxonomy.repository";
import type { UnitDto } from "@/lib/db/repositories/unit.repository";

export interface ListIngredientsQuery {
  locale?: string;
  page?: number;
  pageSize?: number;
  categorySlug?: string;
  search?: string;
  onlyCommon?: boolean;
}

/**
 * CatalogService — nghiệp vụ cho dữ liệu tham chiếu (đơn vị, taxonomy, nguyên liệu).
 *
 * - Đọc: mở cho mọi người (dữ liệu công khai).
 * - Ghi: yêu cầu permission `taxonomy:manage` (admin) — kiểm tra qua authorization tập trung.
 */
export class CatalogService {
  constructor(private readonly deps: Repositories = repositories) {}

  listUnits(locale = "vi"): Promise<UnitDto[]> {
    return this.deps.unit.list(locale);
  }

  listTaxonomyTypes(): Promise<TaxonomyTypeDto[]> {
    return this.deps.taxonomy.listTypes();
  }

  async listTaxonomyTerms(typeCode: string, locale = "vi"): Promise<TaxonomyTermDto[]> {
    const type = await this.deps.taxonomy.findType(typeCode);
    if (!type) throw new NotFoundError(`Không tìm thấy trục phân loại \`${typeCode}\`.`);
    return this.deps.taxonomy.listTerms(typeCode, locale);
  }

  listIngredients(query: ListIngredientsQuery = {}): Promise<Paginated<IngredientDto>> {
    const pagination = parseInput(paginationSchema, {
      page: query.page ?? 1,
      pageSize: query.pageSize ?? 20,
    });
    return this.deps.ingredient.list({
      locale: query.locale ?? "vi",
      pagination,
      categorySlug: query.categorySlug,
      search: query.search,
      onlyCommon: query.onlyCommon,
    });
  }

  async createTaxonomyTerm(actor: Actor | null, raw: unknown): Promise<TaxonomyTermDto> {
    requirePermission(actor, "taxonomy:manage");
    const input = parseInput(createTaxonomyTermSchema, raw);

    const type = await this.deps.taxonomy.findType(input.typeCode);
    if (!type) throw new ValidationError({ typeCode: ["Trục phân loại không tồn tại."] });

    try {
      return await this.deps.taxonomy.createTerm({
        typeCode: input.typeCode,
        slug: input.slug,
        name: input.name,
        locale: input.locale,
        icon: input.icon ?? null,
        sortOrder: input.sortOrder,
        parentId: input.parentId ?? null,
      });
    } catch (error) {
      mapPrismaError(error);
    }
  }

  async createIngredient(actor: Actor | null, raw: unknown): Promise<IngredientDto> {
    requirePermission(actor, "taxonomy:manage");
    const input = parseInput(createIngredientSchema, raw);

    let categoryTermId: string | null = null;
    if (input.categorySlug) {
      const term = await this.deps.taxonomy.findTerm("ingredient_category", input.categorySlug, input.locale);
      if (!term) {
        throw new ValidationError({ categorySlug: ["Nhóm nguyên liệu không tồn tại."] });
      }
      categoryTermId = term.id;
    }

    try {
      return await this.deps.ingredient.createWithTranslation({
        slug: input.slug,
        name: input.name,
        locale: input.locale,
        categoryTermId,
        isCommon: input.isCommon,
      });
    } catch (error) {
      mapPrismaError(error);
    }
  }
}

export const catalogService = new CatalogService();
