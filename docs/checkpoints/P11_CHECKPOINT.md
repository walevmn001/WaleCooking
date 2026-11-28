# P11 — CHECKPOINT: REAL-WORLD VERIFICATION & UX POLISH

> Phase: **P11** · Ngày: 2026-11-28 · Trạng thái: **HOÀN THÀNH (trong giới hạn môi trường)**
> Commit: commit chứa tài liệu này (xem `git log -1` trên `origin/main`).
> Phạm vi: **ổn định & hoàn thiện sản phẩm** — KHÔNG thêm tính năng mới, KHÔNG làm lại P00–P10, KHÔNG triển khai P12.

## 1. Bối cảnh

P11 kiểm thử **thực tế** toàn bộ sản phẩm P00–P10, phát hiện & sửa lỗi có căn cứ, hoàn thiện UX và xác minh
các chức năng quan trọng. Tận dụng toàn bộ module/component đã có; **không** đổi stack/kiến trúc; **không** thêm dependency.

## 2. Phạm vi đã hoàn thành

| Tiểu mục | Nội dung | Tài liệu |
|---|---|---|
| P11.1 | Full Project Audit (16 khu vực) | [FULL_PROJECT_AUDIT.md](../P11/FULL_PROJECT_AUDIT.md) |
| P11.2 | Recipe & Admin Flow Verification | [USER_FLOW_VERIFICATION.md](../P11/USER_FLOW_VERIFICATION.md) |
| P11.3 | Cooking Experience Verification | [COOKING_FEATURE_VERIFICATION.md](../P11/COOKING_FEATURE_VERIFICATION.md) |
| P11.4 | Smart Kitchen Tools Verification | [SMART_KITCHEN_VERIFICATION.md](../P11/SMART_KITCHEN_VERIFICATION.md) |
| P11.5 | Mobile-first UX Audit | [MOBILE_UX_AUDIT.md](../P11/MOBILE_UX_AUDIT.md) |
| P11.6 | SEO / Performance / Security Audit | [SEO_PERFORMANCE_AUDIT.md](../P11/SEO_PERFORMANCE_AUDIT.md) · [SECURITY_AUDIT.md](../P11/SECURITY_AUDIT.md) |
| P11.7 | Automated Testing | [TEST_REPORT.md](../P11/TEST_REPORT.md) |
| P11.8 | Browser/Manual Verification | [MANUAL_VERIFICATION_CHECKLIST.md](../P11/MANUAL_VERIFICATION_CHECKLIST.md) |
| P11.9 | Fix & Polish | [BUG_FIX_REPORT.md](../P11/BUG_FIX_REPORT.md) |
| P11.10 | Documentation & Checkpoint | Checkpoint này |

## 3. Thay đổi mã nguồn chính

**Xóa (FIX-A — sửa soft-404):**
- `app/loading.tsx`
- `app/(public)/cong-thuc/loading.tsx`
- `app/(public)/cong-thuc/[slug]/loading.tsx`

**Thêm mới (FIX-B — SEO):**
- `app/sitemap.ts` — sitemap động, chỉ nội dung công khai (published + danh mục + trang tĩnh), try/catch quanh DB.
- `app/robots.ts` — chặn `/admin`, `/api/`, `/dev/`; trỏ sitemap.

**Sửa đổi:**
- `next.config.ts` (FIX-C) — thêm `securityHeaders` + `async headers()`; `poweredByHeader: false`.
- `app/(public)/cong-thuc/page.tsx` — cập nhật chú thích (bỏ tham chiếu `loading.tsx`).

**Không** thêm schema/migration; **không** thêm dependency; **không** đổi design system/kiến trúc.

## 4. Schema / Migration

**Không có.** P11 không thay đổi schema, không tạo migration (nhất quán D62/D63/D70/D74). Chỉ sửa presentation/config.

## 5. Lỗi phát hiện & đã sửa

