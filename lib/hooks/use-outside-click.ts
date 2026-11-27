"use client";

import { useEffect, type RefObject } from "react";

/** Gọi `handler` khi nhấn chuột/touch ra ngoài phần tử `ref` (đang bật). */
export function useOutsideClick<T extends HTMLElement>(
  ref: RefObject<T | null>,
  handler: () => void,
  enabled = true,
): void {
  useEffect(() => {
    if (!enabled) return;
    const onPointerDown = (event: MouseEvent | TouchEvent) => {
      const el = ref.current;
      if (!el) return;
      if (!el.contains(event.target as Node)) handler();
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("touchstart", onPointerDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("touchstart", onPointerDown);
    };
  }, [ref, handler, enabled]);
}
