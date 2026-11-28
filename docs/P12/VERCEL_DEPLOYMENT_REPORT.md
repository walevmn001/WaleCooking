# P12.6 — VERCEL DEPLOYMENT REPORT (WALE COOKING)

> Phase: **P12 — Production Deployment & Browser Verification**
> Ngày: 2026-11-28 · Người thực hiện: 1 AI Agent (không sub-agent)
> Phạm vi: xác minh cấu hình triển khai + build production không còn lỗi cấu hình.
> **Không** có quyền truy cập Vercel/Neon trong sandbox → không tuyên bố deployment production PASS.

---

## 1. Kiểm kê cấu hình triển khai

| Hạng mục | Giá trị | Nguồn | Trạng thái |
|---|---|---|---|
| Framework | Next.js 16.4.6 (App Router, Turbopack) | `package.json` | ✅ |
| Build command | `next build` (mặc định Vercel cho Next.js) | `package.json` | ✅ |
| Install command | `pnpm install` (Vercel tự nhận `pnpm-lock.yaml`) | `pnpm-lock.yaml` | ✅ |
| Package manager | `pnpm@10.5.2` (`packageManager`) | `package.json` | ✅ |
| Node.js | Sandbox: `v24.1.0`; `@types/node` 22.20.7 | — | ⚠️ Nên pin (xem §5) |
| Start command | `next start` (Vercel serverless tự xử lý) | `package.json` | ✅ |
| Prisma | `prisma`/`@prisma/client` 6.19.3 | `package.json` | ✅ |
| Prisma generate | `@prisma/client` trong `pnpm.onlyBuiltDependencies` → postinstall chạy generate | `package.json` | ✅ |
| Prisma migrations | 1 migration: `20261127175936_init` | `prisma/migrations/` | ✅ (xem §4) |
| Datasource | `provider=postgresql`, `url=env("DATABASE_URL")`, `directUrl=env("DIRECT_URL")` | `prisma/schema.prisma` | ⚠️ `DIRECT_URL` cần cho migrate |
| Output tracing | Turbopack; 3 cảnh báo tracing (media local) | build log | ⚠️ known warning |
| Storage adapter | R2 ở production (guard `getStorage()`), local ở dev/test | `lib/storage/index.ts` | ✅ |
| Route config | 40 route (gồm `/api/v1/admin/recipes`) | build log | ✅ |
| Security headers | `next.config.ts` `headers()` (nosniff, XFO, RP…) | `next.config.ts` | ✅ |

---

## 2. Xác minh build LOCAL (bằng chứng thực tế)

Lệnh (cố ý **không** có `DATABASE_URL`/`DIRECT_URL`/`R2_*`):

```bash
rm -rf .next && env -u DATABASE_URL -u DIRECT_URL -u R2_ACCOUNT_ID pnpm build
```

| Tiêu chí | Kết quả |
|---|---|
| Exit code | **0 (PASS)** |
| Compile | ✓ Compiled successfully (Turbopack) |
| TypeScript | ✓ Finished (không lỗi) |
| Static generation | 28/28 trang |
| Route `/api/v1/admin/recipes` | ✅ Có trong output (`ƒ /api/v1/admin/recipes`) |
| Lỗi "Failed to collect configuration for /api/v1/admin/recipes" | ✅ **KHÔNG còn** (grep không khớp) |
| Cảnh báo | 3× "Dynamic filesystem access causes tracing of the whole project" (media/file route) |

