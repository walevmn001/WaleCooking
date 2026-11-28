import type { Prisma, PrismaClient, RecipeStatus } from "@prisma/client";

import { ValidationError } from "@/lib/errors/app-error";
import { paginate } from "@/lib/validation/common";
import type { Paginated } from "@/lib/validation/common";

import type {
  CreateRecipeInput,
  RecipeAdminListFilters,
  RecipeAdminSummaryDto,
  RecipeDetailDto,
  RecipeIngredientDto,
  RecipeListFilters,
  RecipeRepository,
  RecipeSort,
  RecipeSourceDto,
  RecipeStepDto,
  RecipeSummaryDto,
  RecipeVersionDto,
  SlugLookup,
  UpdateRecipeInput,
} from "./recipe.repository";

type Tx = Prisma.TransactionClient;

/** Ánh xạ lỗi: một số term/slug tham chiếu không tồn tại. */
function missingTerms(field: string, slugs: string[]): ValidationError {
  return new ValidationError({ [field]: [`Không tìm thấy: ${slugs.join(", ")}.`] });
}

/** Triển khai Prisma cho `RecipeRepository`. */
export class PrismaRecipeRepository implements RecipeRepository {
  constructor(private readonly db: PrismaClient) {}

  // ---------------------------------------------------------------- Đọc danh sách

  async listPublic(filters: RecipeListFilters): Promise<Paginated<RecipeSummaryDto>> {
    const where: Prisma.RecipeWhereInput = {
      status: "published",
      deletedAt: null,
      ...this.buildFilterWhere(filters),
    };
    return this.listWithWhere(where, filters);
  }

  async listAdmin(filters: RecipeAdminListFilters): Promise<Paginated<RecipeAdminSummaryDto>> {
    const statusWhere =
      !filters.status || filters.status === "any" ? {} : { status: filters.status };
    const where: Prisma.RecipeWhereInput = {
      deletedAt: null,
      ...statusWhere,
      ...this.buildFilterWhere(filters),
    };
    const [rows, total] = await this.db.$transaction([
      this.db.recipe.findMany({
        where,
        orderBy: this.orderBy(filters.sort ?? "newest"),
        skip: (filters.pagination.page - 1) * filters.pagination.pageSize,
        take: filters.pagination.pageSize,
        include: {
          translations: true,
          primaryImage: { select: { publicUrl: true, altTextDefault: true } },
          foodTypeTerm: { select: { slug: true } },
          cuisineTerm: { select: { slug: true } },
        },
      }),
      this.db.recipe.count({ where }),
    ]);
    const items = rows.map((row) => ({
      ...this.toSummary(row, filters.locale),
      status: row.status,
      verificationStatus: row.verificationStatus,
      authorId: row.authorId,
      updatedAt: row.updatedAt,
    }));
    return paginate(items, total, filters.pagination);
  }

  private async listWithWhere(
    where: Prisma.RecipeWhereInput,
    filters: RecipeListFilters,
  ): Promise<Paginated<RecipeSummaryDto>> {
    const [rows, total] = await this.db.$transaction([
      this.db.recipe.findMany({
        where,
        orderBy: this.orderBy(filters.sort ?? "newest"),
        skip: (filters.pagination.page - 1) * filters.pagination.pageSize,
        take: filters.pagination.pageSize,
        include: {
          translations: true,
          primaryImage: { select: { publicUrl: true, altTextDefault: true } },
          foodTypeTerm: { select: { slug: true } },
          cuisineTerm: { select: { slug: true } },
        },
      }),
      this.db.recipe.count({ where }),
    ]);
    return paginate(
      rows.map((row) => this.toSummary(row, filters.locale)),
      total,
      filters.pagination,
    );
  }

  private buildFilterWhere(filters: RecipeListFilters): Prisma.RecipeWhereInput {
    return {
      ...(filters.foodTypeSlug ? { foodTypeTerm: { slug: filters.foodTypeSlug } } : {}),
      ...(filters.cuisineSlug ? { cuisineTerm: { slug: filters.cuisineSlug } } : {}),
      ...(filters.difficulty ? { difficulty: filters.difficulty } : {}),
      ...(filters.search
        ? {
            OR: [
              { slug: { contains: filters.search, mode: "insensitive" } },
              {
                translations: {
                  some: {
                    title: { contains: filters.search, mode: "insensitive" },
                  },
                },
              },
            ],
          }
        : {}),
    };
  }

