import "server-only";

import { requirePermission, type Actor } from "@/lib/auth/authorization";
import type { RecipeFilterKind } from "@/lib/constants/taxonomy";
import { mapPrismaError } from "@/lib/db/prisma-errors";
import { repositories, type Repositories } from "@/lib/db/repositories";
import type {
  RecipeAdminSummaryDto,
  RecipeDetailDto,
  RecipeListFilters,
  RecipeSort,
  RecipeSummaryDto,
  RecipeTaxonomyFilter,
  RecipeVersionDto,
} from "@/lib/db/repositories/recipe.repository";
import { NotFoundError, ValidationError } from "@/lib/errors/app-error";
import { paginationSchema, parseInput, type Paginated } from "@/lib/validation/common";
import {
  createRecipeSchema,
  listRecipesQuerySchema,
  recipeVersionReasonSchema,
  updateRecipeSchema,
} from "@/lib/validation/recipe";

/** Tham số truy vấn thô từ query string (đã là chuỗi hoặc mảng chuỗi). */
export type RawQuery = Record<string, string | string[] | undefined>;

/**
 * RecipeService — nghiệp vụ module công thức (P07 §12–§18).
 *
 * Nguyên tắc:
 * - Đọc công khai (guest): CHỈ công thức `published` (BR-13).
 * - Ghi/quản trị: kiểm tra quyền qua authorization tập trung (KHÔNG hardcode role).
 * - Publish: kiểm tra trường bắt buộc (BR-01) + nguồn (BR-03) trước khi đổi trạng thái.
 * - Transaction/định thứ tự nguyên liệu & bước nằm ở tầng repository.
 */
export class RecipeService {
  constructor(private readonly deps: Repositories = repositories) {}

  // ---------------------------------------------------------------- Đọc công khai

  async listPublic(query: RawQuery = {}): Promise<Paginated<RecipeSummaryDto>> {
    const parsed = parseInput(listRecipesQuerySchema, query);
    return this.deps.recipe.listPublic({
      locale: "vi",
      pagination: { page: parsed.page, pageSize: parsed.pageSize },
      search: parsed.q,
      foodTypeSlug: parsed.foodType,
      cuisineSlug: parsed.cuisine,
      difficulty: parsed.difficulty,
      sort: parsed.sort,
      ...buildDiscoveryFilters(parsed),
    });
  }

  /**
   * Danh sách công thức công khai thuộc một danh mục (P08.3 — trang `/danh-muc/{segment}/{slug}`).
   *
   * - `direct`: công thức liên kết term trực tiếp (food_type/cuisine/meal_type/…).
   * - `ingredient_category`: công thức có nguyên liệu thuộc nhóm nguyên liệu đó.
   */
  async listPublicForCategory(params: {
    typeCode: string;
    slug: string;
    filterKind: RecipeFilterKind;
    sort?: RecipeSort;
    search?: string;
    page?: number;
    pageSize?: number;
  }): Promise<Paginated<RecipeSummaryDto>> {
    const pagination = parseInput(paginationSchema, {
      page: params.page ?? 1,
      pageSize: params.pageSize ?? 12,
    });
    const base: RecipeListFilters = {
      locale: "vi",
      pagination,
      sort: params.sort ?? "newest",
      search: params.search,
    };
    const filters: RecipeListFilters =
      params.filterKind === "ingredient_category"
        ? { ...base, ingredientCategorySlug: params.slug }
        : { ...base, taxonomy: [{ typeCode: params.typeCode, slug: params.slug }] };
    return this.deps.recipe.listPublic(filters);
  }

  /**
   * Tóm tắt công thức công khai theo danh sách slug (P07.1 §7.1.4 — trang Yêu thích).
   * CHỈ trả công thức `published`; slug không còn công khai/bị xoá bị BỎ QUA (không lỗi).
   * Giữ nguyên thứ tự đầu vào.
   */
  async getPublicSummariesBySlugs(slugs: string[]): Promise<RecipeSummaryDto[]> {
    const clean = slugs.filter((slug) => typeof slug === "string" && slug.length > 0);
    if (clean.length === 0) return [];
    return this.deps.recipe.listPublicSummariesBySlugs(clean, "vi");
  }

  /** Chi tiết công khai theo slug — chỉ trả khi `published` (archived/draft → 404). */
  async getPublicBySlug(slug: string): Promise<RecipeDetailDto> {
    const detail = await this.deps.recipe.findDetailBySlug(slug, "vi");
    if (!detail || detail.status !== "published") {
      throw new NotFoundError("Không tìm thấy công thức.");
    }
    return detail;
  }

