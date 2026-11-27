import type { ComponentPropsWithRef } from "react";
import { cn } from "@/lib/utils/cn";

export interface DividerProps extends ComponentPropsWithRef<"div"> {
  orientation?: "horizontal" | "vertical";
  /** Nhãn chữ ở giữa (chỉ dùng với horizontal). */
  label?: string;
}

/**
 * Divider — đường phân cách. Mặc định `role="separator"` + `aria-orientation`.
 */
export function Divider({
  orientation = "horizontal",
  label,
  className,
  ...props
}: DividerProps) {
  if (label && orientation === "horizontal") {
    return (
      <div
        role="separator"
        aria-orientation="horizontal"
        className={cn("flex items-center gap-3", className)}
        {...props}
      >
        <span className="h-px flex-1 bg-line-subtle" aria-hidden="true" />
        <span className="text-body-sm text-ink-muted">{label}</span>
        <span className="h-px flex-1 bg-line-subtle" aria-hidden="true" />
      </div>
    );
  }

  return (
    <div
      role="separator"
      aria-orientation={orientation}
      className={cn(
        orientation === "horizontal" ? "h-px w-full bg-line-subtle" : "h-full w-px bg-line-subtle",
        className,
      )}
      {...props}
    />
  );
}
