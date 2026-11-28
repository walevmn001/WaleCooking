# P12 — MANUAL VERIFICATION CHECKLIST (WALE COOKING)

> Phase: **P12 — Production Deployment & Browser Verification**
> Ngày: 2026-11-28 · Danh sách thao tác **thủ công** cho những việc không thể xác minh
> trong sandbox (thiếu quyền Vercel/Neon, thiếu credentials R2, thiếu thiết bị thật).
> **Không** đánh dấu PASS khi chưa thực hiện thật.

---

## A. Neon PostgreSQL (Database production)

- [ ] Đặt `DATABASE_URL` (pooled, `?pgbouncer=true&sslmode=require`) trên Vercel (Prod + Preview).
- [ ] Đặt `DIRECT_URL` (direct, không pooler) — **bắt buộc cho `prisma migrate deploy`**.
- [ ] Chạy migration (đúng DB đích đã review): `pnpm prisma migrate deploy` (KHÔNG `db push`).
- [ ] Seed hệ thống nếu cần: `pnpm db:seed`.
- [ ] Kiểm tra: `GET /api/v1/recipes` → 200 + dữ liệu; trang `/cong-thuc` hiển thị công thức thật.
- [ ] Xác nhận trên Neon: đủ bảng (58), extension `citext`/`pg_trgm`/`unaccent`; `_prisma_migrations`
      có bản ghi `20261127175936_init` đã áp.

## B. Cloudflare R2 (Storage production)

- [ ] Đặt `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET` (+ `R2_PUBLIC_BASE_URL`).
- [ ] Upload 1 ảnh qua admin → 201; object xuất hiện trong bucket.
- [ ] `GET` URL ảnh hiển thị (kiểm tra `R2_PUBLIC_BASE_URL`).
- [ ] `GET /api/v1/media/file/<key>` → 404 (đúng: route local tự tắt khi có R2).
- [ ] Nếu **chưa** cấu hình R2 trên production: upload phải **báo lỗi rõ ràng** (không ghi FS tạm).

## C. Vercel deployment

- [ ] Chọn Node.js 22.x (hoặc pin qua `engines`/`.nvmrc`).
- [ ] Build log **không** còn "Failed to collect configuration for /api/v1/admin/recipes".
- [ ] `prisma generate` chạy khi cài (nếu lỗi "@prisma/client did not initialize yet" → thêm
      `postinstall: prisma generate`).
- [ ] Kiểm trang chủ/danh sách/chi tiết tải được trên domain production.

## D. Đăng nhập quản trị & RBAC (Auth.js — chưa nối)

- [ ] Cấu hình `AUTH_SECRET`, `AUTH_URL` + provider.
- [ ] Đăng nhập bằng tài khoản `editor` → thấy `/admin/cong-thuc`.
- [ ] Editor tạo nháp → publish → công thức xuất hiện công khai.
- [ ] Tài khoản role thấp hơn bị chặn khỏi thao tác admin (403).
- [ ] `POST /api/v1/recipes` (đã đăng nhập, đủ quyền) → 201; guest → 401.

## E. Thiết bị & trình duyệt thật (không có trong sandbox)

- [ ] Hiển thị đúng trên thiết bị thật ở **6 viewport** (320 / 375 / 390 / 768 / 1024 / 1440 / 1920),
      không tràn ngang; dialog/menu không vượt màn hình.
- [ ] Đồng hồ đếm ngược nền: khoá màn hình / chuyển app / tab ẩn → thời gian vẫn đúng (deadline),
      cảnh báo âm thanh + Notification hoạt động (đã cấp quyền).
- [ ] Trợ năng: axe/Lighthouse, screen reader (NVDA/VoiceOver), zoom 200%, focus không bị che.
- [ ] Core Web Vitals (LCP/CLS/INP) trên production; kiểm tra rich results (Recipe JSON-LD).
- [ ] Trình duyệt thứ hai (Firefox/Safari): `currentColor` icon, mascot trên nền pastel.

## F. Cách chạy lại E2E trong môi trường có browser

```bash
# 1) DB E2E riêng (KHÔNG dùng DB production)
export DATABASE_URL="postgresql://<user>:<pass>@<host>:<port>/wale_e2e"
pnpm prisma migrate deploy && pnpm e2e:seed

# 2) Server production build
DATABASE_URL="..." NODE_ENV=production PORT=3000 pnpm start
#    Chrome chạy với --remote-debugging-port=9222 (hoặc cung cấp chromium binary)

# 3) Chạy
pnpm e2e
```

---

## G. Bảng trạng thái tổng hợp (P12)

| Hạng mục | Trạng thái |
|---|---|
| Build local (không `DATABASE_URL`) | **PASS** |
| Typecheck / Lint | **PASS** |
| Unit (337) / Integration (59) / E2E (42) | **PASS** |
| Responsive 4 viewport + console/network | **PASS** |
| Database production (Neon) | **BLOCKED** (không có credentials trong sandbox) |
| Storage production (R2) | **BLOCKED** (không có credentials) |
| Deploy production (Vercel) | **BLOCKED** (không có quyền truy cập) |
| Đăng nhập Admin thật / RBAC | **BLOCKED** (Auth.js chưa nối) |
| Thiết bị thật / a11y chuyên sâu / CWV | **PENDING** (mục E ở trên) |
