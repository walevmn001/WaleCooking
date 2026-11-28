# P12 — TỔNG KẾT: PRODUCTION DEPLOYMENT & BROWSER VERIFICATION (WALE COOKING)

> Phase: **P12** (tiếp nối P00–P11) · Ngày: 2026-11-28 · Người thực hiện: **1 AI Agent** (không sub-agent)
> Branch: `trae/agent-VkDApw` → push `origin/main`
> Mốc bắt đầu: `f19f970` (P11). Phạm vi: production-readiness + xác minh trình duyệt.
> **Không** thêm tính năng; **không** làm lại P00–P11; **không** đổi kiến trúc/framework/DB/design system.

---

## 1. Tóm tắt 7 sub-phase

| Sub-phase | Nội dung | Kết quả | Commit |
|---|---|---|---|
| P12.1 | Audit trạng thái thực tế | ✅ | `ce8d4fc` |
| P12.2 | Database readiness (Neon) — sửa **FIND-04** (lazy Prisma init) | ✅ (Neon kết nối: BLOCKED) | `0c05a8e` |
| P12.3 | Storage production readiness — sửa **FIND-07** (guard production) | ✅ (R2 e2e: BLOCKED) | `5fe16be` |
| P12.4 | Playwright browser automation (E2E) | ✅ 28/28 PASS | `63f46f0` |
| P12.5 | Responsive & UX verification | ✅ 14/14 PASS | `399eb39` |
| P12.6 | Vercel deployment verification | ✅ build local PASS (Vercel thật: BLOCKED) | `97ec94e` |
| P12.7 | Documentation & final checkpoint | ✅ | *(commit cuối)* |

---

## 2. Lỗi phát hiện & đã sửa (trong phạm vi P12)

| ID | Mức | Mô tả | Cách sửa | Trạng thái |
|---|---|---|---|---|
| **FIND-04** | High | `PrismaClient` khởi tạo ở module scope → `pnpm build` cần `DATABASE_URL`; Vercel báo *"Failed to collect configuration for /api/v1/admin/recipes"* | `lib/db/prisma.ts` chuyển sang **Proxy lazy** (chỉ tạo client khi truy vấn thật); vẫn gọi `serverEnv()` đúng thời điểm | **ĐÃ SỬA** — build exit 0 khi không có `DATABASE_URL` |
| **FIND-07** | High | Production thiếu `R2_*` → `getStorage()` **im lặng** chọn local adapter → ghi media vào FS tạm Vercel (mất dữ liệu âm thầm) | `lib/storage/index.ts`: ở `NODE_ENV=production` thiếu R2 → **ném lỗi rõ ràng**; đồng thời chuyển `MediaService` sang **getter lazy** | **ĐÃ SỬA** |
| **FIND-05** | Medium | Cảnh báo Turbopack *"Dynamic filesystem access causes tracing of the whole project"* (route media local) | **Không** sửa (không dùng `turbopackIgnore` khi chưa cần) — ghi nhận là **known warning**, không phải lỗi build | **CHẤP NHẬN** |

> Bổ sung: `.media-local/` đã được thêm vào `.gitignore` (tránh commit nhầm ảnh dev).

---

## 3. File quan trọng đã thay đổi (mã nguồn)

