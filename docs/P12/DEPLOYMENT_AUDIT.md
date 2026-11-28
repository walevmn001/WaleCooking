# P12.1 — DEPLOYMENT AUDIT (WALE COOKING)

> Phase: **P12 — Production Deployment & Browser Verification**
> Ngày: 2026-11-28 · Người thực hiện: 1 AI Agent (không sub-agent)
> Phạm vi: **audit trạng thái thực tế** trước khi sửa code. **Không** sửa code trước khi hoàn tất audit.

---

## 1. Trạng thái Git / repository (đã xác minh)

| Hạng mục | Giá trị | Ghi chú |
|---|---|---|
| Branch hiện tại | `trae/agent-VkDApw` | Branch làm việc của phiên P12 |
| HEAD local | `f19f970405ea36f39e4cdddb897573b5a9aef462` | = commit P11 |
| `origin/main` | `f19f970405ea36f39e4cdddb897573b5a9aef462` | Khớp HEAD local |
| Đồng bộ local ↔ remote | `0 0` (ahead 0 / behind 0) | Đồng bộ hoàn toàn |
| Working tree | **Sạch** (`nothing to commit`) | Trước khi bắt đầu P12 |
| Commit gần nhất | `f19f970` — "fix(P11): kiểm thử thực tế & hoàn thiện…" | |

**Kết luận:** Repo sạch, đồng bộ, đúng mốc tiếp nối P11 (`f19f970`). Không có thay đổi chưa lưu.

---

## 2. Xác nhận các phase trước đã hoàn thành

| Phase | Trạng thái | Bằng chứng |
|---|---|---|
| P00–P05 | Hoàn thành | `CURRENT_STATUS.md`, checkpoint tương ứng |
| P06 (Database Foundation) | Hoàn thành | `prisma/schema.prisma` (22 enum / 57 model), migration `20261127175936_init`, seed idempotent |
| P07 / P07.1 | Hoàn thành | Recipe CRUD + media + authorization tập trung |
| P08 | Hoàn thành | Taxonomy/discovery |
| P09 | Hoàn thành | Cooking Mode/Portion/Checklist |
| P10 | Hoàn thành | Multi Timer, Unit Converter, Ingredient Discovery |
| P11 | Hoàn thành (giới hạn môi trường) | `docs/checkpoints/P11_CHECKPOINT.md` (ADR D75–D78) |

**Kết luận:** P00–P11 thực sự đã hoàn thành và push lên `origin/main`. Đây là **phase tiếp nối**, không phải dự án mới.

---

## 3. Kiểm tra module & cấu hình quan trọng

### 3.1 `lib/config/env.ts`
- Schema Zod cho biến server; **lazy + memoized** (`serverEnv()` chỉ parse khi được gọi).
- `DATABASE_URL` **bắt buộc** (`connectionString`). `DIRECT_URL`, `TEST_DATABASE_URL`, `AUTH_*`, `R2_*`, `MEDIA_LOCAL_DIR` optional.
- Lỗi chỉ nêu **tên biến**, không in giá trị. ✅ đúng nguyên tắc bảo mật.
- **Rủi ro:** bản thân env.ts *không* eager, nhưng bị **gọi eager** từ `lib/db/prisma.ts` (xem 3.2) → hệ quả FIND-04.

### 3.2 `lib/db/prisma.ts` — **FIND-04 (Critical cho build)**
```ts
export const prisma: PrismaClient = globalForPrisma.__walePrisma ?? createPrismaClient();
function createPrismaClient(): PrismaClient {
  serverEnv();                        // ← ném lỗi ngay khi import module
  return new PrismaClient({ ... });
}
```
- `createPrismaClient()` gọi `serverEnv()` **ở phạm vi module**. Bất kỳ module nào import `prisma`
  (→ `lib/db/repositories/index.ts` → `lib/services/*` → nhiều route) sẽ **ném lỗi khi evaluate** nếu thiếu `DATABASE_URL`.
