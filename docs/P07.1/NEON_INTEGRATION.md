# P07.1 — Neon PostgreSQL Integration

> Cập nhật: 2026-11-28 (P07.1).

## 1. Trạng thái

| Mục | Kết quả |
| --- | --- |
| Cấu hình env | ✅ `DATABASE_URL` (pooled) + `DIRECT_URL` (direct) — `.env.example` |
| Kiểm tra env | ✅ `lib/config/env.ts` (Zod, không lộ secret) |
| Schema | ✅ `prisma/schema.prisma` — provider `postgresql` |
| Migration baseline | ✅ `20261127175936_init` (tái lập từ DB sạch) |
| Seed idempotent | ✅ chạy 2 lần không trùng |
| Xác minh Neon thật | ⏳ **Chưa có connection string Neon** |

## 2. Pooled vs Direct

- `DATABASE_URL` — pooled (PgBouncer) cho runtime Next.js. Thêm `?pgbouncer=true` khi dùng Neon pooler.
- `DIRECT_URL` — direct connection cho migration/seed (`prisma migrate`, `prisma db seed`).
- Với PostgreSQL local, cả hai có thể trỏ cùng URL.

## 3. Kiểm thử local (PostgreSQL 16.15)

- `wale_dev` — migration áp thành công, seed chạy.
- `wale_test` — migration áp thành công, 58 integration tests pass.
- CRUD recipe, transaction rollback, unique constraint, Decimal, timestamptz — đều pass.

## 4. External verification pending

Cần connection string Neon để xác minh:
- SSL/TLS với Neon.
- Pooled connection (`?pgbouncer=true`).
- Migration từ DB Neon sạch.
- Độ trễ query, giới hạn kết nối.

## 5. Hướng dẫn

```bash
# Sao chép .env.example sang .env, điền DATABASE_URL + DIRECT_URL (Neon)
cp .env.example .env

# Migration
pnpm prisma migrate deploy  # dùng DIRECT_URL

# Seed
pnpm db:seed
```
