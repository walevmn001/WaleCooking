import type { ComponentPropsWithRef } from "react";
import { cn } from "@/lib/utils/cn";
import { Spinner } from "./spinner";

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "outline"
  | "ghost"
  | "danger"
  | "link";

export type ButtonSize = "sm" | "md" | "lg";

const base =
  "relative inline-flex items-center justify-center gap-2 font-semibold rounded-md " +
  "transition-colors duration-fast ease-standard select-none whitespace-nowrap " +
  "focus-visible:outline-none focus-visible:focus-ring " +
  "disabled:cursor-not-allowed disabled:opacity-60 disabled:pointer-events-none";

const variantMap: Record<ButtonVariant, string> = {
  primary: "bg-primary text-ink-inverse hover:bg-primary-hover active:bg-primary-active",
  secondary: "bg-secondary text-ink hover:bg-secondary-hover active:bg-secondary-active",
  outline:
    "border border-line-strong bg-surface text-ink hover:bg-surface-muted active:bg-surface-muted",
  ghost: "bg-transparent text-ink hover:bg-primary-subtle active:bg-primary-subtle",
  danger: "bg-danger text-ink-inverse hover:opacity-90 active:opacity-80",
  link: "bg-transparent text-primary underline underline-offset-4 hover:text-primary-hover active:text-primary-active p-0! h-auto!",
};

const sizeMap: Record<ButtonSize, string> = {
  sm: "h-9 px-3 text-body-sm",
  md: "h-11 px-4 text-body",
  lg: "h-13 px-6 text-body-lg",
};

/** Trả về chuỗi class của Button — dùng lại cho các phần tử khác (vd: Link-as-button). */
export function buttonVariants(
  options: { variant?: ButtonVariant; size?: ButtonSize; className?: string } = {},
): string {
  const { variant = "primary", size = "md", className } = options;
  const sizeCls = variant === "link" ? "" : sizeMap[size];
  return cn(base, variantMap[variant], sizeCls, className);
}

export interface ButtonProps extends ComponentPropsWithRef<"button"> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Hiển thị trạng thái đang tải: spinner + aria-busy, tự vô hiệu hoá. */
  loading?: boolean;
  /** Icon bên trái nhãn. */
  leftIcon?: React.ReactNode;
  /** Icon bên phải nhãn. */
  rightIcon?: React.ReactNode;
  /** Chiếm toàn bộ chiều ngang. */
  fullWidth?: boolean;
}

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  leftIcon,
  rightIcon,
  fullWidth = false,
  disabled,
  className,
  children,
  type = "button",
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading;
  return (
    <button
      type={type}
      aria-busy={loading || undefined}
      disabled={isDisabled}
      className={buttonVariants({
        variant,
        size,
        className: cn(fullWidth && "w-full", className),
      })}
      {...props}
    >
      {loading ? (
        <Spinner size={size === "lg" ? "md" : "sm"} label="Đang xử lý" />
      ) : (
        leftIcon
      )}
      {children}
      {!loading && rightIcon}
    </button>
  );
}
