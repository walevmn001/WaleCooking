import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { hasR2Config, resetServerEnvCache, serverEnv } from "@/lib/config/env";

/**
 * P13.1.2 — Hợp đồng cấu hình datasource Neon.
 *
 * Kiểm chứng (không cần credentials thật):
 * - `DATABASE_URL` BẮT BUỘC và phải là chuỗi `postgresql://` (runtime dùng bản POOLED).
 * - `DIRECT_URL` TÙY CHỌN ở tầng này (Prisma CLI đọc trực tiếp cho `migrate`).
 * - Thông báo lỗi CHỈ nêu TÊN biến — KHÔNG lộ giá trị (connection string/secret).
 * - Hàm memoized: gọi nhiều lần trả cùng tham chiếu.
 */

const MANAGED = [
  "NODE_ENV",
  "DATABASE_URL",
  "DIRECT_URL",
  "TEST_DATABASE_URL",
  "AUTH_SECRET",
  "AUTH_URL",
  "R2_ACCOUNT_ID",
  "R2_ACCESS_KEY_ID",
  "R2_SECRET_ACCESS_KEY",
  "R2_BUCKET",
  "R2_PUBLIC_BASE_URL",
  "MEDIA_LOCAL_DIR",
] as const;

let saved: Record<string, string | undefined> = {};

/** `process.env` chỉ mục được nhưng `NODE_ENV` là thuộc tính chỉ đọc ở `@types/node`. */
const mutableEnv = process.env as Record<string, string | undefined>;

beforeEach(() => {
  saved = {};
  for (const key of MANAGED) {
    saved[key] = mutableEnv[key];
    delete mutableEnv[key];
  }
  resetServerEnvCache();
});

afterEach(() => {
  for (const key of MANAGED) {
    if (saved[key] === undefined) delete mutableEnv[key];
    else mutableEnv[key] = saved[key];
  }
  resetServerEnvCache();
});

describe("config/env — hợp đồng datasource Neon", () => {
  it("ném lỗi khi THIẾU DATABASE_URL, chỉ nêu tên biến (không lộ giá trị)", () => {
    expect(() => serverEnv()).toThrowError(/DATABASE_URL/);

    try {
      serverEnv();
      throw new Error("đáng lẽ phải ném");
    } catch (error) {
      const message = (error as Error).message;
      expect(message).toContain("DATABASE_URL");
      expect(message).not.toContain("postgresql://");
    }
  });

  it("chấp nhận DATABASE_URL POOLED hợp lệ; DIRECT_URL để trống vẫn OK", () => {
    process.env.DATABASE_URL =
      "postgresql://u:p@ep-xxx-pooler.ap-southeast-1.aws.neon.tech/db?pgbouncer=true&sslmode=require";

    const env = serverEnv();
    expect(env.DATABASE_URL).toContain("pgbouncer=true");
    expect(env.DIRECT_URL).toBeUndefined();
  });

  it("nhận DIRECT_URL khi được cấu hình (dành cho migrate)", () => {
    process.env.DATABASE_URL =
      "postgresql://u:p@ep-xxx-pooler.neon.tech/db?pgbouncer=true";
    process.env.DIRECT_URL =
      "postgresql://u:p@ep-xxx.neon.tech/db?sslmode=require";

    expect(serverEnv().DIRECT_URL).toContain("sslmode=require");
  });

  it("từ chối DATABASE_URL sai scheme và KHÔNG lộ giá trị bí mật", () => {
    process.env.DATABASE_URL = "mysql://u:super-secret-pw@host/db";

    expect(() => serverEnv()).toThrowError(/DATABASE_URL/);

    try {
      serverEnv();
      throw new Error("đáng lẽ phải ném");
    } catch (error) {
      expect((error as Error).message).not.toContain("super-secret-pw");
    }
  });

  it("memoized: gọi nhiều lần trả cùng một tham chiếu", () => {
    process.env.DATABASE_URL = "postgresql://u:p@host/db";
    expect(serverEnv()).toBe(serverEnv());
  });

  it("hasR2Config: false khi thiếu một phần, true khi đủ (ngoài phạm vi P13.1)", () => {
    process.env.DATABASE_URL = "postgresql://u:p@host/db";
    const env = serverEnv();
    expect(hasR2Config(env)).toBe(false);
    expect(
      hasR2Config({
        ...env,
        R2_ACCOUNT_ID: "a",
        R2_ACCESS_KEY_ID: "b",
        R2_SECRET_ACCESS_KEY: "c",
        R2_BUCKET: "d",
      }),
    ).toBe(true);
  });
});
