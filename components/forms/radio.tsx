"use client";

import {
  createContext,
  useContext,
  useId,
  type ComponentPropsWithRef,
  type ReactNode,
} from "react";
import { cn } from "@/lib/utils/cn";
import { describedByFromField, useFormField } from "./form-field";

interface RadioGroupContextValue {
  name: string;
  value?: string;
  onChange?: (value: string) => void;
  disabled?: boolean;
}

const RadioGroupContext = createContext<RadioGroupContextValue | null>(null);

export interface RadioGroupProps extends Omit<ComponentPropsWithRef<"fieldset">, "onChange"> {
  /** Nhãn nhóm (legend). Bắt buộc cho a11y. */
  legend: ReactNode;
  name?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  disabled?: boolean;
  /** Bố cục các lựa chọn. */
  orientation?: "vertical" | "horizontal";
}

/**
 * RadioGroup — `<fieldset>` + `<legend>` bọc các `Radio` cùng `name`.
 */
export function RadioGroup({
  legend,
  name,
  value,
  onValueChange,
  disabled,
  orientation = "vertical",
  className,
  children,
  ...props
}: RadioGroupProps) {
  const autoName = useId();
  const groupName = name ?? autoName;
  return (
    <fieldset className={cn("flex flex-col gap-2", className)} {...props}>
      <legend className="mb-1 text-label text-ink">{legend}</legend>
      <RadioGroupContext.Provider
        value={{ name: groupName, value, onChange: onValueChange, disabled }}
      >
        <div
          className={cn(
            "flex gap-3",
            orientation === "vertical" ? "flex-col" : "flex-row flex-wrap",
          )}
        >
          {children}
        </div>
      </RadioGroupContext.Provider>
    </fieldset>
  );
}

export interface RadioProps extends Omit<ComponentPropsWithRef<"input">, "type"> {
  label?: ReactNode;
  description?: ReactNode;
  invalid?: boolean;
}

/** Radio — nút chọn đơn. Dùng trong RadioGroup để có `legend`. */
export function Radio({
  label,
  description,
  invalid,
  className,
  id,
  value,
  disabled,
  onChange,
  ...props
}: RadioProps) {
  const field = useFormField();
  const group = useContext(RadioGroupContext);
  const autoId = useId();
  const controlId = id ?? field?.controlId ?? autoId;
  const isInvalid = invalid ?? field?.invalid ?? false;
  const ariaDescribedBy = describedByFromField(
    field,
    isInvalid,
    props["aria-describedby"],
  );

  return (
    <div className="flex items-start gap-2.5">
      <input
        type="radio"
        id={controlId}
        name={group?.name}
        value={value}
        checked={group?.value !== undefined ? group.value === value : props.checked}
        onChange={(e) => {
          group?.onChange?.(e.target.value);
          onChange?.(e);
        }}
        aria-invalid={isInvalid || undefined}
        aria-describedby={ariaDescribedBy}
        disabled={disabled ?? group?.disabled ?? field?.disabled}
        className={cn(
          "mt-0.5 size-5 shrink-0 cursor-pointer accent-primary",
          "focus-visible:outline-none focus-visible:focus-ring",
          "disabled:cursor-not-allowed disabled:opacity-60",
          isInvalid && "outline-2 outline-offset-1 outline-danger",
          className,
        )}
        {...props}
      />
      {label || description ? (
        <label htmlFor={controlId} className="text-body text-ink select-none">
          {label}
          {description ? (
            <span className="mt-0.5 block text-body-sm text-ink-muted">{description}</span>
          ) : null}
        </label>
      ) : null}
    </div>
  );
}
