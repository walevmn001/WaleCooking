import NextAuth, { type DefaultSession } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { z } from "zod";

import { APP_ROLES, type Role } from "@/lib/auth/authorization";
import { verifyPassword } from "@/lib/auth/password";
import { prisma } from "@/lib/db/prisma";

/**
 * Auth.js (next-auth v5) — xác thực QUẢN TRỊ (P18, giải quyết B-P06-02).
 *
 * Quyết định kiến trúc (P18.1):
 * - **Provider: Credentials** (email + mật khẩu). Chỉ tài khoản nhân sự quản trị
 *   (vai trò `admin`/`editor`) đăng nhập được; KHÔNG có đăng ký công khai.
 * - **Session strategy: JWT** — BẮT BUỘC, vì Auth.js **không hỗ trợ database session**
 *   cho Credentials provider. Bảng `sessions/accounts` (P02) giữ nguyên cho OAuth sau này.
 * - Vai trò lấy từ `users.role` tại thời điểm đăng nhập và được ký trong JWT; KHÔNG bao
 *   giờ lấy role từ request body/client.
 */

/** Vai trò hợp lệ (khớp enum `app_role`). */
function isRole(value: unknown): value is Role {
  return typeof value === "string" && (APP_ROLES as readonly string[]).includes(value);
}

/** Chỉ nhân sự khu quản trị (admin/editor) được xác thực. */
function isAdminAreaRole(role: Role): boolean {
  return role === "admin" || role === "editor";
}

const credentialsSchema = z.object({
  email: z.string().trim().min(1).max(320).email(),
  password: z.string().min(1).max(1024),
});

declare module "next-auth" {
  interface Session {
    user: { id: string; role: Role } & DefaultSession["user"];
  }
  interface User {
    role: Role;
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  // JWT bắt buộc với Credentials (xem chú thích đầu file).
  session: { strategy: "jwt" },
  pages: { signIn: "/dang-nhap" },
  // Cho phép chạy sau proxy/host khác (local + Vercel). Không đọc từ client.
  trustHost: true,
  providers: [
    Credentials({
      name: "Quản trị",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Mật khẩu", type: "password" },
      },
      async authorize(rawCredentials) {
        const parsed = credentialsSchema.safeParse(rawCredentials);
        if (!parsed.success) return null;

        const email = parsed.data.email.toLowerCase();
        const user = await prisma.user.findUnique({ where: { email } });
        // Không có tài khoản / chưa cấp mật khẩu → từ chối (không nêu lý do cụ thể).
        if (!user?.passwordHash || !user.email) return null;

        const passwordOk = await verifyPassword(parsed.data.password, user.passwordHash);
        if (!passwordOk) return null;

        // Không tự nâng quyền: chỉ nhân sự quản trị mới được đăng nhập.
        if (!isAdminAreaRole(user.role)) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name ?? user.email,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    // Ghi id + role (từ tài khoản đã xác thực) vào token khi đăng nhập.
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = isRole(user.role) ? user.role : undefined;
      }
      return token;
    },
    // Chỉ phơi id/role HỢP LỆ ra session; nếu không hợp lệ → coi như khách.
    // (JWT của Auth.js có index signature nên `token.id`/`token.role` là `unknown`;
    //  ta thu hẹp kiểu tường minh thay vì module augmentation cho `next-auth/jwt`.)
    session({ session, token }) {
      const id = token.id;
      const role = token.role;
      if (typeof id === "string" && isRole(role)) {
        session.user.id = id;
        session.user.role = role;
      }
      return session;
    },
  },
});
