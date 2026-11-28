"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Heart, Menu } from "lucide-react";
import { Link } from "@/components/ui/link";
import { IconButton } from "@/components/ui/icon-button";
import { SearchInput } from "@/components/forms/search-input";
import { SiteLogo } from "./site-logo";
import { PrimaryNav } from "./primary-nav";
import { MobileMenu } from "./mobile-menu";
import { Container } from "./container";
import { cn } from "@/lib/utils/cn";

const iconLinkCls =
  "inline-flex size-11 items-center justify-center rounded-md text-ink transition-colors duration-fast hover:bg-primary-subtle focus-visible:outline-none focus-visible:focus-ring";

/**
 * SiteHeader — thanh điều hướng trên cùng (sticky). Desktop: nav đầy đủ + ô tìm kiếm;
 * Mobile: logo + nút mở menu ngăn kéo. Không che nội dung (chiều cao cố định 4rem).
 */
export function SiteHeader({ className }: { className?: string }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const router = useRouter();

  return (
    <header
      role="banner"
      className={cn(
        "sticky top-0 z-sticky border-b border-line-subtle bg-background",
        className,
      )}
    >
      <Container size="wide" className="flex h-16 items-center justify-between gap-4">
        <SiteLogo variant="full" />

        <PrimaryNav className="hidden lg:block" />

        <div className="flex items-center gap-1">
          <div className="hidden w-56 md:block xl:w-64">
            <SearchInput
              size="sm"
              label="Tìm kiếm công thức"
              onSearch={(value) =>
                router.push(
                  value ? `/cong-thuc?q=${encodeURIComponent(value)}` : "/cong-thuc",
                )
              }
            />
          </div>

          <Link href="/yeu-thich" aria-label="Yêu thích" appearance="unstyled" className={cn(iconLinkCls, "hidden sm:inline-flex")}>
            <Heart className="size-5" aria-hidden="true" />
          </Link>

          <IconButton
            aria-label="Mở menu"
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            className="lg:hidden"
            onClick={() => setMenuOpen(true)}
          >
            <Menu className="size-6" aria-hidden="true" />
          </IconButton>
        </div>
      </Container>

      <MobileMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
    </header>
  );
}
