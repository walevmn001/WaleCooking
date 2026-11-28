import { z } from "zod";

import { localeSchema, paginationSchema, slugSchema, termSlugSchema, uuidSchema } from "./common";

/**
 * Validation cho module Recipe (P07 §14/§8).
 * Mọi dữ liệu từ client PHẢI đi qua các schema này ở phía server.
 * KHÔNG dùng `z.any()` cho dữ liệu tự do (ngăn mass assignment).
 */

export const difficultySchema = z.enum(["easy", "medium", "hard"]);
export const verificationStatusSchema = z.enum(["untested", "tested", "verified"]);
export const recipeStatusSchema = z.enum(["draft", "in_review", "published", "archived"]);
export const quantityTypeSchema = z.enum(["decimal", "fraction", "range", "text"]);
export const recipeImageRoleSchema = z.enum(["hero", "step", "gallery"]);
export const recipeSortSchema = z.enum(["newest", "az", "popular"]);

/** Chuỗi thập phân dương (giữ chính xác) — dùng cho định lượng. */
function decimalInput(regex: RegExp, message: string) {
  return z
    .union([z.string(), z.number()])
    .transform((value) => String(value))
    .refine((value) => regex.test(value), { message });
}

const quantityRegex = /^\d{1,7}(\.\d{1,3})?$/;
const servingsRegex = /^\d{1,4}(\.\d{1,2})?$/;
const temperatureRegex = /^-?\d{1,4}(\.\d)?$/;

export const taxonomyTermRefSchema = z.object({
  typeCode: z.string().min(1).max(60),
  slug: termSlugSchema,
});

export const recipeIngredientInputSchema = z
  .object({
    ingredientSlug: termSlugSchema.nullable().optional(),
    displayName: z.string().trim().min(1).max(200),
    quantityType: quantityTypeSchema.default("decimal"),
    quantityNumeric: decimalInput(quantityRegex, "Số lượng không hợp lệ (tối đa 3 chữ số thập phân).").nullable().optional(),
    quantityNumericMax: decimalInput(quantityRegex, "Số lượng tối đa không hợp lệ.").nullable().optional(),
    quantityText: z.string().trim().max(120).nullable().optional(),
    unitCode: z.string().trim().min(1).max(40).nullable().optional(),
    isRequired: z.boolean().optional(),
    preparationNote: z.string().trim().max(300).nullable().optional(),
    groupLabel: z.string().trim().max(120).nullable().optional(),
    sortOrder: z.number().int().min(0).max(100000).optional(),
  })
  .superRefine((value, ctx) => {
    if (value.quantityType === "text") {
      if (!value.quantityText) {
        ctx.addIssue({
          code: "custom",
          path: ["quantityText"],
          message: "Định lượng dạng văn bản cần có nội dung.",
        });
      }
      return;
    }
    if (value.quantityType === "range") {
      if (!value.quantityNumeric || !value.quantityNumericMax) {
        ctx.addIssue({
          code: "custom",
          path: ["quantityNumeric"],
          message: "Định lượng dạng khoảng cần có giá trị nhỏ nhất và lớn nhất.",
        });
      }
      return;
    }
    if (!value.quantityNumeric) {
      ctx.addIssue({
        code: "custom",
        path: ["quantityNumeric"],
        message: "Cần có số lượng cho định lượng dạng số.",
      });
    }
  });

export const recipeStepInputSchema = z.object({
  instruction: z.string().trim().min(1).max(2000),
  tip: z.string().trim().max(1000).nullable().optional(),
  durationSeconds: z.number().int().min(0).max(86400).nullable().optional(),
  temperatureC: decimalInput(temperatureRegex, "Nhiệt độ không hợp lệ.").nullable().optional(),
  temperatureNote: z.string().trim().max(300).nullable().optional(),
  sortOrder: z.number().int().min(0).max(100000).optional(),
});

export const recipeImageInputSchema = z.object({
  mediaAssetId: uuidSchema,
  role: recipeImageRoleSchema.optional(),
  altText: z.string().trim().max(300).nullable().optional(),
  sortOrder: z.number().int().min(0).max(100000).optional(),
  stepNo: z.number().int().min(1).nullable().optional(),
});

export const createRecipeSchema = z.object({
  slug: slugSchema,
  locale: localeSchema,
  title: z.string().trim().min(1).max(200),
  summary: z.string().trim().max(500).nullable().optional(),
  description: z.string().trim().max(5000).nullable().optional(),
  seoTitle: z.string().trim().max(200).nullable().optional(),
  seoDescription: z.string().trim().max(320).nullable().optional(),
  foodTypeSlug: termSlugSchema.nullable().optional(),
  cuisineSlug: termSlugSchema.nullable().optional(),
  difficulty: difficultySchema.default("easy"),
  prepMinutes: z.number().int().min(0).max(14400).nullable().optional(),
  cookMinutes: z.number().int().min(0).max(14400).nullable().optional(),
  totalMinutes: z.number().int().min(0).max(28800).nullable().optional(),
  baseServings: decimalInput(servingsRegex, "Số khẩu phần không hợp lệ."),
  verificationStatus: verificationStatusSchema.optional(),
  ingredients: z.array(recipeIngredientInputSchema).max(200).default([]),
  steps: z.array(recipeStepInputSchema).max(100).default([]),
  sourceIds: z.array(uuidSchema).max(20).optional(),
  allergenSlugs: z.array(termSlugSchema).max(30).optional(),
  taxonomyTerms: z.array(taxonomyTermRefSchema).max(60).optional(),
  images: z.array(recipeImageInputSchema).max(30).optional(),
});

