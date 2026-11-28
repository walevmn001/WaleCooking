import "server-only";

import { requirePermission, type Actor } from "@/lib/auth/authorization";
import {
  DISCOVERY_TAXONOMIES,
  getDiscoveryTaxonomyBySegment,
  type DiscoveryTaxonomy,
} from "@/lib/constants/taxonomy";
import { mapPrismaError } from "@/lib/db/prisma-errors";
import { repositories, type Repositories } from "@/lib/db/repositories";
import type {
  TaxonomyTermDto,
  TaxonomyTermWithCountDto,
  TaxonomyTypeDto,
} from "@/lib/db/repositories/taxonomy.repository";
import { NotFoundError, ValidationError } from "@/lib/errors/app-error";
import { parseInput } from "@/lib/validation/common";
import { createTaxonomyTermSchema, updateTaxonomyTermSchema } from "@/lib/validation/taxonomy";

const DEFAULT_LOCALE = "vi";

/** Nhóm danh mục của một trục khám phá (trang `/danh-muc`). */
export interface CategoryGroup {
  taxonomy: DiscoveryTaxonomy;
  terms: TaxonomyTermWithCountDto[];
}

/** Trang chi tiết danh mục: term + tổ tiên (breadcrumb) + term con. */
export interface CategoryDetail {
  taxonomy: DiscoveryTaxonomy;
  type: TaxonomyTypeDto;
  term: TaxonomyTermWithCountDto;
  /** Tổ tiên từ gốc → cha trực tiếp (dùng dựng breadcrumb). */
  ancestors: TaxonomyTermWithCountDto[];
  parent: TaxonomyTermWithCountDto | null;
  children: TaxonomyTermWithCountDto[];
}

export interface ListTermsForAdminOptions {
  includeInactive?: boolean;
}

/**
 * TaxonomyService — nghiệp vụ phân loại & khám phá công thức (P08).
 *
 * - Đọc (danh mục công khai): mở cho mọi người; CHỈ term đang hoạt động.
 * - Ghi (quản trị): yêu cầu permission `taxonomy:manage` qua authorization tập trung.
 * - Xoá term CHỈ khi không còn công thức/term con tham chiếu; ngược lại yêu cầu lưu trữ.
 */
export class TaxonomyService {
  constructor(private readonly deps: Repositories = repositories) {}

  // ---------------------------------------------------------------- Đọc công khai

  /** Danh sách trục phân loại ở khu vực khám phá (metadata, không truy vấn DB). */
  listDiscoveryTaxonomies(): readonly DiscoveryTaxonomy[] {
    return DISCOVERY_TAXONOMIES;
  }

  /**
   * Danh mục (term gốc) của mọi trục khám phá, kèm số công thức công khai.
   * Trục không có term nào sẽ bị bỏ qua (không hiển thị thẻ rỗng).
   */
  async listDiscoveryGroups(locale: string = DEFAULT_LOCALE): Promise<CategoryGroup[]> {
    const groups = await Promise.all(
      DISCOVERY_TAXONOMIES.map(async (taxonomy) => ({
        taxonomy,
        terms: await this.deps.taxonomy.listTermsWithCounts(taxonomy.code, locale, {
          parentSlug: null,
        }),
      })),
    );
    return groups.filter((group) => group.terms.length > 0);
  }

  /** Toàn bộ term của một trục (kèm số công thức + số term con). */
  async listTypeTerms(
    typeCode: string,
    locale: string = DEFAULT_LOCALE,
    options: ListTermsForAdminOptions = {},
  ): Promise<{ type: TaxonomyTypeDto; terms: TaxonomyTermWithCountDto[] }> {
    const type = await this.requireType(typeCode);
    const terms = await this.deps.taxonomy.listTermsWithCounts(typeCode, locale, {
      includeInactive: options.includeInactive,
    });
    return { type, terms };
  }

  /**
   * Chi tiết một danh mục theo đoạn URL trục + slug term (trang `/danh-muc/{segment}/{slug}`).
   * Ném NotFoundError nếu trục không thuộc khu vực khám phá hoặc term không tồn tại/không hoạt động.
   */
  async getCategoryBySegment(
    segment: string,
    slug: string,
    locale: string = DEFAULT_LOCALE,
  ): Promise<CategoryDetail> {
    const taxonomy = getDiscoveryTaxonomyBySegment(segment);
    if (!taxonomy) throw new NotFoundError("Không tìm thấy danh mục.");

    const { type, terms } = await this.listTypeTerms(taxonomy.code, locale);
    const term = terms.find((item) => item.slug === slug);
    if (!term) throw new NotFoundError("Không tìm thấy danh mục.");

    return {
      taxonomy,
      type,
      term,
      ancestors: this.buildAncestors(terms, term),
      parent: term.parentId ? terms.find((item) => item.id === term.parentId) ?? null : null,
      children: terms.filter((item) => item.parentId === term.id),
    };
  }

  // ---------------------------------------------------------------- Quản trị

  async listTermsForAdmin(
    actor: Actor | null,
    typeCode: string,
    locale: string = DEFAULT_LOCALE,
  ): Promise<{ type: TaxonomyTypeDto; terms: TaxonomyTermWithCountDto[] }> {
    requirePermission(actor, "taxonomy:manage");
    return this.listTypeTerms(typeCode, locale, { includeInactive: true });
  }

