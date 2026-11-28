import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AdminSignInForm } from "@/components/auth/admin-sign-in-form";
import { Badge } from "@/components/ui/badge";
import { Card, CardBody, CardTitle } from "@/components/ui/card";
import { hasRole } from "@/lib/auth/authorization";
import { getCurrentActor } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Đăng nhập quản trị",
  robots: { index: false, follow: false },
};

/**
 * Cổng đăng nhập QUẢN TRỊ (P07.1 §7.1.2, P18).
 *
 * WALE COOKING là website công thức cá nhân: khách truy cập KHÔNG cần tài khoản.
 * Chỉ chủ website (vai trò `editor`/`admin`) đăng nhập khu vực quản trị qua Auth.js
 * (Credentials). Không có đăng ký công khai.
 */
export default async function AdminSignInPage() {
  const actor = await getCurrentActor();
  if (hasRole(actor, "editor")) {
    redirect("/admin");
  }

  return (
    <Card>
      <CardBody className="flex flex-col items-start gap-4">
        <Badge variant="warning">Khu vực quản trị</Badge>
        <CardTitle as="h1" className="text-h2">
          Đăng nhập quản trị
        </CardTitle>
        <p className="text-body text-ink-muted">
          Cổng đăng nhập dành riêng cho chủ website. Khách truy cập không cần tài khoản để xem
          công thức, tìm kiếm hay lưu món yêu thích.
        </p>
        <div className="w-full">
          <AdminSignInForm />
        </div>
      </CardBody>
    </Card>
  );
}
