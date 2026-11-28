/** Taxonomy type (trục phân loại) — DTO. */
export interface TaxonomyTypeDto {
  id: string;
  code: string;
  isHierarchical: boolean;
  isMultiSelect: boolean;
  isRequired: boolean;
  sortOrder: number;
}

/** Taxonomy term đã ánh xạ DTO (có tên theo locale). */
export interface TaxonomyTermDto {
  id: string;
  slug: string;
  typeCode: string;
  parentId: string | null;
  icon: string | null;
  sortOrder: number;
  isActive: boolean;
  /** Tên theo locale; fallback về `slug` nếu thiếu bản dịch. */
  name: string;
  /** Mô tả theo locale (nếu có). */
  description: string | null;
}

/** Term kèm số công thức công khai đang dùng (P08.3 — trang danh mục). */
export interface TaxonomyTermWithCountDto extends TaxonomyTermDto {
  /** Số công thức `published` liên kết với term (đếm DISTINCT theo công thức). */
  recipeCount: number;
  /** Số term con trực tiếp (0 với trục không phân cấp). */
  childCount: number;
}

export interface ListTermsOptions {
  includeInactive?: boolean;
  parentSlug?: string | null;
}

export interface CreateTermInput {
  typeCode: string;
  slug: string;
  name: string;
  locale: string;
  description?: string | null;
  icon?: string | null;
  sortOrder?: number;
  parentId?: string | null;
}

export interface UpdateTermInput {
  /** Tên hiển thị theo `locale` (upsert bản dịch). */
  name?: string;
  /** Mô tả theo `locale` (đặt `null` để xoá). */
  description?: string | null;
  locale: string;
  icon?: string | null;
  sortOrder?: number;
  parentId?: string | null;
  isActive?: boolean;
}

export interface TaxonomyRepository {
  listTypes(): Promise<TaxonomyTypeDto[]>;
  findType(code: string): Promise<TaxonomyTypeDto | null>;
  listTerms(typeCode: string, locale: string, options?: ListTermsOptions): Promise<TaxonomyTermDto[]>;

  /**
   * Liệt kê term của một trục kèm số công thức công khai + số term con (P08.3).
   * CHỈ đếm công thức `published`, chưa xoá mềm.
   */
  listTermsWithCounts(
    typeCode: string,
    locale: string,
    options?: ListTermsOptions,
  ): Promise<TaxonomyTermWithCountDto[]>;

  findTerm(typeCode: string, slug: string, locale: string): Promise<TaxonomyTermDto | null>;
  findTermById(id: string, locale: string): Promise<TaxonomyTermDto | null>;
  countTerms(typeCode: string): Promise<number>;
  /** Số term (đang hoạt động) của TẤT CẢ trục, khóa theo `code` (P08.3 trang danh mục). */
  countActiveTermsByType(): Promise<Record<string, number>>;
  /** Số công thức `published` đang dùng term (dùng để chặn xoá gây mất liên kết). */
  countRecipeUsage(termId: string): Promise<number>;

  createTerm(input: CreateTermInput): Promise<TaxonomyTermDto>;
  updateTerm(id: string, input: UpdateTermInput): Promise<TaxonomyTermDto>;
  /** Lưu trữ / khôi phục term (đặt `is_active`). Không xoá dữ liệu. */
  setTermActive(id: string, isActive: boolean): Promise<void>;
  deleteTermById(id: string): Promise<void>;

  findTermIdsBySlugs(typeCode: string, slugs: string[]): Promise<Map<string, string>>;
}
