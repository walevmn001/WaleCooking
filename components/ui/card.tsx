import type { ComponentPropsWithoutRef, ComponentPropsWithRef, ElementType } from "react";
import { cn } from "@/lib/utils/cn";

export type CardVariant = "default" | "elevated" | "outline" | "muted";

const variantMap: Record<CardVariant, string> = {
  default: "bg-surface border border-line-subtle shadow-sm",
  elevated: "bg-surface border border-line-subtle shadow-lg",
  outline: "bg-surface border border-line-strong",
  muted: "bg-surface-muted border border-line-subtle",
};

export interface CardProps extends ComponentPropsWithoutRef<"div"> {
  variant?: CardVariant;
  /** Bật hiệu ứng nâng nhẹ khi hover (chỉ khi thẻ có tương tác). */
  interactive?: boolean;
  /** Đổi thẻ HTML (mặc định div). Khuyến nghị: "div" | "article" | "section" | "li". */
  as?: ElementType;
}

/**
 * Card — thẻ nội dung. Bo góc lg (18px) theo P03. Không tự thêm padding (dùng CardBody/CardHeader).
 */
export function Card({
  variant = "default",
  interactive = false,
  as: Tag = "div",
  className,
  children,
  ...props
}: CardProps) {
  return (
    <Tag
      className={cn(
        "relative rounded-lg",
        variantMap[variant],
        interactive &&
          "transition-[transform,box-shadow] duration-base ease-standard hover:-translate-y-0.5 hover:shadow-lg focus-within:shadow-lg",
        className,
      )}
      {...props}
    >
      {children}
    </Tag>
  );
}

export function CardHeader({ className, ...props }: ComponentPropsWithRef<"div">) {
  return <div className={cn("flex flex-col gap-1 p-4 sm:p-5", className)} {...props} />;
}

export function CardTitle({
  className,
  as: Tag = "h3",
  ...props
}: ComponentPropsWithRef<"h3"> & { as?: "h1" | "h2" | "h3" | "h4" }) {
  return <Tag className={cn("text-h4 text-ink", className)} {...props} />;
}

export function CardDescription({ className, ...props }: ComponentPropsWithRef<"p">) {
  return <p className={cn("text-body-sm text-ink-muted", className)} {...props} />;
}

export function CardBody({ className, ...props }: ComponentPropsWithRef<"div">) {
  return <div className={cn("p-4 sm:p-5", className)} {...props} />;
}

export function CardFooter({ className, ...props }: ComponentPropsWithRef<"div">) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 border-t border-line-subtle p-4 sm:p-5",
        className,
      )}
      {...props}
    />
  );
}
