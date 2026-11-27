import type { ComponentPropsWithRef } from "react";
import { cn } from "@/lib/utils/cn";

export type ContainerSize = "narrow" | "default" | "wide" | "full";

const sizeMap: Record<ContainerSize, string> = {
  narrow: "max-w-narrow",
  default: "max-w-content",
  wide: "max-w-wide",
  full: "max-w-full",
};

export interface ContainerProps extends ComponentPropsWithRef<"div"> {
  size?: ContainerSize;
}

/**
 * Container — khung nội dung dùng chung. Padding ngang 16/24/32 theo P03.
 */
export function Container({ size = "wide", className, children, ...props }: ContainerProps) {
  return (
    <div
      className={cn("mx-auto w-full px-4 sm:px-6 lg:px-8", sizeMap[size], className)}
      {...props}
    >
      {children}
    </div>
  );
}
