# P12.2 — DATABASE READINESS (Neon PostgreSQL)

> Phase: **P12** · Ngày: 2026-11-28
> Mục tiêu: xác minh WALE COOKING dùng đúng Neon PostgreSQL và **build không còn phụ thuộc `DATABASE_URL`**.

---

## 1. Trạng thái tổng hợp

| Hạng mục | Trạng thái | Bằng chứng |
|---|---|---|
| Prisma datasource/provider | **PASS** | `prisma/schema.prisma` — `provider = "postgresql"`, `url = env("DATABASE_URL")`, `directUrl = env("DIRECT_URL")` |
| Đọc env ở production | **PASS (đã sửa)** | Lazy init qua `Proxy` — build không cần `DATABASE_URL` |
| Migration history | **PASS** | `prisma migrate deploy` áp `20261127175936_init` trên 2 DB thật |
| Index/constraint/enum/relation | **PASS** | Integration `schema.test.ts` (5) + `constraints.test.ts` (6) |
| Seed an toàn & idempotent | **PASS** | Chạy 2 lần, số bản ghi không đổi (integration `seed.test.ts`) |
| Service/repository trên PostgreSQL | **PASS** | **59/59** integration test trên PostgreSQL 16.15 |
| Kết nối **Neon** thật | **BLOCKED** | Không có credentials trong sandbox (không in/không đòi giá trị) |

---

## 2. Sửa FIND-04 — Prisma eager initialization

### Vấn đề (trước sửa)
`lib/db/prisma.ts` tạo client ở **phạm vi module**:
```ts
export const prisma = globalForPrisma.__walePrisma ?? createPrismaClient(); // createPrismaClient() gọi serverEnv()
```
→ Mọi module import `prisma` (qua `lib/db/repositories` → `lib/services` → nhiều route) **ném lỗi ngay khi evaluate** nếu thiếu `DATABASE_URL`. Đây là nguyên nhân lỗi Vercel:
`Failed to collect configuration for /api/v1/admin/recipes`. (Ghi nhận ở D78/FIND-04.)

### Cách sửa (không bỏ validation, không đổi API sử dụng)
`lib/db/prisma.ts` giờ dùng **`Proxy` lazy**:
- Client chỉ được tạo ở **lần truy cập đầu tiên** (`getPrismaClient()`), không ở phạm vi module.
- `serverEnv()` **vẫn được gọi** — đúng thời điểm thực sự kết nối (không bỏ qua validation).
- Getter của Prisma được gọi với `this = client` thật (không truyền `receiver` proxy) → tránh đệ quy và bảo toàn ràng buộc `this` của `$transaction`.
- Singleton giữ nguyên: `globalThis` ở dev (hot-reload), closure ở production.

### Xác minh (bằng chứng thực tế)
```
rm -rf .next && env -u DATABASE_URL pnpm build
→ ✓ Compiled successfully · 42 route (không lỗi "Failed to collect configuration")
```
Trước sửa, build **không có** `DATABASE_URL` sẽ thất bại. Sau sửa, build thành công.

---

## 3. Migration

- **1 migration duy nhất**: `prisma/migrations/20261127175936_init/migration.sql` (baseline tái lập).
- `migration_lock.toml`: `provider = "postgresql"`.
- Áp dụng thực tế trong sandbox P12 trên **PostgreSQL 16.15**:
  - `wale_dev` → `Applying migration 20261127175936_init` → *All migrations successfully applied*.
  - `wale_test` → tương tự.
- **Không** dùng `prisma db push`, **không** `migrate reset`, **không** lệnh phá hủy. Chỉ `migrate deploy`.
- 58 bảng trong schema public (khớp baseline P06).

---

## 4. Seed

- `prisma/seed.ts` → `runSystemSeed` (taxonomy/units/equipment/ingredients/content source) + `runDevSeed` (chỉ khi `SEED_DEV=1`).
- **Idempotent** bằng `upsert` theo khóa duy nhất. Chạy 2 lần liên tiếp → log "hoàn tất", số bản ghi không tăng (integration `seed.test.ts` khẳng định).
- `runDevSeed` **không** tạo công thức (FIND-06 — giữ nguyên, không tạo dữ liệu công thức giả để làm đẹp giao diện).

---

## 5. Kết quả kiểm thử (thực tế trong sandbox P12)

| Kiểm tra | Kết quả |
|---|---|
| `pnpm typecheck` | ✅ 0 lỗi |
| `pnpm lint` | ✅ 0 lỗi/0 cảnh báo |
| `pnpm test` (unit) | ✅ **337/337** (31 file) |
| `pnpm test:integration` | ✅ **59/59** (9 file) — PostgreSQL 16.15 thật |
| `pnpm build` (KHÔNG có `DATABASE_URL`) | ✅ 42 route |

---

## 6. Neon — việc cần chủ dự án thao tác (BLOCKED trong sandbox)

Sandbox **không** có `DATABASE_URL` Neon và **không** được yêu cầu cung cấp. Không in/không lưu giá trị bí mật.

**Lệnh chính xác để chủ dự án chạy (sau khi đặt env, không dán secret vào hội thoại/commit):**
```bash
# 1) Đặt biến môi trường (pooled cho runtime, direct cho migration)
export DATABASE_URL="postgresql://…-pooler…?sslmode=require&pgbouncer=true"
export DIRECT_URL="postgresql://…direct…?sslmode=require"

# 2) Kiểm tra schema & sinh client
pnpm db:generate

# 3) Áp migration lên Neon (chỉ deploy, KHÔNG db push/reset)
pnpm db:deploy

# 4) Seed hệ thống (idempotent)
pnpm db:seed
```
- Chỉ chạy `db:deploy` sau khi xác nhận đúng database đích (Neon branch production) và đã review migration.
- **Không** chạy `db push`/`migrate reset`.
- Trên Vercel: đặt `DATABASE_URL` (pooled) và `DIRECT_URL` (direct) trong Environment Variables.

---

## 7. Trạng thái 4 mức

| Mục | Trạng thái |
|---|---|
| Build không phụ thuộc DB | **PASS** |
| Migration + seed trên PostgreSQL | **PASS** |
| Integration tests | **PASS (59/59)** |
| Neon production kết nối | **BLOCKED** (thiếu credentials — hướng dẫn §6) |
