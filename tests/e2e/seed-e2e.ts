import { PrismaClient } from "@prisma/client";

import { runSystemSeed } from "../../prisma/seed/run";

/**
 * Seed cơ sở dữ liệu RIÊNG cho kiểm thử E2E (P12.4).
 *
 * - Chỉ chạy trên DB E2E (đọc `DATABASE_URL` truyền vào khi khởi động script).
 * - KHÔNG chạm dữ liệu production: chỉ tạo fixture với tiền tố `e2e-` và dọn lại
 *   đúng các bản ghi đó trước mỗi lần chạy (idempotent).
 * - KHÔNG tạo công thức giả để "làm đẹp" giao diện sản phẩm: đây là dữ liệu phục vụ
 *   kiểm thử, nằm trong DB E2E riêng, có tên gắn nhãn "(E2E)".
 */

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("[e2e-seed] Thiếu DATABASE_URL (phải trỏ tới CSDL E2E riêng).");
  process.exit(1);
}

const db = new PrismaClient({ datasources: { db: { url } }, log: ["warn", "error"] });

/** Tiền tố slug của mọi fixture E2E — dùng để dọn dẹp an toàn. */
const PREFIX = "e2e-";

interface IngredientDef {
  displayName: string;
  quantityNumeric?: string;
  unitCode?: string;
}

interface StepDef {
  instruction: string;
  tip?: string;
  durationSeconds?: number;
}

async function termId(typeCode: string, slug: string): Promise<string | null> {
  const term = await db.taxonomyTerm.findFirst({
    where: { type: { code: typeCode }, slug },
    select: { id: true },
  });
  return term?.id ?? null;
}

async function unitId(code: string): Promise<string | null> {
  const unit = await db.unit.findUnique({ where: { code }, select: { id: true } });
  return unit?.id ?? null;
}

interface CreateFixtureInput {
  slug: string;
  title: string;
  summary?: string;
  status: "draft" | "published";
  difficulty: "easy" | "medium" | "hard";
  baseServings: string;
  prepMinutes?: number;
  cookMinutes?: number;
  foodTypeSlug?: string | null;
  cuisineSlug?: string | null;
  authorId: string;
  ingredients: IngredientDef[];
  steps: StepDef[];
}

/** Tạo một công thức fixture (kèm nguyên liệu & bước) ở trạng thái yêu cầu. */
async function createFixture(input: CreateFixtureInput): Promise<string> {
  const locale = "vi";
  const foodTypeTermId = input.foodTypeSlug ? await termId("food_type", input.foodTypeSlug) : null;
  const cuisineTermId = input.cuisineSlug ? await termId("cuisine", input.cuisineSlug) : null;
  const units = await Promise.all(
    input.ingredients.map((ing) => (ing.unitCode ? unitId(ing.unitCode) : Promise.resolve(null))),
  );

  const totalMinutes =
    input.prepMinutes != null || input.cookMinutes != null
      ? (input.prepMinutes ?? 0) + (input.cookMinutes ?? 0)
      : null;

  const recipe = await db.recipe.create({
    data: {
      slug: input.slug,
      status: input.status,
      publishedAt: input.status === "published" ? new Date() : null,
      authorId: input.authorId,
      foodTypeTermId,
      cuisineTermId,
      difficulty: input.difficulty,
      prepMinutes: input.prepMinutes ?? null,
      cookMinutes: input.cookMinutes ?? null,
      totalMinutes,
      baseServings: input.baseServings,
      defaultLocale: locale,
      translations: {
        create: {
          locale,
          title: input.title,
          summary: input.summary ?? null,
        },
      },
      ingredients: {
        create: input.ingredients.map((ing, index) => ({
          displayName: ing.displayName,
          quantityType: "decimal" as const,
          quantityNumeric: ing.quantityNumeric ?? null,
          unitId: units[index] ?? null,
          isRequired: true,
          sortOrder: index,
        })),
      },
    },
    select: { id: true },
  });

  for (const [index, step] of input.steps.entries()) {
    const stepNo = index + 1;
    await db.recipeStep.create({
      data: {
        recipeId: recipe.id,
        stepNo,
        sortOrder: index,
        translations: {
          create: { locale, instruction: step.instruction, tip: step.tip ?? null },
        },
        ...(step.durationSeconds != null
          ? {
              timers: {
                create: { label: `Bước ${stepNo}`, durationSeconds: step.durationSeconds },
              },
            }
          : {}),
      },
    });
  }

  return recipe.id;
}

