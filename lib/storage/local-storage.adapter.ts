import "server-only";

import { mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";

import { ConflictError } from "@/lib/errors/app-error";

import type { PutObjectInput, StoragePort, StoredObject } from "./storage.port";

/**
 * LocalStorageAdapter — nhà cung cấp lưu trữ CỤC BỘ cho dev/test (P02 §12).
 *
 * - Ghi bytes xuống thư mục `MEDIA_LOCAL_DIR` (mặc định `.media-local`).
 * - Phục vụ qua route proxy nội bộ `/api/v1/media/file/{key}` (đúng tinh thần
 *   server-proxy MVP — D-P02-06).
 * - KHÔNG dùng cho production: ghi tệp cục bộ không phù hợp môi trường serverless.
 *   Khi chưa cấu hình R2, adapter này đủ để phát triển/kiểm thử end-to-end.
 */

const KEY_PATTERN = /^[a-zA-Z0-9][a-zA-Z0-9/_.-]*$/;

/** Chặn path traversal: khóa chỉ gồm ký tự an toàn và không chứa `..`. */
export function isSafeStorageKey(key: string): boolean {
  return KEY_PATTERN.test(key) && !key.includes("..") && !key.startsWith("/");
}

export class LocalStorageAdapter implements StoragePort {
  readonly provider = "local" as const;
  private readonly rootDir: string;

  constructor(rootDir?: string) {
    // Đọc trực tiếp từ env (không qua `serverEnv()`) để module này không phụ thuộc
    // cấu hình DATABASE_URL khi chỉ kiểm thử lưu trữ.
    this.rootDir = path.resolve(rootDir ?? process.env.MEDIA_LOCAL_DIR ?? ".media-local");
  }

  private resolvePath(key: string): string {
    if (!isSafeStorageKey(key)) {
      // Khóa không hợp lệ là lỗi lập trình (server sinh khóa) → 409 an toàn.
      throw new ConflictError("Khóa lưu trữ không hợp lệ.");
    }
    const target = path.resolve(this.rootDir, key);
    if (!target.startsWith(this.rootDir + path.sep)) {
      throw new ConflictError("Khóa lưu trữ không hợp lệ.");
    }
    return target;
  }

  async put(input: PutObjectInput): Promise<StoredObject> {
    const target = this.resolvePath(input.key);
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, input.body);
    return { key: input.key, url: this.publicUrl(input.key) };
  }

  async delete(key: string): Promise<void> {
    const target = this.resolvePath(key);
    await rm(target, { force: true });
  }

  publicUrl(key: string): string {
    return `/api/v1/media/file/${key.split("/").map(encodeURIComponent).join("/")}`;
  }
}