| ID | Mô tả | Mức độ | Trạng thái |
|---|---|---|---|
| BUG-01 | Soft-404 route động (200 thay vì 404) | Medium | **Đã sửa (FIX-A)** — Verified |
| BUG-02 | Thiếu `/sitemap.xml` + `/robots.txt` | Medium | **Đã sửa (FIX-B)** — Verified |
| BUG-03 | Thiếu security headers + lộ `X-Powered-By` | Medium | **Đã sửa (FIX-C)** — Verified |
| FIND-04 | Build cần `DATABASE_URL` (Prisma eager init) | Medium | Backlog |
| FIND-05 | Turbopack warning (media route) | Low | Backlog |
| FIND-06 | Seed dev 0 công thức | Low | Ghi nhận |

Chi tiết: [BUG_FIX_REPORT.md](../P11/BUG_FIX_REPORT.md). **Không có lỗi Critical.**

## 6. Kiểm thử đã chạy (kết quả thực tế)

| Kiểm tra | Kết quả |
|---|---|
| `pnpm typecheck` | ✅ **0 lỗi** |
| `pnpm lint` | ✅ **0 lỗi / 0 cảnh báo** |
| `pnpm test` | ✅ **337/337 pass** (31 file) |
| `pnpm test:integration` | ✅ **59/59 pass** (9 file, PostgreSQL thật) — gồm `kitchen.ingredient-match` (khắc phục B-P10-02) |
| `pnpm build` | ✅ thành công — **42 route** (có `/sitemap.xml`, `/robots.txt`) |
| E2E trình duyệt | ⛔ Không chạy — không có browser (External Verification Pending) |

## 7. Xác minh HTTP (production)

- Route công khai/admin/công cụ → **200**.
- Route không tồn tại → **404** (soft-404 đã sửa).
- `/sitemap.xml` + `/robots.txt` → **200**; robots không rò `/admin`/`/api/`/`/dev/`.
- API ghi của khách → **401** `{"error":{"code":"UNAUTHORIZED"…}}`.
- Security headers hiện diện; `X-Powered-By` đã biến mất.

## 8. Chưa xác minh được (External Verification Pending)

- Hiển thị thực tế 6 viewport (responsive), axe/Lighthouse/screen reader/zoom 200%.
- Timer nền: khóa màn hình/chuyển app/rung/âm thanh/Notification thật.
- Đăng nhập admin thật (Auth.js chưa nối) → chưa kiểm 401/403 với phiên thật.
- Bundle size/CWV/DB profiling; rich results Google; HSTS sau deploy.
- Kế thừa blocker P05/P07.1/P08/P09/P10 (không có Neon/R2/browser/device).

## 9. Blocker

Xem `BLOCKERS.md`. P11 **đóng B-P10-02** (integration ingredient-match đã chạy). Các mục còn lại là External Verification Pending (không chặn kết thúc P11).

## 10. Quyết định (ADR)

- **D75**: Loại bỏ `loading.tsx` cấp segment gây **soft-404** (Suspense boundary làm `notFound()` trả 200). Ưu tiên **mã trạng thái HTTP đúng**; tái giới thiệu loading UI **có phạm vi** ở Backlog.
- **D76**: Bổ sung `app/sitemap.ts` + `app/robots.ts` — chỉ liệt kê **nội dung công khai** (không draft/admin/api/dev); truy vấn DB bọc try/catch để không làm hỏng sitemap.
- **D77**: Bổ sung **security headers** + ẩn `X-Powered-By` trong `next.config.ts`; **chưa** đặt CSP (cần nonce-based, để Backlog để tránh hỏng UI).
- **D78**: Trong P11 **không** sửa FIND-04 (eager Prisma init) — refactor hạ tầng lõi rủi ro > lợi ích trong phase ổn định; workaround đặt `DATABASE_URL` khi build.

## 11. Điều kiện chuyển phase

P11 hoàn thành (trong giới hạn môi trường) → **commit + push lên `origin/main`**, xác minh remote HEAD + working tree sạch.
**Không** triển khai P12. Các hạng mục External Verification Pending theo dõi ở `BLOCKERS.md`, không chặn kết thúc P11.