  async createTerm(actor: Actor | null, raw: unknown): Promise<TaxonomyTermDto> {
    requirePermission(actor, "taxonomy:manage");
    const input = parseInput(createTaxonomyTermSchema, raw);

    await this.requireType(input.typeCode);
    const parentId = await this.resolveParentId(input.typeCode, input.parentSlug, input.locale);

    try {
      return await this.deps.taxonomy.createTerm({
        typeCode: input.typeCode,
        slug: input.slug,
        name: input.name,
        locale: input.locale,
        description: input.description ?? null,
        icon: input.icon ?? null,
        sortOrder: input.sortOrder,
        parentId: parentId ?? null,
      });
    } catch (error) {
      mapPrismaError(error);
    }
  }

  async updateTerm(actor: Actor | null, id: string, raw: unknown): Promise<TaxonomyTermDto> {
    requirePermission(actor, "taxonomy:manage");
    const input = parseInput(updateTaxonomyTermSchema, raw);
    const locale = input.locale ?? DEFAULT_LOCALE;

    const existing = await this.deps.taxonomy.findTermById(id, locale);
    if (!existing) throw new NotFoundError("Không tìm thấy danh mục.");

    const parentId = await this.resolveParentId(existing.typeCode, input.parentSlug, locale);
    if (parentId === id) {
      throw new ValidationError({ parentSlug: ["Danh mục cha không thể là chính nó."] });
    }

    try {
      return await this.deps.taxonomy.updateTerm(id, {
        name: input.name,
        description: input.description,
        icon: input.icon,
        sortOrder: input.sortOrder,
        parentId,
        isActive: input.isActive,
        locale,
      });
    } catch (error) {
      mapPrismaError(error);
    }
  }

  /** Lưu trữ danh mục (ẩn khỏi công khai nhưng giữ liên kết dữ liệu). */
  async archiveTerm(actor: Actor | null, id: string): Promise<TaxonomyTermDto> {
    requirePermission(actor, "taxonomy:manage");
    const term = await this.requireTerm(id);
    try {
      await this.deps.taxonomy.setTermActive(id, false);
    } catch (error) {
      mapPrismaError(error);
    }
    return { ...term, isActive: false };
  }

  /** Khôi phục danh mục đã lưu trữ. */
  async restoreTerm(actor: Actor | null, id: string): Promise<TaxonomyTermDto> {
    requirePermission(actor, "taxonomy:manage");
    const term = await this.requireTerm(id);
    try {
      await this.deps.taxonomy.setTermActive(id, true);
    } catch (error) {
      mapPrismaError(error);
    }
    return { ...term, isActive: true };
  }

  /**
   * Xoá danh mục — CHỈ khi không còn công thức và không có danh mục con tham chiếu.
   * Ngược lại ném ValidationError hướng dẫn lưu trữ (tránh mất liên kết dữ liệu).
   */
  async deleteTerm(actor: Actor | null, id: string): Promise<void> {
    requirePermission(actor, "taxonomy:manage");
    const term = await this.requireTerm(id);

    const usage = await this.deps.taxonomy.countRecipeUsage(id);
    if (usage > 0) {
      throw new ValidationError({
        id: [
          `Danh mục đang được ${usage} công thức sử dụng. Hãy lưu trữ thay vì xoá để giữ liên kết dữ liệu.`,
        ],
      });
    }

    const allTerms = await this.deps.taxonomy.listTerms(term.typeCode, DEFAULT_LOCALE, {
      includeInactive: true,
    });
    const childCount = allTerms.filter((item) => item.parentId === id).length;
    if (childCount > 0) {
      throw new ValidationError({
        id: [`Danh mục còn ${childCount} danh mục con. Hãy xử lý các danh mục con trước khi xoá.`],
      });
    }

    try {
      await this.deps.taxonomy.deleteTermById(id);
    } catch (error) {
      mapPrismaError(error);
    }
  }

  // ---------------------------------------------------------------- Hỗ trợ

  private async requireType(typeCode: string): Promise<TaxonomyTypeDto> {
    const type = await this.deps.taxonomy.findType(typeCode);
    if (!type) throw new NotFoundError(`Không tìm thấy trục phân loại \`${typeCode}\`.`);
    return type;
  }

  private async requireTerm(id: string): Promise<TaxonomyTermDto> {
    const term = await this.deps.taxonomy.findTermById(id, DEFAULT_LOCALE);
    if (!term) throw new NotFoundError("Không tìm thấy danh mục.");
    return term;
  }

  /**
   * Quy đổi `parentSlug` → `parentId`.
   * `undefined` = không thay đổi (giữ nguyên); `null` = bỏ cha (danh mục gốc).
   */
  private async resolveParentId(
    typeCode: string,
    parentSlug: string | null | undefined,
    locale: string,
  ): Promise<string | null | undefined> {
    if (parentSlug === undefined) return undefined;
    if (parentSlug === null) return null;

    const parent = await this.deps.taxonomy.findTerm(typeCode, parentSlug, locale);
    if (!parent) {
      throw new ValidationError({ parentSlug: ["Danh mục cha không tồn tại trong cùng trục."] });
    }
    return parent.id;
  }

  /** Dựng chuỗi tổ tiên (gốc → cha trực tiếp) cho breadcrumb. */
  private buildAncestors(
    terms: TaxonomyTermWithCountDto[],
    term: TaxonomyTermWithCountDto,
  ): TaxonomyTermWithCountDto[] {
    const byId = new Map(terms.map((item) => [item.id, item]));
    const chain: TaxonomyTermWithCountDto[] = [];
    let current = term.parentId ? byId.get(term.parentId) : undefined;
    let guard = 0;
    while (current && guard < 10) {
      chain.unshift(current);
      current = current.parentId ? byId.get(current.parentId) : undefined;
      guard += 1;
    }
    return chain;
  }
}

export const taxonomyService = new TaxonomyService();
