import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { Link } from "@/components/ui/link";
import { Breadcrumb } from "@/components/navigation/breadcrumb";
import { Container } from "./container";

export interface PlaceholderPageProps {
  title: string;
  description?: string;
  /** Phase dự kiến triển khai (mặc định P06). */
  phase?: string;
  icon?: ReactNode;
}

/**
 * PlaceholderPage — nội dung cho route CHƯA triển khai. Nói rõ trạng thái để không
 * gây hiểu lầm là module đã hoạt động.
 */
export function PlaceholderPage({
  title,
  description = "Trang này chưa được triển khai.",
  phase = "P06",
  icon,
}: PlaceholderPageProps) {
  return (
    <Container className="py-8 sm:py-12">
      <Breadcrumb items={[{ label: "Trang chủ", href: "/" }, { label: title }]} />
      <div className="mt-6 flex max-w-2xl flex-col items-start gap-4 rounded-lg border border-dashed border-line-strong bg-surface p-6 sm:p-8">
        <Badge variant="warning">Chưa triển khai</Badge>
        <div className="flex items-center gap-3">
          {icon ? (
            <span aria-hidden="true" className="text-primary">
              {icon}
            </span>
          ) : null}
          <h1 className="text-h1 text-ink">{title}</h1>
        </div>
        <p className="text-body text-ink-muted">{description}</p>
        <p className="text-body-sm text-ink-subtle">
          Nội dung và chức năng của trang sẽ được triển khai ở phase {phase}.
        </p>
        <Link href="/" appearance="button" variant="outline" size="md">
          Về trang chủ
        </Link>
      </div>
    </Container>
  );
}
