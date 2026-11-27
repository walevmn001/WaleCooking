import { cn } from "@/lib/utils/cn";
import { Spinner } from "./spinner";

export interface LoadingStateProps {
  /** Thông điệp hiển thị. Mặc định "Đang tải…". */
  message?: string;
  /** Bọc trong khung card. */
  className?: string;
  /** Chiều cao tối thiểu của vùng chờ. */
  minHeight?: string;
}

/**
 * LoadingState — trạng thái đang tải cho cả vùng nội dung.
 * `role="status"` + `aria-live="polite"` để screen reader thông báo.
 */
export function LoadingState({
  message = "Đang tải…",
  className,
  minHeight = "12rem",
}: LoadingStateProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      style={{ minHeight }}
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-lg border border-line-subtle bg-surface px-6 py-10 text-center",
        className,
      )}
    >
      <span aria-hidden="true">
        <Spinner size="lg" label={message} />
      </span>
      <p className="text-body text-ink-muted">{message}</p>
    </div>
  );
}
