import type { Metadata } from "next";
import { PlaceholderPage } from "@/components/layout/placeholder-page";

export const metadata: Metadata = { title: "Kiến thức nấu ăn" };

export default function KnowledgePage() {
  return (
    <PlaceholderPage
      title="Kiến thức nấu ăn"
      description="Bài viết, mẹo và hướng dẫn kỹ thuật nấu ăn."
      phase="P08"
    />
  );
}
