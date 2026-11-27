import type { ComponentPropsWithRef } from "react";
import { cn } from "@/lib/utils/cn";

export type SpinnerSize = "sm" | "md" | "lg";

const sizeMap: Record<SpinnerSize, string> = {
  sm: "size-4",
  md: "size-5",
  lg: "size-8",
};

export interface SpinnerProps extends ComponentPropsWithRef<"span"> {
  size?: SpinnerSize;
  /** Nhãn cho screen reader. Mặc định "Đang tải". */
  label?: string;
}

/**
 * Spinner — chỉ báo tải dạng vòng. Có `role="status"` + nhãn ẩn cho screen reader.
 * Tôn trọng prefers-reduced-motion qua global CSS.
 */
export function Spinner({
  size = "md",
  label = "Đang tải",
  className,
  ...props
}: SpinnerProps) {
  return (
    <span
      role="status"
      aria-live="polite"
      className={cn("inline-flex items-center justify-center", className)}
      {...props}
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
        className={cn("animate-spin text-current", sizeMap[size])}
      >
        <circle
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeOpacity="0.25"
          strokeWidth="3"
        />
        <path
          d="M22 12a10 10 0 0 0-10-10"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
        />
      </svg>
      <span className="sr-only">{label}</span>
    </span>
  );
}
