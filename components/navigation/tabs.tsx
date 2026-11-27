"use client";

import { useId, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

export interface TabItem {
  id: string;
  label: ReactNode;
  content: ReactNode;
  disabled?: boolean;
}

export interface TabsProps {
  items: TabItem[];
  /** id tab mặc định chọn (không kiểm soát). */
  defaultTabId?: string;
  /** id tab đang chọn (kiểm soát). */
  tabId?: string;
  onTabChange?: (id: string) => void;
  className?: string;
  /** Nhãn cho nhóm tab (bắt buộc cho a11y khi không có tiêu đề bao ngoài). */
  "aria-label"?: string;
}

/**
 * Tabs — tablist/tab/tabpanel với điều hướng bàn phím ←/→/Home/End.
 * Quản lý `aria-selected`, `aria-controls`, `aria-labelledby`.
 */
export function Tabs({
  items,
  defaultTabId,
  tabId,
  onTabChange,
  className,
  "aria-label": ariaLabel,
}: TabsProps) {
  const baseId = useId();
  const firstEnabled = items.find((i) => !i.disabled)?.id;
  const [internal, setInternal] = useState(defaultTabId ?? firstEnabled ?? "");
  const activeId = tabId ?? internal;
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  const select = (id: string) => {
    if (tabId === undefined) setInternal(id);
    onTabChange?.(id);
  };

  const focusTab = (id: string) => {
    tabRefs.current[id]?.focus();
  };

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const enabled = items.filter((i) => !i.disabled);
    const currentIndex = enabled.findIndex((i) => i.id === activeId);
    if (currentIndex === -1) return;

    let nextIndex: number | null = null;
    if (e.key === "ArrowRight") nextIndex = (currentIndex + 1) % enabled.length;
    else if (e.key === "ArrowLeft")
      nextIndex = (currentIndex - 1 + enabled.length) % enabled.length;
    else if (e.key === "Home") nextIndex = 0;
    else if (e.key === "End") nextIndex = enabled.length - 1;

    if (nextIndex !== null) {
      e.preventDefault();
      const next = enabled[nextIndex]!;
      select(next.id);
      focusTab(next.id);
    }
  };

  const active = items.find((i) => i.id === activeId);

  return (
    <div className={cn("flex flex-col gap-4", className)}>
      <div
        role="tablist"
        aria-label={ariaLabel}
        onKeyDown={onKeyDown}
        className="flex gap-1 overflow-x-auto border-b border-line-subtle"
      >
        {items.map((item) => {
          const selected = item.id === activeId;
          return (
            <button
              key={item.id}
              ref={(el) => {
                tabRefs.current[item.id] = el;
              }}
              role="tab"
              id={`${baseId}-tab-${item.id}`}
              aria-selected={selected}
              aria-controls={`${baseId}-panel-${item.id}`}
              tabIndex={selected ? 0 : -1}
              disabled={item.disabled}
              onClick={() => select(item.id)}
              className={cn(
                "-mb-px border-b-2 px-4 py-2.5 text-nav whitespace-nowrap transition-colors duration-fast",
                "focus-visible:outline-none focus-visible:focus-ring rounded-t-md",
                "disabled:cursor-not-allowed disabled:text-ink-disabled",
                selected
                  ? "border-primary text-primary font-semibold"
                  : "border-transparent text-ink-muted hover:text-ink hover:border-line-strong",
              )}
            >
              {item.label}
            </button>
          );
        })}
      </div>

      {active ? (
        <div
          role="tabpanel"
          id={`${baseId}-panel-${active.id}`}
          aria-labelledby={`${baseId}-tab-${active.id}`}
          tabIndex={0}
          className="focus-visible:outline-none focus-visible:focus-ring rounded-md"
        >
          {active.content}
        </div>
      ) : null}
    </div>
  );
}
