# P07.1.1 — AUDIT TÍCH HỢP THỰC TẾ (sau P06 & P07)

> Mục đích: kiểm tra trạng thái **thật** của các thành phần tích hợp, KHÔNG giả định
> rằng báo cáo P07 đồng nghĩa tích hợp đã chạy thực tế.
> Phương pháp: đọc mã nguồn, cấu hình, chạy `typecheck`/`lint`/`test` trong môi trường
> sandbox hiện tại (deps cài lại bằng `pnpm install`), kiểm tra kết nối hạ tầng.
> Ngày audit: 2026-11-28.

## Trạng thái môi trường kiểm chứng

| Yếu tố | Quan sát thực tế | Hệ quả |
| --- | --- | --- |
| `node_modules` | **Thiếu** khi bắt đầu audit → đã `pnpm install --frozen-lockfile` lại | Có thể chạy lại kiểm chứng |
| `.env` | **Không tồn tại** (chỉ có `.env.example`) | Không có credentials Neon/R2/Auth |
| PostgreSQL cục bộ | **Không có** (`postgres`/`psql`/`pg_isready` đều không tồn tại; cổng 5432 đóng) | **Không chạy được test tích hợp** trong sandbox này |
| `DATABASE_URL` | Không có | Không kết nối DB thật |
| Trình duyệt headless | Không có | Không chạy E2E/axe thật |

## Bảng audit thành phần

| # | Thành phần | Trạng thái hiện tại | Mức độ hoàn thiện | Vấn đề | Cách xử lý | Kiểm thử cần thiết |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | **Neon PostgreSQL** | Chưa có connection string | 0% (mục tiêu) | Chưa xác minh kết nối pooled/direct, SSL, `?pgbouncer=true` | Giữ `DATABASE_URL` + `DIRECT_URL`; viết hướng dẫn; đánh dấu **External Verification Pending** | Kết nối thật + `migrate deploy` + `select 1` (ngoài sandbox) |
| 2 | **Prisma** | `schema.prisma` 22 enum/57 model khớp P02; client generate OK | 100% code | Không có DB để chạy `migrate`/`seed` | Giữ nguyên; ghi rõ chưa chạy trong sandbox | `prisma validate/generate` (đã chạy) · `migrate deploy`/`seed` (cần DB) |
| 3 | **Auth.js** | **CHƯA nối** — `getCurrentActor()` trả `null` (`lib/auth/session.ts`) | 0% | Không có phiên đăng nhập; mọi thao tác ghi → 401 (đúng hành vi an toàn) | Giữ Auth.js cho **admin**; KHÔNG thêm hệ auth thứ hai; viết hướng dẫn cấu hình | Test 401/403 qua HTTP (cần phiên thật — External Verification Pending) |
| 4 | **RBAC & middleware** | `lib/auth/authorization.ts` tập trung (`can`/`requirePermission`); **không có** middleware.ts | 90% | Chưa có middleware bảo vệ route admin cấp HTTP; quyền kiểm ở tầng service/route | Xác nhận quyền kiểm ở **server**; bổ sung chặn ở tầng trang admin (đã có `can()` guard) | Unit test authorization (đã có, mở rộng) |
| 5 | **Recipe API** | `app/api/v1/recipes*` theo contract P02 | 100% code | Chưa test HTTP (cần DB) | Giữ; bổ sung bộ lọc P08 | Integration/HTTP (cần DB) |
| 6 | **Admin API** | `app/api/v1/admin/recipes` (đọc, yêu cầu `recipe:read:draft`) | 100% code | Guest → 401 (đúng) | Giữ | HTTP 401 (cần DB) |
| 7 | **Media API** | `app/api/v1/media*` (upload/list/get/file) | 100% code | Chạy **local provider** (chưa có R2) | Giữ; R2 adapter đã hoàn thiện | Upload thật cần R2 — External Verification Pending |
| 8 | **Cloudflare R2** | Adapter đầy đủ (`r2-storage.adapter.ts`), chưa có credentials | Code 100% / kết nối 0% | Chưa xác minh endpoint/SSL/CORS/CDN | Hướng dẫn cấu hình + mock test | Kết nối thật (ngoài sandbox) |
| 9 | **Route công khai** | `/`, `/cong-thuc`, `/cong-thuc/[slug]`, `/danh-muc`, `/yeu-thich`, `/kien-thuc`, `/gioi-thieu`, pháp lý | Đa số còn **placeholder** | `/danh-muc`, `/yeu-thich` chưa có chức năng; `/tai-khoan` là khái niệm tài khoản khách (không còn phù hợp) | Bổ sung danh mục (P08) + yêu thích cookie (P07.1); **bỏ tài khoản khách** | Unit + build (đã chạy) · E2E (cần trình duyệt) |
| 10 | **Route quản trị** | `/admin/cong-thuc{,/moi,/[id]/sua}` | Recipe admin OK | Chưa có quản trị danh mục | Thêm `/admin/danh-muc` (P08) | Unit authorization + build |
| 11 | **Bảng `users`** | Có (Auth.js compatible) | Giữ | Cần cho admin | **GIỮ** cho quản trị | — |
| 12 | **Bảng `accounts`, `sessions`, `verification_tokens`** | Có | Giữ | Cần cho Auth.js admin | **GIỮ** | — |
| 13 | **Vai trò (`app_role` enum)** | `user`/`editor`/`admin` trên `users.role`; KHÔNG có bảng `roles`/`permissions` | 100% | Vai trò `user` gắn tài khoản khách không còn dùng | Giữ enum (admin dùng `editor`/`admin`); **không** drop | — |
| 14 | **Bảng `favorites`** | Có (FK `user_id` + `recipe_id`) | Giữ, KHÔNG dùng cho khách | Thiết kế gắn tài khoản → không phù hợp yêu thích bằng cookie | **Không dùng** cho yêu thích khách; giữ bảng (không drop) | — |
| 15 | **Service/repository phụ thuộc User/Favorite** | `recipe.service` (authorId/editorId), `recipe.repository` (author relation) | 100% | Chỉ admin tạo công thức → cần user thật | Giữ; yêu thích khách tách hoàn toàn khỏi User | — |
| 16 | **`getCurrentActor()`** | Trả `null` | Đúng (an toàn) | Chưa có phiên | Giữ; là điểm nối Auth.js duy nhất | — |

## Kết luận audit

- **Tích hợp DB (Neon/Prisma/seed) và storage (R2) ở trạng thái "code hoàn thiện, kết nối chưa xác minh".**
- **Auth.js chưa nối** → mọi API ghi trả 401; đây là hành vi **an toàn**, không phải lỗi.
- **Vấn đề phạm vi cần sửa:** khái niệm **tài khoản khách** (`/tai-khoan`, mục "Đăng nhập/Tài khoản"
  ở footer công khai) không còn phù hợp với định hướng "không có tài khoản khách".
- **Vấn đề dữ liệu cần sửa:** bảng `favorites` gắn tài khoản **không dùng** cho yêu thích khách →
  xây module yêu thích bằng **cookie** tách biệt.
- **Không cần migration mới** trong P07.1 (xem `DATABASE_CLASSIFICATION.md`).

Chi tiết từng tiểu mục: xem `AUTHENTICATION_SCOPE.md`, `DATABASE_CLASSIFICATION.md`,
`COOKIE_FAVORITES.md`, `EXTERNAL_VERIFICATION.md`, `E2E_VERIFICATION.md`, `TEST_REPORT.md`.
