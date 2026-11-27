import Image from "next/image";
import type { ComponentPropsWithoutRef } from "react";
import { cn } from "@/lib/utils/cn";

export type AvatarSize = "sm" | "md" | "lg" | "xl";

const sizeMap: Record<AvatarSize, { px: number; cls: string; text: string }> = {
  sm: { px: 32, cls: "size-8", text: "text-caption" },
  md: { px: 40, cls: "size-10", text: "text-body-sm" },
  lg: { px: 48, cls: "size-12", text: "text-body" },
  xl: { px: 64, cls: "size-16", text: "text-h3" },
};

export interface AvatarProps extends ComponentPropsWithoutRef<"div"> {
  /** URL ảnh (dùng next/image). Bỏ trống → hiển thị chữ cái đầu. */
  src?: string | null;
  /** Tên người dùng — dùng cho alt và chữ cái đầu. */
  name: string;
  size?: AvatarSize;
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase();
}

/**
 * Avatar — ảnh đại diện hoặc chữ cái đầu. `alt` = tên (hoặc rỗng nếu trang trí thì dùng aria-hidden).
 */
export function Avatar({ src, name, size = "md", className, ...props }: AvatarProps) {
  const conf = sizeMap[size];
  return (
    <div
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full",
        "bg-primary-subtle text-ink-on-brand font-semibold select-none",
        conf.cls,
        className,
      )}
      {...props}
    >
      {src ? (
        <Image
          src={src}
          alt={name}
          width={conf.px}
          height={conf.px}
          className="size-full object-cover"
        />
      ) : (
        <>
          <span aria-hidden="true">{initials(name)}</span>
          <span className="sr-only">{name}</span>
        </>
      )}
    </div>
  );
}
