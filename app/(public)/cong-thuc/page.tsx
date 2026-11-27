import type { Metadata } from "next";
import { PlaceholderPage } from "@/components/layout/placeholder-page";

export const metadata: Metadata = { title: "Công thức" };

export default function RecipesPage() {
  return (
    <PlaceholderPage
      title="Công thức"
      description="Kho công thức nấu ăn với tìm kiếm, lọc và sắp xếp."
      phase="P06"
    />
  );
}