  /** Sắp xếp: `az` theo slug; `popular` tạm dùng mới nhất (chưa có số liệu tương tác). */
  private orderBy(sort: RecipeSort): Prisma.RecipeOrderByWithRelationInput[] {
    switch (sort) {
      case "az":
        return [{ slug: "asc" }];
      case "popular":
      case "newest":
      default:
        return [{ publishedAt: { sort: "desc", nulls: "last" } }, { createdAt: "desc" }];
    }
  }

  // ---------------------------------------------------------------- Đọc chi tiết

  async listPublicSummariesBySlugs(slugs: string[], locale: string): Promise<RecipeSummaryDto[]> {
    const unique = [...new Set(slugs)];
    if (unique.length === 0) return [];
    const rows = await this.db.recipe.findMany({
      where: { slug: { in: unique }, status: "published", deletedAt: null },
      include: {
        translations: true,
        primaryImage: { select: { publicUrl: true, altTextDefault: true } },
        foodTypeTerm: { select: { slug: true } },
        cuisineTerm: { select: { slug: true } },
      },
    });
    // Giữ đúng thứ tự slug người dùng đã lưu (thứ tự thêm vào yêu thích).
    const bySlug = new Map(rows.map((row) => [row.slug, this.toSummary(row, locale)]));
    return unique
      .map((slug) => bySlug.get(slug))
      .filter((item): item is RecipeSummaryDto => item !== undefined);
  }

  async findDetailBySlug(slug: string, locale: string): Promise<RecipeDetailDto | null> {
    const row = await this.db.recipe.findFirst({
      where: { slug, deletedAt: null },
      include: this.detailInclude(locale),
    });
    return row ? this.toDetail(row, locale) : null;
  }

  async findDetailById(id: string, locale: string): Promise<RecipeDetailDto | null> {
    const row = await this.db.recipe.findFirst({
      where: { id, deletedAt: null },
      include: this.detailInclude(locale),
    });
    return row ? this.toDetail(row, locale) : null;
  }

  async findIdBySlug(slug: string): Promise<SlugLookup | null> {
    const row = await this.db.recipe.findUnique({
      where: { slug },
      select: { id: true, status: true, deletedAt: true },
    });
    return row;
  }

  async slugExists(slug: string, exceptId?: string): Promise<boolean> {
    const row = await this.db.recipe.findUnique({ where: { slug }, select: { id: true } });
    if (!row) return false;
    return row.id !== exceptId;
  }

  private detailInclude(locale: string) {
    return {
      translations: true,
      primaryImage: { select: { id: true, publicUrl: true, altTextDefault: true } },
      foodTypeTerm: { select: { slug: true } },
      cuisineTerm: { select: { slug: true } },
      images: {
        orderBy: { sortOrder: "asc" as const },
        include: { mediaAsset: { select: { publicUrl: true, altTextDefault: true } } },
      },
      ingredients: {
        orderBy: { sortOrder: "asc" as const },
        include: {
          unit: { include: { translations: { where: { locale } } } },
        },
      },
      steps: {
        orderBy: { stepNo: "asc" as const },
        include: {
          translations: { where: { locale } },
          timers: true,
          images: {
            include: { mediaAsset: { select: { publicUrl: true, altTextDefault: true } } },
          },
        },
      },
      nutrition: true,
      allergens: {
        include: { term: { include: { translations: { where: { locale } } } } },
      },
      sources: {
        include: {
          source: {
            select: { name: true, authorOrOrg: true, url: true, license: true },
          },
        },
      },
      taxonomyTerms: {
        include: {
          term: {
            include: {
              type: { select: { code: true } },
              translations: { where: { locale } },
            },
          },
        },
      },
    } satisfies Prisma.RecipeInclude;
  }

  // ---------------------------------------------------------------- Ghi

