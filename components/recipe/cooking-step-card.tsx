"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { Badge } from "@/components/ui/badge";
import { formatMinutes } from "@/lib/utils/format";
import type { RecipeStep } from "./types";

export interface CookingStepCardProps {
  step: RecipeStep;
  /** Đã hoàn thành bước này. */
  done?: boolean;
  onToggleDone?: (done: boolean) => void;
  className?: string;
}

/**
 * CookingStepCard — một bước nấu (`<li>` trong `<ol>`). Nút đánh dấu hoàn thành
 * dùng `aria-pressed`; trạng thái hoàn thành biểu thị bằng cả dấu ✓ và chữ (không chỉ màu).
 */
export function CookingStepCard({ step, done = false, onToggleDone, className }: CookingStepCardProps) {
  return (
    <li
      className={cn(
        "flex gap-3 rounded-lg border border-line-subtle bg-surface p-4",
        done && "bg-surface-muted",
        className,
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          "flex size-8 shrink-0 items-center justify-center rounded-full text-body-sm font-bold",
          done ? "bg-success text-ink-inverse" : "bg-primary-subtle text-ink-on-brand",
        )}
      >
        {step.order}
      </span>

      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div className="flex items-start justify-between gap-3">
          <p className={cn("text-body text-ink", done && "text-ink-muted line-through")}>
            {step.instruction}
          </p>
          {onToggleDone ? (
            <button
              type="button"
              aria-pressed={done}
              aria-label={done ? `Bỏ đánh dấu bước ${step.order}` : `Đánh dấu bước ${step.order} hoàn thành`}
              onClick={() => onToggleDone(!done)}
              className={cn(
                "inline-flex shrink-0 items-center gap-1 rounded-md border px-2.5 py-1 text-caption font-semibold transition-colors duration-fast",
                "focus-visible:outline-none focus-visible:focus-ring",
                done
                  ? "border-success bg-success text-ink-inverse"
                  : "border-line-strong bg-surface text-ink hover:bg-surface-muted",
              )}
            >
              <Check className="size-3.5" aria-hidden="true" />
              {done ? "Đã xong" : "Hoàn thành"}
            </button>
          ) : null}
        </div>

        {step.durationMinutes ? (
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="info" size="sm">
              {formatMinutes(step.durationMinutes)}
            </Badge>
          </div>
        ) : null}

        {step.tip ? (
          <p className="rounded-md bg-primary-subtle/60 px-3 py-2 text-body-sm text-ink-on-brand">
            <span className="font-semibold">Mẹo: </span>
            {step.tip}
          </p>
        ) : null}
      </div>
    </li>
  );
}
