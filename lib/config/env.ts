import { z } from "zod";

/**
 * Kiểm tra biến môi trường phía server (P06 §4).
 *
 * Nguyên tắc:
 * - Chỉ chạy ở server (không import module này từ client component).
 * - Thông báo lỗi CHỈ nêu TÊN biến còn thiếu/sai — KHÔNG bao giờ in giá trị
 *   (tránh lộ connection string, secret, API key ra log).
 * - Hàm lazy + memoized: chỉ ném lỗi khi thực sự cần kết nối, để `next build`
 *   vẫn chạy được cho các route không dùng database.
 */

const connectionString = z
  .string()
  .min(1)
  .refine((value) => /^postgres(ql)?:\/\//.test(value), {
    message: "phải là chuỗi kết nối postgresql://",
  });

const serverEnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),

  // Bắt buộc cho runtime có truy vấn database.
  DATABASE_URL: connectionString,
  // Chỉ bắt buộc khi chạy migration (`prisma migrate`). Với local có thể trùng DATABASE_URL.
  DIRECT_URL: connectionString.optional(),

  // Tùy chọn: CSDL riêng cho kiểm thử tích hợp.
  TEST_DATABASE_URL: connectionString.optional(),

  // Auth.js (P06 chưa triển khai đăng nhập; vẫn kiểm tra nếu có).
  AUTH_SECRET: z.string().min(1).optional(),
  AUTH_URL: z.string().optional(),

  // Cloudflare R2 — để trống thì media adapter chuyển sang local (dev/test).
  R2_ACCOUNT_ID: z.string().optional(),
  R2_ACCESS_KEY_ID: z.string().optional(),
  R2_SECRET_ACCESS_KEY: z.string().optional(),
  R2_BUCKET: z.string().optional(),
  R2_PUBLIC_BASE_URL: z.string().optional(),
  MEDIA_LOCAL_DIR: z.string().optional(),
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;

let cached: ServerEnv | null = null;

/** Trả về env đã kiểm tra; ném lỗi an toàn (chỉ nêu tên biến) nếu thiếu/sai. */
export function serverEnv(): ServerEnv {
  if (cached) return cached;

  const parsed = serverEnvSchema.safeParse(process.env);
  if (!parsed.success) {
    const names = [
      ...new Set(
        parsed.error.issues.map((issue) => issue.path.join(".") || "(root)"),
      ),
    ];
    throw new Error(
      `[env] Cấu hình môi trường không hợp lệ. Kiểm tra các biến: ${names.join(", ")}`,
    );
  }

  cached = parsed.data;
  return cached;
}

/** Đặt lại cache — chỉ dùng trong test. */
export function resetServerEnvCache(): void {
  cached = null;
}

/** Có cấu hình R2 đầy đủ hay không (để media adapter chọn provider). */
export function hasR2Config(env: ServerEnv = serverEnv()): boolean {
  return Boolean(
    env.R2_ACCOUNT_ID &&
      env.R2_ACCESS_KEY_ID &&
      env.R2_SECRET_ACCESS_KEY &&
      env.R2_BUCKET,
  );
}
