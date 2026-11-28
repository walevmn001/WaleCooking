"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { createPortal } from "react-dom";
import { ChevronLeft, ChevronRight, List, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { IconButton } from "@/components/ui/icon-button";
import { CookingProgress } from "./cooking-progress";
import { formatMinutes } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";
import type { RecipeStep } from "@/components/recipe/types";

export interface CookingModeLayoutProps {
  open: boolean;
  /** Tiêu đề công thức. */
  title: string;
  steps: RecipeStep[];
  /** Chỉ số bước hiện tại (0-based). */
  currentIndex: number;
  onSelectStep: (index: number) => void;
  /** Yêu cầu kết thúc (mở hộp thoại xác nhận). */
  onRequestExit: () => void;
}

const FOCUSABLE = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * CookingModeLayout — chế độ nấu toàn màn hình (P09.2). Tập trung vào bước hiện tại,
 * chữ lớn, nút lớn, khoảng cách thoải mái, dùng được trên điện thoại khi đang đứng bếp.
 * Không sinh/đổi thứ tự bước. Đóng bằng Esc (mở xác nhận) — có focus trap cơ bản.
 */
export function CookingModeLayout({
  open,
  title,
  steps,
  currentIndex,
  onSelectStep,
  onRequestExit,
}: CookingModeLayoutProps) {
  const [mounted, setMounted] = useState(false);
  const [showList, setShowList] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    previouslyFocused.current = document.activeElement as HTMLElement | null;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const timer = window.setTimeout(() => {
      const target =
        dialogRef.current?.querySelector<HTMLElement>(FOCUSABLE) ?? dialogRef.current;
      target?.focus();
    }, 0);
    return () => {
      window.clearTimeout(timer);
      document.body.style.overflow = originalOverflow;
      previouslyFocused.current?.focus();
    };
  }, [open]);

  // Đóng danh sách bước khi chuyển bước (giữ tập trung vào bước hiện tại).
  useEffect(() => {
    setShowList(false);
  }, [currentIndex]);

  if (!mounted || !open) return null;

  const step = steps[currentIndex];
  const total = steps.length;
  const isFirst = currentIndex <= 0;
  const isLast = currentIndex >= total - 1;

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Escape") {
      e.stopPropagation();
      onRequestExit();
      return;
    }
    if (e.key !== "Tab") return;
    const nodes = Array.from(dialogRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? []);
    if (nodes.length === 0) {
      e.preventDefault();
      return;
    }
    const first = nodes[0]!;
    const last = nodes[nodes.length - 1]!;
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };

  return createPortal(
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-label={`Chế độ nấu: ${title}`}
      tabIndex={-1}
      onKeyDown={onKeyDown}
      className="fixed inset-0 z-modal flex flex-col bg-background"
    >
      {/* Thanh đầu — tiêu đề + tiến độ + thoát */}
      <header className="flex items-center gap-3 border-b border-line-subtle bg-surface px-4 py-3 sm:px-6">
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <p className="truncate text-body-sm font-semibold text-ink-muted">{title}</p>
          <CookingProgress current={currentIndex + 1} total={total} />
        </div>
        <IconButton aria-label="Kết thúc chế độ nấu" size="lg" onClick={onRequestExit}>
          <X className="size-6" aria-hidden="true" />
        </IconButton>
      </header>

      {/* Nội dung — bước hiện tại */}
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto flex w-full max-w-2xl flex-col gap-5 px-4 py-6 sm:px-6">
          {step ? (
            <article className="flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <span
                  aria-hidden="true"
                  className="flex size-12 shrink-0 items-center justify-center rounded-full bg-primary text-h3 font-bold text-ink-inverse"
                >
                  {step.order}
                </span>
                <h2 className="text-h3 text-ink">Bước {step.order}</h2>
              </div>

              <p className="text-body-lg leading-relaxed text-ink">{step.instruction}</p>

              {step.durationMinutes ? (
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="info" size="md">
                    {formatMinutes(step.durationMinutes)}
                  </Badge>
                </div>
              ) : null}

              {step.imageUrl ? (
                // Ảnh bước — dùng thẻ img thuần vì URL có thể nằm ngoài miền đã cấu hình cho next/image.
                <img
                  src={step.imageUrl}
                  alt={step.imageAlt ?? `Bước ${step.order}`}
                  className="w-full rounded-lg border border-line-subtle object-cover"
                />
              ) : null}

              {step.tip ? (
                <p className="rounded-lg bg-primary-subtle/60 px-4 py-3 text-body text-ink-on-brand">
                  <span className="font-semibold">Mẹo: </span>
                  {step.tip}
                </p>
              ) : null}
            </article>
          ) : (
            <p className="text-body text-ink-muted">Công thức chưa có bước nào.</p>
          )}

          {/* Danh sách bước (xem lại / chuyển nhanh) */}
          <div className="flex flex-col gap-3">
            <Button
              variant="outline"
              size="md"
              className="self-start"
              onClick={() => setShowList((v) => !v)}
              aria-expanded={showList}
              leftIcon={<List className="size-5" aria-hidden="true" />}
            >
              {showList ? "Ẩn danh sách bước" : "Xem danh sách bước"}
            </Button>

            {showList ? (
              <ol className="flex flex-col gap-2">
                {steps.map((s, index) => {
                  const isCurrent = index === currentIndex;
                  return (
                    <li key={s.id}>
                      <button
                        type="button"
                        onClick={() => onSelectStep(index)}
                        aria-current={isCurrent ? "step" : undefined}
                        className={cn(
                          "flex w-full items-start gap-3 rounded-lg border p-3 text-left transition-colors duration-fast",
                          "focus-visible:outline-none focus-visible:focus-ring",
                          isCurrent
                            ? "border-primary bg-primary-subtle"
                            : "border-line-subtle bg-surface hover:bg-surface-muted",
                        )}
                      >
                        <span
                          aria-hidden="true"
                          className={cn(
                            "flex size-7 shrink-0 items-center justify-center rounded-full text-body-sm font-bold",
                            isCurrent
                              ? "bg-primary text-ink-inverse"
                              : "bg-surface-muted text-ink-muted",
                          )}
                        >
                          {s.order}
                        </span>
                        <span className="min-w-0 flex-1 text-body text-ink">{s.instruction}</span>
                      </button>
                    </li>
                  );
                })}
              </ol>
            ) : null}
          </div>
        </div>
      </div>

      {/* Thanh cuối — điều hướng bước */}
      <footer className="flex items-center justify-between gap-3 border-t border-line-subtle bg-surface px-4 py-3 sm:px-6">
        <Button
          variant="outline"
          size="lg"
          onClick={() => onSelectStep(Math.max(0, currentIndex - 1))}
          disabled={isFirst}
          leftIcon={<ChevronLeft className="size-5" aria-hidden="true" />}
        >
          Bước trước
        </Button>
        {isLast ? (
          <Button variant="primary" size="lg" onClick={onRequestExit}>
            Hoàn tất
          </Button>
        ) : (
          <Button
            variant="primary"
            size="lg"
            onClick={() => onSelectStep(Math.min(total - 1, currentIndex + 1))}
            rightIcon={<ChevronRight className="size-5" aria-hidden="true" />}
          >
            Bước tiếp theo
          </Button>
        )}
      </footer>
    </div>,
    document.body,
  );
}
