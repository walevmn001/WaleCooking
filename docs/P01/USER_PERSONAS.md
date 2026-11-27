# P01 — USER PERSONAS: WALE COOKING

> Các nhóm người dùng, quyền hạn và nhu cầu. Liên quan: [PRD.md](./PRD.md), [USER_JOURNEYS.md](./USER_JOURNEYS.md).

## 1. Danh sách vai trò (RBAC)

| Vai trò hệ thống | Nhãn hiển thị | Mô tả |
| --- | --- | --- |
| `guest` | Khách | Chưa đăng nhập |
| `user` | Thành viên | Đã đăng ký |
| `editor` | Biên tập viên | Tạo/sửa/duyệt nội dung |
| `admin` | Quản trị viên | Toàn quyền hệ thống |

> `editor`/`admin` là **vai trò cấp nội dung**; chỉ cấp bởi `admin`.

## 2. Ma trận quyền chi tiết

| Hành động | guest | user | editor | admin |
| --- | :-: | :-: | :-: | :-: |
| Xem trang chủ / thư viện / công thức đã xuất bản | ✔ | ✔ | ✔ | ✔ |
| Tìm kiếm & lọc công thức | ✔ | ✔ | ✔ | ✔ |
| Điều chỉnh khẩu phần (phiên tạm) | ✔ | ✔ | ✔ | ✔ |
| Dùng chế độ nấu (không lưu tiến độ) | ✔ | ✔ | ✔ | ✔ |
| Lưu công thức yêu thích | — | ✔ | ✔ | ✔ |
| Sổ tay (bộ sưu tập, lịch sử nấu, ghi chú) | — | ✔ | ✔ | ✔ |
| Meal planner / shopping list | — | ✔ | ✔ | ✔ |
| Lưu tiến độ nấu & đồng bộ | — | ✔ | ✔ | ✔ |
| Tạo/sửa công thức (nháp) | — | — | ✔ | ✔ |
| Duyệt & xuất bản / lưu trữ công thức | — | — | ✔ | ✔ |
| Quản lý taxonomy (food type, cuisine, ingredient, method, meal type, diet, allergen) | — | — | ⚠ (*) | ✔ |
| Quản lý người dùng & phân quyền | — | — | — | ✔ |
| Cấu hình hệ thống, xem log/giám sát | — | — | — | ✔ |

(*) Biên tập viên có thể **đề xuất** giá trị taxonomy mới; chỉ `admin` phê duyệt/thêm chính thức. *(Chi tiết quy trình: xem [BLOCKERS.md](../../BLOCKERS.md) — chờ xác nhận.)*

## 3. Chân dung người dùng (personas)

### P1 — Khách chưa đăng nhập ("Guest")
- **Đặc điểm:** Tìm công thức qua tìm kiếm/cuộc gọi chia sẻ; chưa muốn tạo tài khoản.
- **Mục tiêu:** Đọc công thức trọn vẹn nhanh; không bị chặn bởi đăng ký.
- **Nhu cầu:** Nội dung công khai đầy đủ (trừ lưu cá nhân); tải nhanh; SEO tốt.
- **Ràng buộc (BR-11):** Không ép tạo tài khoản cho chức năng công khai.

### P2 — Người dùng đã đăng ký ("Member")
- **Đặc điểm:** Có tài khoản, muốn lưu và quay lại.
- **Mục tiêu:** Lưu yêu thích, lập kế hoạch, đồng bộ tiến độ.
- **Nhu cầu:** Đồng bộ dữ liệu qua thiết bị; quản lý dữ liệu cá nhân.
- **Ràng buộc:** Dữ liệu cá nhân bảo mật (PC-09).

### P3 — Người dùng thường xuyên nấu ăn ("Frequent cook")
- **Đặc điểm:** Nấu nhiều lần/tuần; quan tâm meal plan, shopping list, mẹo/bảo quản.
- **Lưu ý:** Đây là **hành vi nâng cao** của `user`, **không phải** vai trò riêng — không mở quyền mới.
- **Mục tiêu:** Giảm thời gian lên kế hoạch; tái sử dụng công thức.
- **Nhu cầu:** Meal planner, shopping list gộp nguyên liệu, lịch sử nấu, ghi chú.

### P4 — Biên tập viên nội dung ("Editor")
- **Đặc điểm:** Người tạo/chuẩn hóa công thức.
- **Mục tiêu:** Nhập công thức đúng chuẩn, đủ trường bắt buộc, có nguồn.
- **Nhu cầu:** CMS thuận tiện, kiểm tra hợp lệ trước xuất bản, quản lý taxonomy.
- **Ràng buộc (BR-01/02/03):** Không xuất bản thiếu dữ liệu bắt buộc; không tạo công thức giả; có nguồn.

### P5 — Quản trị viên ("Admin")
- **Đặc điểm:** Chịu trách nhiệm vận hành & chất lượng.
- **Mục tiêu:** Quản lý người dùng, taxonomy, cấu hình, giám sát.
- **Nhu cầu:** Công cụ quản trị, log, sao lưu/phục hồi, kiểm soát xuất bản.
- **Ràng buộc:** Tuân thủ privacy/security (PC-09, NFR-SEC).

## 4. Nhu cầu truy cập & trợ năng

- Người dùng có thể dùng **bàn phím** và **trình đọc màn hình** (PC-07).
- Chế độ nấu hỗ trợ **chữ lớn** cho người dùng phổ thông (không phải tính năng y tế).
- Hỗ trợ tiếng Việt có dấu/không dấu khi tìm kiếm.

## 5. Điểm chưa xác định (cần xác nhận)
- Quy trình phê duyệt taxonomy của `editor` (B-P01-01 trong [BLOCKERS.md](../../BLOCKERS.md)).
- Có cần vai trò `moderator` (kiểm duyệt bình luận/đánh giá) không? Hiện **chưa** đưa vào.