  async create(input: CreateRecipeInput): Promise<string> {
    return this.db.$transaction(async (tx) => {
      const foodTypeTermId = input.foodTypeSlug
        ? await this.resolveTermId(tx, "food_type", input.foodTypeSlug)
        : null;
      const cuisineTermId = input.cuisineSlug
        ? await this.resolveTermId(tx, "cuisine", input.cuisineSlug)
        : null;

      const ingredientIds = await this.resolveIngredientIds(tx, input.ingredients);
      const unitIds = await this.resolveUnitIds(tx, input.ingredients);
      const allergenIds = await this.resolveTermIds(tx, "allergen", input.allergenSlugs ?? []);
      const taxonomyTermIds = await this.resolveExtraTaxonomyIds(tx, input.taxonomyTerms ?? []);
      const sourceIds = input.sourceIds ?? [];

      const recipe = await tx.recipe.create({
        data: {
          slug: input.slug,
          status: input.status ?? "draft",
          authorId: input.authorId,
          foodTypeTermId,
          cuisineTermId,
          difficulty: input.difficulty,
          prepMinutes: input.prepMinutes ?? null,
          cookMinutes: input.cookMinutes ?? null,
          totalMinutes: input.totalMinutes ?? null,
          baseServings: input.baseServings,
          verificationStatus: input.verificationStatus ?? "untested",
          defaultLocale: input.defaultLocale,
          translations: {
            create: {
              locale: input.defaultLocale,
              title: input.title,
              summary: input.summary ?? null,
              description: input.description ?? null,
              seoTitle: input.seoTitle ?? null,
              seoDescription: input.seoDescription ?? null,
            },
          },
          ingredients: {
            create: input.ingredients.map((ing, index) => ({
              ingredientId: ing.ingredientSlug ? (ingredientIds.get(ing.ingredientSlug) ?? null) : null,
              displayName: ing.displayName,
              quantityType: ing.quantityType,
              quantityNumeric: ing.quantityNumeric ?? null,
              quantityNumericMax: ing.quantityNumericMax ?? null,
              quantityText: ing.quantityText ?? null,
              unitId: ing.unitCode ? (unitIds.get(ing.unitCode) ?? null) : null,
              isRequired: ing.isRequired ?? true,
              preparationNote: ing.preparationNote ?? null,
              groupLabel: ing.groupLabel ?? null,
              sortOrder: ing.sortOrder ?? index,
            })),
          },
          taxonomyTerms: { create: taxonomyTermIds.map((id) => ({ taxonomyTermId: id })) },
          allergens: {
            create: allergenIds.map((id) => ({ allergenTermId: id, source: "declared" as const })),
          },
          sources: {
            create: sourceIds.map((id, index) => ({ sourceId: id, isPrimary: index === 0 })),
          },
        },
        select: { id: true },
      });

      const stepIdByNo = await this.createSteps(tx, recipe.id, input.defaultLocale, input.steps);
      const primaryImageId = await this.createImages(tx, recipe.id, input.images ?? [], stepIdByNo);

      if (primaryImageId) {
        await tx.recipe.update({ where: { id: recipe.id }, data: { primaryImageId } });
      }
      return recipe.id;
    });
  }

