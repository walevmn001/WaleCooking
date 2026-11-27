"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { AlertTriangle, CheckCircle2, Info, X, XCircle } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export type ToastTone = "info" | "success" | "warning" | "error";

export interface ToastAction {
  label: string;
  onClick: () => void;
}

export interface ToastOptions {
  title: string;
  description?: string;
  tone?: ToastTone;
  /** ms tự ẩn; mặc định 5000. Lỗi mặc định KHÔNG tự ẩn. */
  duration?: number;
  action?: ToastAction;
}

interface ToastRecord extends ToastOptions {
  id: string;
}

interface ToastContextValue {
  toast: (options: ToastOptions) => string;
  dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast phải được dùng bên trong <ToastProvider>");
  }
  return ctx;
}

const toneConfig: Record<ToastTone, { icon: ReactNode; className: string }> = {
  info: { icon: <Info className="size-5" aria-hidden="true" />, className: "text-info" },
  success: {
    icon: <CheckCircle2 className="size-5" aria-hidden="true" />,
    className: "text-success",
  },
  warning: {
    icon: <AlertTriangle className="size-5" aria-hidden="true" />,
    className: "text-warning",
  },
  error: { icon: <XCircle className="size-5" aria-hidden="true" />, className: "text-danger" },
};

/** ToastProvider — đặt ở root layout; cung cấp `useToast()`. */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastRecord[]>([]);
  const counter = useRef(0);
  const timers = useRef<Map<string, number>>(new Map());

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    const timer = timers.current.get(id);
    if (timer) {
      window.clearTimeout(timer);
      timers.current.delete(id);
    }
  }, []);

  const toast = useCallback(
    (options: ToastOptions) => {
      const id = `toast-${++counter.current}`;
      const record: ToastRecord = { tone: "info", ...options, id };
      setToasts((prev) => [...prev, record]);

      const tone = record.tone ?? "info";
      const duration = record.duration ?? (tone === "error" ? 0 : 5000);
      if (duration > 0) {
        const timer = window.setTimeout(() => dismiss(id), duration);
        timers.current.set(id, timer);
      }
      return id;
    },
    [dismiss],
  );

  const value = useMemo(() => ({ toast, dismiss }), [toast, dismiss]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        aria-atomic="false"
        className="pointer-events-none fixed inset-x-0 bottom-0 z-toast flex flex-col items-center gap-2 p-4 sm:items-end"
      >
        {toasts.map((t) => {
          const tone = t.tone ?? "info";
          const config = toneConfig[tone];
          return (
            <div
              key={t.id}
              role={tone === "error" ? "alert" : "status"}
              className={cn(
                "pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-md border border-line-subtle bg-surface p-3.5 shadow-lg animate-scale-in",
              )}
            >
              <span className={cn("mt-0.5 shrink-0", config.className)}>{config.icon}</span>
              <div className="flex flex-1 flex-col gap-0.5">
                <p className="text-body-sm font-semibold text-ink">{t.title}</p>
                {t.description ? (
                  <p className="text-body-sm text-ink-muted">{t.description}</p>
                ) : null}
                {t.action ? (
                  <button
                    type="button"
                    onClick={() => {
                      t.action?.onClick();
                      dismiss(t.id);
                    }}
                    className="mt-1 self-start text-body-sm font-semibold text-primary underline underline-offset-4 hover:text-primary-hover focus-visible:outline-none focus-visible:focus-ring rounded-sm"
                  >
                    {t.action.label}
                  </button>
                ) : null}
              </div>
              <button
                type="button"
                aria-label="Đóng thông báo"
                onClick={() => dismiss(t.id)}
                className="-mr-1 inline-flex size-7 shrink-0 items-center justify-center rounded-full text-ink-muted hover:bg-surface-muted focus-visible:outline-none focus-visible:focus-ring"
              >
                <X className="size-4" aria-hidden="true" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}
