"use client";

import type { ComponentPropsWithRef } from "react";
import { cn } from "@/lib/utils/cn";
import { describedByFromField, useFormField } from "./form-field";

export type FieldSize = "sm" | "md" | "lg";

const sizeMap: Record<FieldSize, string> = {
  sm: "h-9 px-3 text-body-sm",
  md: "h-11 px-3.5 text-body",
  lg: "h-13 px-4 text-body-lg",
};

const base =
  "w-full rounded-md border border-line-strong bg-surface text-ink " +
  "placeholder:text-ink-subtle transition-colors duration-fast ease-standard " +
  "focus-visible:outline-none focus-visible:focus-ring " +
  "disabled:cursor-not-allowed disabled:bg-surface-muted disabled:text-ink-disabled disabled:opacity-100";

const invalidCls = "border-danger";

export interface InputProps extends Omit<ComponentPropsWithRef<"input">, "size"> {
  size?: FieldSize;
  /** Ghi đè trạng thái lỗi (mặc định lấy từ FormField). */
  invalid?: boolean;
}

/** Input — ô nhập 1 dòng. Tự nối id/aria từ FormField nếu có. */
export function Input({ size = "md", invalid, className, id, ...props }: InputProps) {
  const field = useFormField();
  const isInvalid = invalid ?? field?.invalid ?? false;
  const ariaDescribedBy = describedByFromField(
    field,
    isInvalid,
    props["aria-describedby"],
  );

  return (
    <input
      id={id ?? field?.controlId}
      aria-invalid={isInvalid || undefined}
      aria-describedby={ariaDescribedBy}
      aria-required={field?.required || undefined}
      disabled={props.disabled ?? field?.disabled}
      className={cn(base, sizeMap[size], isInvalid && invalidCls, className)}
      {...props}
    />
  );
}

export interface TextareaProps extends ComponentPropsWithRef<"textarea"> {
  size?: FieldSize;
  invalid?: boolean;
  /** Số dòng tối thiểu (mặc định 4). */
  rows?: number;
}

/** Textarea — ô nhập nhiều dòng. */
export function Textarea({
  size = "md",
  invalid,
  rows = 4,
  className,
  id,
  ...props
}: TextareaProps) {
  const field = useFormField();
  const isInvalid = invalid ?? field?.invalid ?? false;
  const ariaDescribedBy = describedByFromField(
    field,
    isInvalid,
    props["aria-describedby"],
  );

  return (
    <textarea
      id={id ?? field?.controlId}
      rows={rows}
      aria-invalid={isInvalid || undefined}
      aria-describedby={ariaDescribedBy}
      aria-required={field?.required || undefined}
      disabled={props.disabled ?? field?.disabled}
      className={cn(
        base,
        "min-h-24 resize-y py-2.5",
        size === "sm" ? "text-body-sm" : size === "lg" ? "text-body-lg" : "text-body",
        isInvalid && invalidCls,
        className,
      )}
      {...props}
    />
  );
}