  async update(id: string, input: UpdateRecipeInput): Promise<void> {
    await this.db.$transaction(async (tx) => {
      const current = await tx.recipe.findUniqueOrThrow({
        where: { id },
        select: { defaultLocale: true },
      });

      const data: Prisma.RecipeUpdateInput = {};
      if (input.difficulty !== undefined) data.difficulty = input.difficulty;
      if (input.prepMinutes !== undefined) data.prepMinutes = input.prepMinutes;
      if (input.cookMinutes !== undefined) data.cookMinutes = input.cookMinutes;
      if (input.totalMinutes !== undefined) data.totalMinutes = input.totalMinutes;
      if (input.baseServings !== undefined) data.baseServings = input.baseServings;
      if (input.verificationStatus !== undefined) data.verificationStatus = input.verificationStatus;
      if (input.editorId !== undefined) {
        data.editor = input.editorId ? { connect: { id: input.editorId } } : { disconnect: true };
      }
      if (input.foodTypeSlug !== undefined) {
        data.foodTypeTerm = input.foodTypeSlug
          ? { connect: { id: await this.resolveTermId(tx, "food_type", input.foodTypeSlug) } }
          : { disconnect: true };
      }
      if (input.cuisineSlug !== undefined) {
        data.cuisineTerm = input.cuisineSlug
          ? { connect: { id: await this.resolveTermId(tx, "cuisine", input.cuisineSlug) } }
          : { disconnect: true };
      }
      if (input.primaryImageMediaId !== undefined) {
        data.primaryImage = input.primaryImageMediaId
          ? { connect: { id: input.primaryImageMediaId } }
          : { disconnect: true };
      }
      await tx.recipe.update({ where: { id }, data });

      // Bản dịch (upsert theo locale mặc định của công thức).
      const translationData: Prisma.RecipeTranslationUpdateInput = {};
      if (input.title !== undefined) translationData.title = input.title;
      if (input.summary !== undefined) translationData.summary = input.summary;
      if (input.description !== undefined) translationData.description = input.description;
      if (input.seoTitle !== undefined) translationData.seoTitle = input.seoTitle;
      if (input.seoDescription !== undefined) translationData.seoDescription = input.seoDescription;
      if (Object.keys(translationData).length > 0) {
        await tx.recipeTranslation.update({
          where: { recipeId_locale: { recipeId: id, locale: current.defaultLocale } },
          data: translationData,
        });
      }

      if (input.ingredients !== undefined) {
        await tx.recipeIngredient.deleteMany({ where: { recipeId: id } });
        const ingredientIds = await this.resolveIngredientIds(tx, input.ingredients);
        const unitIds = await this.resolveUnitIds(tx, input.ingredients);
        for (const [index, ing] of input.ingredients.entries()) {
          await tx.recipeIngredient.create({
            data: {
              recipeId: id,
              ingredientId: ing.ingredientSlug ? (ingredientIds.get(ing.ingredientSlug) ?? null) : null,
              displayName: ing.displayName,
              quantityType: ing.quantityType,
              quantityNumeric: ing.quantityNumeric ?? null,
              quantityNumericMax: ing.quantityNumericMax ?? null,
              quantityText: ing.quantityText ?? null,
              unitId: ing.unitCode ? (unitIds.get(ing.unitCode) ?? null) : null,
              isRequired: ing.isRequired ?? true,
              preparationNote: ing.preparationNote ?? null,
              groupLabel: ing.groupLabel ?? null,
              sortOrder: ing.sortOrder ?? index,
            },
          });
        }
      }

      if (input.steps !== undefined) {
        await tx.recipeStep.deleteMany({ where: { recipeId: id } });
        await this.createSteps(tx, id, current.defaultLocale, input.steps);
      }

      if (input.allergenSlugs !== undefined) {
        await tx.recipeAllergen.deleteMany({ where: { recipeId: id } });
        const allergenIds = await this.resolveTermIds(tx, "allergen", input.allergenSlugs);
        for (const allergenTermId of allergenIds) {
          await tx.recipeAllergen.create({
            data: { recipeId: id, allergenTermId, source: "declared" },
          });
        }
      }

      if (input.taxonomyTerms !== undefined) {
        await tx.recipeTaxonomyTerm.deleteMany({ where: { recipeId: id } });
        const taxonomyTermIds = await this.resolveExtraTaxonomyIds(tx, input.taxonomyTerms);
        for (const taxonomyTermId of taxonomyTermIds) {
          await tx.recipeTaxonomyTerm.create({ data: { recipeId: id, taxonomyTermId } });
        }
      }

      if (input.sourceIds !== undefined) {
        await tx.recipeSource.deleteMany({ where: { recipeId: id } });
        for (const [index, sourceId] of input.sourceIds.entries()) {
          await tx.recipeSource.create({
            data: { recipeId: id, sourceId, isPrimary: index === 0 },
          });
        }
      }

      if (input.images !== undefined) {
        await tx.recipeImage.deleteMany({ where: { recipeId: id } });
        const stepRows = await tx.recipeStep.findMany({
          where: { recipeId: id },
          select: { id: true, stepNo: true },
        });
        const map = new Map(stepRows.map((s) => [s.stepNo, s.id]));
        await this.createImages(tx, id, input.images, map);
      }
    });
  }

  async setStatus(id: string, status: RecipeStatus): Promise<void> {
    await this.db.recipe.update({
      where: { id },
      data: {
        status,
        ...(status === "published" ? { publishedAt: new Date() } : {}),
        ...(status === "archived" ? { archivedAt: new Date() } : {}),
      },
    });
  }

  async publish(id: string): Promise<void> {
    await this.setStatus(id, "published");
  }

  async archive(id: string): Promise<void> {
    await this.setStatus(id, "archived");
  }

