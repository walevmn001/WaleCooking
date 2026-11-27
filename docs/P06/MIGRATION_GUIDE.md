# P06 — MIGRATION GUIDE

> Quy trình migration tái lập được cho WALE COOKING.
> Cập nhật: 2026-11-28 (P06).

---

## 1. Nguyên tắc

- **Không dùng `prisma db push`** thay cho migration trong quy trình production (P06 §5).
- Migration phải **chạy được từ database sạch** (baseline đầy đủ).
- **Không sửa** file migration đã áp dụng theo cách phá vỡ lịch sử; thay đổi mới → migration mới.
- **Không chạy migration phá hủy** trên database thật khi chưa có xác nhận.
- Migration luôn dùng kết nối **DIRECT** (`DIRECT_URL`) khi chạy qua pooler Neon.
- Migration thử trên DB thử nghiệm (`wale_test`) trước khi lên `wale_dev`/production.

---

## 2. Baseline hiện có

| Mục | Giá trị |
| --- | --- |
| Thư mục | `prisma/migrations/20261127175936_init/` |
| Lockfile | `prisma/migrations/migration_lock.toml` (`provider = "postgresql"`) |
| Nội dung | 3 `CREATE EXTENSION` (`citext`, `pg_trgm`, `unaccent`) + 22 `CREATE TYPE` (enum) + 57 `CREATE TABLE` |
| Trạng thái | Đã áp thành công lên `wale_dev` và `wale_test`; `prisma migrate status` = up-to-date |

> Baseline được **tạo lại** sau khi sửa delete behavior `Ingredient.category` (ADR-P06-04). Vì chưa
> có dữ liệu thật nào phụ thuộc, việc tái tạo baseline là an toàn và giữ lịch sử sạch (không có
> migration "sửa lỗi" chồng lên).

---

## 3. Biến môi trường

```bash
# Runtime (pooled) — có thể có ?pgbouncer=true khi dùng Neon pooler
DATABASE_URL="postgresql://…"
# Migration/seed (direct)
DIRECT_URL="postgresql://…"
# CSDL kiểm thử (tùy chọn; mặc định local wale_test)
TEST_DATABASE_URL="postgresql://wale:wale@127.0.0.1:5432/wale_test"
```

Không hardcode; dùng `.env` (đã `.gitignore`) / `.env.example` (mẫu, đã commit).

---

## 4. Quy trình thường dùng

### 4.1. Áp migration lên môi trường sạch (dev/test)

```bash
# 1) Trỏ DIRECT_URL/DATABASE_URL tới DB đích
# 2) Áp migration (không tạo mới, không reset)
pnpm db:deploy          # prisma migrate deploy

# 3) Sinh client nếu chưa có
pnpm db:generate

# 4) Seed dữ liệu hệ thống (idempotent)
pnpm db:seed
```

### 4.2. Tạo migration mới (khi đổi schema)

```bash
# Sau khi sửa prisma/schema.prisma
pnpm db:migrate         # prisma migrate dev → tạo migration mới + áp + generate
```

`prisma migrate dev` có thể gợi ý reset nếu phát hiện drift — **đọc kỹ** trước khi xác nhận, không
tự động chấp nhận reset trên DB có dữ liệu.

### 4.3. Kiểm tra trạng thái

```bash
pnpm exec prisma migrate status
```

---

## 5. Rollback / recovery

Prisma **không** tự sinh `down` migration. Phương án recovery:

1. **Trên dev/test (chấp nhận mất dữ liệu):**
   ```bash
   pnpm db:reset        # prisma migrate reset --force  → xóa + áp lại baseline + seed
   ```
   > ⚠️ `db:reset` **xóa toàn bộ dữ liệu** của DB đích. Chỉ dùng cho dev/test.

2. **Trên môi trường có dữ liệu (production):**
   - **Rollback logic:** tạo một migration **mới** đảo ngược thay đổi (drop/alter ngược lại) rồi
     `pnpm db:deploy`. Không sửa migration cũ.
   - **PITR / backup:** khôi phục từ điểm sao lưu (Neon PITR) — **chưa xác minh hạn mức gói free**
     (B-P02-02).
   - Nếu migration lỡ thất bại giữa chừng: `prisma migrate status` để xem migration nào đang
     "failed"; sửa nguyên nhân rồi `prisma migrate resolve --rolled-back <name>` hoặc
     `--applied <name>` cho đúng, **không** chạy lại mù quáng.

3. **Quy tắc an toàn:** trước mọi migration phá hủy trên DB thật → **sao lưu/export** và **có xác
   nhận của người dùng**.

---

## 6. Neon PostgreSQL — trạng thái xác minh

| Hạng mục | Trạng thái |
| --- | --- |
| Cấu hình tách pooled (`DATABASE_URL`) / direct (`DIRECT_URL`) | ✅ Đã cấu hình trong schema + `.env.example` |
| Migration qua kết nối direct | ✅ Đã chạy (trên PostgreSQL **local**) |
| Kết nối Neon thật (pooler + SSL) | ⛔ **CHƯA XÁC MINH** — chưa có connection string Neon |
| `?pgbouncer=true` với pooler Neon | ⛔ **CHƯA XÁC MINH** |

> Toàn bộ kiểm chứng P06 chạy trên **PostgreSQL 16.15 local** (`127.0.0.1:5432`, DB `wale_dev` +
  `wale_test`). **Không** tự tạo/bịa credentials Neon. Khi có credentials thật, chạy lại
> `pnpm db:deploy` + `pnpm db:seed` trên nhánh Neon để xác minh (ghi vào báo cáo tích hợp).
