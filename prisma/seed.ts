import { PrismaClient } from "@prisma/client";

import { runDevSeed, runSystemSeed } from "./seed/run";

/**
 * CLI seed: `pnpm db:seed`.
 * - Luôn chạy SEED HỆ THỐNG (idempotent).
 * - Chạy DỮ LIỆU PHÁT TRIỂN khi `SEED_DEV=1`.
 */

const prisma = new PrismaClient();

async function main(): Promise<void> {
  await runSystemSeed(prisma, (msg) => console.log(msg));

  if (process.env.SEED_DEV === "1") {
    console.log("[seed:dev] bật (SEED_DEV=1)…");
    await runDevSeed(prisma, (msg) => console.log(msg));
    console.log("[seed:dev] hoàn tất.");
  } else {
    console.log("[seed:dev] bỏ qua (đặt SEED_DEV=1 để tạo dữ liệu phát triển).");
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error("[seed] thất bại:", error instanceof Error ? error.message : error);
    await prisma.$disconnect();
    process.exit(1);
  });