  /** Xóa mềm (soft delete) — giữ dữ liệu, ẩn khỏi truy vấn công khai. */
  async softDelete(id: string): Promise<void> {
    await this.db.recipe.update({
      where: { id },
      data: { deletedAt: new Date(), status: "archived", archivedAt: new Date() },
    });
  }

  async listVersions(id: string): Promise<RecipeVersionDto[]> {
    const rows = await this.db.recipeVersion.findMany({
      where: { recipeId: id },
      orderBy: { versionNo: "desc" },
      select: { id: true, versionNo: true, changeSummary: true, createdAt: true },
    });
    return rows;
  }

  async snapshotVersion(
    id: string,
    editorId: string | null,
    changeSummary: string | null,
  ): Promise<void> {
    await this.db.$transaction(async (tx) => {
      const detail = await tx.recipe.findUnique({
        where: { id },
        include: {
          translations: true,
          ingredients: { orderBy: { sortOrder: "asc" } },
          steps: {
            orderBy: { stepNo: "asc" },
            include: { translations: true, timers: true },
          },
          taxonomyTerms: { include: { term: { include: { type: true } } } },
          allergens: true,
          sources: true,
          nutrition: true,
        },
      });
      if (!detail) return;
      const last = await tx.recipeVersion.findFirst({
        where: { recipeId: id },
        orderBy: { versionNo: "desc" },
        select: { versionNo: true },
      });
      const versionNo = (last?.versionNo ?? 0) + 1;
      await tx.recipeVersion.create({
        data: {
          recipeId: id,
          versionNo,
          editorId,
          changeSummary,
          snapshot: JSON.parse(JSON.stringify(detail)),
        },
      });
    });
  }

  async countByStatus(status: RecipeStatus): Promise<number> {
    return this.db.recipe.count({ where: { status, deletedAt: null } });
  }

  async countAll(): Promise<number> {
    return this.db.recipe.count({ where: { deletedAt: null } });
  }

  // ---------------------------------------------------------------- Hỗ trợ ghi

  private async createSteps(
    tx: Tx,
    recipeId: string,
    locale: string,
    steps: CreateRecipeInput["steps"],
  ): Promise<Map<number, string>> {
    const stepIdByNo = new Map<number, string>();
    for (const [index, step] of steps.entries()) {
      const stepNo = index + 1;
      const created = await tx.recipeStep.create({
        data: {
          recipeId,
          stepNo,
          sortOrder: step.sortOrder ?? index,
          translations: {
            create: {
              locale,
              instruction: step.instruction,
              tip: step.tip ?? null,
            },
          },
          ...(step.durationSeconds != null
            ? {
                timers: {
                  create: {
                    label: step.temperatureNote ?? `Bước ${stepNo}`,
                    durationSeconds: step.durationSeconds,
                    temperatureC: step.temperatureC ?? null,
                    temperatureNote: step.temperatureNote ?? null,
                  },
                },
              }
            : {}),
        },
        select: { id: true },
      });
      stepIdByNo.set(stepNo, created.id);
    }
    return stepIdByNo;
  }

  private async createImages(
    tx: Tx,
    recipeId: string,
    images: NonNullable<CreateRecipeInput["images"]>,
    stepIdByNo: Map<number, string>,
  ): Promise<string | null> {
    let primaryImageId: string | null = null;
    for (const [index, image] of images.entries()) {
      const role = image.role ?? "gallery";
      await tx.recipeImage.create({
        data: {
          recipeId,
          mediaAssetId: image.mediaAssetId,
          role,
          altText: image.altText ?? null,
          sortOrder: image.sortOrder ?? index,
          stepId: image.stepNo ? (stepIdByNo.get(image.stepNo) ?? null) : null,
        },
      });
      if (role === "hero" && !primaryImageId) primaryImageId = image.mediaAssetId;
    }
    return primaryImageId;
  }

  // ---------------------------------------------------------------- Hỗ trợ tra cứu

  private async resolveTermId(tx: Tx, typeCode: string, slug: string): Promise<string> {
    const term = await tx.taxonomyTerm.findFirst({
      where: { type: { code: typeCode }, slug },
      select: { id: true },
    });
    if (!term) throw missingTerms(typeCode, [slug]);
    return term.id;
  }