/**
 * Cập nhật công thức — mọi trường tùy chọn. Trường KHÔNG truyền = giữ nguyên;
 * truyền `null` = xóa giá trị. Viết tường minh (không suy diễn từ schema tạo)
 * để tránh áp `default` ngoài ý muốn khi cập nhật cục bộ.
 */
export const updateRecipeSchema = z.object({
  title: z.string().trim().min(1).max(200).optional(),
  summary: z.string().trim().max(500).nullable().optional(),
  description: z.string().trim().max(5000).nullable().optional(),
  seoTitle: z.string().trim().max(200).nullable().optional(),
  seoDescription: z.string().trim().max(320).nullable().optional(),
  foodTypeSlug: slugSchema.nullable().optional(),
  cuisineSlug: slugSchema.nullable().optional(),
  difficulty: difficultySchema.optional(),
  prepMinutes: z.number().int().min(0).max(14400).nullable().optional(),
  cookMinutes: z.number().int().min(0).max(14400).nullable().optional(),
  totalMinutes: z.number().int().min(0).max(28800).nullable().optional(),
  baseServings: decimalInput(servingsRegex, "Số khẩu phần không hợp lệ.").optional(),
  verificationStatus: verificationStatusSchema.optional(),
  ingredients: z.array(recipeIngredientInputSchema).max(200).optional(),
  steps: z.array(recipeStepInputSchema).max(100).optional(),
  sourceIds: z.array(uuidSchema).max(20).optional(),
  allergenSlugs: z.array(termSlugSchema).max(30).optional(),
  taxonomyTerms: z.array(taxonomyTermRefSchema).max(60).optional(),
  images: z.array(recipeImageInputSchema).max(30).optional(),
  primaryImageMediaId: uuidSchema.nullable().optional(),
});

export const listRecipesQuerySchema = paginationSchema.extend({
  q: z.string().trim().max(200).optional(),
  foodType: z.string().trim().max(200).optional(),
  cuisine: z.string().trim().max(200).optional(),
  difficulty: difficultySchema.optional(),
  sort: recipeSortSchema.optional(),
  status: z.union([recipeStatusSchema, z.literal("any")]).optional(),
  // Bộ lọc khám phá (P08 §P08.2) — chỉ dùng dữ liệu thật của công thức.
  mealType: z.string().trim().max(200).optional(),
  cookingMethod: z.string().trim().max(200).optional(),
  dietary: z.string().trim().max(200).optional(),
  ingredient: z.string().trim().max(200).optional(),
  ingredientCategory: z.string().trim().max(200).optional(),
  maxMinutes: z.coerce.number().int().min(1).max(28800).optional(),
});

/** Tham số truy vấn thô từ URL (giá trị chuỗi hoặc mảng chuỗi). */
export type RawQueryParams = Record<string, string | string[] | undefined>;

/**
 * Loại bỏ tham số truy vấn KHÔNG hợp lệ trước khi truy vấn công khai (FR-05, P15.3).
 *
 * URL có thể bị người dùng sửa; một tham số sai (vd `difficulty=xyz`, `page=abc`)
 * KHÔNG được làm hỏng trang. Dùng chính `listRecipesQuerySchema` (giữ nguyên
 * validation hiện tại): nếu toàn bộ hợp lệ thì giữ nguyên; nếu có trường sai thì
 * chỉ loại các trường đó và giữ lại phần còn lại.
 */
export function sanitizeRecipeListQuery(raw: RawQueryParams): RawQueryParams {
  const result = listRecipesQuerySchema.safeParse(raw);
  if (result.success) return raw;

  const invalid = new Set(result.error.issues.map((issue) => String(issue.path[0] ?? "")));
  const cleaned: RawQueryParams = {};
  for (const [key, value] of Object.entries(raw)) {
    if (!invalid.has(key)) cleaned[key] = value;
  }
  return cleaned;
}

export const listMediaQuerySchema = paginationSchema;

/** Truy vấn "tìm món theo nguyên liệu người dùng đang có" (P10.3). */
export const matchByIngredientsQuerySchema = z.object({
  /** Danh sách tên nguyên liệu (đã tách), mỗi mục là chuỗi ngắn. */
  ingredients: z.array(z.string().trim().min(1).max(80)).min(1).max(30),
});
export type MatchByIngredientsQuery = z.infer<typeof matchByIngredientsQuerySchema>;

export const uploadMediaSchema = z.object({
  altText: z.string().trim().max(300).optional(),
});

export const recipeVersionReasonSchema = z.object({
  reason: z.string().trim().max(500).optional(),
});

export type CreateRecipeFormInput = z.infer<typeof createRecipeSchema>;
export type UpdateRecipeFormInput = z.infer<typeof updateRecipeSchema>;
export type RecipeIngredientFormInput = z.infer<typeof recipeIngredientInputSchema>;
export type RecipeStepFormInput = z.infer<typeof recipeStepInputSchema>;
export type RecipeImageFormInput = z.infer<typeof recipeImageInputSchema>;
export type UploadMediaFormInput = z.infer<typeof uploadMediaSchema>;
