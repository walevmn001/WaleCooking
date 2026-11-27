"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { Heart, User, X } from "lucide-react";
import { Link } from "@/components/ui/link";
import { IconButton } from "@/components/ui/icon-button";
import { Divider } from "@/components/ui/divider";
import { SearchInput } from "@/components/forms/search-input";
import { SiteLogo } from "./site-logo";
import { cn } from "@/lib/utils/cn";
import { accountNav, primaryNav, type NavItem } from "@/lib/constants/navigation";

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])';

export interface MobileMenuProps {
  open: boolean;
  onClose: () => void;
  items?: NavItem[];
}

/**
 * MobileMenu — ngăn kéo điều hướng cho màn hình nhỏ.
 * `role="dialog" aria-modal`; focus trap; Esc đóng; trả focus về nút mở.
 */
export function MobileMenu({ open, onClose, items = primaryNav }: MobileMenuProps) {
  const [mounted, setMounted] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);
  const router = useRouter();

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    previouslyFocused.current = document.activeElement as HTMLElement | null;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const timer = window.setTimeout(() => {
      panelRef.current?.querySelector<HTMLElement>(FOCUSABLE)?.focus();
    }, 0);

    return () => {
      window.clearTimeout(timer);
      document.body.style.overflow = originalOverflow;
      previouslyFocused.current?.focus();
    };
  }, [open]);

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Escape") {
      onClose();
      return;
    }
    if (e.key !== "Tab") return;
    const nodes = Array.from(panelRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? []);
    if (nodes.length === 0) return;
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
    <div className="fixed inset-0 z-modal lg:hidden">
      <div
        className="absolute inset-0 bg-background-inverse/50 animate-fade-in"
        aria-hidden="true"
        onClick={onClose}
      />
      <div
        ref={panelRef}
        id="mobile-menu"
        role="dialog"
        aria-modal="true"
        aria-label="Menu điều hướng"
        tabIndex={-1}
        onKeyDown={onKeyDown}
        className="absolute inset-y-0 left-0 flex w-[86%] max-w-xs flex-col gap-4 overflow-y-auto bg-surface p-4 shadow-xl"
      >
        <div className="flex items-center justify-between">
          <SiteLogo variant="full" />
          <IconButton aria-label="Đóng menu" size="sm" onClick={onClose}>
            <X className="size-5" aria-hidden="true" />
          </IconButton>
        </div>

        <SearchInput
          size="md"
          label="Tìm kiếm công thức"
          onSearch={(value) => {
            onClose();
            router.push(value ? `/tim-kiem?q=${encodeURIComponent(value)}` : "/tim-kiem");
          }}
        />

        <nav aria-label="Điều hướng chính (di động)">
          <ul className="flex flex-col gap-1">
            {items.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  appearance="unstyled"
                  onClick={onClose}
                  className={cn(
                    "flex items-center justify-between gap-2 rounded-md px-3 py-3 text-body font-semibold text-ink",
                    "hover:bg-primary-subtle focus-visible:outline-none focus-visible:focus-ring",
                  )}
                >
                  <span>{item.label}</span>
                  {item.placeholder ? (
                    <span className="text-caption font-normal text-ink-subtle">Sắp có</span>
                  ) : null}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <Divider />

        <ul className="flex flex-col gap-1">
          <li>
            <Link
              href="/yeu-thich"
              appearance="unstyled"
              onClick={onClose}
              className="flex items-center gap-3 rounded-md px-3 py-3 text-body font-semibold text-ink hover:bg-primary-subtle focus-visible:outline-none focus-visible:focus-ring"
            >
              <Heart className="size-5" aria-hidden="true" />
              Yêu thích
            </Link>
          </li>
          {accountNav.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                appearance="unstyled"
                onClick={onClose}
                className="flex items-center gap-3 rounded-md px-3 py-3 text-body font-semibold text-ink hover:bg-primary-subtle focus-visible:outline-none focus-visible:focus-ring"
              >
                <User className="size-5" aria-hidden="true" />
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>,
    document.body,
  );
}
