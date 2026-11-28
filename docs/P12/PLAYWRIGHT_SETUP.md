# P12.4 — PLAYWRIGHT SETUP (WALE COOKING)

> Phase: **P12 — Production Deployment & Browser Verification**
> Ngày: 2026-11-28 · Người thực hiện: 1 AI Agent (không sub-agent)
> Phạm vi: thiết lập kiểm thử trình duyệt thực tế (E2E) phù hợp Next.js + pnpm.
> **Không** đổi stack chính; **không** yêu cầu credentials production.

---

## 1. Trạng thái trước khi thiết lập (audit)

| Hạng mục | Kết quả audit |
|---|---|
| Playwright đã có trong `package.json`? | ✅ Đã có `@playwright/test` **1.56.1** ở `devDependencies` (thêm từ trước, không cài trùng) |
| Cấu hình test hiện có | Vitest cho unit (`vitest.config.ts`) + integration (`vitest.integration.config.ts`). **Chưa** có Playwright. |
| Script test hiện có | `test`, `test:integration`, `typecheck`, `lint`, `build` |
| Chromium binary tải sẵn (`~/.cache/ms-playwright`)? | ❌ **Trống** — sandbox không có binary |
| Chrome chạy sẵn? | ✅ Chrome 150 với `--remote-debugging-port=9222` |

**Kết luận:** Không cài package trùng. Chỉ cần thêm cấu hình + fixture, tận dụng Chrome có sẵn qua **CDP**.

---

## 2. Quyết định kỹ thuật: kết nối CDP thay vì `launch()`

Vì sandbox **không có Chromium binary**, `browserType.launch()` mặc định sẽ thất bại. Thay vào đó
fixture `browser` được override để **kết nối** tới Chrome đang chạy sẵn qua giao thức CDP.

- [playwright.config.ts](file:///workspace/playwright.config.ts): `testDir: "./tests/e2e"`,
  `testMatch: "**/*.e2e.ts"`, `workers: 1`, `baseURL` từ `E2E_BASE_URL` (mặc định
  `http://127.0.0.1:3000`), project `chromium-cdp`.
- [tests/e2e/fixtures.ts](file:///workspace/tests/e2e/fixtures.ts): `browser` là fixture **cấp worker**
  → override đúng scope:

```ts
export const test = base.extend<Record<never, never>, { browser: Browser }>({
  browser: [
    // eslint-disable-next-line no-empty-pattern
    async ({}, use) => {
      const browser = await chromium.connectOverCDP(CDP_ENDPOINT);
      await use(browser);
      await browser.close(); // chỉ NGẮT kết nối CDP, KHÔNG tắt Chrome của môi trường
    },
    { scope: "worker" },
  ],
});
```

> **Lưu ý kỹ thuật đã gặp & xử lý:**
> - Playwright **yêu cầu tham số đầu fixture là mẫu destructuring** → phải viết `async ({}, use)`
>   (kèm `// eslint-disable-next-line no-empty-pattern`).
> - Generic của `base.extend` phải là `Record<never, never>` (không phải `Record<string, never>`,
>   vì `never` cấm mọi key → lỗi typecheck TS2345 khi gán `Browser`).

---

## 3. Biến môi trường

| Biến | Ý nghĩa | Mặc định |
|---|---|---|
| `E2E_BASE_URL` | URL server Next.js (production build) đang chạy | `http://127.0.0.1:3000` |
| `E2E_CDP_ENDPOINT` | Endpoint CDP của Chrome | `http://127.0.0.1:9222` |
| `DATABASE_URL` (khi seed) | **Chỉ** để seed fixture vào CSDL E2E **riêng** | — |

> ⚠️ **Không** đặt credentials production vào môi trường chạy E2E. E2E chỉ dùng DB E2E riêng.

---

## 4. Cách chạy (local / CI)

### 4.1. Chuẩn bị CSDL E2E riêng

```bash
# DB E2E riêng (ví dụ Postgres cục bộ). TUYỆT ĐỐI không trỏ DATABASE_URL production.
export DATABASE_URL="postgresql://<user>:<pass>@<host>:<port>/wale_e2e"

# Áp dụng migration đã review lên DB E2E (KHÔNG dùng db push)
pnpm prisma migrate deploy

# Seed hệ thống + fixture E2E (idempotent, chỉ dữ liệu tiền tố `e2e-`)
pnpm e2e:seed
```

`tests/e2e/seed-e2e.ts` tạo: user `e2e-editor@wale.invalid` (role `editor`) + 3 fixture:
`e2e-canh-trung-ca-chua` (published), `e2e-pho-bo` (published), `e2e-ban-nhap` (draft).
Script **dọn** các slug `e2e-` trước mỗi lần chạy nên **idempotent**, không chạm production.

### 4.2. Chạy server (production build) + Chrome

```bash
# Terminal 1 — server
DATABASE_URL="postgresql://<user>:<pass>@<host>:<port>/wale_e2e" \
  NODE_ENV=production PORT=3000 pnpm start

# Chrome đã chạy sẵn với cờ:
#   --remote-debugging-port=9222
```

### 4.3. Chạy E2E

```bash
pnpm e2e            # playwright test
pnpm e2e --grep "Cooking"   # lọc theo nhóm
```

Scripts đã thêm vào `package.json`:

```json
"e2e": "playwright test",
"e2e:seed": "tsx tests/e2e/seed-e2e.ts"
```

---

## 5. Ghi chú vận hành

- **Hydration race (đã gặp):** một số công cụ là Client Component; `fill()` chạy trước khi React
  hydrate có thể bị reset về state rỗng. Bộ test dùng helper `fillStable` (retry `fill` + assert
  `toHaveValue`) để ổn định — xem [tests/e2e/tools.e2e.ts](file:///workspace/tests/e2e/tools.e2e.ts).
- **Đầu ra tạm:** `test-results/`, `playwright-report/`, `blob-report/`, `.playwright/` đã được thêm
  vào [.gitignore](file:///workspace/.gitignore) và `ignores` của
  [eslint.config.mjs](file:///workspace/eslint.config.mjs).
- **CI:** có thể chạy trong CI nếu runner cung cấp Chrome (hoặc cài Chromium) + DB E2E riêng; cấu
  hình hiện tại không yêu cầu credentials production.