- **Đây chính là nguyên nhân lỗi Vercel:** `Failed to collect configuration for /api/v1/admin/recipes`.
- Ngoài ra `new PrismaClient()` cũng ném lỗi tại thời điểm khởi tạo nếu thiếu `DATABASE_URL` (Prisma đọc `env("DATABASE_URL")`).
- **Mức độ: High** (chặn deploy; làm build phụ thuộc biến runtime).

### 3.3 `lib/storage/*` — **FIND-05 / P12.3**
- `storage.port.ts`: cổng `StoragePort` (put/delete/publicUrl/getSignedUrl?) — **không** đổi.
- `local-storage.adapter.ts`: `node:fs/promises` (`mkdir/rm/writeFile`), `path.resolve(dynamic)` → Next.js tracing cảnh báo
  *"Dynamic filesystem access causes tracing of the whole project"*.
- `r2-storage.adapter.ts`: S3-compatible, đọc `R2_*` env, **không** hardcode credentials. ✅
- `index.ts` `getStorage()`: chọn R2 nếu đủ env, ngược lại `LocalStorageAdapter`.
  - **Rủi ro production (High):** nếu Vercel không cấu hình `R2_*`, `getStorage()` **im lặng** trả adapter local →
    upload ghi vào filesystem tạm (ephemeral) của Vercel → mất file. Cần **chặn** hành vi này ở production.
- `media.service.ts`: `MediaService` khởi tạo `storage = getStorage()` mặc định; `export const mediaService = new MediaService()`
  ở **phạm vi module** → gọi `getStorage()` lúc import (nhưng không ném lỗi → an toàn cho build).
- `app/api/v1/media/file/[...key]/route.ts`: chỉ phục vụ local; khi có R2 → 404. `path.resolve` động → cũng góp phần cảnh báo tracing.

### 3.4 `app/api/v1/admin/recipes/route.ts`
- `GET` → `getCurrentActor()` (hiện trả `null`) → `recipeService.listAdmin(actor, query)`.
- Import chuỗi → `lib/services` → `lib/db/repositories` → `lib/db/prisma` → **điểm chạm FIND-04**.

### 3.5 `app/(public)/cong-thuc/[slug]/page.tsx`
- Server Component; `recipeService.getPublicBySlug` → `notFound()` khi `NotFoundError`.
- `generateMetadata` bọc try/catch (trả title mặc định khi lỗi DB) → **không** crash trang khi DB lỗi.
- **P11 đã sửa soft-404** (xóa `loading.tsx`) — đã xác minh 404 đúng.

### 3.6 Prisma datasource & migration
- `datasource db`: `provider = "postgresql"`, `url = env("DATABASE_URL")`, `directUrl = env("DIRECT_URL")`, extensions `citext/pg_trgm/unaccent`.
- **1 migration** duy nhất: `prisma/migrations/20261127175936_init/migration.sql` (baseline tái lập từ DB sạch).
- `migration_lock.toml`: `provider = "postgresql"`. ✅
- Seed: `prisma/seed.ts` → `prisma/seed/{data,run}.ts` (idempotent, upsert).

### 3.7 Cấu hình Next.js / Vercel / package
- `next.config.ts`: `reactStrictMode`, `poweredByHeader:false`, `images.dangerouslyAllowSVG`, `securityHeaders` (P11). **Chưa** có `outputFileTracingIncludes/Excludes`.
- **Không** có `vercel.json`; **không** có cấu hình `output: 'standalone'`.
- `package.json`: `next 16.4.6`, `react 19.3.1`, `prisma 6.19.3`, `pnpm@10.5.2`. Scripts: `build`, `typecheck`, `lint`, `test`, `test:integration`, `db:deploy`, `db:seed`. **Chưa** có Playwright.
- `.env` **không tồn tại** trong sandbox; `.gitignore` chặn `.env`/`.env*.local`. ✅ (không commit secret)
- `.env.example` mô tả đúng `DATABASE_URL`/`DIRECT_URL`/`TEST_DATABASE_URL`/`AUTH_*`/`R2_*`/`MEDIA_LOCAL_DIR`.

---

## 4. Danh sách lỗi / rủi ro (có bằng chứng)

