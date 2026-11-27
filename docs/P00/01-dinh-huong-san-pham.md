# P00 — Định hướng sản phẩm & Phạm vi tổng thể

> Cập nhật tại **P00-FIX**: đồng bộ thương hiệu sang **WALE COOKING** và bổ sung đầy đủ phạm vi chức năng.

## 1. Nhận diện sản phẩm

| Trường | Giá trị |
| --- | --- |
| Tên sản phẩm | **WALE COOKING** |
| Loại sản phẩm | Website hướng dẫn nấu ăn |
| Ngôn ngữ mặc định | **Tiếng Việt** |
| Sẵn sàng i18n | Có — kiến trúc phải mở rộng được sang **tiếng Anh** |
| Đối tượng | Người mới học nấu ăn **và** người đã có kinh nghiệm |

> Tên repository `WaleCooking` **được giữ nguyên** (không đổi tên repo).

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

Phạm vi đã được **bổ sung đầy đủ** tại P00-FIX (20 nhóm chức năng):

| # | Nhóm chức năng | Mô tả chính |
| --- | --- | --- |
| 1 | Trang chủ | Món nổi bật, món mới, món phổ biến, danh mục, món theo quốc gia, nguyên liệu và mùa |
| 2 | Thư viện công thức | Danh sách toàn bộ công thức, dạng thư viện/sách nấu ăn |
| 3 | Trang chi tiết công thức | Ảnh, giới thiệu, khẩu phần, thời gian, độ khó, nguyên liệu, định lượng, dụng cụ, từng bước chế biến, mẹo, bảo quản, dinh dưỡng, dị ứng và nguồn |
| 4 | Hệ thống phân loại | Phân loại theo loại món, quốc gia/vùng miền, nguyên liệu và phương pháp chế biến (xem mục 4) |
| 5 | Tìm kiếm | Theo tên món, tên tiếng Anh/tên gốc, nguyên liệu, quốc gia, phương pháp và mô tả |
| 6 | Tìm món từ nguyên liệu sẵn có | Nhập nguyên liệu đang có; hiển thị nguyên liệu còn thiếu và nguyên liệu thay thế |
| 7 | Bộ lọc | Theo thời gian, độ khó, ngân sách, khẩu phần, chế độ ăn, dị ứng, dụng cụ và độ cay |
| 8 | Điều chỉnh khẩu phần | Tự động tính lại định lượng nguyên liệu theo khẩu phần |
| 9 | Chế độ nấu từng bước | Chữ lớn, tiến độ, đánh dấu hoàn thành, đồng hồ đếm giờ, tạm dừng và tiếp tục |
| 10 | Thư viện kiến thức nấu ăn | Sơ chế, chọn nguyên liệu, kỹ thuật chế biến, nước dùng, gia vị, bảo quản và an toàn thực phẩm |
| 11 | Sổ tay cá nhân | Yêu thích, bộ sưu tập, lịch sử nấu và ghi chú |
| 12 | Meal Planner | Lập kế hoạch bữa ăn theo ngày/tuần và số khẩu phần |
| 13 | Shopping List | Tự tổng hợp nguyên liệu, gộp nguyên liệu trùng, chỉnh số lượng, đánh dấu đã mua |
| 14 | Dinh dưỡng & dị ứng | Thông tin dinh dưỡng và cảnh báo dị ứng; **không đưa ra tuyên bố chữa bệnh** |
| 15 | Trợ lý AI nấu ăn | Tư vấn kỹ thuật, gợi ý món và thay thế nguyên liệu; **không được tự bịa** định lượng, nhiệt độ hoặc hướng dẫn an toàn thực phẩm |
| 16 | Tài khoản | Đăng ký, đăng nhập, đăng xuất, hồ sơ và đồng bộ dữ liệu |
| 17 | CMS/Admin | Quản lý công thức, nguyên liệu, danh mục, quốc gia, hình ảnh, nguồn tham khảo, người dùng và trạng thái xuất bản |
| 18 | Bản quyền & nguồn nội dung | Quản lý bản quyền và nguồn nội dung |
| 19 | SEO, chia sẻ & đa ngôn ngữ | SEO, chia sẻ, in công thức và hỗ trợ đa ngôn ngữ |
| 20 | Vận hành & chất lượng | Bảo mật, sao lưu, phục hồi, giám sát và kiểm thử |

## 4. Chuẩn hóa hệ thống phân loại

Các khái niệm dưới đây là **trục phân loại độc lập**, **không gộp** thành một danh mục chung:

| Trục phân loại | Ý nghĩa |
| --- | --- |
| **Food type** | Loại món ăn |
| **Cuisine / Origin** | Quốc gia hoặc vùng miền xuất xứ |
| **Ingredient** | Nguyên liệu |
| **Cooking method** | Phương pháp chế biến |
| **Meal type** | Bữa sáng, trưa, tối, ăn nhẹ |
| **Dietary preference** | Chay, thuần chay và các chế độ ăn khác |
| **Allergen** | Thành phần có nguy cơ gây dị ứng |

**Yêu cầu kỹ thuật:** hệ thống phải **mở rộng được bằng dữ liệu**, **không hardcode** toàn bộ danh mục trong frontend. Các giá trị phân loại được quản lý trong database và qua CMS/Admin.

## 5. Định hướng thiết kế đã chốt (không thay đổi)

Chi tiết tại [02-dinh-huong-giao-dien.md](./02-dinh-huong-giao-dien.md):
- Phong cách: **WALE COOKING — Pastel Mint**
- Bảng màu, typography, quy chuẩn component, mascot, trải nghiệm đã được xác lập.

## 6. Định hướng công nghệ

Chi tiết tại [03-de-xuat-cong-nghe.md](./03-de-xuat-cong-nghe.md).

## 7. Phạm vi của P00 & P00-FIX

P00 **chỉ** thực hiện: khảo sát, xác lập yêu cầu, ghi tài liệu định hướng, đề xuất công nghệ và tạo checkpoint nền tảng.

P00-FIX **chỉ** thực hiện: đồng bộ thương hiệu sang WALE COOKING, bổ sung đầy đủ phạm vi chức năng và chuẩn hóa hệ thống phân loại; cập nhật tài liệu trạng thái và tạo checkpoint mới.

**Không** thực hiện trong P00/P00-FIX:
- Không cài đặt dependency / khởi tạo framework.
- Không lập trình giao diện, không tạo database, không triển khai backend.
- Không triển khai (deploy) hay cấu hình tài khoản dịch vụ.
- Không tự chuyển sang P01.
