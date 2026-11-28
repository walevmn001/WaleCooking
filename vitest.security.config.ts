import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

/**
 * Cấu hình test AN NINH SSRF (I2.3).
 * - Môi trường node (cần `node:net`/`node:http`/`node:https`), socket thật + DNS giả tiêm được.
 * - KHÔNG cần database (khác `vitest.integration.config.ts`).
 * - Chạy: `pnpm test:security`.
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
    include: ['tests/security/**/*.test.ts'],
    testTimeout: 30000,
    hookTimeout: 30000,
    // Test mở socket cục bộ ⇒ chạy tuần tự để tránh tranh chấp cổng.
    fileParallelism: false,
    css: false,
  },
});
