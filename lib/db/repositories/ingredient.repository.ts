import type { Paginated, Pagination } from "@/lib/validation/common";

/** Nguyên liệu đã ánh xạ DTO. */
export interface IngredientDto {
  id: string;
  slug: string;
  originalName: string | null;
  /** Tên theo locale; fallback về `slug`. */
  name: string;
  categorySlug: string | null;
  isCommon: boolean;
}

export interface ListIngredientsOptions {
  locale: string;
  pagination: Pagination;
  categorySlug?: string;
  search?: string;
  onlyCommon?: boolean;
}

export interface CreateIngredientInput {
  slug: string;
  name: string;
  locale: string;
  categoryTermId?: string | null;
  isCommon?: boolean;
}

export interface IngredientRepository {
  list(options: ListIngredientsOptions): Promise<Paginated<IngredientDto>>;
  findBySlug(slug: string, locale: string): Promise<IngredientDto | null>;
  /** Tạo nguyên liệu + bản dịch trong MỘT transaction. */
  createWithTranslation(input: CreateIngredientInput): Promise<IngredientDto>;
  countAll(): Promise<number>;
}
