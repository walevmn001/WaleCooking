import "server-only";

import { PrismaClient } from "@prisma/client";
import { serverEnv } from "@/lib/config/env";

/**
 * Prisma client dùng chung (P06 §3).
 *
 * - Singleton: tránh tạo nhiều `PrismaClient` khi Next.js hot-reload ở development
 *   (gắn vào `globalThis`). Ở production chỉ tạo một instance.
 * - `log` chỉ bật mức `warn`/`error` — KHÔNG bật mức `query` để tránh ghi dữ liệu
 *   truy vấn (có thể chứa thông tin nhạy cảm) ra log.
 * - Chỉ dùng ở phía server (Server Components, Route Handlers, Service layer).
 *   UI component KHÔNG được import module này — truy cập dữ liệu qua service/repository.
 */

function createPrismaClient(): PrismaClient {
  // Kích hoạt kiểm tra biến môi trường ngay khi tạo client (lỗi an toàn, không lộ giá trị).
  serverEnv();

  return new PrismaClient({
    log: [
      { emit: "stdout", level: "warn" },
      { emit: "stdout", level: "error" },
    ],
  });
}

const globalForPrisma = globalThis as unknown as {
  __walePrisma?: PrismaClient;
};

export const prisma: PrismaClient = globalForPrisma.__walePrisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.__walePrisma = prisma;
}
