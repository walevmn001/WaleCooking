import "server-only";

import NextAuth, { type DefaultSession } from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";

import { prisma } from "@/lib/db/prisma";
import type { Role } from "./authorization";

/**
 * Auth.js v5 — cấu hình đăng nhập và phiên (P02 §AUTHORIZATION_SECURITY, P07.1).
 *
 * - Adapter: Prisma (bảng `users`, `accounts`, `sessions`, `verification_tokens`
 *   đã có sẵn trong schema P06).
 * - Chiến lược phiên: `database` (lưu session trong DB theo P02).
 * - Providers: được thêm khi có credentials thật (OAuth GitHub/Google hoặc
 *   Credentials cho môi trường phát triển). KHÔNG giả lập người dùng đã đăng nhập.
 *
 * Khi chưa có provider/credentials, `auth()` trả về `null` → mọi endpoint ghi
 * nhận 401 (đúng hành vi an toàn fail-closed).
 */

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: Role;
    } & DefaultSession["user"];
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "database" },
  providers: [
    // TODO(P08+): thêm OAuth providers khi có credentials:
    //   GitHub, Google,… cấu hình qua env (AUTH_GITHUB_ID/SECRET, …).
    // Credentials provider chỉ dùng cho môi trường phát triển/test cục bộ,
    // KHÔNG bật ở production.
  ],
  pages: {
    signIn: "/dang-nhap",
  },
  callbacks: {
    /** Gắn `id` và `role` vào session.user để tầng API dùng cho RBAC. */
    async session({ session, user }) {
      if (session.user && user?.id) {
        const full = await prisma.user.findUnique({
          where: { id: user.id },
          select: { id: true, role: true },
        });
        session.user.id = full?.id ?? user.id;
        session.user.role = (full?.role as Role) ?? "user";
      }
      return session;
    },
  },
  // Bật debug chỉ ở môi trường development (không log ở production).
  debug: process.env.NODE_ENV === "development",
});
