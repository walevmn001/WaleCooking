import { PrismaClient, type AppRole } from "@prisma/client";

import { hashPassword } from "../lib/auth/password";

/**
 * Tạo / cập nhật tài khoản nhân sự quản trị (P18).
 *
 * QUY TRÌNH PROVISIONING AN TOÀN:
 * - KHÔNG có tài khoản mặc định, KHÔNG có mật khẩu mặc định, KHÔNG hardcode credential.
 * - Bắt buộc truyền thông tin qua biến môi trường của LỆNH chạy (không ghi vào Git):
 *     ADMIN_EMAIL     (bắt buộc)
 *     ADMIN_PASSWORD  (bắt buộc, ≥ 12 ký tự)
 *     ADMIN_ROLE      (tùy chọn: "admin" (mặc định) hoặc "editor")
 *     ADMIN_NAME      (tùy chọn)
 *     DATABASE_URL    (bắt buộc — CSDL đích)
 * - Mật khẩu được băm bằng scrypt (lib/auth/password.ts) trước khi lưu; KHÔNG lưu thô.
 *
 * Ví dụ (local, KHÔNG commit giá trị thật):
 *   DATABASE_URL="postgresql://…" ADMIN_EMAIL="admin@example.com" \
 *   ADMIN_PASSWORD="$(openssl rand -base64 18)" ADMIN_ROLE=admin \
 *   pnpm admin:create
 */

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("[create-admin] Thiếu DATABASE_URL — chỉ định CSDL đích khi chạy lệnh.");
  process.exit(1);
}

const email = (process.env.ADMIN_EMAIL ?? "").trim().toLowerCase();
const password = process.env.ADMIN_PASSWORD ?? "";
const roleInput = (process.env.ADMIN_ROLE ?? "admin").trim();
const name = (process.env.ADMIN_NAME ?? "").trim();

if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
  console.error("[create-admin] ADMIN_EMAIL không hợp lệ hoặc để trống.");
  process.exit(1);
}
if (password.length < 12) {
  console.error("[create-admin] ADMIN_PASSWORD phải dài tối thiểu 12 ký tự.");
  process.exit(1);
}
if (roleInput !== "admin" && roleInput !== "editor") {
  console.error('[create-admin] ADMIN_ROLE chỉ nhận "admin" hoặc "editor".');
  process.exit(1);
}
const role: AppRole = roleInput === "editor" ? "editor" : "admin";

const db = new PrismaClient({ datasources: { db: { url } }, log: ["warn", "error"] });

async function main(): Promise<void> {
  const passwordHash = await hashPassword(password);

  const user = await db.user.upsert({
    where: { email },
    update: {
      passwordHash,
      role,
      ...(name ? { name } : {}),
    },
    create: {
      email,
      passwordHash,
      role,
      ...(name ? { name } : {}),
      preferredLocale: "vi",
    },
    select: { id: true, email: true, role: true },
  });

  console.log(`[create-admin] Hoàn tất: ${user.email} (vai trò: ${user.role}).`);
}

main()
  .then(async () => {
    await db.$disconnect();
  })
  .catch(async (error) => {
    console.error("[create-admin] Thất bại:", error instanceof Error ? error.message : error);
    await db.$disconnect();
    process.exit(1);
  });
