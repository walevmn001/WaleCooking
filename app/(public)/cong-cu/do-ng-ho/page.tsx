import type { Metadata } from "next";
import { Container } from "@/components/layout/container";
import { Breadcrumb } from "@/components/navigation/breadcrumb";
import { MultiTimer } from "@/components/kitchen/multi-timer";

export const metadata: Metadata = {
  title: "Đồng hồ đếm ngược",
  description:
    "Tạo nhiều đồng hồ đếm ngược cùng lúc cho các bước nấu. Có tạm dừng, đặt lại và cảnh báo khi hết giờ.",
};

/** Trang nhiều đồng hồ đếm ngược (P10.1). */
export default function TimersPage() {
  return (
    <Container size="default" className="py-8 sm:py-12">
      <Breadcrumb
        items={[
          { label: "Trang chủ", href: "/" },
          { label: "Công cụ nhà bếp", href: "/cong-cu" },
          { label: "Đồng hồ đếm ngược" },
        ]}
      />

      <header className="mt-6 flex flex-col gap-2">
        <h1 className="text-h1 text-ink">Đồng hồ đếm ngược</h1>
        <p className="max-w-prose text-body text-ink-muted">
          Theo dõi nhiều bước nấu cùng lúc. Đồng hồ vẫn đúng khi bạn chuyển tab hoặc khoá màn hình,
          và vẫn còn khi tải lại trang.
        </p>
      </header>

      <MultiTimer className="mt-8" />
    </Container>
  );
}
