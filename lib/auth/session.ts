import "server-only";

import { auth } from "./auth";
import type { Actor, Role } from "./authorization";

/**
 * Cầu nối phiên đăng nhập (P06/P07/P07.1).
 *
 * Sử dụng Auth.js v5 qua `auth()` từ `./auth`. Khi chưa có provider/credentials,
 * `auth()` trả về `null` (guest). Mọi endpoint ghi sẽ nhận 401 — đúng hành vi an toàn.
 *
 * QUAN TRỌNG: KHÔNG giả lập người dùng đã đăng nhập. Actor lấy trực tiếp từ session
 * (đã được gán `id` + `role` qua callback trong `auth.ts`).
 */
export async function getCurrentActor(): Promise<Actor | null> {
  const session = await auth();
  if (!session?.user?.id) return null;
  return {
    id: session.user.id,
    role: session.user.role as Role,
  };
}

/** Lấy actor và vai trò, dùng khi cần kiểm tra role trực tiếp (hiếm khi cần). */
export async function getCurrentRole(): Promise<Role | null> {
  return (await getCurrentActor())?.role ?? null;
}