| ID | Mức | Mô tả | Bằng chứng | Hướng xử lý (P12) |
|---|---|---|---|---|
| FIND-04 | **High** | Prisma eager init → build cần `DATABASE_URL`; lỗi Vercel "Failed to collect configuration for /api/v1/admin/recipes" | `lib/db/prisma.ts#L17-33`; log deploy | P12.2 — lazy init `PrismaClient` |
| FIND-05 | Medium | Cảnh báo tracing "dynamic filesystem access" từ local adapter + media route | `local-storage.adapter.ts`, `media/file/[...key]/route.ts` | P12.3 — cô lập local adapter khỏi prod; đánh giá tracing |
| FIND-07 (mới) | **High** | Production có thể **im lặng** ghi media vào FS tạm Vercel khi thiếu `R2_*` | `lib/storage/index.ts#L17-21` | P12.3 — chặn local ở production |
| FIND-08 (mới) | Medium | Không có kiểm thử trình duyệt thật (E2E/responsive/a11y) | `BLOCKERS.md` B-P11-01/02 | P12.4/P12.5 — Playwright |
| FIND-09 (mới) | Info | Sandbox mới **không có** `node_modules`, `DATABASE_URL`, PostgreSQL, `.env` | kiểm tra env/phiên bản | Cài deps; DB: BLOCKED nếu không khả dụng |
| FIND-06 | Low | Seed dev tạo 0 công thức | `docs/P11` FIND-06 | Ghi nhận |

---

## 5. Khả năng xác minh trong sandbox (đã kiểm tra thực tế)

| Năng lực | Kết quả | Ghi chú |
|---|---|---|
| Node / pnpm | ✅ `v24.1.0` / `10.5.2` | Khớp `packageManager` |
| Mạng npm registry | ✅ HTTP 200 (qua proxy) | Có thể cài Playwright |
| Chrome + CDP | ✅ **có** — Chrome 150 @ `127.0.0.1:9222` | Dùng cho browser verification (connectOverCDP) |
| PostgreSQL | ❌ **không có** (không psql/pg server) | Integration & E2E DB: **BLOCKED** trừ khi cài được |
| `DATABASE_URL` / `R2_*` | ❌ chưa cấp | Không in giá trị; chỉ kiểm sự hiện diện |
| Vercel dashboard/CLI | ❌ không có quyền | Xác minh deploy: **BLOCKED/PENDING** |

---

## 6. Danh sách kiểm thử cần thực hiện (kế hoạch P12)

1. **P12.2** — Sửa FIND-04 (lazy `PrismaClient`/env); `prisma validate`; chạy typecheck/unit/build **không** cần `DATABASE_URL`; integration nếu có DB.
2. **P12.3** — Guard local adapter ở production (FIND-07); kiểm upload/đọc/MIME/magic-bytes/path-traversal/local; ghi yêu cầu env R2 trên Vercel.
3. **P12.4** — Thiết lập Playwright (`@playwright/test` + connectOverCDP tới Chrome 9222); bộ E2E public/cooking/admin/API.
4. **P12.5** — Responsive 375/390/768/1440; console/network; a11y cơ bản.
5. **P12.6** — Xác minh cấu hình Vercel (tài liệu) + đối chiếu baseline test P11 (337 unit / 59 integration / 42 route).
6. **P12.7** — Tài liệu `docs/P12/*` + checkpoint cuối + cập nhật status/blockers.

---

## 7. Kết luận audit

- Repository **sạch, đồng bộ, đúng mốc P11**. Sản phẩm P00–P11 đã hoàn thành thực tế.
- **1 lỗi High chặn deploy (FIND-04)** + **1 rủi ro High mất dữ liệu media ở production (FIND-07)** cần sửa trong P12.
- Sandbox **có Chrome/CDP** (mở khóa browser verification) nhưng **thiếu PostgreSQL/credentials** → integration & deploy production phải đánh dấu **BLOCKED/PENDING** nếu không khắc phục được.
- **Nguyên tắc:** chỉ sửa trong phạm vi P12; không đổi stack/kiến trúc/design system; không thêm tính năng; không nới lỏng bảo mật.
