import { AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils/cn";
import type { Allergen } from "./types";

export interface AllergenBadgesProps {
  allergens: Allergen[];
  /** Nhãn khi không có dữ liệu. */
  emptyLabel?: string;
  /** Tiêu đề nhóm (hiển thị dạng sr-only nếu `hideLabel`). */
  label?: string;
  hideLabel?: boolean;
  className?: string;
}

/**
 * AllergenBadges — danh sách chất gây dị ứng. Dùng cảnh báo (chữ + icon), không chỉ màu.
 * Không suy diễn: chỉ hiển thị dữ liệu được cung cấp.
 */
export function AllergenBadges({
  allergens,
  emptyLabel = "Chưa có thông tin về chất gây dị ứng.",
  label = "Chất gây dị ứng",
  hideLabel = false,
  className,
}: AllergenBadgesProps) {
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <span className={cn("text-label text-ink", hideLabel && "sr-only")}>{label}</span>
      {allergens.length > 0 ? (
        <ul className="flex flex-wrap gap-1.5">
          {allergens.map((allergen) => (
            <li key={allergen.id}>
              <Badge variant="warning">
                <AlertTriangle className="size-3.5 shrink-0" aria-hidden="true" />
                {allergen.label}
              </Badge>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-body-sm text-ink-muted">{emptyLabel}</p>
      )}
    </div>
  );
}
