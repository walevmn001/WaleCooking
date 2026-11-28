import { describe, expect, it, vi } from "vitest";

// Chặn nạp Prisma ở unit test (module repositories tạo PrismaClient khi import).
vi.mock("@/lib/db/repositories", () => ({ repositories: {} }));

import type { Repositories } from "@/lib/db/repositories";
import type {
  CreateTermInput,
  TaxonomyRepository,
  TaxonomyTermWithCountDto,
  TaxonomyTypeDto,
  UpdateTermInput,
} from "@/lib/db/repositories/taxonomy.repository";
import {
  ForbiddenError,
  NotFoundError,
  UnauthorizedError,
  ValidationError,
} from "@/lib/errors/app-error";
import { TaxonomyService } from "@/lib/services/taxonomy.service";

const admin = { id: "u-admin", role: "admin" } as const;
const editor = { id: "u-editor", role: "editor" } as const;

const typeDto: TaxonomyTypeDto = {
  id: "ty",
  code: "food_type",
  isHierarchical: false,
  isMultiSelect: false,
  isRequired: false,
  sortOrder: 0,
};

function term(overrides: Partial<TaxonomyTermWithCountDto> = {}): TaxonomyTermWithCountDto {
  return {
    id: "t",
    slug: "term",
    typeCode: "food_type",
    parentId: null,
    icon: null,
    sortOrder: 0,
    isActive: true,
    name: "Term",
    description: null,
    recipeCount: 0,
    childCount: 0,
    ...overrides,
  };
}

type TaxonomyRepo = TaxonomyRepository;

function makeRepo(overrides: Partial<TaxonomyRepo> = {}): TaxonomyRepo {
  return {
    listTypes: vi.fn(async () => [typeDto]),
    findType: vi.fn(async () => typeDto),
    listTerms: vi.fn(async () => []),
    listTermsWithCounts: vi.fn(async () => []),
    findTerm: vi.fn(async () => null),
    findTermById: vi.fn(async () => null),
    countTerms: vi.fn(async () => 0),
    countActiveTermsByType: vi.fn(async () => ({})),
    countRecipeUsage: vi.fn(async () => 0),
    createTerm: vi.fn(async (input: CreateTermInput) =>
      term({ slug: input.slug, name: input.name, parentId: input.parentId ?? null }),
    ),
    updateTerm: vi.fn(async (id: string, input: UpdateTermInput) =>
      term({ id, name: input.name ?? "Term" }),
    ),
    setTermActive: vi.fn(async () => undefined),
    deleteTermById: vi.fn(async () => undefined),
    findTermIdsBySlugs: vi.fn(async () => new Map<string, string>()),
    ...overrides,
  };
}

function makeService(overrides: Partial<TaxonomyRepo> = {}): TaxonomyService {
  const deps = {
    taxonomy: makeRepo(overrides),
    unit: {},
    ingredient: {},
    recipe: {},
    media: {},
  } as unknown as Repositories;
  return new TaxonomyService(deps);
}

describe("P08 — TaxonomyService: đọc công khai", () => {
  it("listDiscoveryTaxonomies trả về cấu hình trục khám phá (không truy vấn DB)", () => {
    const service = makeService();
    const result = service.listDiscoveryTaxonomies();
    expect(result.length).toBeGreaterThan(0);
    expect(result.some((t) => t.code === "food_type")).toBe(true);
  });

  it("getCategoryBySegment dựng tổ tiên (gốc→cha) + cha + term con", async () => {
    const root = term({ id: "r", slug: "mon-viet", name: "Món Việt" });
    const child = term({ id: "c", slug: "mon-nuoc", name: "Món nước", parentId: "r" });
    const grand = term({ id: "g", slug: "pho", name: "Phở", parentId: "c" });
    const sibling = term({ id: "s", slug: "bun", name: "Bún", parentId: "c" });
    const service = makeService({
      listTermsWithCounts: vi.fn(async () => [root, child, grand, sibling]),
    });

    const detail = await service.getCategoryBySegment("nhom-mon", "pho");
    expect(detail.taxonomy.code).toBe("food_type");
    expect(detail.term.slug).toBe("pho");
    expect(detail.ancestors.map((t) => t.slug)).toEqual(["mon-viet", "mon-nuoc"]);
    expect(detail.parent?.slug).toBe("mon-nuoc");
    expect(detail.children).toEqual([]);
  });

  it("getCategoryBySegment: segment không thuộc khám phá → NotFoundError", async () => {
    const service = makeService();
    await expect(service.getCategoryBySegment("khong-ton-tai", "x")).rejects.toBeInstanceOf(
      NotFoundError,
    );
  });

  it("getCategoryBySegment: slug không tồn tại → NotFoundError", async () => {
    const service = makeService({
      listTermsWithCounts: vi.fn(async () => [term({ slug: "khac" })]),
    });
    await expect(service.getCategoryBySegment("nhom-mon", "khong-co")).rejects.toBeInstanceOf(
      NotFoundError,
    );
  });

  it("listDiscoveryGroups bỏ qua trục không có term", async () => {
    const listTermsWithCounts = vi.fn(async (typeCode: string) =>
      typeCode === "food_type" ? [term({ slug: "mon-chinh" })] : [],
    );
    const service = makeService({ listTermsWithCounts });
    const groups = await service.listDiscoveryGroups();
    expect(groups).toHaveLength(1);
    expect(groups[0].taxonomy.code).toBe("food_type");
  });
});

