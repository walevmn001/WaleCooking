import { randomUUID } from "node:crypto";

import { PrismaClient } from "@prisma/client";

/**
 * PrismaClient dùng cho test tích hợp — trỏ tới `TEST_DATABASE_URL`.
 * Không dùng chung client với ứng dụng (tránh tác động dữ liệu dev).
 */
const url = process.env.TEST_DATABASE_URL;

if (!url) {
  throw new Error(
    "[integration] Thiếu TEST_DATABASE_URL. Đặt biến này (xem .env.example) hoặc thêm vào .env.",
  );
}

export const testDb = new PrismaClient({
  datasources: { db: { url } },
  log: ["warn", "error"],
});

/** Sinh slug/giá trị duy nhất cho mỗi test (tránh trùng dữ liệu giữa các lần chạy). */
export function uniqueSuffix(): string {
  return randomUUID().slice(0, 8);
}

export function uniqueSlug(prefix: string): string {
  return `${prefix}-${uniqueSuffix()}`;
}
