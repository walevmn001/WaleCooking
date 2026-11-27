import type { ComponentPropsWithRef } from "react";
import { cn } from "@/lib/utils/cn";
import type { ButtonVariant } from "./button";
import { Spinner } from "./spinner";

export type IconButtonSize = "sm" | "md" | "lg";

const base =
  "inline-flex items-center justify-center shrink-0 rounded-md " +
  "transition-colors duration-fast ease-standard " +
  "focus-visible:outline-none focus-visible:focus-ring " +
  "disabled:cursor-not-allowed disabled:opacity-60 disabled:pointer-events-none";

const variantMap: Record<Exclude<ButtonVariant, "link">, string> = {
  primary: "bg-primary text-ink-inverse hover:bg-primary-hover active:bg-primary-active",
  secondary: "bg-secondary text-ink hover:bg-secondary-hover active:bg-secondary-active",
  outline: "border border-line-strong bg-surface text-ink hover:bg-surface-muted",
  ghost: "bg-transparent text-ink hover:bg-primary-subtle",
  danger: "bg-danger text-ink-inverse hover:opacity-90",
};

const sizeMap: Record<IconButtonSize, string> = {
  sm: "size-9",
  md: "size-11",
  lg: "size-13",
};

export interface IconButtonProps extends ComponentPropsWithRef<"button"> {
  variant?: Exclude<ButtonVariant, "link">;
  size?: IconButtonSize;
  /** Nhãn bắt buộc cho screen reader (nút chỉ có icon). */
  "aria-label": string;
  loading?: boolean;
}

/**
 * IconButton — nút chỉ có icon. BẮT BUỘC có `aria-label` (mô tả hành động).
 * Icon truyền qua `children` (thường là Lucide icon).
 */
export function IconButton({
  variant = "ghost",
  size = "md",
  loading = false,
  disabled,
  className,
  children,
  type = "button",
  ...props
}: IconButtonProps) {
  return (
    <button
      type={type}
      aria-busy={loading || undefined}
      disabled={disabled || loading}
      className={cn(base, variantMap[variant], sizeMap[size], className)}
      {...props}
    >
      {loading ? <Spinner size="sm" label="Đang xử lý" /> : children}
    </button>
  );
}
