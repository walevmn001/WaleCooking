import type { Metadata } from "next";
import { PlaceholderPage } from "@/components/layout/placeholder-page";

export const metadata: Metadata = { title: "Yêu thích" };

export default function FavoritesPage() {
  return (
    <PlaceholderPage
      title="Yêu thích"
      description="Danh sách công thức bạn đã lưu. Cần đăng nhập để sử dụng."
      phase="P07"
    />
  );
}