  private async resolveTermIds(tx: Tx, typeCode: string, slugs: string[]): Promise<string[]> {
    const unique = [...new Set(slugs)];
    if (unique.length === 0) return [];
    const rows = await tx.taxonomyTerm.findMany({
      where: { type: { code: typeCode }, slug: { in: unique } },
      select: { id: true, slug: true },
    });
    const found = new Map(rows.map((row) => [row.slug, row.id]));
    const missing = unique.filter((slug) => !found.has(slug));
    if (missing.length > 0) throw missingTerms(typeCode, missing);
    return unique.map((slug) => found.get(slug) as string);
  }

  /** Trục bổ sung (multi-select) — bỏ `food_type`/`cuisine` (đã là FK trên recipes). */
  private async resolveExtraTaxonomyIds(
    tx: Tx,
    refs: { typeCode: string; slug: string }[],
  ): Promise<string[]> {
    const filtered = refs.filter((ref) => ref.typeCode !== "food_type" && ref.typeCode !== "cuisine");
    if (filtered.length === 0) return [];
    const byType = new Map<string, string[]>();
    for (const ref of filtered) {
      byType.set(ref.typeCode, [...(byType.get(ref.typeCode) ?? []), ref.slug]);
    }
    const ids: string[] = [];
    for (const [typeCode, slugs] of byType) {
      ids.push(...(await this.resolveTermIds(tx, typeCode, slugs)));
    }
    return [...new Set(ids)];
  }

  private async resolveIngredientIds(
    tx: Tx,
    ingredients: CreateRecipeInput["ingredients"],
  ): Promise<Map<string, string>> {
    const slugs = [
      ...new Set(
        ingredients
          .map((ing) => ing.ingredientSlug)
          .filter((slug): slug is string => Boolean(slug)),
      ),
    ];
    if (slugs.length === 0) return new Map();
    const rows = await tx.ingredient.findMany({
      where: { slug: { in: slugs } },
      select: { id: true, slug: true },
    });
    const found = new Map(rows.map((row) => [row.slug, row.id]));
    const missing = slugs.filter((slug) => !found.has(slug));
    if (missing.length > 0) throw missingTerms("ingredientSlug", missing);
    return found;
  }

  private async resolveUnitIds(
    tx: Tx,
    ingredients: CreateRecipeInput["ingredients"],
  ): Promise<Map<string, string>> {
    const codes = [
      ...new Set(
        ingredients
          .map((ing) => ing.unitCode)
          .filter((code): code is string => Boolean(code)),
      ),
    ];
    if (codes.length === 0) return new Map();
    const rows = await tx.unit.findMany({
      where: { code: { in: codes } },
      select: { id: true, code: true },
    });
    const found = new Map(rows.map((row) => [row.code, row.id]));
    const missing = codes.filter((code) => !found.has(code));
    if (missing.length > 0) throw missingTerms("unitCode", missing);
    return found;
  }

  // ---------------------------------------------------------------- Ánh xạ DTO

  private pickTranslation<T extends { locale: string; title: string }>(
    translations: T[],
    locale: string,
  ): T | undefined {
    return translations.find((t) => t.locale === locale) ?? translations[0];
  }

  private toSummary(
    row: {
      id: string;
      slug: string;
      prepMinutes: number | null;
      cookMinutes: number | null;
      totalMinutes: number | null;
      baseServings: Prisma.Decimal;
      difficulty: RecipeSummaryDto["difficulty"];
      publishedAt: Date | null;
      translations: { locale: string; title: string; summary: string | null }[];
      primaryImage: { publicUrl: string | null; altTextDefault: string | null } | null;
      foodTypeTerm: { slug: string } | null;
      cuisineTerm: { slug: string } | null;
    },
    locale: string,
  ): RecipeSummaryDto {
    const translation = this.pickTranslation(row.translations, locale);
    return {
      id: row.id,
      slug: row.slug,
      title: translation?.title ?? row.slug,
      summary: translation?.summary ?? null,
      imageUrl: row.primaryImage?.publicUrl ?? null,
      imageAlt: row.primaryImage?.altTextDefault ?? null,
      prepMinutes: row.prepMinutes,
      cookMinutes: row.cookMinutes,
      totalMinutes: row.totalMinutes,
      baseServings: Number(row.baseServings),
      difficulty: row.difficulty,
      foodTypeSlug: row.foodTypeTerm?.slug ?? null,
      cuisineSlug: row.cuisineTerm?.slug ?? null,
      publishedAt: row.publishedAt,
    };
  }

