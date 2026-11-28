import "server-only";

import { auth } from "@/auth";

import { APP_ROLES, type Actor, type Role } from "./authorization";

/**
 * Cầu nối phiên đăng nhập (P06/P07/P18).
 *
 * Auth.js (next-auth v5) đã được nối ở P18 (giải quyết B-P06-02). Hàm này là ĐIỂM DUY
 * NHẤT để lấy actor hiện tại cho tầng API / server component.
 *
 * Quy tắc an toàn:
 * - `actor = null` khi chưa đăng nhập, session không hợp lệ/hết hạn, hoặc vai trò không
 *   nằm trong danh sách hợp lệ → coi là KHÁCH (`can(null, …) === false`, ghi → 401).
 * - Vai trò LẤY TỪ DANH TÍNH ĐÃ XÁC THỰC (token đã ký), KHÔNG lấy từ request body/client.
 */

function toRole(value: unknown): Role | null {
  return typeof value === "string" && (APP_ROLES as readonly string[]).includes(value)
    ? (value as Role)
    : null;
}

export async function getCurrentActor(): Promise<Actor | null> {
  const session = await auth();
  const user = session?.user;
  if (!user?.id) return null;

  const role = toRole(user.role);
  if (!role) return null;

  return { id: user.id, role };
}

/** Lấy actor và vai trò, dùng khi cần kiểm tra role trực tiếp (hiếm khi cần). */
export async function getCurrentRole(): Promise<Role | null> {
  return (await getCurrentActor())?.role ?? null;
}
