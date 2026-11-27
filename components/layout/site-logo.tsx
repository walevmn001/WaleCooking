import Image from "next/image";
import { Link } from "@/components/ui/link";
import { cn } from "@/lib/utils/cn";

export interface SiteLogoProps {
  /** `full` = logo có chữ, `compact` = chỉ mark. */
  variant?: "full" | "compact";
  className?: string;
}

const ASSET = {
  full: "/assets/brand/logo-primary.svg",
  compact: "/assets/brand/logo-mark.svg",
} as const;

const DIMENSIONS = {
  full: { width: 150, height: 40 },
  compact: { width: 40, height: 40 },
} as const;

/**
 * SiteLogo — logo WALE COOKING (asset P04). Liên kết về trang chủ.
 */
export function SiteLogo({ variant = "full", className }: SiteLogoProps) {
  const dim = DIMENSIONS[variant];
  return (
    <Link
      href="/"
      aria-label="WALE COOKING — về trang chủ"
      appearance="unstyled"
      className={cn("inline-flex items-center rounded-md focus-visible:outline-none focus-visible:focus-ring", className)}
    >
      <Image
        src={ASSET[variant]}
        alt="WALE COOKING"
        width={dim.width}
        height={dim.height}
        priority
        unoptimized
        className={variant === "full" ? "h-9 w-auto" : "size-10"}
      />
    </Link>
  );
}
