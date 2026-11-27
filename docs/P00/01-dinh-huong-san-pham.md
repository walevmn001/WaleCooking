# P00 — Định hướng sản phẩm & Phạm vi tổng thể

## 1. Nhận diện sản phẩm

| Trường | Giá trị |
| --- | --- |
| Tên sản phẩm | **CUTE COOKBOOK** |
| Loại sản phẩm | Website hướng dẫn nấu ăn |
| Ngôn ngữ mặc định | **Tiếng Việt** |
| Sẵn sàng i18n | Có — kiến trúc phải mở rộng được sang **tiếng Anh** |
| Đối tượng | Người mới học nấu ăn **và** người đã có kinh nghiệm |

## 2. Mục tiêu sản phẩm

Xây dựng một website nấu ăn toàn diện, giúp người dùng:

1. **Khám phá món ăn** từ nhiều quốc gia.
2. **Tìm kiếm món ăn** theo tên, nguyên liệu và cách chế biến.
3. **Xem công thức** với định lượng cụ thể.
4. **Theo dõi từng bước** nấu ăn.
5. **Lưu công thức yêu thích.**
6. **Lập kế hoạch bữa ăn.**
7. **Tạo danh sách mua sắm** nguyên liệu.
8. **Tra cứu kiến thức** nấu ăn.
9. **Quản lý bộ sưu tập** công thức cá nhân.

## 3. Phạm vi chức năng tổng thể

> ⚠️ **Lưu ý quan trọng:** Prompt P00 bị cắt ngắn tại mục "4. Phân loại…". Do đó danh sách dưới đây gồm:
> - **Phần đã cung cấp** trong prompt (mục 1–3 + tên mục 4).
> - **Phần đề xuất bổ sung** (đánh dấu `[ĐỀ XUẤT]`) được suy ra trực tiếp từ mục tiêu sản phẩm — **chờ xác nhận**, không phải quyết định đã chốt.

### 3.1. Nhóm chức năng đã cung cấp

| # | Nhóm chức năng | Ghi chú |
| --- | --- | --- |
| 1 | Trang chủ | Điểm vào, giới thiệu, gợi ý món |
| 2 | Thư viện công thức | Danh sách toàn bộ công thức |
| 3 | Danh mục món ăn | Phân theo món/loại |
| 4 | Phân loại | *(prompt bị cắt — tiêu đề có, nội dung chưa đầy đủ)* |

### 3.2. Nhóm chức năng đề xuất bổ sung `[ĐỀ XUẤT]`

| # | Nhóm chức năng | Liên kết tới mục tiêu |
| --- | --- | --- |
| 5 | Chi tiết công thức | Mục tiêu 3, 4 — nguyên liệu, định lượng, các bước |
| 6 | Tìm kiếm & lọc nâng cao | Mục tiêu 2 — theo tên / nguyên liệu / cách chế biến |
| 7 | Bộ sưu tập & Yêu thích | Mục tiêu 5, 9 |
| 8 | Kế hoạch bữa ăn (Meal plan) | Mục tiêu 6 |
| 9 | Danh sách mua sắm (Shopping list) | Mục tiêu 7 |
| 10 | Kiến thức / Cẩm nang nấu ăn | Mục tiêu 8 |
| 11 | Tài khoản & Xác thực người dùng | Nền tảng cho 5, 6, 7, 8, 9 |
| 12 | Khu vực quản trị (Admin/CMS) | Nhập & quản lý công thức, nguyên liệu, danh mục |
| 13 | Đa ngôn ngữ (VI mặc định, EN mở rộng) | Yêu cầu i18n |
| 14 | Trang đơn vị đo lường & quy đổi | Hỗ trợ định lượng (mục tiêu 3) |

> Việc chốt đúng danh sách, thứ tự ưu tiên và roadmap theo phase cần **phần còn lại của prompt P00**.

## 4. Định hướng thiết kế đã chốt (không thay đổi)

Chi tiết tại [02-dinh-huong-giao-dien.md](./02-dinh-huong-giao-dien.md):
- Phong cách: **Cute Cookbook — Pastel Mint**
- Bảng màu, typography, quy chuẩn component, mascot, trải nghiệm đã được xác lập.

## 5. Định hướng công nghệ

Chi tiết tại [03-de-xuat-cong-nghe.md](./03-de-xuat-cong-nghe.md).

## 6. Phạm vi của P00

P00 **chỉ** thực hiện: khảo sát, xác lập yêu cầu, ghi tài liệu định hướng, đề xuất công nghệ và tạo checkpoint nền tảng.

**Không** thực hiện trong P00:
- Không cài đặt dependency / khởi tạo framework.
- Không lập trình giao diện hoàn chỉnh.
- Không triển khai (deploy) hay cấu hình tài khoản dịch vụ.
- Không triển khai trước phạm vi của phase tiếp theo.
