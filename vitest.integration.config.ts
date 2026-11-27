import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

/**
 * Cấu hình test TÍCH HỢP (P06 §9 / P07 §19).
 * - Môi trường node, kết nối PostgreSQL thử nghiệm qua `TEST_DATABASE_URL`.
 * - Chạy: `pnpm test:integration` (sau khi đã `prisma migrate deploy` lên DB thử nghiệm).
 */
export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./', import.meta.url)),
      'server-only': fileURLToPath(new URL('./tests/stubs/server-only.ts', import.meta.url)),
    },
  },
  test: {
    environment: 'node',
    globals: true,
    setupFiles: ['./tests/integration/setup.ts'],
    include: ['tests/integration/**/*.test.ts'],
    testTimeout: 30000,
    hookTimeout: 60000,
    // Test tích hợp dùng chung một DB → chạy tuần tự để tránh tranh chấp dữ liệu.
    fileParallelism: false,
    css: false,
  },
});
