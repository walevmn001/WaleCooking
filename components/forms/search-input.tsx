"use client";

import { useState, type ComponentPropsWithRef } from "react";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import type { FieldSize } from "./input";

const sizeMap: Record<FieldSize, string> = {
  sm: "h-9 text-body-sm",
  md: "h-11 text-body",
  lg: "h-13 text-body-lg",
};

export interface SearchInputProps
  extends Omit<ComponentPropsWithRef<"input">, "type" | "value" | "defaultValue" | "size"> {
  size?: FieldSize;
  /** Nhãn cho screen reader (mặc định "Tìm kiếm"). */
  label?: string;
  /** Nút xoá nội dung. */
  clearable?: boolean;
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  /** Gọi khi submit (Enter). */
  onSearch?: (value: string) => void;
}

/**
 * SearchInput — ô tìm kiếm. Bọc `role="search"`, có icon và nút xoá.
 * Enter kích hoạt `onSearch`.
 */
export function SearchInput({
  size = "md",
  label = "Tìm kiếm",
  clearable = true,
  value,
  defaultValue,
  onValueChange,
  onSearch,
  className,
  placeholder = "Tìm công thức, nguyên liệu…",
  ...props
}: SearchInputProps) {
  const controlled = value !== undefined;
  const [internal, setInternal] = useState(defaultValue ?? "");
  const current = controlled ? value : internal;

  const setValue = (next: string) => {
    if (!controlled) setInternal(next);
    onValueChange?.(next);
  };

  return (
    <form
      role="search"
      className={cn("relative w-full", className)}
      onSubmit={(e) => {
        e.preventDefault();
        onSearch?.(current);
      }}
    >
      <Search
        aria-hidden="true"
        className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-muted"
      />
      <input
        type="search"
        aria-label={label}
        value={current}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        className={cn(
          "w-full rounded-md border border-line-strong bg-surface pl-10 text-ink",
          "placeholder:text-ink-subtle transition-colors duration-fast ease-standard",
          "focus-visible:outline-none focus-visible:focus-ring",
          "disabled:cursor-not-allowed disabled:bg-surface-muted disabled:text-ink-disabled",
          clearable && current ? "pr-10" : "pr-3.5",
          sizeMap[size],
        )}
        {...props}
      />
      {clearable && current ? (
        <button
          type="button"
          aria-label="Xoá nội dung tìm kiếm"
          onClick={() => setValue("")}
          className="absolute right-2 top-1/2 inline-flex size-7 -translate-y-1/2 items-center justify-center rounded-full text-ink-muted hover:bg-surface-muted focus-visible:outline-none focus-visible:focus-ring"
        >
          <X className="size-4" aria-hidden="true" />
        </button>
      ) : null}
    </form>
  );
}
