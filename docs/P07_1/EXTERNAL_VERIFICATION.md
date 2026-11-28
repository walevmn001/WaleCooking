# P07.1.5 — XÁC MINH DỊCH VỤ NGOÀI (Neon PostgreSQL & Cloudflare R2)

> Trạng thái: **EXTERNAL VERIFICATION PENDING** — không có credentials trong môi trường hiện tại.
> **KHÔNG** tuyên bố tích hợp production đã thành công.

## 1. Trạng thái môi trường kiểm chứng (đo lại ngày 2026-11-28)

| Yếu tố | Kết quả đo | Hệ quả |
| --- | --- | --- |
| `node_modules` | **Tồn tại** (đã cài) | Chạy được `typecheck`/`lint`/`test`/`build` |
| `.env` | **Không tồn tại** (chỉ `.env.example`) | Không có `DATABASE_URL`/R2/Auth secrets |
| `psql` | **Không có** | Không có PostgreSQL cục bộ |
| Cổng `5432` | **Đóng** | Không kết nối được DB nào |
| Trình duyệt headless | Không có | Không chạy E2E/axe thật |

## 2. Neon PostgreSQL

| Hạng mục | Trạng thái | Ghi chú |
| --- | --- | --- |
| Connection string | **Chưa có** | `DATABASE_URL` (pooled, `?pgbouncer=true`) + `DIRECT_URL` (direct) đã khai trong schema + `.env.example` |
| Kết nối thật | **Chưa xác minh** | External Verification Pending |
| Migration `migrate deploy` | **Chưa xác minh** | Baseline `20261127175936_init` đã kiểm ở PostgreSQL local (P06); chưa chạy trên Neon |
| Seed | **Chưa xác minh** | Seed idempotent đã kiểm ở local (P06) |
| SSL / pooled / direct | **Chưa xác minh** | — |

**Kết luận:** Neon = **code hoàn thiện, kết nối chưa xác minh**. Đây là trạng thái trung thực, không suy diễn thành công.

## 3. Cloudflare R2

| Hạng mục | Trạng thái | Ghi chú |
| --- | --- | --- |
| Adapter R2 | **Code hoàn thiện** | `lib/storage/r2-storage.adapter.ts` (S3-compatible, khóa do server sinh) |
| Upload/đọc thật | **Chưa xác minh** | Chạy **LocalStorageAdapter** (dev/test) |
| Kiểm MIME/magic bytes | **Đã hiện thực trong code** | `lib/storage/image-validation.ts` (không tin `Content-Type` từ client) |
| Giới hạn kích thước | **Đã hiện thực trong code** | — |
| Xóa/thay media | **Đã hiện thực trong code** | — |
| URL công khai/CDN/presigned | **Chưa xác minh** | — |
| Quyền truy cập media | **Chưa xác minh** | — |

**Kết luận:** R2 = **code hoàn thiện, kết nối chưa xác minh** (External Verification Pending). Media chạy local provider.

## 4. Secrets & an toàn

- **Không** đưa credentials vào Git: `.env` **không tồn tại**; `.gitignore` đã bỏ qua `.env*`.
- `.env.example` chỉ chứa **tên biến** + mô tả, không giá trị thật.
- `lib/config/env.ts` kiểm tra biến môi trường phía server; lỗi **chỉ nêu tên biến**, **không in giá trị**.
- Không có mật khẩu/secret hardcode; không ghi thông tin đăng nhập vào log.

## 5. Hướng dẫn hoàn tất xác minh (ngoài sandbox)

### Neon
1. Tạo project Neon (PostgreSQL) → tạo branch `dev`, `test`.
2. Lấy pooled connection string (có `?pgbouncer=true`) → `DATABASE_URL`; lấy direct → `DIRECT_URL`.
3. `pnpm prisma migrate deploy` → `pnpm prisma generate` → `pnpm db:seed`.
4. Kiểm tra: `select 1`, `prisma migrate status`, đếm bảng (58), seed không trùng khi chạy lại.
5. Chạy integration test: `TEST_DATABASE_URL=<neon-test-branch> pnpm test:integration`.

### Cloudflare R2
1. Tạo bucket + API token (Access Key/Secret) → điền các biến `R2_*` trong `.env`.
2. Đặt `MEDIA_PROVIDER=r2` (thay vì local).
3. Upload một ảnh JPEG/PNG thật qua `POST /api/v1/media` → kiểm `publicUrl`, MIME chặn sai magic bytes, giới hạn kích thước, xóa/thay media an toàn.
4. Kiểm quyền truy cập tệp (public vs presigned) theo cấu hình bucket.

## 6. Test mock đã có

- Unit/integration hiện có dùng **LocalStorageAdapter** + fixture ⇒ luồng adapter/validate chạy được không cần R2 thật.
- Kiểm magic bytes/giới hạn kích thước là **logic thuần**, kiểm được bằng unit test.
