"use client";

import { useId, type ComponentPropsWithRef, type ReactNode } from "react";
import { cn } from "@/lib/utils/cn";
import { describedByFromField, useFormField } from "./form-field";

export interface CheckboxProps extends Omit<ComponentPropsWithRef<"input">, "type"> {
  /** Nhãn ngay cạnh checkbox (khuyến nghị). */
  label?: ReactNode;
  /** Mô tả phụ dưới nhãn. */
  description?: ReactNode;
  invalid?: boolean;
}

/**
 * Checkbox — ô đánh dấu. Nhãn gắn bằng `htmlFor` + `id`; lỗi nối qua `aria-describedby`.
 */
export function Checkbox({
  label,
  description,
  invalid,
  className,
  id,
  disabled,
  ...props
}: CheckboxProps) {
  const field = useFormField();
  const autoId = useId();
  const controlId = id ?? field?.controlId ?? autoId;
  const isInvalid = invalid ?? field?.invalid ?? false;
  const ariaDescribedBy = describedByFromField(
    field,
    isInvalid,
    props["aria-describedby"],
  );

  const control = (
    <input
      type="checkbox"
      id={controlId}
      aria-invalid={isInvalid || undefined}
      aria-describedby={ariaDescribedBy}
      disabled={disabled ?? field?.disabled}
      className={cn(
        "mt-0.5 size-5 shrink-0 cursor-pointer rounded-sm accent-primary",
        "focus-visible:outline-none focus-visible:focus-ring",
        "disabled:cursor-not-allowed disabled:opacity-60",
        isInvalid && "outline-2 outline-offset-1 outline-danger",
        className,
      )}
      {...props}
    />
  );

  if (!label && !description) return control;

  return (
    <div className="flex items-start gap-2.5">
      {control}
      <label htmlFor={controlId} className="text-body text-ink select-none">
        {label}
        {description ? (
          <span className="mt-0.5 block text-body-sm text-ink-muted">{description}</span>
        ) : null}
      </label>
    </div>
  );
}
