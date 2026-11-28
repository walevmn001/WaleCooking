import { handlers } from "@/auth";

/**
 * Route handler của Auth.js (P18).
 * `GET/POST /api/auth/*` — xử lý đăng nhập, đăng xuất, session, callback.
 * Chạy ở Node runtime (mặc định) vì `authorize()` truy vấn Prisma + băm scrypt.
 */
export const { GET, POST } = handlers;
