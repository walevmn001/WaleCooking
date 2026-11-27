import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { Link } from "@/components/ui/link";

export interface PaginationProps {
  /** Trang hiện tại (1-based). */
  page: number;
  totalPages: number;
  /** Sinh href cho một trang. */
  hrefFor: (page: number) => string;
  /** Số trang lân cận hiển thị (mặc định 1). */
  siblingCount?: number;
  className?: string;
}

function range(start: number, end: number): number[] {
  return Array.from({ length: end - start + 1 }, (_, i) => start + i);
}

function buildPages(page: number, total: number, siblings: number): (number | "…")[] {
  const totalNumbers = siblings * 2 + 5; // first,last,current,2*siblings,2 ellipsis
  if (total <= totalNumbers) return range(1, total);

  const left = Math.max(page - siblings, 1);
  const right = Math.min(page + siblings, total);
  const showLeftEllipsis = left > 2;
  const showRightEllipsis = right < total - 1;

  const pages: (number | "…")[] = [1];
  if (showLeftEllipsis) pages.push("…");
  pages.push(...range(Math.max(left, 2), Math.min(right, total - 1)));
  if (showRightEllipsis) pages.push("…");
  pages.push(total);
  return pages;
}

const itemBase =
  "inline-flex size-10 items-center justify-center rounded-md text-body-sm font-semibold transition-colors duration-fast focus-visible:outline-none focus-visible:focus-ring";

/**
 * Pagination — điều hướng trang. `aria-current="page"` cho trang hiện tại.
 */
export function Pagination({
  page,
  totalPages,
  hrefFor,
  siblingCount = 1,
  className,
}: PaginationProps) {
  if (totalPages <= 1) return null;
  const pages = buildPages(page, totalPages, siblingCount);
  const hasPrev = page > 1;
  const hasNext = page < totalPages;

  return (
    <nav aria-label="Phân trang" className={cn("flex items-center justify-center gap-1", className)}>
      <Link
        href={hasPrev ? hrefFor(page - 1) : hrefFor(1)}
        aria-label="Trang trước"
        aria-disabled={!hasPrev || undefined}
        tabIndex={hasPrev ? undefined : -1}
        appearance="unstyled"
        className={cn(
          itemBase,
          hasPrev ? "text-ink hover:bg-primary-subtle" : "pointer-events-none text-ink-disabled",
        )}
      >
        <ChevronLeft className="size-4" aria-hidden="true" />
      </Link>

      {pages.map((p, i) =>
        p === "…" ? (
          <span
            key={`ellipsis-${i}`}
            aria-hidden="true"
            className="inline-flex size-10 items-center justify-center text-ink-muted"
          >
            <MoreHorizontal className="size-4" />
          </span>
        ) : (
          <Link
            key={p}
            href={hrefFor(p)}
            aria-label={`Trang ${p}`}
            aria-current={p === page ? "page" : undefined}
            appearance="unstyled"
            className={cn(
              itemBase,
              p === page
                ? "bg-primary text-ink-inverse"
                : "text-ink hover:bg-primary-subtle",
            )}
          >
            {p}
          </Link>
        ),
      )}

      <Link
        href={hasNext ? hrefFor(page + 1) : hrefFor(totalPages)}
        aria-label="Trang sau"
        aria-disabled={!hasNext || undefined}
        tabIndex={hasNext ? undefined : -1}
        appearance="unstyled"
        className={cn(
          itemBase,
          hasNext ? "text-ink hover:bg-primary-subtle" : "pointer-events-none text-ink-disabled",
        )}
      >
        <ChevronRight className="size-4" aria-hidden="true" />
      </Link>
    </nav>
  );
}
