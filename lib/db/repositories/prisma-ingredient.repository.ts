import type { PrismaClient } from "@prisma/client";

import { ConflictError } from "@/lib/errors/app-error";
import { paginate } from "@/lib/validation/common";
import type {
  CreateIngredientInput,
  IngredientDto,
  IngredientRepository,
  ListIngredientsOptions,
} from "./ingredient.repository";

type IngredientRow = {
  id: string;
  slug: string;
  originalName: string | null;
  isCommon: boolean;
  translations: { name: string }[];
  category: { slug: string } | null;
};

/** Triển khai Prisma cho `IngredientRepository`. */
export class PrismaIngredientRepository implements IngredientRepository {
  constructor(private readonly db: PrismaClient) {}

  async list(options: ListIngredientsOptions) {
    const { locale, pagination } = options;
    const where = {
      ...(options.onlyCommon ? { isCommon: true } : {}),
      ...(options.categorySlug ? { category: { slug: options.categorySlug } } : {}),
      ...(options.search
        ? {
            OR: [
              { slug: { contains: options.search, mode: "insensitive" as const } },
              { originalName: { contains: options.search, mode: "insensitive" as const } },
              { translations: { some: { locale, name: { contains: options.search, mode: "insensitive" as const } } } },
            ],
          }
        : {}),
    };

    const [rows, total] = await this.db.$transaction([
      this.db.ingredient.findMany({
        where,
        orderBy: [{ isCommon: "desc" }, { slug: "asc" }],
        skip: (pagination.page - 1) * pagination.pageSize,
        take: pagination.pageSize,
        include: { translations: { where: { locale } }, category: { select: { slug: true } } },
      }),
      this.db.ingredient.count({ where }),
    ]);

    return paginate(rows.map((row) => this.toDto(row)), total, pagination);
  }

  async findBySlug(slug: string, locale: string): Promise<IngredientDto | null> {
    const row = await this.db.ingredient.findUnique({
      where: { slug },
      include: { translations: { where: { locale } }, category: { select: { slug: true } } },
    });
    return row ? this.toDto(row) : null;
  }

  /**
   * Tạo nguyên liệu + bản dịch trong MỘT transaction (P06 §8).
   * Nếu tạo bản dịch thất bại → rollback toàn bộ (không để nguyên liệu "nửa vời").
   */
  async createWithTranslation(input: CreateIngredientInput): Promise<IngredientDto> {
    const existing = await this.db.ingredient.findUnique({
      where: { slug: input.slug },
      select: { id: true },
    });
    if (existing) {
      throw new ConflictError(`Nguyên liệu với slug \`${input.slug}\` đã tồn tại.`);
    }

    return this.db.$transaction(async (tx) => {
      const created = await tx.ingredient.create({
        data: {
          slug: input.slug,
          categoryTermId: input.categoryTermId ?? null,
          isCommon: input.isCommon ?? false,
          translations: { create: { locale: input.locale, name: input.name } },
        },
        include: { translations: { where: { locale: input.locale } }, category: { select: { slug: true } } },
      });
      return this.toDto(created);
    });
  }

  async countAll(): Promise<number> {
    return this.db.ingredient.count();
  }

  private toDto(row: IngredientRow): IngredientDto {
    return {
      id: row.id,
      slug: row.slug,
      originalName: row.originalName,
      name: row.translations[0]?.name ?? row.slug,
      categorySlug: row.category?.slug ?? null,
      isCommon: row.isCommon,
    };
  }
}
