import type {
  AllergenSource,
  Difficulty,
  NutritionBasis,
  NutritionDataSourceType,
  QuantityType,
  RecipeImageRole,
  RecipeStatus,
  VerificationStatus,
} from "@prisma/client";

import type { Paginated, Pagination } from "@/lib/validation/common";

/** Sắp xếp danh sách công thức công khai. */
export type RecipeSort = "newest" | "az" | "popular";

export interface RecipeListFilters {
  locale: string;
  pagination: Pagination;
  search?: string;
  foodTypeSlug?: string;
  cuisineSlug?: string;
  difficulty?: Difficulty;
  sort?: RecipeSort;
}

export interface RecipeAdminListFilters extends RecipeListFilters {
  /** `"any"` = mọi trạng thái (trang quản trị). */
  status?: RecipeStatus | "any";
}

export interface RecipeImageDto {
  id: string;
  role: RecipeImageRole;
  url: string | null;
  altText: string | null;
  sortOrder: number;
}

export interface RecipeIngredientDto {
  id: string;
  displayName: string;
  quantityType: QuantityType;
  /** Số dạng chuỗi để giữ chính xác (Prisma Decimal không đưa ra JSON trực tiếp). */
  quantityNumeric: string | null;
  quantityNumericMax: string | null;
  quantityText: string | null;
  unitCode: string | null;
  unitName: string | null;
  unitSymbol: string | null;
  isRequired: boolean;
  preparationNote: string | null;
  groupLabel: string | null;
  sortOrder: number;
}

export interface RecipeStepTimerDto {
  label: string;
  durationSeconds: number;
  temperatureC: string | null;
  temperatureNote: string | null;
}

export interface RecipeStepDto {
  id: string;
  stepNo: number;
  sortOrder: number;
  instruction: string;
  tip: string | null;
  timers: RecipeStepTimerDto[];
  images: { id: string; url: string | null; altText: string | null }[];
}

export interface RecipeNutritionDto {
  basis: NutritionBasis;
  calories: string | null;
  proteinG: string | null;
  carbsG: string | null;
  fatG: string | null;
  fiberG: string | null;
  sugarG: string | null;
  sodiumMg: string | null;
  dataSourceType: NutritionDataSourceType;
  sourceNote: string | null;
}

export interface RecipeAllergenDto {
  termId: string;
  slug: string;
  name: string;
  source: AllergenSource;
}

export interface RecipeSourceDto {
  id: string;
  name: string;
  authorOrOrg: string | null;
  url: string | null;
  license: string | null;
  note: string | null;
  isPrimary: boolean;
}

export interface RecipeTaxonomyTermDto {
  typeCode: string;
  slug: string;
  name: string;
}

/** Thẻ công thức cho danh sách (rút gọn, đủ để render `RecipeSummary`). */
export interface RecipeSummaryDto {
  id: string;
  slug: string;
  title: string;
  summary: string | null;
  imageUrl: string | null;
  imageAlt: string | null;
  prepMinutes: number | null;
  cookMinutes: number | null;
  totalMinutes: number | null;
  baseServings: number;
  difficulty: Difficulty;
  foodTypeSlug: string | null;
  cuisineSlug: string | null;
  publishedAt: Date | null;
}

/** Thẻ công thức cho trang quản trị (kèm trạng thái). */
export interface RecipeAdminSummaryDto extends RecipeSummaryDto {
  status: RecipeStatus;
  verificationStatus: VerificationStatus;
  authorId: string;
  updatedAt: Date;
}

/** Công thức đầy đủ (trang chi tiết). */
export interface RecipeDetailDto extends RecipeSummaryDto {
  status: RecipeStatus;
  verificationStatus: VerificationStatus;
  defaultLocale: string;
  description: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  authorId: string;
  editorId: string | null;
  primaryImage: { id: string; url: string | null; altText: string | null } | null;
  images: RecipeImageDto[];
  ingredients: RecipeIngredientDto[];
  steps: RecipeStepDto[];
  nutrition: RecipeNutritionDto[];
  allergens: RecipeAllergenDto[];
  sources: RecipeSourceDto[];
  taxonomy: RecipeTaxonomyTermDto[];
  createdAt: Date;
  updatedAt: Date;
}

