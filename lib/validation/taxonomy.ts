import { z } from "zod";

import { localeSchema, termSlugSchema } from "./common";

/**
 * Validation quản trị taxonomy (P08 §P08.4).
 * Mọi dữ liệu từ client đi qua schema này ở phía server (ngăn mass assignment).
 */

export const createTaxonomyTermSchema = z.object({
  typeCode: z.string().trim().min(1).max(60),
  slug: termSlugSchema,
  name: z.string().trim().min(1).max(200),
  locale: localeSchema,
  description: z.string().trim().max(1000).nullable().optional(),
  icon: z.string().trim().max(200).nullable().optional(),
  sortOrder: z.number().int().min(0).max(100000).optional(),
  /** Slug danh mục cha (cùng trục). `null`/bỏ trống = danh mục gốc. */
  parentSlug: termSlugSchema.nullable().optional(),
});

export const updateTaxonomyTermSchema = z.object({
  name: z.string().trim().min(1).max(200).optional(),
  description: z.string().trim().max(1000).nullable().optional(),
  icon: z.string().trim().max(200).nullable().optional(),
  sortOrder: z.number().int().min(0).max(100000).optional(),
  parentSlug: termSlugSchema.nullable().optional(),
  isActive: z.boolean().optional(),
  locale: localeSchema.optional(),
});

export type CreateTaxonomyTermFormInput = z.infer<typeof createTaxonomyTermSchema>;
export type UpdateTaxonomyTermFormInput = z.infer<typeof updateTaxonomyTermSchema>;