> **Kết luận:** Build production **không còn cần `DATABASE_URL`** để biên dịch/collect cấu hình —
> xác nhận bản sửa **FIND-04** (Prisma lazy Proxy trong [lib/db/prisma.ts](file:///workspace/lib/db/prisma.ts))
> hoạt động đúng. Đây chính là nguyên nhân lỗi Vercel trước đó.

---

## 3. `DATABASE_URL` trong production

- [lib/config/env.ts](file:///workspace/lib/config/env.ts) validate **lazy + memoized**; **không** chạy khi
  import module → build không bị chặn. Khi **thực sự** truy vấn, `serverEnv()` mới ném lỗi **nêu tên
  biến** nếu thiếu (không in giá trị).
- [lib/db/prisma.ts](file:///workspace/lib/db/prisma.ts) tạo `PrismaClient` qua Proxy ở **lần dùng đầu
  tiên** → không khởi tạo database trong lúc module evaluation.
- Bằng chứng runtime: server production (`next start`) chạy **chỉ với `DATABASE_URL`** (không
  `DIRECT_URL`) → 42 E2E + các trang truy vấn DB hoạt động bình thường ⇒ Prisma Client **không** bắt
  buộc `DIRECT_URL` ở runtime.
- **Không** có secret bị in ra log/báo cáo.

---

## 4. Phát hiện: `DIRECT_URL` cần cho migration (Neon)

`prisma/schema.prisma` khai báo `directUrl = env("DIRECT_URL")`. Prisma Client **không** cần biến này
ở runtime (đã kiểm chứng §3), nhưng **`prisma migrate`/`migrate deploy` CẦN** `DIRECT_URL` (kết nối
trực tiếp, không qua pooler) để chạy migration an toàn trên Neon.

| Việc | Biến cần | Ghi chú |
|---|---|---|
| Runtime (Next.js server) | `DATABASE_URL` (pooled, `?pgbouncer=true`) | Bắt buộc |
| `prisma migrate deploy` (Neon) | `DATABASE_URL` + `DIRECT_URL` | `DIRECT_URL` = kết nối direct Neon |
| Seed | `DATABASE_URL` | — |

> ⚠️ Nếu trên Vercel chỉ cấu hình `DATABASE_URL` mà **chưa** có `DIRECT_URL` → **migration sẽ lỗi**
> ("Environment variable not found: DIRECT_URL"). Xem checklist §6.

---

## 5. Ghi chú & khuyến nghị

- **Node.js:** sandbox dùng `v24.1.0`; Vercel mặc định hỗ trợ Node 20/22. Khuyến nghị pin phiên bản
  bằng `engines.node` (ví dụ `22.x`) **hoặc** chọn Node 22 trong Vercel Project Settings để tránh lệch
  runtime. *(Chưa thêm vào `package.json` để không mở rộng phạm vi — cần chủ dự án xác nhận.)*
- **Prisma generate trên Vercel:** build cần Prisma Client đã generate. Hiện dựa vào postinstall của
  `@prisma/client` (đã cho phép trong `pnpm.onlyBuiltDependencies`). Nếu build Vercel báo
  "@prisma/client did not initialize yet", thêm script `"postinstall": "prisma generate"`.
- **Cảnh báo tracing (FIND-05):** 3 cảnh báo "Dynamic filesystem access" do route/adapter local media
  (chỉ dùng dev/test). KHÔNG phải lỗi build; ở production adapter R2 được dùng và route local tự 404.
  Không thêm `turbopackIgnore` (theo yêu cầu). Chi tiết: `STORAGE_READINESS.md` §2.
- **Migrations trong build:** KHÔNG dùng `prisma db push`; chỉ dùng `prisma migrate deploy` (đã review).

---

## 6. Checklist deploy (chủ dự án thao tác thủ công)

1. **Vercel → Project Settings → Environment Variables** (Production **và** Preview):
   - [ ] `DATABASE_URL` — Neon **pooled** (`?pgbouncer=true&sslmode=require`).
   - [ ] `DIRECT_URL` — Neon **direct** (không pooler) — **bắt buộc nếu chạy migration**.
   - [ ] `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET` (+ tùy chọn
         `R2_PUBLIC_BASE_URL`) — theo `STORAGE_READINESS.md` §4.
   - [ ] (khi tích hợp đăng nhập) `AUTH_SECRET`, `AUTH_URL`.
2. **Chọn Node.js version** trong Vercel (khuyến nghị 22.x).
3. **Chạy migration** trên DB đích (đúng database, đã review):
   ```bash
   DIRECT_URL="<neon-direct>" DATABASE_URL="<neon-pooled>" pnpm prisma migrate deploy
   ```
   (Hoặc thêm bước này vào pipeline deploy — **không** dùng `db push`.)
4. **Redeploy** và kiểm tra build log: xác nhận **không** còn "Failed to collect configuration".
5. Sau deploy, xác minh thủ công (xem `MANUAL_VERIFICATION_CHECKLIST.md`):
   - [ ] Trang chủ/danh sách/chi tiết tải được (DB Neon đã migrate + seed nếu cần).
   - [ ] `GET /api/v1/recipes` trả 200 + dữ liệu.
   - [ ] Upload media (đã có R2) → 201; ảnh hiển thị qua URL.
   - [ ] Không có lỗi console/network ở production.

---

## 7. Trạng thái 4 mức

| Hạng mục | Trạng thái |
|---|---|
| Build local không cần `DATABASE_URL` | **PASS** (exit 0, route admin/recipes OK) |
| Lỗi "Failed to collect configuration" | **PASS** (đã hết) — nhờ FIND-04 |
| Không in secret | **PASS** |
| Toàn bộ test sau build | **PASS** — unit 337/337, integration 59/59, E2E 42/42 |
| Cấu hình `R2_*`/`DIRECT_URL` trên Vercel | **PENDING** — cần chủ dự án cấu hình |
| Deployment production thật trên Vercel | **BLOCKED** — sandbox không có quyền truy cập Vercel/Neon |
| Pin Node.js version | **PENDING** — khuyến nghị, chờ xác nhận |

**Không tuyên bố deployment production đã PASS.** Chỉ xác nhận build local + checklist deploy.

---

## 8. Kết luận

- Build production **PASS** ở local (kể cả khi thiếu `DATABASE_URL`) → bản sửa FIND-04 đã loại bỏ
  nguyên nhân lỗi Vercel trước đó; route `/api/v1/admin/recipes` biên dịch bình thường.
- Đã ghi rõ yêu cầu `DIRECT_URL` cho migration Neon và checklist cấu hình Vercel/R2.
- Không có quyền truy cập Vercel/Neon trong sandbox → **BLOCKED** cho xác minh deployment production;
  **PENDING** cho các biến môi trường cần chủ dự án cấu hình.
