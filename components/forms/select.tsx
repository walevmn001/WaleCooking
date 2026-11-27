"use client";

import type { ComponentPropsWithRef } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import type { FieldSize } from "./input";
import { describedByFromField, useFormField } from "./form-field";

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends Omit<ComponentPropsWithRef<"select">, "size"> {
  size?: FieldSize;
  invalid?: boolean;
  options?: SelectOption[];
  placeholder?: string;
}

const sizeMap: Record<FieldSize, string> = {
  sm: "h-9 pl-3 text-body-sm",
  md: "h-11 pl-3.5 text-body",
  lg: "h-13 pl-4 text-body-lg",
};

/**
 * Select — dùng `<select>` gốc (a11y tốt nhất, hỗ trợ bàn phím mặc định).
 * Có thể truyền `options` hoặc `<option>` qua children.
 */
export function Select({
  size = "md",
  invalid,
  options,
  placeholder,
  className,
  id,
  children,
  ...props
}: SelectProps) {
  const field = useFormField();
  const isInvalid = invalid ?? field?.invalid ?? false;
  const ariaDescribedBy = describedByFromField(
    field,
    isInvalid,
    props["aria-describedby"],
  );

  return (
    <div className="relative">
      <select
        id={id ?? field?.controlId}
        aria-invalid={isInvalid || undefined}
        aria-describedby={ariaDescribedBy}
        aria-required={field?.required || undefined}
        disabled={props.disabled ?? field?.disabled}
        className={cn(
          "w-full appearance-none rounded-md border border-line-strong bg-surface pr-10 text-ink transition-colors duration-fast ease-standard",
          "focus-visible:outline-none focus-visible:focus-ring",
          "disabled:cursor-not-allowed disabled:bg-surface-muted disabled:text-ink-disabled",
          sizeMap[size],
          isInvalid && "border-danger",
          className,
        )}
        {...props}
      >
        {placeholder ? (
          <option value="" disabled>
            {placeholder}
          </option>
        ) : null}
        {options
          ? options.map((opt) => (
              <option key={opt.value} value={opt.value} disabled={opt.disabled}>
                {opt.label}
              </option>
            ))
          : children}
      </select>
      <ChevronDown
        aria-hidden="true"
        className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-ink-muted"
      />
    </div>
  );
}
