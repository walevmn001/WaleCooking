# P07.1.2 — PHẠM VI AUTHENTICATION & AUTHORIZATION

> Điều chỉnh theo định hướng **Recipe-focused Cooking Assistant**: chỉ giữ xác thực cho
> **quản trị**. Không có tài khoản khách.

## Nguyên tắc

| Yêu cầu | Trạng thái | Ghi chú |
| --- | --- | --- |
| Không có public registration | ✅ | Không tồn tại route/form đăng ký |
| Không có public login cho khách | ✅ | `/dang-nhap` chỉ là **cổng đăng nhập quản trị** (Auth.js chưa nối) |
| Không có public user profile | ✅ (đã sửa ở P07.1) | Đã **bỏ** trang `/tai-khoan` và mục tài khoản ở footer công khai |
| Không bắt buộc đăng nhập để xem/yêu thích công thức | ✅ | Yêu thích dùng cookie; trang công khai mở |
| Giữ bảo vệ route admin | ✅ | Mọi trang `/admin/*` guard bằng `can(actor, …)`; API trả 401/403 |
| Giữ xác thực & phân quyền cho API thay đổi dữ liệu | ✅ | `requirePermission()` ở tầng service |
| `actor = null` KHÔNG vượt qua kiểm tra quyền | ✅ | `can(null, …) === false`; `requireActor/requirePermission` ném 401 |
| Kiểm quyền ở **server**, không chỉ ẩn nút | ✅ | Guard nằm trong service + server component; UI chỉ phản ánh |
| Chống truy cập trái phép API quản trị | ✅ | API admin dùng `getCurrentActor()` + `requirePermission` |
| Bảo vệ session/cookie đăng nhập | N/A (Auth.js chưa nối) | Khi nối: cookie `HttpOnly` do Auth.js quản lý |
| Không hardcode mật khẩu/secret | ✅ | Chỉ đọc `AUTH_SECRET` từ env |
| Không ghi thông tin đăng nhập vào log | ✅ | Không có log credential |

## Kiến trúc (không tạo hệ auth thứ hai)

- **Auth.js** là lựa chọn duy nhất cho admin (bảng `users/accounts/sessions/verification_tokens`
  đã có sẵn theo P02, tương thích Prisma Adapter).
- Điểm nối duy nhất: `lib/auth/session.ts → getCurrentActor()`. Khi nối Auth.js chỉ cần thay
  thân hàm bằng `auth()` rồi map sang `Actor`.
- **KHÔNG** thêm NextAuth thứ hai, **KHÔNG** tự viết session cho khách.

## Yêu thích không phụ thuộc đăng nhập

- Quyền `favorite:manage` trong RBAC chỉ áp cho **tài khoản** (legacy). Module yêu thích mới
  (cookie) **không** dùng RBAC và **không** yêu cầu đăng nhập — xem `COOKIE_FAVORITES.md`.
- Vì không có tài khoản khách, bảng `favorites` không được dùng cho luồng khách.

## Việc chưa xác minh được (không giả lập)

- Chưa có `AUTH_SECRET`/phiên thật → **không** xác minh đăng nhập production.
- 401/403 mới kiểm ở **tầng service/unit** (actor giả trong bộ nhớ), chưa qua HTTP phiên thật
  (kế thừa B-P07-02; cần DB + Auth.js).

## Hướng dẫn cấu hình Auth.js (khi triển khai)

1. Sinh secret: `npx auth secret` hoặc `openssl rand -base64 32` → đặt `AUTH_SECRET`.
2. Đặt `AUTH_URL` theo domain triển khai.
3. Cấu hình `DATABASE_URL` (bảng Auth.js đã có sẵn từ migration P06 — KHÔNG cần migration mới).
4. Tạo **tài khoản quản trị đầu tiên** bằng script seed/admin riêng (không mở đăng ký công khai).
5. Thay `getCurrentActor()` bằng `auth()` và map `session.user.role` (enum `app_role`).
