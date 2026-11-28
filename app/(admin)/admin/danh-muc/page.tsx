import type { Metadata } from "next";

import { AdminAccessNotice } from "@/components/admin/admin-access-notice";
import { CategoryTile } from "@/components/recipe/category-tile";
import { can } from "@/lib/auth/authorization";
import { getCurrentActor } from "@/lib/auth/session";
import { DISCOVERY_TAXONOMIES } from "@/lib/constants/taxonomy";
import { taxonomyService } from "@/lib/services";

export const metadata: Metadata = {
  title: "Quản lý danh mục",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

/**
 * Trang quản lý danh mục (P08 §P08.4) — điểm vào cho mọi trục phân loại khám phá.
 *
 * YÊU CẦU quyền `taxonomy:manage` (Admin). Khi Auth.js chưa nối, guest bị từ chối —
 * hiển thị thông báo quyền truy cập (KHÔNG giả lập người dùng).
 */
export default async function AdminTaxonomyPage() {
  const actor = await getCurrentActor();
  if (!can(actor, "taxonomy:manage")) {
    return <AdminAccessNotice title="Quản lý danh mục" />;
  }

  const groups = await Promise.all(
    DISCOVERY_TAXONOMIES.map(async (taxonomy) => {
      try {
        const { terms } = await taxonomyService.listTypeTerms(taxonomy.code, "vi", {
          includeInactive: true,
        });
        const activeCount = terms.filter((term) => term.isActive).length;
        return { taxonomy, total: terms.length, activeCount };
      } catch {
        return { taxonomy, total: 0, activeCount: 0 };
      }
    }),
  );

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6">
      <header className="flex flex-col gap-2">
        <h1 className="text-h2 text-ink">Quản lý danh mục</h1>
        <p className="text-body text-ink-muted">
          Tạo, sửa, lưu trữ danh mục phân loại công thức. Danh mục đang được công thức sử dụng
          sẽ KHÔNG xóa được — hãy lưu trữ để giữ liên kết dữ liệu.
        </p>
      </header>

      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {groups.map(({ taxonomy, total, activeCount }) => (
          <li key={taxonomy.code} className="flex">
            <CategoryTile
              name={taxonomy.label}
              description={`${total} danh mục (${activeCount} đang hoạt động)`}
              href={`/admin/danh-muc/${taxonomy.code}`}
              className="w-full"
            />
          </li>
        ))}
      </ul>
    </div>
  );
}
