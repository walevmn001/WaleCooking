"use client";

import type { ComponentPropsWithRef } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import type { BadgeVariant } from "./badge";

export interface ChipProps extends Omit<ComponentPropsWithRef<"button">, "onSelect"> {
  variant?: BadgeVariant;
  /** Trạng thái được chọn (chip lọc) → aria-pressed. */
  selected?: boolean;
  leftIcon?: React.ReactNode;
  /** Hiện nút xoá (dùng cho chip đã chọn). */
  onRemove?: () => void;
  removeLabel?: string;
}

const variantMap: Record<BadgeVariant, string> = {
  neutral: "bg-chip-neutral-bg text-chip-neutral-text border-line-subtle",
  brand: "bg-primary-subtle text-ink-on-brand border-primary-subtle",
  success: "bg-chip-success-bg text-chip-success-text border-transparent",
  danger: "bg-chip-danger-bg text-chip-danger-text border-transparent",
  warning: "bg-chip-warning-bg text-chip-warning-text border-transparent",
  info: "bg-chip-info-bg text-chip-info-text border-transparent",
};

/**
 * Chip — thẻ tương tác (lọc/lựa chọn). Là `<button>` với `aria-pressed`.
 * Không dùng màu đơn thuần: chip đang chọn có viền + dấu hiệu (in đậm).
 */
export function Chip({
  variant = "neutral",
  selected = false,
  leftIcon,
  onRemove,
  removeLabel = "Bỏ chọn",
  className,
  children,
  type = "button",
  ...props
}: ChipProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-pill border transition-colors duration-fast ease-standard",
        selected ? "ring-2 ring-primary-ring" : "",
        variantMap[variant],
        className,
      )}
    >
      <button
        type={type}
        aria-pressed={selected}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-pill px-3 py-1.5 text-body-sm font-semibold",
          "focus-visible:outline-none focus-visible:focus-ring",
          "hover:opacity-90",
          selected && "font-bold",
        )}
        {...props}
      >
        {leftIcon ? (
          <span aria-hidden="true" className="inline-flex shrink-0">
            {leftIcon}
          </span>
        ) : null}
        {children}
      </button>
      {onRemove ? (
        <button
          type="button"
          aria-label={removeLabel}
          onClick={onRemove}
          className="mr-1 inline-flex size-5 items-center justify-center rounded-full hover:bg-black/10 focus-visible:outline-none focus-visible:focus-ring"
        >
          <X className="size-3.5" aria-hidden="true" />
        </button>
      ) : null}
    </span>
  );
}
