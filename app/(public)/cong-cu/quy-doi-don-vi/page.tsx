import type { Metadata } from "next";
import { Container } from "@/components/layout/container";
import { Breadcrumb } from "@/components/navigation/breadcrumb";
import { UnitConverter } from "@/components/kitchen/unit-converter";

export const metadata: Metadata = {
  title: "Quy đổi đơn vị",
  description:
    "Quy đổi đơn vị khối lượng, thể tích và nhiệt độ dùng trong nấu ăn theo hệ số chuyển đổi xác định.",
};

/** Trang quy đổi đơn vị (P10.2). */
export default function UnitConverterPage() {
  return (
    <Container size="default" className="py-8 sm:py-12">
      <Breadcrumb
        items={[
          { label: "Trang chủ", href: "/" },
          { label: "Công cụ nhà bếp", href: "/cong-cu" },
          { label: "Quy đổi đơn vị" },
        ]}
      />

      <header className="mt-6 flex flex-col gap-2">
        <h1 className="text-h1 text-ink">Quy đổi đơn vị</h1>
        <p className="max-w-prose text-body text-ink-muted">
          Quy đổi trong cùng nhóm đại lượng theo hệ số xác định. Không quy đổi khối lượng sang thể
          tích vì thiếu tỷ trọng tin cậy.
        </p>
      </header>

      <UnitConverter className="mt-8" />
    </Container>
  );
}