async function main(): Promise<void> {
  await runSystemSeed(db, (msg) => console.log(msg));

  // Dọn fixture E2E cũ (chỉ các slug có tiền tố `e2e-`).
  const removed = await db.recipe.deleteMany({ where: { slug: { startsWith: PREFIX } } });
  console.log(`[e2e-seed] dọn ${removed.count} công thức E2E cũ.`);

  const author = await db.user.upsert({
    where: { email: "e2e-editor@wale.invalid" },
    update: { role: "editor" },
    create: {
      email: "e2e-editor@wale.invalid",
      name: "Biên tập viên E2E",
      role: "editor",
      preferredLocale: "vi",
    },
    select: { id: true },
  });

  const foodTypes = await db.taxonomyTerm.findMany({
    where: { type: { code: "food_type" } },
    orderBy: { sortOrder: "asc" },
    select: { slug: true },
  });
  const cuisines = await db.taxonomyTerm.findMany({
    where: { type: { code: "cuisine" } },
    orderBy: { sortOrder: "asc" },
    select: { slug: true },
  });

  const foodTypeA = foodTypes[0]?.slug ?? null;
  const foodTypeB = foodTypes[1]?.slug ?? foodTypeA;
  const cuisine = cuisines[0]?.slug ?? null;

  await createFixture({
    slug: "e2e-canh-trung-ca-chua",
    title: "Canh trứng cà chua (E2E)",
    summary: "Món canh nhanh gọn cho bữa cơm gia đình.",
    status: "published",
    difficulty: "easy",
    baseServings: "4",
    prepMinutes: 10,
    cookMinutes: 15,
    foodTypeSlug: foodTypeA,
    cuisineSlug: cuisine,
    authorId: author.id,
    ingredients: [
      { displayName: "Trứng gà", quantityNumeric: "3", unitCode: "piece" },
      { displayName: "Cà chua", quantityNumeric: "300", unitCode: "g" },
      { displayName: "Hành lá", quantityNumeric: "20", unitCode: "g" },
    ],
    steps: [
      { instruction: "Đập trứng ra bát, đánh tan cùng chút muối." },
      { instruction: "Đun sôi nước, cho cà chua vào nấu cho mềm.", durationSeconds: 300 },
      {
        instruction: "Cho trứng vào, khuấy nhẹ, nêm nếm rồi tắt bếp.",
        durationSeconds: 120,
        tip: "Khuấy nhẹ tay để trứng không bị vón cục.",
      },
    ],
  });

  await createFixture({
    slug: "e2e-pho-bo",
    title: "Phở bò (E2E)",
    summary: "Bát phở bò nước dùng trong, thơm mùi gừng nướng.",
    status: "published",
    difficulty: "medium",
    baseServings: "2",
    prepMinutes: 20,
    cookMinutes: 90,
    foodTypeSlug: foodTypeB,
    cuisineSlug: cuisine,
    authorId: author.id,
    ingredients: [
      { displayName: "Bánh phở", quantityNumeric: "400", unitCode: "g" },
      { displayName: "Thịt bò", quantityNumeric: "300", unitCode: "g" },
      { displayName: "Hành tây", quantityNumeric: "1", unitCode: "piece" },
      { displayName: "Gừng", quantityNumeric: "30", unitCode: "g" },
    ],
    steps: [
      { instruction: "Nướng hành tây và gừng cho thơm rồi rửa sạch." },
      { instruction: "Hầm xương với gia vị trong thời gian dài để lấy nước dùng.", durationSeconds: 3600 },
      { instruction: "Trần bánh phở, xếp thịt bò thái mỏng rồi chan nước dùng nóng.", durationSeconds: 60 },
    ],
  });

  // Công thức ở trạng thái nháp — KHÔNG được hiển thị công khai (dùng để kiểm tra soft-404).
  await createFixture({
    slug: "e2e-ban-nhap",
    title: "Món nháp (E2E)",
    status: "draft",
    difficulty: "easy",
    baseServings: "2",
    authorId: author.id,
    ingredients: [{ displayName: "Nguyên liệu nháp", quantityNumeric: "1", unitCode: "g" }],
    steps: [{ instruction: "Bước nháp." }],
  });

  console.log("[e2e-seed] hoàn tất: đã tạo 3 công thức fixture (2 published, 1 draft).");
}

main()
  .then(async () => {
    await db.$disconnect();
  })
  .catch(async (error) => {
    console.error("[e2e-seed] thất bại:", error instanceof Error ? error.message : error);
    await db.$disconnect();
    process.exit(1);
  });
