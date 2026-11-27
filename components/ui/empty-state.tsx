import Image from "next/image";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

export interface EmptyStateProps {
  title: string;
  description?: string;
  /** Hành động gợi ý (nút/link thật). */
  action?: ReactNode;
  /** Đường dẫn minh họa P04 (mặc định minh họa rỗng). */
  illustrationSrc?: string;
  illustrationAlt?: string;
  className?: string;
}

/**
 * EmptyState — trạng thái rỗng. Nêu rõ nguyên nhân + cách tiếp tục.
 */
export function EmptyState({
  title,
  description,
  action,
  illustrationSrc = "/assets/illustrations/empty-recipes.svg",
  illustrationAlt = "",
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-4 rounded-lg border border-line-subtle bg-surface px-6 py-12 text-center",
        className,
      )}
    >
      <Image
        src={illustrationSrc}
        alt={illustrationAlt}
        width={160}
        height={160}
        unoptimized
        className="size-32 sm:size-40"
        aria-hidden={illustrationAlt === "" ? true : undefined}
      />
      <div className="flex flex-col gap-1.5">
        <h2 className="text-h3 text-ink">{title}</h2>
        {description ? (
          <p className="mx-auto max-w-[52ch] text-body text-ink-muted">{description}</p>
        ) : null}
      </div>
      {action ? <div className="mt-1">{action}</div> : null}
    </div>
  );
}
