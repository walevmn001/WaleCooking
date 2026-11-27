import type { Metadata } from "next";

import { AdminAccessNotice } from "@/components/admin/admin-access-notice";
import { Pagination } from "@/components/navigation/pagination";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Link } from "@/components/ui/link";
import { can } from "@/lib/auth/authorization";
import { getCurrentActor } from "@/lib/auth/session";
import {
  RECIPE_STATUS_LABEL,
  RECIPE_STATUS_VARIANT,
  toAdminRecipeRow,
} from "@/lib/presentation/recipe-view";
import { recipeService } from "@/lib/services";

export const metadata: Metadata = {
  title: "Quản lý công thức",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

const STATUS_FILTERS = [
  { value: "any", label: "Tất cả" },
  { value: "draft", label: "Bản nháp" },
  { value: "in_review", label: "Chờ duyệt" },
  { value: "published", label: "Đã xuất bản" },
  { value: "archived", label: "Đã lưu trữ" },
] as const;

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "Asia/Ho_Chi_Minh",
  }).format(date);
}

function statusHref(status: string, page = 1): string {
  const params = new URLSearchParams();
  if (status && status !== "any") params.set("status", status);
  if (page > 1) params.set("page", String(page));
  const qs = params.toString();
  return qs ? `/admin/cong-thuc?${qs}` : "/admin/cong-thuc";
}

interface AdminRecipesPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

/**
 * Danh sách công thức cho quản trị (P07 §13/§16).
 *
 * YÊU CẦU quyền `recipe:read:draft` (Editor/Admin). Khi Auth.js chưa nối, guest luôn
 * bị từ chối — hiển thị thông báo quyền truy cập (KHÔNG giả lập người dùng).
 */
export default async function AdminRecipesPage({ searchParams }: AdminRecipesPageProps) {
  const actor = await getCurrentActor();
  if (!can(actor, "recipe:read:draft")) {
    return <AdminAccessNotice title="Quản lý công thức" />;
  }

  const sp = await searchParams;
  const statusParam = Array.isArray(sp.status) ? sp.status[0] : sp.status;
  const pageParam = Array.isArray(sp.page) ? sp.page[0] : sp.page;
  const data = await recipeService.listAdmin(actor, { ...sp, status: statusParam ?? "any", page: pageParam });

  const currentStatus = statusParam ?? "any";
  const rows = data.items.map(toAdminRecipeRow);

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-h2 text-ink">Quản lý công thức</h1>
        <Link href="/admin/cong-thuc/moi" appearance="button" variant="primary">
          Tạo công thức
        </Link>
      </div>

      <nav aria-label="Lọc theo trạng thái" className="flex flex-wrap gap-2">
        {STATUS_FILTERS.map((filter) => (
          <Link
            key={filter.value}
            href={statusHref(filter.value)}
            appearance="unstyled"
            aria-current={currentStatus === filter.value ? "page" : undefined}
            className={
              currentStatus === filter.value
                ? "rounded-pill bg-primary px-3 py-1.5 text-body-sm font-semibold text-ink-inverse"
                : "rounded-pill border border-line-subtle px-3 py-1.5 text-body-sm text-ink hover:bg-surface-muted"
            }
          >
            {filter.label}
          </Link>
        ))}
      </nav>

      {rows.length === 0 ? (
        <EmptyState
          title="Chưa có công thức"
          description="Chưa có công thức nào ở trạng thái này. Hãy tạo công thức mới để bắt đầu."
        />
      ) : (
        <div className="overflow-x-auto rounded-lg border border-line-subtle bg-surface">
          <table className="w-full min-w-[40rem] border-collapse text-left">
            <caption className="sr-only">Danh sách công thức</caption>
            <thead>
              <tr className="border-b border-line-subtle text-body-sm text-ink-muted">
                <th scope="col" className="px-4 py-3 font-semibold">
                  Tên công thức
                </th>
                <th scope="col" className="px-4 py-3 font-semibold">
                  Trạng thái
                </th>
                <th scope="col" className="px-4 py-3 font-semibold">
                  Cập nhật
                </th>
                <th scope="col" className="px-4 py-3 font-semibold">
                  <span className="sr-only">Hành động</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-b border-line-subtle last:border-b-0">
                  <td className="px-4 py-3">
                    <div className="flex flex-col">
                      <span className="text-body font-semibold text-ink">{row.title}</span>
                      <span className="text-caption text-ink-subtle">/{row.slug}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={RECIPE_STATUS_VARIANT[row.status]}>
                      {RECIPE_STATUS_LABEL[row.status]}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-body-sm text-ink-muted">{formatDate(row.updatedAt)}</td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/admin/cong-thuc/${row.id}/sua`} appearance="inline">
                      Sửa
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Pagination
        page={data.page}
        totalPages={data.totalPages}
        hrefFor={(page) => statusHref(currentStatus, page)}
      />
    </div>
  );
}
