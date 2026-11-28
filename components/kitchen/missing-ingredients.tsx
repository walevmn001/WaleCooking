import { AlertTriangle, Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils/cn";

export interface MissingIngredientsProps {
  /** Tên nguyên liệu công thức CÒN thiếu. */
  missing: string[];
  /** Trong số thiếu, những nguyên liệu BẮT BUỘC. */
  missingRequired: string[];
  className?: string;
}

/**
 * MissingIngredients — liệt kê nguyên liệu còn thiếu (P10.4). Tách riêng nhóm BẮT BUỘC để
 * KHÔNG khẳng định người dùng "nấu được" khi còn thiếu nguyên liệu thiết yếu.
 */
export function MissingIngredients({ missing, missingRequired, className }: MissingIngredientsProps) {
  if (missing.length === 0) {
    return (
      <p className={cn("flex items-center gap-1.5 text-body-sm font-semibold text-success", className)}>
        <Check className="size-4 shrink-0" aria-hidden="true" />
        Đã có đủ mọi nguyên liệu của công thức này.
      </p>
    );
  }

  const requiredSet = new Set(missingRequired);

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <p className="flex items-center gap-1.5 text-body-sm font-semibold text-ink">
        <AlertTriangle className="size-4 shrink-0 text-warning" aria-hidden="true" />
        Còn thiếu {missing.length} nguyên liệu
        {missingRequired.length > 0 ? ` (${missingRequired.length} bắt buộc)` : ""}:
      </p>
      <ul className="flex flex-wrap gap-1.5">
        {missing.map((name) => {
          const required = requiredSet.has(name);
          return (
            <li key={name}>
              <Badge variant={required ? "warning" : "neutral"} size="sm">
                {name}
                {required ? " · bắt buộc" : ""}
              </Badge>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
