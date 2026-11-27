import type { Metadata } from "next";
import { PlaceholderPage } from "@/components/layout/placeholder-page";

export const metadata: Metadata = { title: "Chính sách bảo mật" };

export default function PrivacyPage() {
  return (
    <PlaceholderPage
      title="Chính sách bảo mật"
      description="Nội dung pháp lý sẽ được bổ sung khi có bản chính thức."
      phase="P09"
    />
  );
}
