import type { Metadata } from "next";
import { Container } from "@/components/layout/container";
import { Breadcrumb } from "@/components/navigation/breadcrumb";
import { IngredientSearch } from "@/components/kitchen/ingredient-search";

export const metadata: Metadata = {
  title: "Tìm món theo nguyên liệu",
  description:
    "Nhập những nguyên liệu bạn đang có để tìm công thức phù hợp, kèm nguyên liệu còn thiếu.",
};

/** Trang tìm công thức theo nguyên liệu (P10.3/P10.4). */
export default function IngredientDiscoveryPage() {
  return (
    <Container className="py-8 sm:py-12">
      <Breadcrumb
        items={[
          { label: "Trang chủ", href: "/" },
          { label: "Công cụ nhà bếp", href: "/cong-cu" },
          { label: "Tìm món theo nguyên liệu" },
        ]}
      />

      <header className="mt-6 flex flex-col gap-2">
        <h1 className="text-h1 text-ink">Tìm món theo nguyên liệu</h1>
        <p className="max-w-prose text-body text-ink-muted">
          Nhập nguyên liệu bạn đang có. Kết quả hiển thị rõ nguyên liệu đã có, còn thiếu và tỷ lệ
          khớp tính từ dữ liệu công thức thực tế.
        </p>
      </header>

      <IngredientSearch className="mt-8" />
    </Container>
  );
}