export interface RecipeVersionDto {
  id: string;
  versionNo: number;
  changeSummary: string | null;
  createdAt: Date;
}

export interface RecipeIngredientInput {
  /** Liên kết tới nguyên liệu nền (nếu có). */
  ingredientSlug?: string | null;
  displayName: string;
  quantityType: QuantityType;
  quantityNumeric?: string | null;
  quantityNumericMax?: string | null;
  quantityText?: string | null;
  unitCode?: string | null;
  isRequired?: boolean;
  preparationNote?: string | null;
  groupLabel?: string | null;
  sortOrder?: number;
}

export interface RecipeStepInput {
  instruction: string;
  tip?: string | null;
  durationSeconds?: number | null;
  temperatureC?: string | null;
  temperatureNote?: string | null;
  sortOrder?: number;
}

export interface RecipeImageInput {
  mediaAssetId: string;
  role?: RecipeImageRole;
  altText?: string | null;
  sortOrder?: number;
  stepNo?: number | null;
}

export interface TaxonomyTermRef {
  typeCode: string;
  slug: string;
}

export interface CreateRecipeInput {
  slug: string;
  authorId: string;
  defaultLocale: string;
  title: string;
  summary?: string | null;
  description?: string | null;
  seoTitle?: string | null;
  seoDescription?: string | null;
  foodTypeSlug?: string | null;
  cuisineSlug?: string | null;
  difficulty: Difficulty;
  prepMinutes?: number | null;
  cookMinutes?: number | null;
  totalMinutes?: number | null;
  baseServings: string;
  verificationStatus?: VerificationStatus;
  status?: RecipeStatus;
  ingredients: RecipeIngredientInput[];
  steps: RecipeStepInput[];
  /** Nguồn tham khảo (`content_sources.id`). */
  sourceIds?: string[];
  /** Slug term trong trục `allergen`. */
  allergenSlugs?: string[];
  /** Các trục phân loại bổ sung (multi-select). */
  taxonomyTerms?: TaxonomyTermRef[];
  images?: RecipeImageInput[];
}

export interface UpdateRecipeInput {
  title?: string;
  summary?: string | null;
  description?: string | null;
  seoTitle?: string | null;
  seoDescription?: string | null;
  foodTypeSlug?: string | null;
  cuisineSlug?: string | null;
  difficulty?: Difficulty;
  prepMinutes?: number | null;
  cookMinutes?: number | null;
  totalMinutes?: number | null;
  baseServings?: string;
  verificationStatus?: VerificationStatus;
  editorId?: string | null;
  /** Nếu truyền, THAY THẾ toàn bộ danh sách nguyên liệu. */
  ingredients?: RecipeIngredientInput[];
  /** Nếu truyền, THAY THẾ toàn bộ các bước nấu. */
  steps?: RecipeStepInput[];
  sourceIds?: string[];
  allergenSlugs?: string[];
  taxonomyTerms?: TaxonomyTermRef[];
  images?: RecipeImageInput[];
  primaryImageMediaId?: string | null;
}

export interface SlugLookup {
  id: string;
  status: RecipeStatus;
  deletedAt: Date | null;
}

export interface RecipeRepository {
  listPublic(filters: RecipeListFilters): Promise<Paginated<RecipeSummaryDto>>;
  listAdmin(filters: RecipeAdminListFilters): Promise<Paginated<RecipeAdminSummaryDto>>;

  findDetailBySlug(slug: string, locale: string): Promise<RecipeDetailDto | null>;
  findDetailById(id: string, locale: string): Promise<RecipeDetailDto | null>;
  findIdBySlug(slug: string): Promise<SlugLookup | null>;
  slugExists(slug: string, exceptId?: string): Promise<boolean>;

  create(input: CreateRecipeInput): Promise<string>;
  update(id: string, input: UpdateRecipeInput): Promise<void>;

  setStatus(id: string, status: RecipeStatus): Promise<void>;
  publish(id: string): Promise<void>;
  archive(id: string): Promise<void>;
  softDelete(id: string): Promise<void>;

  listVersions(id: string): Promise<RecipeVersionDto[]>;
  snapshotVersion(id: string, editorId: string | null, changeSummary: string | null): Promise<void>;

  countByStatus(status: RecipeStatus): Promise<number>;
  countAll(): Promise<number>;
}
