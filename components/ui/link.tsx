import NextLink from "next/link";
import type { ComponentPropsWithRef } from "react";
import { cn } from "@/lib/utils/cn";
import { buttonVariants, type ButtonSize, type ButtonVariant } from "./button";

export type LinkAppearance = "inline" | "nav" | "button" | "unstyled";

export interface LinkProps extends ComponentPropsWithRef<typeof NextLink> {
  /** Kiểu hiển thị. `inline` = link chữ (mặc định), `nav` = mục điều hướng, `button` = giống Button. */
  appearance?: LinkAppearance;
  /** Liên kết ra ngoài: tự thêm rel="noopener noreferrer" + target="_blank". */
  external?: boolean;
  variant?: ButtonVariant;
  size?: ButtonSize;
}

const appearanceMap: Record<Exclude<LinkAppearance, "button">, string> = {
  inline:
    "text-primary underline underline-offset-4 decoration-line-strong hover:decoration-primary hover:text-primary-hover transition-colors duration-fast",
  nav: "text-ink rounded-md px-3 py-2 text-nav hover:bg-primary-subtle transition-colors duration-fast",
  unstyled: "no-underline",
};

/**
 * Link — bao Next.js Link. Đảm bảo phân biệt bằng gạch chân (không chỉ màu) ở dạng inline.
 */
export function Link({
  appearance = "inline",
  external = false,
  variant = "primary",
  size = "md",
  className,
  children,
  ...props
}: LinkProps) {
  const cls =
    appearance === "button"
      ? buttonVariants({ variant, size, className })
      : cn(appearanceMap[appearance], className);

  return (
    <NextLink
      className={cls}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : null)}
      {...props}
    >
      {children}
    </NextLink>
  );
}
