import type { Metadata } from "next";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = {
  title: "Quản trị",
  robots: { index: false, follow: false },
};

export default function AdminPage() {
  return (
    <div className="flex max-w-2xl flex-col items-start gap-3">
      <Badge variant="warning">Chưa triển khai</Badge>
      <h1 className="text-h2 text-ink">Bảng điều khiển quản trị</h1>
      <p className="text-body text-ink-muted">
        P05 chỉ dựng nền tảng layout quản trị. Nội dung dashboard, quản lý công thức và phân quyền
        sẽ được triển khai ở phase sau.
      </p>
    </div>
  );
}
