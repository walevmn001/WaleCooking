"use client";

import { X } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export interface IngredientChipProps {
  label: string;
  onRemove: () => void;
  className?: string;
}

/** IngredientChip — nhãn nguyên liệu đã thêm kèm nút xoá (P10.4). */
export function IngredientChip({ label, onRemove, className }: IngredientChipProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-pill border border-primary-subtle bg-primary-subtle py-1 pl-3 pr-1 text-body-sm font-semibold text-ink-on-brand",
        className,
      )}
    >
      {label}
      <button
        type="button"
        aria-label={`Xoá nguyên liệu ${label}`}
        onClick={onRemove}
        className="inline-flex size-6 items-center justify-center rounded-full hover:bg-black/10 focus-visible:outline-none focus-visible:focus-ring"
      >
        <X className="size-3.5" aria-hidden="true" />
      </button>
    </span>
  );
}
