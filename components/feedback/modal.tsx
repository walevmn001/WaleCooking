"use client";

import { useEffect, useId, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { IconButton } from "@/components/ui/icon-button";

export type ModalSize = "sm" | "md" | "lg";

const sizeMap: Record<ModalSize, string> = {
  sm: "max-w-md",
  md: "max-w-lg",
  lg: "max-w-2xl",
};

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])';

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
  footer?: ReactNode;
  size?: ModalSize;
  /** Đóng khi click overlay (mặc định true). */
  closeOnOverlay?: boolean;
  /** Hiện nút X (mặc định true). */
  showClose?: boolean;
}

/**
 * Modal — hộp thoại. `role="dialog" aria-modal`, focus trap, đóng bằng Esc,
 * khoá cuộn nền, trả focus về phần tử trước đó.
 */
export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = "md",
  closeOnOverlay = true,
  showClose = true,
}: ModalProps) {
  const [mounted, setMounted] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);
  const titleId = useId();
  const descId = useId();

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

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Escape") {
      e.stopPropagation();
      onClose();
      return;
    }
    if (e.key !== "Tab") return;
    const nodes = Array.from(
      dialogRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? [],
    );
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

  if (!mounted || !open) return null;

  return createPortal(
    <div className="fixed inset-0 z-modal flex items-end justify-center p-0 sm:items-center sm:p-4">
      <div
        className="absolute inset-0 bg-background-inverse/50 animate-fade-in"
        aria-hidden="true"
        onClick={closeOnOverlay ? onClose : undefined}
      />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descId : undefined}
        tabIndex={-1}
        onKeyDown={onKeyDown}
        className={cn(
          "relative z-10 flex max-h-[90dvh] w-full flex-col rounded-t-xl bg-surface shadow-xl animate-scale-in sm:rounded-xl",
          sizeMap[size],
        )}
      >
        <div className="flex items-start gap-3 border-b border-line-subtle p-4 sm:p-5">
          <div className="flex flex-1 flex-col gap-1">
            <h2 id={titleId} className="text-h4 text-ink">
              {title}
            </h2>
            {description ? (
              <p id={descId} className="text-body-sm text-ink-muted">
                {description}
              </p>
            ) : null}
          </div>
          {showClose ? (
            <IconButton aria-label="Đóng hộp thoại" size="sm" onClick={onClose}>
              <X className="size-5" aria-hidden="true" />
            </IconButton>
          ) : null}
        </div>

        {children ? <div className="flex-1 overflow-y-auto p-4 sm:p-5">{children}</div> : null}

        {footer ? (
          <div className="flex flex-wrap justify-end gap-3 border-t border-line-subtle p-4 sm:p-5">
            {footer}
          </div>
        ) : null}
      </div>
    </div>,
    document.body,
  );
}
