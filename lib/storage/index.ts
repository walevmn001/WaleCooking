import "server-only";

import { LocalStorageAdapter } from "./local-storage.adapter";
import { hasR2Env, R2StorageAdapter } from "./r2-storage.adapter";
import type { StoragePort } from "./storage.port";

/**
 * Chọn nhà cung cấp lưu trữ theo cấu hình (P02 §12):
 * - Có đủ `R2_*` → R2StorageAdapter (mục tiêu production).
 * - Chưa cấu hình + `NODE_ENV != production` → LocalStorageAdapter (dev/test).
 * - Chưa cấu hình + production → **ném lỗi rõ ràng** (P12.3 / FIND-07): KHÔNG cho phép
 *   production ghi tệp vào filesystem tạm (ephemeral) của Vercel — tránh mất dữ liệu.
 *
 * Lazy: hàm được gọi khi THỰC SỰ cần lưu trữ (không ở phạm vi module) → `next build`
 * không bị ảnh hưởng (xem `MediaService` giải mã storage lazily).
 * Singleton: adapter được tạo một lần cho mỗi tiến trình.
 */

let cached: StoragePort | null = null;

/** Lỗi cấu hình thiếu R2 ở production (không lộ giá trị bí mật). */
function missingR2InProduction(): Error {
  return new Error(
    "[storage] Production yêu cầu cấu hình Cloudflare R2 " +
      "(R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET). " +
      "Local storage chỉ dùng cho dev/test.",
  );
}

export function getStorage(): StoragePort {
  if (cached) return cached;
  if (hasR2Env()) {
    cached = new R2StorageAdapter();
  } else if (process.env.NODE_ENV === "production") {
    throw missingR2InProduction();
  } else {
    cached = new LocalStorageAdapter();
  }
  return cached;
}

/** Ghi đè adapter — CHỈ dùng trong kiểm thử. Truyền `null` để xóa cache. */
export function setStorageForTesting(adapter: StoragePort | null): void {
  cached = adapter;
}

export type { StoragePort } from "./storage.port";
export { LocalStorageAdapter, isSafeStorageKey } from "./local-storage.adapter";
export { R2StorageAdapter, readR2Config, hasR2Env } from "./r2-storage.adapter";
