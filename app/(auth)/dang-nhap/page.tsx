import type { Metadata } from "next";
import { Card, CardBody, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = {
  title: "Đăng nhập quản trị",
  robots: { index: false, follow: false },
};

/**
 * Cổng đăng nhập QUẢN TRỊ (P07.1 §7.1.2).
 *
 * WALE COOKING là website công thức cá nhân: khách truy cập KHÔNG cần tài khoản.
 * Chỉ chủ website (vai trò `editor`/`admin`) đăng nhập khu vực quản trị.
 *
 * Auth.js (database-session) chưa được nối credential thật — xem
 * `docs/P07_1/EXTERNAL_VERIFICATION.md`. Trang này KHÔNG hiển thị form giả để tránh
 * gây hiểu lầm là đăng nhập đã hoạt động.
 */
export default function AdminSignInPage() {
  return (
    <Card>
      <CardBody className="flex flex-col items-start gap-3">
        <Badge variant="warning">Khu vực quản trị</Badge>
        <CardTitle as="h1" className="text-h2">
          Đăng nhập quản trị
        </CardTitle>
        <p className="text-body text-ink-muted">
          Đây là cổng đăng nhập dành riêng cho chủ website. Khách truy cập không cần tài
          khoản để xem công thức, tìm kiếm hay lưu món yêu thích.
        </p>
        <p className="text-body-sm text-ink-subtle">
          Xác thực (Auth.js) chưa được cấu hình trong môi trường này. Khi hoàn tất cấu hình
          biến môi trường, biểu mẫu đăng nhập sẽ được bật tại đây.
        </p>
      </CardBody>
    </Card>
  );
}