  private toDetail(
    row: Prisma.RecipeGetPayload<{ include: ReturnType<PrismaRecipeRepository["detailInclude"]> }>,
    locale: string,
  ): RecipeDetailDto {
    const summary = this.toSummary(row, locale);
    const translation = this.pickTranslation(row.translations, locale);

    const ingredients: RecipeIngredientDto[] = row.ingredients.map((ing) => {
      const unit = ing.unit;
      const unitTranslation = unit
        ? this.pickTranslation(
            unit.translations.map((t) => ({ ...t, title: t.name })),
            locale,
          )
        : undefined;
      return {
        id: ing.id,
        displayName: ing.displayName,
        quantityType: ing.quantityType,
        quantityNumeric: ing.quantityNumeric?.toString() ?? null,
        quantityNumericMax: ing.quantityNumericMax?.toString() ?? null,
        quantityText: ing.quantityText,
        unitCode: unit?.code ?? null,
        unitName: unitTranslation?.title ?? null,
        unitSymbol: unitTranslation?.symbol ?? null,
        isRequired: ing.isRequired,
        preparationNote: ing.preparationNote,
        groupLabel: ing.groupLabel,
        sortOrder: ing.sortOrder,
      };
    });

    const steps: RecipeStepDto[] = row.steps.map((step) => ({
      id: step.id,
      stepNo: step.stepNo,
      sortOrder: step.sortOrder,
      instruction: step.translations[0]?.instruction ?? "",
      tip: step.translations[0]?.tip ?? null,
      timers: step.timers.map((timer) => ({
        label: timer.label,
        durationSeconds: timer.durationSeconds,
        temperatureC: timer.temperatureC?.toString() ?? null,
        temperatureNote: timer.temperatureNote,
      })),
      images: step.images.map((image) => ({
        id: image.id,
        url: image.mediaAsset.publicUrl,
        altText: image.altText ?? image.mediaAsset.altTextDefault,
      })),
    }));

    return {
      ...summary,
      status: row.status,
      verificationStatus: row.verificationStatus,
      defaultLocale: row.defaultLocale,
      description: translation?.description ?? null,
      seoTitle: translation?.seoTitle ?? null,
      seoDescription: translation?.seoDescription ?? null,
      authorId: row.authorId,
      editorId: row.editorId,
      primaryImage: row.primaryImage
        ? {
            id: row.primaryImage.id,
            url: row.primaryImage.publicUrl,
            altText: row.primaryImage.altTextDefault,
          }
        : null,
      images: row.images.map((image) => ({
        id: image.id,
        role: image.role,
        url: image.mediaAsset.publicUrl,
        altText: image.altText ?? image.mediaAsset.altTextDefault,
        sortOrder: image.sortOrder,
      })),
      ingredients,
      steps,
      nutrition: row.nutrition.map((n) => ({
        basis: n.basis,
        calories: n.calories?.toString() ?? null,
        proteinG: n.proteinG?.toString() ?? null,
        carbsG: n.carbsG?.toString() ?? null,
        fatG: n.fatG?.toString() ?? null,
        fiberG: n.fiberG?.toString() ?? null,
        sugarG: n.sugarG?.toString() ?? null,
        sodiumMg: n.sodiumMg?.toString() ?? null,
        dataSourceType: n.dataSourceType,
        sourceNote: n.sourceNote,
      })),
      allergens: row.allergens.map((allergen) => ({
        termId: allergen.allergenTermId,
        slug: allergen.term.slug,
        name: allergen.term.translations[0]?.name ?? allergen.term.slug,
        source: allergen.source,
      })),
      sources: row.sources.map(
        (link): RecipeSourceDto => ({
          id: link.sourceId,
          name: link.source.name,
          authorOrOrg: link.source.authorOrOrg,
          url: link.source.url,
          license: link.source.license,
          note: link.note,
          isPrimary: link.isPrimary,
        }),
      ),
      taxonomy: row.taxonomyTerms.map((link) => ({
        typeCode: link.term.type.code,
        slug: link.term.slug,
        name: link.term.translations[0]?.name ?? link.term.slug,
      })),
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }
}
