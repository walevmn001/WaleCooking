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
  /** Tên theo locale; fallback về `slug` nếu thiếu bản dịch. */
  name: string;
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
  icon?: string | null;
  sortOrder?: number;
  parentId?: string | null;
}

export interface TaxonomyRepository {
  listTypes(): Promise<TaxonomyTypeDto[]>;
  findType(code: string): Promise<TaxonomyTypeDto | null>;
  listTerms(typeCode: string, locale: string, options?: ListTermsOptions): Promise<TaxonomyTermDto[]>;
  findTerm(typeCode: string, slug: string, locale: string): Promise<TaxonomyTermDto | null>;
  countTerms(typeCode: string): Promise<number>;
  createTerm(input: CreateTermInput): Promise<TaxonomyTermDto>;
  deleteTermById(id: string): Promise<void>;
  findTermIdsBySlugs(typeCode: string, slugs: string[]): Promise<Map<string, string>>;
}
