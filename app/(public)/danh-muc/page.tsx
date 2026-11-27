import type { Metadata } from "next";
import { PlaceholderPage } from "@/components/layout/placeholder-page";

export const metadata: Metadata = { title: "Danh mục" };

export default function CategoriesPage() {
  return (
    <PlaceholderPage
      title="Danh mục"
      description="Phân loại theo món ăn, vùng miền và phương pháp nấu."
      phase="P06"
    />
  );
}
