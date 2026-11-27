import type { Metadata } from "next";
import { PlaceholderPage } from "@/components/layout/placeholder-page";

export const metadata: Metadata = { title: "Giới thiệu" };

export default function AboutPage() {
  return (
    <PlaceholderPage
      title="Giới thiệu"
      description="Thông tin về WALE COOKING và sứ mệnh của dự án."
      phase="P08"
    />
  );
}
