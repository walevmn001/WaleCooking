# P07.1.3 — PHÂN LOẠI BẢNG DATABASE & ADR

> Đánh giá lại `User`, `Account`, `Role`, `Permission`, `Favorite` theo mô hình **không có
> tài khoản khách**. **KHÔNG** drop bảng, **KHÔNG** sửa lịch sử migration.

## Phân loại

| Bảng / khái niệm | Nhóm | Quyết định |
| --- | --- | --- |
| `users` | **1. Cần giữ cho quản trị** | Giữ — tài khoản editor/admin (Auth.js) |
| `accounts` | **1. Cần giữ cho quản trị** | Giữ — Auth.js Prisma Adapter |
| `sessions` | **1. Cần giữ cho quản trị** | Giữ — session database |
| `verification_tokens` | **1. Cần giữ cho quản trị** | Giữ — luồng xác minh email (nếu dùng) |
| Vai trò (enum `app_role` trên `users.role`) | **1. Cần giữ cho quản trị** | Giữ (`editor`, `admin`). **Không** có bảng `roles`/`permissions` — RBAC là hằng số trong mã (P02 D-P02-03) |
| `user_profiles`, `user_preferences`, `user_dietary_preferences`, `user_allergens` | **2. Không còn cần cho khách** | Giữ nhưng **không dùng** cho khách (không có tài khoản khách). Không drop |
| `favorites` | **2. Không còn cần cho khách** | Giữ bảng, **KHÔNG dùng** cho yêu thích khách (yêu thích mới dùng **cookie**). `user` role + quyền `favorite:manage` là **legacy** — không drop |
| `collections`, `recipe_notes`, `cooked_history`, `cooking_sessions`, `meal_plans`, `shopping_lists` | **3. Có thể ngừng sử dụng** | Giữ (đã thiết kế P02), chưa dùng ở MVP |
| (không có) | **4. Có thể loại bỏ trong tương lai** | Sau khi xác nhận không dùng — **chưa** drop ở P07.1 |

## ADR-P07_1-01: Không drop bảng; yêu thích khách dùng cookie thay bảng `favorites`

**Bối cảnh:**
- Sản phẩm chuyển sang mô hình **không có tài khoản khách**.
- Bảng `favorites` có khóa chính `(user_id, recipe_id)` → **bắt buộc** có `users` row → chỉ
  dùng được nếu có tài khoản khách (đã bị loại bỏ).

**Quyết định:**
1. **Không** tạo migration drop/xóa bảng nào (tránh phá dữ liệu, tránh sửa lịch sử migration).
2. Yêu thích của khách triển khai bằng **cookie** (`lib/favorites/`), **không** ghi DB.
3. Bảng `favorites` và vai trò `user` giữ nguyên ở trạng thái **legacy (không dùng)**.

**Lý do:**
- Không có thay đổi schema ⇒ không có rủi ro rollback; không cần migration mới.
- An toàn: giữ nguyên mọi FK/dữ liệu hiện có.

**Hệ quả:**
- Cần dọn dẹp `user`-role/Favorite ở một phase tương lai nếu chốt bỏ hẳn (ghi backlog).
- Không phát sinh yêu cầu cập nhật Prisma schema/repository/service/test trong P07.1.

**Trạng thái:** Đã chấp nhận (Accepted) — P07.1.

## Kiểm tra FK & dữ liệu (không chạy được trong sandbox)

Không có DB trong sandbox ⇒ **không** kiểm được FK/dữ liệu thực tế. Vì **không thay đổi schema**,
rủi ro FK bằng 0. Khi có DB, chạy `prisma migrate status` để xác nhận baseline `20261127175936_init`
đã áp (xem `docs/P06/MIGRATION_GUIDE.md`).

## ADR-P07_1-02: Không thêm cột SEO/ảnh cho taxonomy trong P07.1/P08

**Bối cảnh:** P08 yêu cầu quản trị danh mục có "SEO title/description" và "hình ảnh đại diện nếu
hệ thống media hỗ trợ". Schema hiện tại (`taxonomy_terms`, `taxonomy_term_translations`) **chưa có**
cột SEO/ảnh (chỉ có `slug`, `icon`, `sort_order`, `is_active`, `name`, `description`).

**Quyết định:** P08 quản trị các trường **có thật** trong schema (tên, slug, mô tả, icon, cha/con,
thứ tự, kích hoạt/lưu trữ). **Không** thêm migration cột SEO/ảnh trong phạm vi P07.1+P08 vì không
thể xác minh migration trong môi trường hiện tại. SEO trang danh mục **suy ra** từ `name`/`description`.

**Hệ quả:** Trường SEO/ảnh riêng cho term đưa vào **backlog** (kèm migration khi có DB để xác minh).
