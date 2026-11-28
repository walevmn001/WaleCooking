import type { Metadata } from "next";

import { Badge } from "@/components/ui/badge";
import { Card, CardBody, CardTitle } from "@/components/ui/card";
import { Link } from "@/components/ui/link";

export const metadata: Metadata = {
  title: "Quản trị",
  robots: { index: false, follow: false },
};

/** Bảng điều khiển quản trị (P07) — điểm vào cho module công thức. */
export default function AdminDashboardPage() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <header className="flex flex-col gap-2">
        <Badge variant="brand">P07</Badge>
        <h1 className="text-h2 text-ink">Bảng điều khiển quản trị</h1>
        <p className="text-body text-ink-muted">
          Quản lý nội dung công thức của WALE COOKING.
        </p>
      </header>

      <Card>
        <CardBody className="flex flex-col items-start gap-3">
          <CardTitle as="h2" className="text-h3">
            Công thức
          </CardTitle>
          <p className="text-body-sm text-ink-muted">
            Tạo bản nháp, chỉnh sửa, gửi duyệt, xuất bản, lưu trữ và xóa công thức.
          </p>
          <Link href="/admin/cong-thuc" appearance="button" variant="primary">
            Quản lý công thức
          </Link>
        </CardBody>
      </Card>

      <Card>
        <CardBody className="flex flex-col items-start gap-3">
          <CardTitle as="h2" className="text-h3">
            Danh mục
          </CardTitle>
          <p className="text-body-sm text-ink-muted">
            Quản lý danh mục phân loại: nhóm món, ẩm thực, bữa ăn, phương pháp, đặc điểm món,
            nguyên liệu chính.
          </p>
          <Link href="/admin/danh-muc" appearance="button" variant="outline">
            Quản lý danh mục
          </Link>
        </CardBody>
      </Card>
    </div>
  );
}
