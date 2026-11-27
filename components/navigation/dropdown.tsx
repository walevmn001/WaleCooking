"use client";

import {
  cloneElement,
  isValidElement,
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactElement,
  type ReactNode,
} from "react";
import { cn } from "@/lib/utils/cn";
import { useOutsideClick } from "@/lib/hooks/use-outside-click";

export interface DropdownItem {
  label: ReactNode;
  onSelect?: () => void;
  icon?: ReactNode;
  danger?: boolean;
  disabled?: boolean;
}

export interface DropdownProps {
  /** Phần tử kích hoạt (thường là Button/IconButton). */
  trigger: ReactElement<{
    onClick?: (e: React.MouseEvent<HTMLElement>) => void;
    "aria-haspopup"?: string;
    "aria-expanded"?: boolean;
    "aria-controls"?: string;
  }>;
  items: DropdownItem[];
  /** Nhãn cho menu (bắt buộc cho a11y). */
  label: string;
  align?: "start" | "end";
  className?: string;
}

/**
 * Dropdown — menu ngữ cảnh. Hỗ trợ bàn phím ↑/↓/Home/End/Esc/Tab,
 * đóng khi click ngoài, trả focus về trigger.
 */
export function Dropdown({ trigger, items, label, align = "start", className }: DropdownProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);
  const menuId = useId();

  const close = (returnFocus = true) => {
    setOpen(false);
    if (returnFocus) triggerRef.current?.focus();
  };

  useOutsideClick(rootRef, () => close(false), open);

  useEffect(() => {
    if (!open) return;
    const first = menuRef.current?.querySelector<HTMLElement>('[role="menuitem"]:not([disabled])');
    first?.focus();
  }, [open]);

  const enabledItems = () =>
    Array.from(
      menuRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]:not([disabled])') ?? [],
    );

  const onMenuKeyDown = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    const list = enabledItems();
    if (list.length === 0) return;
    const index = list.indexOf(document.activeElement as HTMLElement);
    if (e.key === "ArrowDown") {
      e.preventDefault();
      list[(index + 1) % list.length]?.focus();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      list[(index - 1 + list.length) % list.length]?.focus();
    } else if (e.key === "Home") {
      e.preventDefault();
      list[0]?.focus();
    } else if (e.key === "End") {
      e.preventDefault();
      list[list.length - 1]?.focus();
    } else if (e.key === "Escape") {
      e.preventDefault();
      close(true);
    } else if (e.key === "Tab") {
      close(false);
    }
  };

  const triggerEl = isValidElement(trigger)
    ? cloneElement(trigger, {
        "aria-haspopup": "menu",
        "aria-expanded": open,
        "aria-controls": open ? menuId : undefined,
        onClick: (e: React.MouseEvent<HTMLElement>) => {
          triggerRef.current = e.currentTarget;
          trigger.props.onClick?.(e);
          setOpen((v) => !v);
        },
      })
    : trigger;

  return (
    <div ref={rootRef} className={cn("relative inline-block", className)}>
      {triggerEl}
      {open ? (
        <div
          ref={menuRef}
          role="menu"
          id={menuId}
          aria-label={label}
          onKeyDown={onMenuKeyDown}
          className={cn(
            "absolute mt-1 z-dropdown min-w-44 rounded-md border border-line-subtle bg-surface p-1 shadow-lg animate-fade-in",
            align === "end" ? "right-0" : "left-0",
          )}
        >
          {items.map((item, index) => (
            <button
              key={index}
              type="button"
              role="menuitem"
              tabIndex={-1}
              disabled={item.disabled}
              onClick={() => {
                item.onSelect?.();
                close(true);
              }}
              className={cn(
                "flex w-full items-center gap-2 rounded-sm px-3 py-2 text-left text-body-sm transition-colors duration-fast",
                "focus-visible:outline-none focus-visible:focus-ring",
                "disabled:cursor-not-allowed disabled:text-ink-disabled",
                item.danger
                  ? "text-danger hover:bg-chip-danger-bg"
                  : "text-ink hover:bg-primary-subtle",
              )}
            >
              {item.icon ? (
                <span aria-hidden="true" className="inline-flex shrink-0">
                  {item.icon}
                </span>
              ) : null}
              <span className="flex-1">{item.label}</span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
