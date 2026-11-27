import { afterEach, describe, expect, it } from "vitest";

import { ConflictError } from "@/lib/errors/app-error";
import { LocalStorageAdapter, isSafeStorageKey } from "@/lib/storage/local-storage.adapter";
import { hasR2Env, readR2Config } from "@/lib/storage/r2-storage.adapter";
import type { StoragePort } from "@/lib/storage/storage.port";

/**
 * Contract test cho StoragePort (P07.1 §6.3).
 *
 * - LocalStorageAdapter: kiểm tra put/delete/publicUrl + chống path traversal.
 * - R2 adapter: kiểm tra cấu hình env (không có credentials → báo lỗi rõ ràng,
 *   KHÔNG lộ giá trị bí mật). Upload/đọc R2 thật cần credentials → external verification.
 */

const PNG_BYTES = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00]);

describe("StoragePort contract — LocalStorageAdapter", () => {
  const adapter: StoragePort = new LocalStorageAdapter(".media-local-test");

  it("provider là 'local'", () => {
    expect(adapter.provider).toBe("local");
  });

  it("put trả về key và url", async () => {
    const key = `recipes/2026/11/test-${Date.now()}.png`;
    const result = await adapter.put({ key, body: PNG_BYTES, contentType: "image/png" });
    expect(result.key).toBe(key);
    expect(result.url).toBe(adapter.publicUrl(key));
    await adapter.delete(key);
  });

  it("publicUrl dùng proxy nội bộ (không lộ đường dẫn máy)", () => {
    const url = adapter.publicUrl("recipes/2026/11/abc.png");
    expect(url).toMatch(/^\/api\/v1\/media\/file\//);
    expect(url).not.toContain("..");
  });

  it("chặn path traversal qua key nguy hiểm", () => {
    expect(isSafeStorageKey("../etc/passwd")).toBe(false);
    expect(isSafeStorageKey("recipes/../../../etc/passwd")).toBe(false);
    expect(isSafeStorageKey("/absolute/path")).toBe(false);
    expect(isSafeStorageKey("recipes/2026/11/abc.png")).toBe(true);
  });

  it("put với key không hợp lệ ném ConflictError", async () => {
    await expect(
      adapter.put({ key: "../evil.png", body: PNG_BYTES, contentType: "image/png" }),
    ).rejects.toBeInstanceOf(ConflictError);
  });

  it("delete không lỗi với key không tồn tại", async () => {
    await expect(adapter.delete("does-not-exist.png")).resolves.toBeUndefined();
  });
});

describe("R2 adapter — cấu hình env (không credentials)", () => {
  const original = { ...process.env };
  afterEach(() => {
    process.env = { ...original };
  });

  it("hasR2Env() trả false khi thiếu biến", () => {
    delete process.env.R2_ACCOUNT_ID;
    delete process.env.R2_ACCESS_KEY_ID;
    delete process.env.R2_SECRET_ACCESS_KEY;
    delete process.env.R2_BUCKET;
    expect(hasR2Env()).toBe(false);
  });

  it("readR2Config() ném lỗi rõ ràng khi thiếu (không lộ giá trị)", () => {
    delete process.env.R2_ACCOUNT_ID;
    delete process.env.R2_ACCESS_KEY_ID;
    delete process.env.R2_SECRET_ACCESS_KEY;
    delete process.env.R2_BUCKET;
    expect(() => readR2Config()).toThrow(/R2_ACCOUNT_ID/);
  });

  it("readR2Config() trả về cấu hình khi đủ", () => {
    process.env.R2_ACCOUNT_ID = "acc";
    process.env.R2_ACCESS_KEY_ID = "key";
    process.env.R2_SECRET_ACCESS_KEY = "secret";
    process.env.R2_BUCKET = "bucket";
    const cfg = readR2Config();
    expect(cfg.accountId).toBe("acc");
    expect(cfg.bucket).toBe("bucket");
    expect(cfg.publicBaseUrl).toBeUndefined();
  });
});
