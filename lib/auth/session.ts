import "server-only";

import type { Actor, Role } from "./authorization";

/**
 * Cầu nối phiên đăng nhập (P06/P07).
 *
 * Auth.js CHƯA được nối đầy đủ trong phạm vi P06 (P06 chỉ làm nền dữ liệu; P02 đã
 * thiết kế bảng `sessions` kiểu database-session). Hàm này là ĐIỂM DUY NHẤT để lấy
 * actor hiện tại cho tầng API.
 *
 * QUAN TRỌNG: KHÔNG giả lập người dùng đã đăng nhập. Khi Auth.js chưa nối, hàm trả
 * về `null` (guest). Mọi endpoint ghi sẽ nhận 401 — đúng hành vi an toàn.
 *
 * Khi nối Auth.js ở phase sau, chỉ cần thay thân hàm bằng `auth()` và map sang Actor.
 */
export async function getCurrentActor(): Promise<Actor | null> {
  // TODO(P08+): thay bằng `const session = await auth();` rồi map sang Actor.
  return null;
}

/** Lấy actor và vai trò, dùng khi cần kiểm tra role trực tiếp (hiếm khi cần). */
export async function getCurrentRole(): Promise<Role | null> {
  return (await getCurrentActor())?.role ?? null;
}
