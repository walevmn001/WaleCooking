import type { Metadata } from "next";
import { PlaceholderPage } from "@/components/layout/placeholder-page";

export const metadata: Metadata = { title: "Chính sách bản quyền nội dung" };

export default function CopyrightPage() {
  return (
    <PlaceholderPage
      title="Chính sách bản quyền nội dung"
      description="Quy định về nguồn gốc và bản quyền nội dung công thức (FR-18)."
      phase="P09"
    />
  );
}
