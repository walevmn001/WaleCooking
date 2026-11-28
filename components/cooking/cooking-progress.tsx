import { cn } from "@/lib/utils/cn";

export interface CookingProgressProps {
  /** Bước hiện tại (1-based). */
  current: number;
  /** Tổng số bước. */
  total: number;
  className?: string;
}

/**
 * CookingProgress — hiển thị tiến độ theo bước (P09.2). Không truyền đạt tiến độ
 * chỉ bằng màu: luôn có chữ "Bước x/y" và thanh tiến độ có thuộc tính ARIA.
 */
export function CookingProgress({ current, total, className }: CookingProgressProps) {
  const safeTotal = Math.max(1, total);
  const safeCurrent = Math.min(safeTotal, Math.max(1, current));
  const percent = Math.round((safeCurrent / safeTotal) * 100);

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <span className="shrink-0 text-body-sm font-semibold text-ink">
        Bước {safeCurrent}/{safeTotal}
      </span>
      <div
        role="progressbar"
        aria-valuenow={safeCurrent}
        aria-valuemin={1}
        aria-valuemax={safeTotal}
        aria-label="Tiến độ các bước nấu"
        className="h-2 flex-1 overflow-hidden rounded-pill bg-surface-muted"
      >
        <div
          className="h-full rounded-pill bg-primary transition-[width] duration-base ease-standard"
          style={{ width: `${percent}%` }}
        />
      </div>
      <span className="shrink-0 text-caption text-ink-subtle">{percent}%</span>
    </div>
  );
}
