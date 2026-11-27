import type { Metadata } from "next";
import { PlaceholderPage } from "@/components/layout/placeholder-page";

export const metadata: Metadata = { title: "Tài khoản" };

export default function AccountPage() {
  return (
    <PlaceholderPage
      title="Tài khoản"
      description="Hồ sơ, tuỳ chọn ăn uống và quản lý công thức đã lưu."
      phase="P07"
    />
  );
}
