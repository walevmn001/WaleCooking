import "server-only";

import { LocalStorageAdapter } from "./local-storage.adapter";
import { hasR2Env, R2StorageAdapter } from "./r2-storage.adapter";
import type { StoragePort } from "./storage.port";

/**
 * Chọn nhà cung cấp lưu trữ theo cấu hình (P02 §12):
 * - Có đủ `R2_*` → R2StorageAdapter (mục tiêu).
 * - Chưa cấu hình → LocalStorageAdapter (dev/test) — KHÔNG tuyên bố R2 đã kết nối.
 *
 * Singleton: adapter được tạo một lần cho mỗi tiến trình.
 */

let cached: StoragePort | null = null;

export function getStorage(): StoragePort {
  if (cached) return cached;
  cached = hasR2Env() ? new R2StorageAdapter() : new LocalStorageAdapter();
  return cached;
}

/** Ghi đè adapter — CHỈ dùng trong kiểm thử. Truyền `null` để xóa cache. */
export function setStorageForTesting(adapter: StoragePort | null): void {
  cached = adapter;
}

export type { StoragePort } from "./storage.port";
export { LocalStorageAdapter, isSafeStorageKey } from "./local-storage.adapter";
export { R2StorageAdapter, readR2Config, hasR2Env } from "./r2-storage.adapter";
