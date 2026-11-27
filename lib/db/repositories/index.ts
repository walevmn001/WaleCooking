import "server-only";

import { prisma } from "@/lib/db/prisma";
import { PrismaIngredientRepository } from "./prisma-ingredient.repository";
import { PrismaTaxonomyRepository } from "./prisma-taxonomy.repository";
import { PrismaUnitRepository } from "./prisma-unit.repository";

/**
 * Cổng truy cập dữ liệu (ports) đã gắn adapter Prisma (P06 §7).
 * Tầng service/API dùng các cổng này; UI KHÔNG import trực tiếp.
 */
export const repositories = {
  unit: new PrismaUnitRepository(prisma),
  taxonomy: new PrismaTaxonomyRepository(prisma),
  ingredient: new PrismaIngredientRepository(prisma),
};

export type Repositories = typeof repositories;

export type { UnitDto, UnitConversionDto, UnitRepository } from "./unit.repository";
export type {
  TaxonomyTypeDto,
  TaxonomyTermDto,
  TaxonomyRepository,
  ListTermsOptions,
  CreateTermInput,
} from "./taxonomy.repository";
export type {
  IngredientDto,
  IngredientRepository,
  ListIngredientsOptions,
  CreateIngredientInput,
} from "./ingredient.repository";
