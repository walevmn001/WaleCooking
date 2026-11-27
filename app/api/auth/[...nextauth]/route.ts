import { handlers } from "@/lib/auth/auth";

/**
 * Auth.js v5 route handler — `/api/auth/*`.
 *
 * Cung cấp các endpoint đăng nhập/đăng xuất/session theo kiến trúc P02.
 * Xem `lib/auth/auth.ts` để cấu hình providers.
 */
export const { GET, POST } = handlers;
