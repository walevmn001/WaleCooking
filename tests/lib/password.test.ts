import { describe, expect, it } from "vitest";

import { hashPassword, verifyPassword } from "@/lib/auth/password";

/**
 * Unit test — băm/kiểm tra mật khẩu (P18, giải quyết B-P06-02).
 * Bảo đảm: KHÔNG lưu mật khẩu thô, salt ngẫu nhiên, verify an toàn với dữ liệu hỏng.
 */

describe("password hashing (scrypt)", () => {
  it("băm thành chuỗi scrypt tự mô tả tham số, KHÔNG chứa mật khẩu thô", async () => {
    const raw = "Mat-Khau-Rat-Dai-2026";
    const hash = await hashPassword(raw);

    expect(hash.startsWith("scrypt$")).toBe(true);
    expect(hash.split("$")).toHaveLength(6);
    expect(hash).not.toContain(raw);
  });

  it("cùng mật khẩu cho ra hash KHÁC nhau (salt ngẫu nhiên mỗi lần)", async () => {
    const a = await hashPassword("cung-mot-mat-khau");
    const b = await hashPassword("cung-mot-mat-khau");
    expect(a).not.toBe(b);
  });

  it("verifyPassword đúng với mật khẩu đúng và sai với mật khẩu sai", async () => {
    const hash = await hashPassword("dung-mat-khau-123");
    expect(await verifyPassword("dung-mat-khau-123", hash)).toBe(true);
    expect(await verifyPassword("sai-mat-khau-456", hash)).toBe(false);
  });

  it("verifyPassword trả false (KHÔNG ném) với hash hỏng/định dạng lạ", async () => {
    expect(await verifyPassword("x", "")).toBe(false);
    expect(await verifyPassword("x", "plaintext-khong-phai-hash")).toBe(false);
    expect(await verifyPassword("x", "scrypt$bad$bad$bad$bad$bad")).toBe(false);
    expect(await verifyPassword("x", "sha256$1$1$1$YQ==$YQ==")).toBe(false);
  });
});
