import { defineConfig } from "@playwright/test";

/**
 * Cấu hình Playwright cho WALE COOKING (P12.4).
 *
 * Môi trường sandbox/CI KHÔNG có Chromium binary tải sẵn (`~/.cache/ms-playwright` trống).
 * Vì vậy KHÔNG dùng `browserType.launch()` mặc định. Thay vào đó, fixture `browser` được
 * override trong `tests/e2e/fixtures.ts` để KẾT NỐI tới một Chrome đang chạy sẵn qua CDP
 * (`E2E_CDP_ENDPOINT`, mặc định `http://127.0.0.1:9222`).
 *
 * Yêu cầu môi trường trước khi chạy:
 *   1. Chrome có `--remote-debugging-port=9222` đang chạy.
 *   2. Server Next.js (production build) đang chạy ở `E2E_BASE_URL` (mặc định
 *      `http://127.0.0.1:3000`) và trỏ tới CSDL E2E riêng đã seed bằng
 *      `pnpm e2e:seed` — xem `docs/P12/PLAYWRIGHT_SETUP.md`.
 */
export default defineConfig({
  testDir: "./tests/e2e",
  testMatch: "**/*.e2e.ts",
  timeout: 30_000,
  expect: { timeout: 7_000 },
  fullyParallel: false,
  workers: 1,
  retries: 0,
  forbidOnly: !!process.env.CI,
  reporter: process.env.CI ? "list" : [["list"], ["html", { open: "never" }]],
  outputDir: "test-results",
  use: {
    baseURL: process.env.E2E_BASE_URL ?? "http://127.0.0.1:3000",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "off",
    locale: "vi-VN",
    timezoneId: "Asia/Ho_Chi_Minh",
    // Tắt phát hiện cổng của Playwright: trình duyệt do môi trường cung cấp (CDP).
    launchOptions: undefined,
  },
  projects: [{ name: "chromium-cdp" }],
});
