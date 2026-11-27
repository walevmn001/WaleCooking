import type { ComponentPropsWithRef } from "react";
import { cn } from "@/lib/utils/cn";

export interface SkeletonProps extends ComponentPropsWithRef<"div"> {
  /** Biến thể bo góc. Mặc định bo md. */
  shape?: "text" | "radius" | "circle";
}

/**
 * Skeleton — placeholder khi đang tải. `aria-hidden` (vùng chứa nên đặt `aria-busy`).
 * Shimmer tắt khi prefers-reduced-motion.
 */
export function Skeleton({ shape = "radius", className, ...props }: SkeletonProps) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "animate-pulse bg-surface-muted",
        shape === "circle" && "rounded-full",
        shape === "text" && "h-4 rounded-sm",
        shape === "radius" && "rounded-md",
        className,
      )}
      {...props}
    />
  );
}
