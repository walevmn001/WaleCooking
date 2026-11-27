import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { Link } from "@/components/ui/link";

export interface BreadcrumbItem {
  label: string;
  /** Bỏ trống ở mục cuối (trang hiện tại). */
  href?: string;
}

export interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}

/**
 * Breadcrumb — điều hướng phân cấp. Mục cuối có `aria-current="page"`.
 */
export function Breadcrumb({ items, className }: BreadcrumbProps) {
  if (items.length === 0) return null;

  return (
    <nav aria-label="Đường dẫn" className={cn("w-full", className)}>
      <ol className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-body-sm">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li key={`${item.label}-${index}`} className="flex items-center gap-1.5">
              {item.href && !isLast ? (
                <Link
                  href={item.href}
                  appearance="unstyled"
                  className="text-ink-muted underline-offset-4 hover:text-primary hover:underline focus-visible:outline-none focus-visible:focus-ring rounded-sm"
                >
                  {item.label}
                </Link>
              ) : (
                <span
                  aria-current={isLast ? "page" : undefined}
                  className={cn(isLast ? "font-semibold text-ink" : "text-ink-muted")}
                >
                  {item.label}
                </span>
              )}
              {!isLast ? (
                <ChevronRight aria-hidden="true" className="size-4 shrink-0 text-ink-subtle" />
              ) : null}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
