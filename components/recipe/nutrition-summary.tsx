import { Card, CardBody, CardTitle } from "@/components/ui/card";
import type { NutritionFact } from "./types";

export interface NutritionSummaryProps {
  /** Tiêu đề khối. Mặc định "Dinh dưỡng (ước tính)". */
  title?: string;
  facts: NutritionFact[];
  /** Ghi chú nguồn/độ chính xác (khuyến nghị khi số liệu là ước tính). */
  note?: string;
  emptyLabel?: string;
  className?: string;
}

/**
 * NutritionSummary — bảng dinh dưỡng dạng `<dl>`. Nếu không có dữ liệu, hiển thị
 * thông báo trung tính (không bịa số liệu).
 */
export function NutritionSummary({
  title = "Dinh dưỡng (ước tính)",
  facts,
  note,
  emptyLabel = "Chưa có thông tin dinh dưỡng cho công thức này.",
  className,
}: NutritionSummaryProps) {
  return (
    <Card className={className}>
      <CardBody className="flex flex-col gap-3">
        <CardTitle as="h3" className="text-h4">
          {title}
        </CardTitle>

        {facts.length > 0 ? (
          <dl className="flex flex-col">
            {facts.map((fact) => (
              <div
                key={fact.label}
                className="flex items-center justify-between gap-4 border-b border-line-subtle py-2 last:border-b-0"
              >
                <dt className="text-body-sm text-ink-muted">{fact.label}</dt>
                <dd className="text-body-sm font-semibold text-ink">{fact.value}</dd>
              </div>
            ))}
          </dl>
        ) : (
          <p className="text-body-sm text-ink-muted">{emptyLabel}</p>
        )}

        {facts.length > 0 && note ? (
          <p className="text-caption text-ink-subtle">{note}</p>
        ) : null}
      </CardBody>
    </Card>
  );
}
