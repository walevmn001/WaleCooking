import Image from "next/image";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

export interface ErrorStateProps {
  title?: string;
  description?: string;
  /** Hành động khắc phục (nút "Thử lại", link về trang chủ...). */
  action?: ReactNode;
  illustrationSrc?: string;
  className?: string;
}

/**
 * ErrorState — trạng thái lỗi. `role="alert"` để screen reader đọc ngay khi xuất hiện.
 * Không truyền đạt lỗi chỉ bằng màu: luôn có tiêu đề + mô tả chữ.
 */
export function ErrorState({
  title = "Đã xảy ra lỗi",
  description = "Rất tiếc, nội dung này không tải được. Vui lòng thử lại.",
  action,
  illustrationSrc = "/assets/illustrations/error.svg",
  className,
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      className={cn(
        "flex flex-col items-center justify-center gap-4 rounded-lg border border-line-subtle bg-surface px-6 py-12 text-center",
        className,
      )}
    >
      <Image
        src={illustrationSrc}
        alt=""
        aria-hidden="true"
        width={144}
        height={144}
        unoptimized
        className="size-28 sm:size-36"
      />
      <div className="flex flex-col gap-1.5">
        <h2 className="text-h3 text-ink">{title}</h2>
        <p className="mx-auto max-w-[52ch] text-body text-ink-muted">{description}</p>
      </div>
      {action ? <div className="mt-1">{action}</div> : null}
    </div>
  );
}
