import { Badge } from "@/components/ui/badge";
import { SiteLogo } from "@/components/layout/site-logo";

/**
 * Layout quản trị — CHỈ dựng nền tảng khung (aside + vùng nội dung).
 * Chưa triển khai dashboard/chức năng; phân quyền thực hiện ở phase sau.
 */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh bg-surface-muted">
      <aside
        aria-label="Điều hướng quản trị"
        className="hidden w-60 shrink-0 flex-col gap-4 border-r border-line-subtle bg-surface p-4 md:flex"
      >
        <SiteLogo variant="compact" />
        <Badge variant="warning">Khu vực quản trị</Badge>
        <p className="text-body-sm text-ink-muted">
          Nền tảng khung quản trị. Menu chức năng và dashboard sẽ được triển khai ở phase sau.
        </p>
      </aside>
      <main id="main-content" className="flex-1 p-4 sm:p-6">
        {children}
      </main>
    </div>
  );
}