  // ---------------------------------------------------------------- Đọc quản trị

  async listAdmin(actor: Actor | null, query: RawQuery = {}): Promise<Paginated<RecipeAdminSummaryDto>> {
    requirePermission(actor, "recipe:read:draft");
    const parsed = parseInput(listRecipesQuerySchema, query);
    return this.deps.recipe.listAdmin({
      locale: "vi",
      pagination: { page: parsed.page, pageSize: parsed.pageSize },
      search: parsed.q,
      foodTypeSlug: parsed.foodType,
      cuisineSlug: parsed.cuisine,
      difficulty: parsed.difficulty,
      sort: parsed.sort,
      status: parsed.status,
      ...buildDiscoveryFilters(parsed),
    });
  }

  async getAdminDetail(actor: Actor | null, id: string): Promise<RecipeDetailDto> {
    requirePermission(actor, "recipe:read:draft");
    return this.requireDetail(id);
  }

  // ---------------------------------------------------------------- Ghi

  /** Tạo công thức mới (mặc định trạng thái `draft`). */
  async create(actor: Actor | null, raw: unknown): Promise<RecipeDetailDto> {
    const current = requirePermission(actor, "recipe:create");
    const input = parseInput(createRecipeSchema, raw);

    if (await this.deps.recipe.slugExists(input.slug)) {
      throw new ValidationError({ slug: ["Slug đã được sử dụng."] });
    }

    let id: string;
    try {
      id = await this.deps.recipe.create({
        slug: input.slug,
        authorId: current.id,
        defaultLocale: input.locale,
        title: input.title,
        summary: input.summary ?? null,
        description: input.description ?? null,
        seoTitle: input.seoTitle ?? null,
        seoDescription: input.seoDescription ?? null,
        foodTypeSlug: input.foodTypeSlug ?? null,
        cuisineSlug: input.cuisineSlug ?? null,
        difficulty: input.difficulty,
        prepMinutes: input.prepMinutes ?? null,
        cookMinutes: input.cookMinutes ?? null,
        totalMinutes: input.totalMinutes ?? null,
        baseServings: input.baseServings,
        verificationStatus: input.verificationStatus,
        status: "draft",
        ingredients: input.ingredients,
        steps: input.steps,
        sourceIds: input.sourceIds,
        allergenSlugs: input.allergenSlugs,
        taxonomyTerms: input.taxonomyTerms,
        images: input.images,
      });
    } catch (error) {
      mapPrismaError(error);
    }
    return this.requireDetail(id);
  }

  /** Cập nhật công thức. */
  async update(actor: Actor | null, id: string, raw: unknown): Promise<RecipeDetailDto> {
    const current = requirePermission(actor, "recipe:update");
    await this.requireDetail(id);
    const input = parseInput(updateRecipeSchema, raw);
    try {
      await this.deps.recipe.update(id, { ...input, editorId: current.id });
    } catch (error) {
      mapPrismaError(error);
    }
    return this.requireDetail(id);
  }

  /** Chuyển công thức sang `in_review` (gửi duyệt). */
  async submitForReview(actor: Actor | null, id: string): Promise<RecipeDetailDto> {
    requirePermission(actor, "recipe:submit_review");
    await this.requireDetail(id);
    try {
      await this.deps.recipe.setStatus(id, "in_review");
    } catch (error) {
      mapPrismaError(error);
    }
    return this.requireDetail(id);
  }

  /** Xuất bản — kiểm tra đủ điều kiện BR-01/BR-03, lưu snapshot phiên bản. */
  async publish(actor: Actor | null, id: string, raw: unknown = {}): Promise<RecipeDetailDto> {
    const current = requirePermission(actor, "recipe:publish");
    const { reason } = parseInput(recipeVersionReasonSchema, raw);
    const detail = await this.requireDetail(id);
    assertPublishable(detail);

    try {
      await this.deps.recipe.snapshotVersion(id, current.id, reason ?? "Xuất bản công thức");
      await this.deps.recipe.publish(id);
    } catch (error) {
      mapPrismaError(error);
    }
    return this.requireDetail(id);
  }

  /** Lưu trữ (unpublish) — giữ dữ liệu, ẩn khỏi công khai (BR-12). */
  async archive(actor: Actor | null, id: string, raw: unknown = {}): Promise<RecipeDetailDto> {
    const current = requirePermission(actor, "recipe:archive");
    const { reason } = parseInput(recipeVersionReasonSchema, raw);
    await this.requireDetail(id);

    try {
      await this.deps.recipe.snapshotVersion(id, current.id, reason ?? "Lưu trữ công thức");
      await this.deps.recipe.archive(id);
    } catch (error) {
      mapPrismaError(error);
    }
    return this.requireDetail(id);
  }

