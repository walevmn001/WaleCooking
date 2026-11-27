import { BookOpen, Heart, Search, Utensils } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Link } from "@/components/ui/link";
import { Container } from "@/components/layout/container";
import { siteConfig } from "@/lib/constants/site";

const quickLinks = [
  { href: "/cong-thuc", label: "Công thức", description: "Kho công thức nấu ăn", icon: Utensils },
  { href: "/danh-muc", label: "Danh mục", description: "Món ăn, vùng miền, phương pháp", icon: BookOpen },
  { href: "/tim-kiem", label: "Tìm kiếm", description: "Tìm theo nguyên liệu", icon: Search },
  { href: "/yeu-thich", label: "Yêu thích", description: "Công thức đã lưu", icon: Heart },
];

export default function HomePage() {
  return (
    <>
      <Container className="py-10 sm:py-16">
        <section className="flex flex-col items-start gap-5">
          <Badge variant="brand">Nền tảng giao diện P05</Badge>
          <h1 className="max-w-2xl text-display text-ink">{siteConfig.name}</h1>
          <p className="max-w-prose text-body-lg text-ink-muted">{siteConfig.description}</p>
          <div className="flex flex-wrap gap-3">
            <Link href="/cong-thuc" appearance="button" variant="primary" size="lg">
              Khám phá công thức
            </Link>
            <Link href="/gioi-thieu" appearance="button" variant="outline" size="lg">
              Tìm hiểu thêm
            </Link>
          </div>
        </section>
      </Container>

      <Container className="pb-12">
        <section aria-labelledby="quick-links-heading" className="flex flex-col gap-5">
          <h2 id="quick-links-heading" className="text-h2 text-ink">
            Bắt đầu khám phá
          </h2>
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {quickLinks.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    appearance="unstyled"
                    className="flex h-full flex-col gap-2 rounded-lg border border-line-subtle bg-surface p-5 shadow-sm transition-[transform,box-shadow] duration-base hover:-translate-y-0.5 hover:shadow-lg focus-visible:outline-none focus-visible:focus-ring"
                  >
                    <Icon className="size-6 text-primary" aria-hidden="true" />
                    <span className="text-h4 text-ink">{item.label}</span>
                    <span className="text-body-sm text-ink-muted">{item.description}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      </Container>

      <Container className="pb-16">
        <section className="rounded-lg border border-dashed border-line-strong bg-surface-muted p-6">
          <h2 className="text-h4 text-ink">Trạng thái các module</h2>
          <p className="mt-2 max-w-prose text-body-sm text-ink-muted">
            P05 đã dựng xong nền tảng giao diện dùng chung (shared UI) và bộ khung ứng dụng
            (header, điều hướng, footer, layout). Nội dung và chức năng của từng trang sẽ được
            triển khai ở các phase sau; các liên kết hiện dẫn tới trang đánh dấu “Chưa triển khai”.
          </p>
        </section>
      </Container>
    </>
  );
}
