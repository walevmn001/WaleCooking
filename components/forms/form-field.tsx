"use client";

import {
  createContext,
  useContext,
  useId,
  type ComponentPropsWithRef,
  type ReactNode,
} from "react";
import { AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export interface FormFieldContextValue {
  controlId: string;
  errorId: string;
  hintId: string;
  invalid: boolean;
  required: boolean;
  disabled: boolean;
}

const FormFieldContext = createContext<FormFieldContextValue | null>(null);

/** Đọc ngữ cảnh FormField để control tự nối id/aria. Trả null khi dùng độc lập. */
export function useFormField(): FormFieldContextValue | null {
  return useContext(FormFieldContext);
}

/** Nối `aria-describedby` từ ngữ cảnh FormField + prop của người dùng. */
export function describedByFromField(
  field: FormFieldContextValue | null,
  isInvalid: boolean,
  userValue: string | undefined,
): string | undefined {
  const ids = [
    userValue,
    isInvalid ? field?.errorId : undefined,
    field?.hintId,
  ].filter(Boolean) as string[];
  return ids.length ? Array.from(new Set(ids)).join(" ") : undefined;
}

export interface FormFieldProps {
  /** id của control; mặc định tự sinh. */
  id?: string;
  label: ReactNode;
  /** Ẩn nhãn trực quan nhưng vẫn cho screen reader. */
  hideLabel?: boolean;
  hint?: ReactNode;
  error?: ReactNode;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  /** Lớp bọc control (giữa label và hint/error). */
  children: ReactNode;
}

/**
 * FormField — bọc label + control + hint + error; tự nối `htmlFor`, `aria-describedby`,
 * `aria-invalid`. Truyền control (Input/Select/Checkbox…) làm `children`.
 */
export function FormField({
  id,
  label,
  hideLabel = false,
  hint,
  error,
  required = false,
  disabled = false,
  className,
  children,
}: FormFieldProps) {
  const autoId = useId();
  const controlId = id ?? autoId;
  const errorId = `${controlId}-error`;
  const hintId = `${controlId}-hint`;
  const invalid = Boolean(error);

  const value: FormFieldContextValue = {
    controlId,
    errorId,
    hintId,
    invalid,
    required,
    disabled,
  };

  return (
    <FormFieldContext.Provider value={value}>
      <div
        className={cn("flex flex-col gap-1.5", className)}
        data-invalid={invalid || undefined}
        data-disabled={disabled || undefined}
      >
        <FormLabel htmlFor={controlId} required={required} srOnly={hideLabel}>
          {label}
        </FormLabel>
        {children}
        {hint && !error ? <FormHint id={hintId}>{hint}</FormHint> : null}
        {error ? <FormError id={errorId}>{error}</FormError> : null}
      </div>
    </FormFieldContext.Provider>
  );
}

export interface FormLabelProps extends ComponentPropsWithRef<"label"> {
  required?: boolean;
  srOnly?: boolean;
}

export function FormLabel({
  required = false,
  srOnly = false,
  className,
  children,
  ...props
}: FormLabelProps) {
  return (
    <label
      className={cn(
        "text-label text-ink",
        srOnly && "sr-only",
        className,
      )}
      {...props}
    >
      {children}
      {required ? (
        <>
          <span aria-hidden="true" className="ml-0.5 text-danger">
            *
          </span>
          <span className="sr-only"> (bắt buộc)</span>
        </>
      ) : null}
    </label>
  );
}

export type FormHintProps = ComponentPropsWithRef<"p">;

export function FormHint({ className, children, ...props }: FormHintProps) {
  return (
    <p className={cn("text-body-sm text-ink-muted", className)} {...props}>
      {children}
    </p>
  );
}

export type FormErrorProps = ComponentPropsWithRef<"p">;

/**
 * FormError — thông báo lỗi. Luôn có icon + chữ (không chỉ dựa vào màu) — WCAG 3.3.1.
 * `role="alert"` để screen reader đọc khi lỗi xuất hiện.
 */
export function FormError({ className, children, ...props }: FormErrorProps) {
  return (
    <p
      role="alert"
      className={cn("flex items-start gap-1.5 text-body-sm font-semibold text-danger", className)}
      {...props}
    >
      <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      <span>{children}</span>
    </p>
  );
}
