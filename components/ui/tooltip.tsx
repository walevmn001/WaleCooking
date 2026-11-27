"use client";

import { useId, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

export type TooltipSide = "top" | "bottom";

export interface TooltipProps {
  /** Nội dung tooltip (chữ). */
  label: string;
  /** Phần tử kích hoạt (thường là IconButton). */
  children: ReactNode;
  side?: TooltipSide;
  className?: string;
}

/**
 * Tooltip — gợi ý khi hover/focus. Hiện khi hover hoặc focus bàn phím.
 * `role="tooltip"`; `aria-describedby` chỉ gắn khi đang mở.
 * Nội dung không chứa hành động tương tác (tooltip không nhận focus).
 */
export function Tooltip({ label, children, side = "top", className }: TooltipProps) {
  const [open, setOpen] = useState(false);
  const id = useId();

  return (
    <span
      className={cn("relative inline-flex", className)}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocusCapture={() => setOpen(true)}
      onBlurCapture={() => setOpen(false)}
      onKeyDown={(e) => {
        if (e.key === "Escape") setOpen(false);
      }}
    >
      <span aria-describedby={open ? id : undefined} className="inline-flex">
        {children}
      </span>
      <span
        role="tooltip"
        id={id}
        hidden={!open}
        className={cn(
          "z-tooltip pointer-events-none absolute left-1/2 -translate-x-1/2 whitespace-nowrap",
          "rounded-md bg-background-inverse px-2.5 py-1.5 text-caption text-ink-inverse shadow-md",
          "animate-fade-in",
          side === "top" ? "bottom-full mb-2" : "top-full mt-2",
        )}
      >
        {label}
      </span>
    </span>
  );
}
