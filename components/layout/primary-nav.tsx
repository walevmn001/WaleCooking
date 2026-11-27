"use client";

import { usePathname } from "next/navigation";
import { Link } from "@/components/ui/link";
import { cn } from "@/lib/utils/cn";
import { primaryNav, type NavItem } from "@/lib/constants/navigation";

function isActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export interface PrimaryNavProps {
  items?: NavItem[];
  className?: string;
  /** Gọi sau khi chọn mục (đóng menu mobile). */
  onNavigate?: () => void;
}

/**
 * PrimaryNav — điều hướng chính. `aria-current="page"` cho mục đang mở.
 */
export function PrimaryNav({ items = primaryNav, className, onNavigate }: PrimaryNavProps) {
  const pathname = usePathname();

  return (
    <nav aria-label="Điều hướng chính" className={className}>
      <ul className="flex items-center gap-1">
        {items.map((item) => {
          const active = isActive(pathname, item.href);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                appearance="nav"
                aria-current={active ? "page" : undefined}
                onClick={onNavigate}
                className={cn(
                  "inline-flex items-center gap-1",
                  active && "bg-primary-subtle font-bold text-primary",
                )}
              >
                {item.label}
                {item.placeholder ? (
                  <span
                    aria-hidden="true"
                    title="Sẽ triển khai ở phase sau"
                    className="size-1.5 rounded-full bg-line-strong"
                  />
                ) : null}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
