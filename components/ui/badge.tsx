import type { ComponentPropsWithRef } from "react";
import { cn } from "@/lib/utils/cn";

export type BadgeVariant =
  | "neutral"
  | "brand"
  | "success"
  | "danger"
  | "warning"
  | "info";

export type BadgeSize = "sm" | "md";

const variantMap: Record<BadgeVariant, string> = {
  neutral: "bg-chip-neutral-bg text-chip-neutral-text",
  brand: "bg-primary-subtle text-ink-on-brand",
  success: "bg-chip-success-bg text-chip-success-text",
  danger: "bg-chip-danger-bg text-chip-danger-text",
  warning: "bg-chip-warning-bg text-chip-warning-text",
  info: "bg-chip-info-bg text-chip-info-text",
};

const sizeMap: Record<BadgeSize, string> = {
  sm: "px-2 py-0.5 text-caption",
  md: "px-2.5 py-1 text-body-sm",
};

export interface BadgeProps extends ComponentPropsWithRef<"span"> {
  variant?: BadgeVariant;
  size?: BadgeSize;
  /** Icon nhỏ phía trước. */
  leftIcon?: React.ReactNode;
}

/**
 * Badge — nhãn trạng thái không tương tác. Màu đi kèm CHỮ (không truyền đạt chỉ bằng màu).
 */
export function Badge({
  variant = "neutral",
  size = "md",
  leftIcon,
  className,
  children,
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-pill font-semibold whitespace-nowrap",
        variantMap[variant],
        sizeMap[size],
        className,
      )}
      {...props}
    >
      {leftIcon ? (
        <span aria-hidden="true" className="inline-flex shrink-0">
          {leftIcon}
        </span>
      ) : null}
      {children}
    </span>
  );
}
