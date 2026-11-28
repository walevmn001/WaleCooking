import { redirect } from "next/navigation";

import { signOut } from "@/auth";
import { SiteLogo } from "@/components/layout/site-logo";
import { Badge } from "@/components/ui/badge";
import { hasRole } from "@/lib/auth/authorization";
import { getCurrentActor } from "@/lib/auth/session";

/**
 * Layout khu quản trị (P18).
 *
 * - GUARD phía server: khách (chưa đăng nhập) và tài khoản không thuộc khu quản trị
 *   (`role < editor`) bị CHUYỂN HƯỚNG về cổng đăng nhập. Việc kiểm quyền chi tiết theo
 *   từng chức năng vẫn được thực hiện ở mỗi trang (`can(actor, …)`) và ở tầng service
 *   (`requirePermission`) — đây là lớp phòng thủ bổ sung, không thay thế.
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const actor = await getCurrentActor();
  if (!actor || !hasRole(actor, "editor")) {
    redirect("/dang-nhap");
  }

  async function handleSignOut(): Promise<void> {
    "use server";
    await signOut({ redirectTo: "/dang-nhap" });
  }

  return (
    <div className="flex min-h-dvh bg-surface-muted">
      <aside
        aria-label="Điều hướng quản trị"
        className="hidden w-60 shrink-0 flex-col gap-4 border-r border-line-subtle bg-surface p-4 md:flex"
      >
        <SiteLogo variant="compact" />
        <Badge variant="warning">Khu vực quản trị</Badge>
        <p className="text-body-sm text-ink-muted">
          Đăng nhập với vai trò {actor.role === "admin" ? "Quản trị (Admin)" : "Biên tập (Editor)"}.
        </p>
        <form action={handleSignOut} className="mt-auto">
          <button
            type="submit"
            className="rounded-md border border-line-subtle px-3 py-1.5 text-body-sm text-ink hover:bg-surface-muted"
          >
            Đăng xuất
          </button>
        </form>
      </aside>
      <main id="main-content" className="flex-1 p-4 sm:p-6">
        {children}
      </main>
    </div>
  );
}
