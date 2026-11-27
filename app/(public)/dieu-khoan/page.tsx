import type { Metadata } from "next";
import { PlaceholderPage } from "@/components/layout/placeholder-page";

export const metadata: Metadata = { title: "Điều khoản sử dụng" };

export default function TermsPage() {
  return (
    <PlaceholderPage
      title="Điều khoản sử dụng"
      description="Nội dung pháp lý sẽ được bổ sung khi có bản chính thức."
      phase="P09"
    />
  );
}
