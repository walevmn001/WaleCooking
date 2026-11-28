import "server-only";

import { PrismaClient } from "@prisma/client";
import { serverEnv } from "@/lib/config/env";

/**
 * Prisma client dùng chung (P06 §3).
 *
 * - **Lazy (P12.2 / sửa FIND-04):** client CHỈ được tạo ở lần truy cập đầu tiên
 *   (thông qua `Proxy`), KHÔNG tạo ở phạm vi module. Nhờ đó `next build` không còn
 *   cần `DATABASE_URL` cho các route/module không thực sự truy vấn database — sửa
 *   lỗi Vercel "Failed to collect configuration for /api/v1/admin/recipes".
 *   Kiểm tra biến môi trường (`serverEnv()`) vẫn được thực thi, nhưng đúng thời điểm
 *   thực sự kết nối — không bị bỏ qua.
 * - Singleton: tránh tạo nhiều `PrismaClient` khi Next.js hot-reload ở development
 *   (gắn vào `globalThis`). Ở production chỉ tạo một instance (giữ trong closure).
 * - `log` chỉ bật mức `warn`/`error` — KHÔNG bật mức `query` để tránh ghi dữ liệu
 *   truy vấn (có thể chứa thông tin nhạy cảm) ra log.
 * - Chỉ dùng ở phía server (Server Components, Route Handlers, Service layer).
 *   UI component KHÔNG được import module này — truy cập dữ liệu qua service/repository.
 */

function createPrismaClient(): PrismaClient {
  // Kích hoạt kiểm tra biến môi trường ngay trước khi tạo client (lỗi an toàn, không lộ giá trị).
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

let cachedClient: PrismaClient | null = null;

/** Tạo (một lần) và trả về `PrismaClient` — chỉ chạy khi thực sự có truy vấn. */
function getPrismaClient(): PrismaClient {
  if (cachedClient) return cachedClient;

  cachedClient = globalForPrisma.__walePrisma ?? createPrismaClient();

  if (process.env.NODE_ENV !== "production") {
    globalForPrisma.__walePrisma = cachedClient;
  }

  return cachedClient;
}

/**
 * Proxy lazy: mọi `prisma.<model>.<op>(...)` sẽ khởi tạo client ở lần dùng đầu tiên.
 * Getter của Prisma được gọi với `this` = client thật (không truyền `receiver` proxy)
 * để tránh đệ quy và bảo toàn ràng buộc `this` của các hàm như `$transaction`.
 */
export const prisma: PrismaClient = new Proxy({} as PrismaClient, {
  get(_target, property) {
    const client = getPrismaClient();
    const value = Reflect.get(client, property);
    return typeof value === "function" ? value.bind(client) : value;
  },
});