describe("P08 — TaxonomyService: ủy quyền quản trị", () => {
  it("guest → UnauthorizedError; editor (không có taxonomy:manage) → ForbiddenError", async () => {
    const service = makeService();
    await expect(
      service.createTerm(null, { typeCode: "meal_type", slug: "x", name: "X" }),
    ).rejects.toBeInstanceOf(UnauthorizedError);
    await expect(
      service.createTerm(editor, { typeCode: "meal_type", slug: "x", name: "X" }),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });

  it("admin tạo term và resolve parentSlug → parentId", async () => {
    const createTerm = vi.fn(async (input: CreateTermInput) =>
      term({ slug: input.slug, name: input.name, parentId: input.parentId ?? null }),
    );
    const service = makeService({
      findTerm: vi.fn(async () => term({ id: "p1", slug: "thit" })),
      createTerm,
    });

    const result = await service.createTerm(admin, {
      typeCode: "ingredient_category",
      slug: "thit-bo",
      name: "Thịt bò",
      parentSlug: "thit",
    });
    expect(result.slug).toBe("thit-bo");
    expect(createTerm).toHaveBeenCalledWith(expect.objectContaining({ parentId: "p1" }));
  });

  it("admin tạo term với parentSlug không tồn tại → ValidationError", async () => {
    const service = makeService({ findTerm: vi.fn(async () => null) });
    await expect(
      service.createTerm(admin, {
        typeCode: "ingredient_category",
        slug: "x",
        name: "X",
        parentSlug: "khong-co",
      }),
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it("updateTerm chặn đặt danh mục cha là chính nó", async () => {
    const service = makeService({
      findTermById: vi.fn(async () => term({ id: "self", slug: "self-slug" })),
      findTerm: vi.fn(async () => term({ id: "self", slug: "self-slug" })),
    });
    await expect(
      service.updateTerm(admin, "self", { parentSlug: "self-slug" }),
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it("archiveTerm/restoreTerm đặt lại trạng thái hoạt động", async () => {
    const setTermActive = vi.fn(async () => undefined);
    const service = makeService({
      findTermById: vi.fn(async () => term({ id: "t1", isActive: true })),
      setTermActive,
    });

    const archived = await service.archiveTerm(admin, "t1");
    expect(archived.isActive).toBe(false);
    expect(setTermActive).toHaveBeenCalledWith("t1", false);

    const restored = await service.restoreTerm(admin, "t1");
    expect(restored.isActive).toBe(true);
    expect(setTermActive).toHaveBeenCalledWith("t1", true);
  });
});

describe("P08 — TaxonomyService: xoá term an toàn", () => {
  it("chặn xoá khi công thức còn sử dụng", async () => {
    const service = makeService({
      findTermById: vi.fn(async () => term({ id: "t1" })),
      countRecipeUsage: vi.fn(async () => 3),
    });
    await expect(service.deleteTerm(admin, "t1")).rejects.toBeInstanceOf(ValidationError);
  });

  it("chặn xoá khi còn danh mục con", async () => {
    const service = makeService({
      findTermById: vi.fn(async () => term({ id: "t1" })),
      countRecipeUsage: vi.fn(async () => 0),
      listTerms: vi.fn(async () => [term({ id: "c1", parentId: "t1" })]),
    });
    await expect(service.deleteTerm(admin, "t1")).rejects.toBeInstanceOf(ValidationError);
  });

  it("xoá thành công khi không còn ràng buộc", async () => {
    const deleteTermById = vi.fn(async () => undefined);
    const service = makeService({
      findTermById: vi.fn(async () => term({ id: "t1" })),
      countRecipeUsage: vi.fn(async () => 0),
      listTerms: vi.fn(async () => []),
      deleteTermById,
    });

    await service.deleteTerm(admin, "t1");
    expect(deleteTermById).toHaveBeenCalledWith("t1");
  });

  it("editor không được xoá danh mục", async () => {
    const service = makeService();
    await expect(service.deleteTerm(editor, "t1")).rejects.toBeInstanceOf(ForbiddenError);
  });
});
