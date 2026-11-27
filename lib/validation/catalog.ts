import { z } from "zod";

import { localeSchema, slugSchema, uuidSchema } from "./common";

/** Input tạo taxonomy term (trục phân loại). */
export const createTaxonomyTermSchema = z.object({
  typeCode: z.string().min(1).max(60),
  slug: slugSchema,
  name: z.string().min(1).max(200),
  locale: localeSchema,
  icon: z.string().max(200).nullable().optional(),
  sortOrder: z.number().int().min(0).max(100000).optional(),
  parentId: uuidSchema.nullable().optional(),
});

export type CreateTaxonomyTermInput = z.infer<typeof createTaxonomyTermSchema>;

/** Input tạo nguyên liệu nền. */
export const createIngredientSchema = z.object({
  slug: slugSchema,
  name: z.string().min(1).max(200),
  locale: localeSchema,
  categorySlug: z.string().min(1).max(200).nullable().optional(),
  isCommon: z.boolean().optional(),
});

export type CreateIngredientInput = z.infer<typeof createIngredientSchema>;