  /** Xóa mềm — yêu cầu quyền admin (`recipe:delete`). */
  async remove(actor: Actor | null, id: string): Promise<void> {
    requirePermission(actor, "recipe:delete");
    await this.requireDetail(id);
    try {
      await this.deps.recipe.softDelete(id);
    } catch (error) {
      mapPrismaError(error);
    }
  }

  /** Lịch sử phiên bản công thức. */
  async listVersions(actor: Actor | null, id: string): Promise<RecipeVersionDto[]> {
    requirePermission(actor, "recipe:read:draft");
    await this.requireDetail(id);
    return this.deps.recipe.listVersions(id);
  }

  // ---------------------------------------------------------------- Hỗ trợ

  private async requireDetail(id: string): Promise<RecipeDetailDto> {
    const detail = await this.deps.recipe.findDetailById(id, "vi");
    if (!detail) throw new NotFoundError("Không tìm thấy công thức.");
    return detail;
  }
}

/**
 * Quy đổi tham số bộ lọc khám phá (P08 §P08.2) sang bộ lọc repository.
 * Chỉ tạo bộ lọc khi có giá trị — không tạo điều kiện rỗng.
 */
function buildDiscoveryFilters(parsed: {
  mealType?: string;
  cookingMethod?: string;
  dietary?: string;
  ingredient?: string;
  ingredientCategory?: string;
  maxMinutes?: number;
}): Partial<RecipeListFilters> {
  const taxonomy: RecipeTaxonomyFilter[] = [];
  if (parsed.mealType) taxonomy.push({ typeCode: "meal_type", slug: parsed.mealType });
  if (parsed.cookingMethod) taxonomy.push({ typeCode: "cooking_method", slug: parsed.cookingMethod });
  if (parsed.dietary) taxonomy.push({ typeCode: "dietary_preference", slug: parsed.dietary });

  return {
    ...(taxonomy.length > 0 ? { taxonomy } : {}),
    ...(parsed.ingredient ? { ingredientSlug: parsed.ingredient } : {}),
    ...(parsed.ingredientCategory ? { ingredientCategorySlug: parsed.ingredientCategory } : {}),
    ...(parsed.maxMinutes != null ? { maxTotalMinutes: parsed.maxMinutes } : {}),
  };
}

/**
 * Kiểm tra điều kiện xuất bản (BR-01 + BR-03).
 *
 * BR-03 yêu cầu nguồn khi KHÔNG phải nội dung gốc. Vì không thể xác định chắc chắn
 * tính "gốc", ta yêu cầu tối thiểu một nguồn — bao gồm cả nguồn hệ thống
 * "WALE COOKING (tự biên soạn)" dùng để tự khai báo nội dung gốc.
 */
export function assertPublishable(detail: RecipeDetailDto): void {
  const details: Record<string, string[]> = {};

  if (!detail.title.trim()) details.title = ["Cần có tên công thức."];
  if (!detail.summary?.trim()) details.summary = ["Cần có mô tả ngắn."];
  if (!detail.foodTypeSlug) details.foodTypeSlug = ["Cần chọn loại món (food type)."];
  if (!detail.cuisineSlug) details.cuisineSlug = ["Cần chọn xuất xứ (cuisine)."];

  const servings = Number(detail.baseServings);
  if (!Number.isFinite(servings) || servings <= 0) {
    details.baseServings = ["Số khẩu phần phải lớn hơn 0."];
  }

  if (detail.totalMinutes == null && detail.prepMinutes == null && detail.cookMinutes == null) {
    details.totalMinutes = ["Cần có tổng thời gian (hoặc thời gian chuẩn bị/thời gian nấu)."];
  }

  if (detail.ingredients.length === 0) details.ingredients = ["Cần ít nhất 1 nguyên liệu."];
  if (detail.steps.length === 0) details.steps = ["Cần ít nhất 1 bước chế biến."];
  if (!detail.primaryImage) details.primaryImage = ["Cần ảnh đại diện để xuất bản."];
  if (detail.sources.length === 0) {
    details.sources = ["Cần ghi nguồn tham khảo (kể cả khi là nội dung tự biên soạn)."];
  }

  if (Object.keys(details).length > 0) {
    throw new ValidationError(details, "Công thức chưa đủ điều kiện xuất bản.");
  }
}

export const recipeService = new RecipeService();
