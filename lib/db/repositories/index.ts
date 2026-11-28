import "server-only";

import { prisma } from "@/lib/db/prisma";
import { PrismaIngredientRepository } from "./prisma-ingredient.repository";
import { PrismaMediaRepository } from "./prisma-media.repository";
import { PrismaRecipeRepository } from "./prisma-recipe.repository";
import { PrismaTaxonomyRepository } from "./prisma-taxonomy.repository";
import { PrismaUnitRepository } from "./prisma-unit.repository";

/**
 * Cổng truy cập dữ liệu (ports) đã gắn adapter Prisma (P06 §7, P07 §7).
 * Tầng service/API dùng các cổng này; UI KHÔNG import trực tiếp.
 */
export const repositories = {
  unit: new PrismaUnitRepository(prisma),
  taxonomy: new PrismaTaxonomyRepository(prisma),
  ingredient: new PrismaIngredientRepository(prisma),
  recipe: new PrismaRecipeRepository(prisma),
  media: new PrismaMediaRepository(prisma),
};

export type Repositories = typeof repositories;

export type { UnitDto, UnitConversionDto, UnitRepository } from "./unit.repository";
export type {
  TaxonomyTypeDto,
  TaxonomyTermDto,
  TaxonomyTermWithCountDto,
  TaxonomyRepository,
  ListTermsOptions,
  CreateTermInput,
  UpdateTermInput,
} from "./taxonomy.repository";
export type {
  IngredientDto,
  IngredientRepository,
  ListIngredientsOptions,
  CreateIngredientInput,
} from "./ingredient.repository";
export type {
  RecipeRepository,
  RecipeSort,
  RecipeListFilters,
  RecipeAdminListFilters,
  RecipeSummaryDto,
  RecipeAdminSummaryDto,
  RecipeDetailDto,
  RecipeIngredientDto,
  RecipeStepDto,
  RecipeStepTimerDto,
  RecipeImageDto,
  RecipeNutritionDto,
  RecipeAllergenDto,
  RecipeSourceDto,
  RecipeTaxonomyTermDto,
  RecipeVersionDto,
  RecipeIngredientInput,
  RecipeStepInput,
  RecipeImageInput,
  TaxonomyTermRef,
  CreateRecipeInput,
  UpdateRecipeInput,
  SlugLookup,
} from "./recipe.repository";
export type { MediaAssetDto, CreateMediaAssetInput, MediaRepository } from "./media.repository";
export type {
  ImportSourceDto,
  ImportJobDto,
  ImportJobItemDto,
  CreateImportJobInput,
  CreateImportJobItemInput,
  ImportRepository,
} from "./import.repository";