| File | Thay đổi |
|---|---|
| [lib/db/prisma.ts](file:///workspace/lib/db/prisma.ts) | Lazy Proxy cho `PrismaClient` (FIND-04) |
| [lib/storage/index.ts](file:///workspace/lib/storage/index.ts) | Guard production thiếu R2 → ném lỗi (FIND-07) |
| [lib/services/media.service.ts](file:///workspace/lib/services/media.service.ts) | Getter `storage` lazy (không resolve lúc evaluate) |
| [.gitignore](file:///workspace/.gitignore) | Thêm `.media-local/`, `test-results/`, `playwright-report/`, `blob-report/`, `.playwright/` |
| [package.json](file:///workspace/package.json) | Script `e2e`, `e2e:seed`; dep `@playwright/test` |
| [eslint.config.mjs](file:///workspace/eslint.config.mjs) | Ignore output Playwright |
| [playwright.config.ts](file:///workspace/playwright.config.ts) | Cấu hình Playwright (CDP, vi-VN) |
| [tests/e2e/](file:///workspace/tests/e2e/) | `fixtures.ts`, `seed-e2e.ts`, `public.e2e.ts`, `cooking.e2e.ts`, `tools.e2e.ts`, `admin.e2e.ts`, `api.e2e.ts`, `responsive.e2e.ts` |

**Tài liệu mới:** `docs/P12/` — `DEPLOYMENT_AUDIT.md`, `DATABASE_READINESS.md`, `STORAGE_READINESS.md`,
`PLAYWRIGHT_SETUP.md`, `E2E_TEST_REPORT.md`, `RESPONSIVE_UX_REPORT.md`, `VERCEL_DEPLOYMENT_REPORT.md`,
`MANUAL_VERIFICATION_CHECKLIST.md`, `P12_SUMMARY.md`; checkpoint `docs/checkpoints/P12_CHECKPOINT.md`.

---

## 4. Kết quả kiểm thử (trước/sau)

| Loại | Baseline P11 | Sau P12 | Ghi chú |
|---|---|---|---|
| Unit | 337/337 | **337/337** | Không giảm coverage |
| Integration | 59/59 | **59/59** | PostgreSQL thật (`wale_test`) |
| E2E (Playwright) | *(chưa có)* | **42/42** | 28 (P12.4) + 14 (P12.5) |
| Typecheck | PASS | **PASS** | |
| Lint | PASS | **PASS** | |
| Build | PASS (cần `DATABASE_URL`) | **PASS (không cần `DATABASE_URL`)** | Cải thiện nhờ FIND-04 |

---

## 5. Trạng thái 4 mức (PASS / FAIL / BLOCKED / PENDING)

**PASS (đã thực hiện, có bằng chứng):**
- Production build local; typecheck; lint; unit 337; integration 59; E2E 42.
- Responsive 4 viewport (375/390/768/1440): không tràn ngang, nav đúng breakpoint, console/network sạch,
  bàn phím + focus hiển thị.
- Luồng khách: trang chủ, danh sách, tìm kiếm, lọc, chi tiết, 404, yêu thích cookie, chia sẻ.
- Cooking/Tools: portion scaling, checklist, cooking mode, unit converter, multi timer, tìm theo nguyên liệu.
- API: mã trạng thái + dữ liệu (200/401/404/422); guard production storage (logic); lazy Prisma (build).
- Không in secret ở bất kỳ bước nào.

**FAIL:** không có (0).

**BLOCKED (thiếu điều kiện môi trường):**
- Kết nối **Neon PostgreSQL** thật (không có credentials trong sandbox).
- **Cloudflare R2** end-to-end (không có credentials).
- **Deploy Vercel** production (không có quyền truy cập).
- **Đăng nhập Admin thật + RBAC** (Auth.js chưa được nối — ngoài phạm vi P12).

**PENDING (chưa thực hiện):**
- Thiết bị/trình duyệt thật 6 viewport, a11y chuyên sâu (axe/screen reader), Core Web Vitals.
- Cấu hình `DIRECT_URL`/`R2_*`/Node version trên Vercel (chủ dự án thao tác).
- Pin Node.js version.

> **Không** đánh dấu PASS cho các mục BLOCKED/PENDING. Chi tiết: `MANUAL_VERIFICATION_CHECKLIST.md`.

---

## 6. Việc chủ dự án cần thao tác thủ công

1. **Neon:** đặt `DATABASE_URL` (pooled) + `DIRECT_URL` (direct) trên Vercel; chạy `prisma migrate deploy`.
2. **R2:** đặt 4–5 biến `R2_*`; kiểm upload + hiển thị ảnh.
3. **Vercel:** chọn Node 22.x; xác nhận build log hết lỗi "Failed to collect configuration".
4. **Auth.js (khi cần):** cấu hình `AUTH_SECRET`/`AUTH_URL`/provider để kiểm RBAC.
5. Kiểm thủ công trên thiết bị thật + a11y (mục E của checklist).

---

## 7. Kết luận

- P12 đã **chuyển dự án từ "build cần `DATABASE_URL`" sang "build production không cần DB"**,
  **loại bỏ rủi ro mất media âm thầm** ở production, và **bổ sung lớp xác minh trình duyệt thật**
  (E2E 42 test + responsive 4 viewport).
- Các phần phụ thuộc hạ tầng ngoài (Neon/R2/Vercel/Auth.js) được ghi **BLOCKED/PENDING rõ ràng**
  kèm checklist thao tác — **không** tuyên bố đã PASS.
- Không thêm tính năng ngoài phạm vi; không đổi kiến trúc/framework/database provider/design system.
