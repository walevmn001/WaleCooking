"use client";

import { useId, type ComponentPropsWithRef, type ReactNode } from "react";
import { cn } from "@/lib/utils/cn";
import { describedByFromField, useFormField } from "./form-field";

export interface SwitchProps
  extends Omit<ComponentPropsWithRef<"button">, "onChange" | "type"> {
  checked: boolean;
  onCheckedChange?: (checked: boolean) => void;
  label?: ReactNode;
  description?: ReactNode;
  invalid?: boolean;
  /** Bật khi chưa có nhãn hiển thị — bắt buộc nếu không có `label`. */
  "aria-label"?: string;
}

/**
 * Switch — công tắc bật/tắt. `role="switch"` + `aria-checked`; điều khiển bằng Space/Enter.
 */
export function Switch({
  checked,
  onCheckedChange,
  label,
  description,
  invalid,
  className,
  id,
  disabled,
  "aria-label": ariaLabel,
  ...props
}: SwitchProps) {
  const field = useFormField();
  const autoId = useId();
  const controlId = id ?? field?.controlId ?? autoId;
  const labelId = `${controlId}-label`;
  const isInvalid = invalid ?? field?.invalid ?? false;
  const ariaDescribedBy = describedByFromField(
    field,
    isInvalid,
    props["aria-describedby"],
  );

  const control = (
    <button
      type="button"
      role="switch"
      id={controlId}
      aria-checked={checked}
      aria-invalid={isInvalid || undefined}
      aria-describedby={ariaDescribedBy}
      aria-label={!label ? ariaLabel : undefined}
      aria-labelledby={label ? labelId : undefined}
      disabled={disabled ?? field?.disabled}
      onClick={() => onCheckedChange?.(!checked)}
      className={cn(
        "relative inline-flex h-6 w-11 shrink-0 items-center rounded-pill border-2 border-transparent transition-colors duration-fast ease-standard",
        "focus-visible:outline-none focus-visible:focus-ring",
        "disabled:cursor-not-allowed disabled:opacity-60",
        checked ? "bg-primary" : "bg-line-subtle",
        isInvalid && "ring-2 ring-danger",
        className,
      )}
      {...props}
    >
      <span
        aria-hidden="true"
        className={cn(
          "pointer-events-none block size-5 rounded-full bg-surface shadow-sm transition-transform duration-fast ease-standard",
          checked ? "translate-x-5" : "translate-x-0",
        )}
      />
    </button>
  );

  if (!label && !description) return control;

  return (
    <div className="flex items-start gap-3">
      {control}
      <div className="flex flex-col">
        <span id={labelId} className="text-body text-ink">
          {label}
        </span>
        {description ? (
          <span className="text-body-sm text-ink-muted">{description}</span>
        ) : null}
      </div>
    </div>
  );
}
