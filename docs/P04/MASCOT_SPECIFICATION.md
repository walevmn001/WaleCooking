# P04 — MASCOT SPECIFICATION: WALE COOKING

> Đặc tả **nhân vật đầu bếp WALE COOKING** — một nhân vật **duy nhất**, nhiều biểu cảm/tư thế.
> Nguồn sinh: [scripts/p04_generate_assets.py](../../scripts/p04_generate_assets.py) · Lưu tại: `public/assets/mascot/`.

## 1. Danh tính nhân vật

| Thuộc tính | Quy định |
| --- | --- |
| Loại | Đầu bếp 2D, phong cách chibi (đầu lớn, thân nhỏ) |
| Cảm giác | Dễ thương, ấm áp, thân thiện, hiện đại — **không** quá trẻ con |
| Nét vẽ | Đồng nhất `#594B40`, bo tròn (`round`) |
| Tạp dề | **Pastel Mint** `#C9E8D5`, có túi **Mint Dark** `#789B83` |
| Mũ đầu bếp | **Cream** `#FFF9F0` (3 búp tròn + vành) |
| Da | **Beige** `#E8DCC6` |
| Má | **Soft Pink** `#F8DDE3` |
| Trắng mắt | `#FFFFFF` |

> Nhân vật **không** đeo/không mang yếu tố nhận diện của thương hiệu khác. Tên nhân vật: **Wale** (gợi từ WALE COOKING).

## 2. Tỷ lệ & cấu trúc (khung 220×260)

| Bộ phận | Hình học cố định | Ghi chú |
| --- | --- | --- |
| Đầu | `circle cx=110 cy=126 r=46` | **Bất biến** giữa mọi biến thể |
| Tai | `circle (60,128) r=9` và `(160,128) r=9` | Hai bên đầu |
| Tóc mái | Dải nâu dưới vành mũ | Tạo điểm nhấn |
| Mũ | 3 ellipse (76,66 / 110,52 / 144,66) + vành `rect x=72 y=76 w=76 h=18 rx=8` | Cream |
| Cổ | `rect x=96 y=158 w=28 h=16` | Beige |
| Thân | Khối áo cream + tạp dề mint bo tròn | Đáy y≈236 |
| Tay | Cánh tay (nét 3px) + bàn tay `circle r=9` | Đổi theo tư thế |
| Túi tạp dề | `rect x=98 y=206 w=24 h=18 rx=4` | Mint Dark |

**Quy tắc bất biến:** mọi biến thể **giữ nguyên** đầu (cx110 cy126 r46), tỷ lệ, trang phục, palette và kiểu nét. Validator tự động kiểm tra "đầu chuẩn" cho cả 8 file — nếu lệch → báo lỗi.

## 3. Bộ biến thể (8)

| File | Biểu cảm | Tư thế | Phụ kiện | Dùng cho |
| --- | --- | --- | --- | --- |
| `mascot-default.svg` | Trung tính, mắt tròn | Đứng, tay xuôi | — | Trạng thái mặc định, khối giới thiệu |
| `mascot-happy.svg` | Mắt cong vui, miệng cười mở | Tay mở | — | Lời chào, lời cảm ơn, mục "về chúng tôi" |
| `mascot-cooking.svg` | Tập trung, chân mày | Một tay cầm chảo | Chảo | Chế độ nấu, bước hướng dẫn |
| `mascot-holding-recipe.svg` | Vui vẻ | Hai tay giữ thẻ công thức | Thẻ công thức | Danh mục công thức, "công thức của bạn" |
| `mascot-thinking.svg` | Mắt nhìn lên, tay chống cằm | Tay chống cằm | Dấu "?" | Gợi ý, mẹo nấu, trạng thái chờ nhập |
| `mascot-success.svg` | Mắt hình sao | Hai tay giơ lên | Tia sáng | Lưu thành công, hoàn tất, chúc mừng |
| `mascot-error.svg` | Mắt lo, miệng mếu, chân mày | Tay xuôi | — | Lỗi, không tìm thấy, thất bại |
| `mascot-waving.svg` | Vui vẻ | Một tay vẫy | — | Chào mừng, người dùng mới |

> **Không** tạo nhân vật thứ hai. Mọi biến thể là **cùng một** Wale thay đổi biểu cảm/tư thế.

## 4. Quy chuẩn sử dụng mascot

- **Vị trí dùng:** trang chủ (hero), empty/error/success state, trợ giúp/AI, onboarding, 404.
- **Kích thước hiển thị gợi ý:** 96–220px (mobile → desktop); không phóng to quá 220px làm mất độ nét.
- **Không gian trống tối thiểu:** ≥ 0.25 × chiều rộng asset quanh nhân vật.
- **Nền sử dụng:** cream/white/pastel. Trên nền màu đậm (`primary`/`brown`) phải đặt mascot trong **badge nền sáng** để nét nâu vẫn đủ tương phản.
- **Không:** kéo méo (giữ đúng tỉ lệ 220:260), đổi màu tạp dề/mũ, xoay nghiêng tùy tiện, chồng chữ lên mặt nhân vật, ghép bộ phận từ biến thể khác.

## 5. Accessibility

- `<svg>` có `role="img"` và `aria-label="Mascot WALE COOKING"`.
- Khi mascot **thuần trang trí** (đã có chữ mô tả bên cạnh) → đặt `aria-hidden="true"` thay cho `role/aria-label`.
- Mascot không truyền thông tin chỉ bằng hình; mọi trạng thái kèm text (tuân thủ PC-07 / [ACCESSIBILITY_GUIDELINES.md](../P03/ACCESSIBILITY_GUIDELINES.md)).

## 6. Truy vết
PC-06 (design consistency), PC-07 (a11y); [DESIGN_SYSTEM.md](../P03/DESIGN_SYSTEM.md); [02-dinh-huong-giao-dien.md](../P00/02-dinh-huong-giao-dien.md) (§5 Mascot).
