import { chromium, expect, test as base, type Browser } from "@playwright/test";

/**
 * Fixture Playwright cho WALE COOKING (P12.4).
 *
 * Sandbox/CI KHÔNG có Chromium binary tải sẵn → thay vì `browserType.launch()`, ta
 * KẾT NỐI tới một Chrome đang chạy sẵn qua giao thức CDP. Trình duyệt đó do môi trường
 * cung cấp (`E2E_CDP_ENDPOINT`, mặc định `http://127.0.0.1:9222`).
 *
 * `browser` là fixture cấp WORKER trong Playwright → phải override ở scope `worker`.
 * Các fixture `context`/`page` mặc định vẫn hoạt động và nhận `baseURL`, `viewport`,
 * `locale`… từ `use` trong `playwright.config.ts`.
 */
const CDP_ENDPOINT = process.env.E2E_CDP_ENDPOINT ?? "http://127.0.0.1:9222";

export const test = base.extend<Record<never, never>, { browser: Browser }>({
  browser: [
    // Playwright yêu cầu tham số đầu là mẫu destructuring; fixture này không phụ thuộc fixture khác.
    // eslint-disable-next-line no-empty-pattern
    async ({}, use) => {
      const browser = await chromium.connectOverCDP(CDP_ENDPOINT);
      await use(browser);
      // `close()` khi kết nối CDP chỉ NGẮT kết nối, KHÔNG tắt Chrome của môi trường.
      await browser.close();
    },
    { scope: "worker" },
  ],
});

export { expect };
