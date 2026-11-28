import type { Metadata } from "next";
import type { ReactNode } from "react";
import { ArrowLeftRight, ChefHat, Search, Timer } from "lucide-react";
import { Container } from "@/components/layout/container";
import { Breadcrumb } from "@/components/navigation/breadcrumb";
import { Card, CardBody } from "@/components/ui/card";
import { Link } from "@/components/ui/link";

export const metadata: Metadata = {
  title: "Công cụ nhà bếp",
  description:
    "Bộ công cụ hỗ trợ nấu ăn của WALE COOKING: chế độ nấu, nhiều đồng hồ đếm ngược, quy đổi đơn vị và tìm món theo nguyên liệu đang có.",
};

interface ToolLink {
  title: string;
  description: string;
  href: string;
  icon: ReactNode;
}

const tools: ToolLink[] = [
  {
    title: "Chế độ nấu",
    description:
      "Mở công thức và bấm “Bắt đầu nấu” để theo dõi từng bước với chữ lớn, dễ đọc khi đang đứng bếp.",
    href: "/cong-thuc",
    icon: <ChefHat className="size-6" aria-hidden="true" />,
  },
  {
    title: "Đồng hồ đếm ngược",
    description: "Tạo nhiều đồng hồ cùng lúc cho các bước nấu khác nhau, có cảnh báo khi hết giờ.",
    href: "/cong-cu/do-ng-ho",
    icon: <Timer className="size-6" aria-hidden="true" />,
  },
  {
    title: "Quy đổi đơn vị",
    description: "Quy đổi khối lượng, thể tích và nhiệt độ theo hệ số xác định.",
    href: "/cong-cu/quy-doi-don-vi",
    icon: <ArrowLeftRight className="size-6" aria-hidden="true" />,
  },
  {
    title: "Tìm món theo nguyên liệu",
    description: "Nhập những nguyên liệu bạn đang có để tìm công thức phù hợp.",
    href: "/cong-cu/tim-theo-nguyen-lieu",
    icon: <Search className="size-6" aria-hidden="true" />,
  },
];

/** Trang hub Công cụ nhà bếp (P10.4) — lối vào rõ ràng cho các công cụ hỗ trợ nấu ăn. */
export default function KitchenToolsPage() {
  return (
    <Container className="py-8 sm:py-12">
      <Breadcrumb items={[{ label: "Trang chủ", href: "/" }, { label: "Công cụ nhà bếp" }]} />

      <header className="mt-6 flex flex-col gap-2">
        <h1 className="text-h1 text-ink">Công cụ nhà bếp</h1>
        <p className="max-w-prose text-body text-ink-muted">
          Những công cụ nhỏ giúp bạn chuẩn bị nguyên liệu đúng định lượng và làm theo hướng dẫn
          thuận tiện hơn trong lúc nấu.
        </p>
      </header>

      <ul className="mt-8 grid gap-5 sm:grid-cols-2">
        {tools.map((tool) => (
          <li key={tool.href}>
            <Card as="article" interactive className="h-full">
              <CardBody className="flex flex-col gap-3">
                <span
                  className="inline-flex size-12 items-center justify-center rounded-lg bg-primary-subtle text-primary"
                  aria-hidden="true"
                >
                  {tool.icon}
                </span>
                <h2 className="text-h4 text-ink">
                  <Link
                    href={tool.href}
                    appearance="unstyled"
                    className="rounded-sm focus-visible:outline-none focus-visible:focus-ring after:absolute after:inset-0 after:content-['']"
                  >
                    {tool.title}
                  </Link>
                </h2>
                <p className="text-body-sm text-ink-muted">{tool.description}</p>
              </CardBody>
            </Card>
          </li>
        ))}
      </ul>
    </Container>
  );
}
