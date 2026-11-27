# P04 — ILLUSTRATION GUIDELINES: WALE COOKING

> Quy chuẩn **minh họa trạng thái giao diện** (empty / loading / error / success / 404 / welcome).
> Lưu tại `public/assets/illustrations/`. Nguồn sinh: [scripts/p04_generate_assets.py](../../scripts/p04_generate_assets.py).

## 1. Quy cách chung

| Thuộc tính | Giá trị |
| --- | --- |
| Khung (viewBox) | `0 0 320 220` |
| Thành phần | Nền blob pastel + vật thể biểu tượng + mascot Wale (đồng bộ [MASCOT_SPECIFICATION.md](./MASCOT_SPECIFICATION.md)) |
| Màu | Palette brand + trắng + `primary` (nền blob: mint / pink / beige luân phiên) |
| Nét | `#594B40`, bo tròn — đồng nhất với mascot/icon |
| Kích thước hiển thị | 160–320px; không vượt 320px để không lấn nội dung |
| Thuộc tính | `role="img"` + `aria-label` mô tả trạng thái |

**Nguyên tắc trình bày:** minh họa là **phụ trợ** — vừa đủ, không chiếm quá nửa màn hình, **luôn kèm tiêu đề + mô tả + hành động** ở cấp component (tuân thủ empty/error state trong [COMPONENT_SPECIFICATIONS.md](../P03/COMPONENT_SPECIFICATIONS.md)).

## 2. Danh mục 9 minh họa

| File | Trạng thái | Nền blob | Nhân vật | Vật thể | Dùng ở |
| --- | --- | --- | --- | --- | --- |
| `empty-recipes.svg` | Danh sách công thức trống | Beige | default | Bát + dấu + | Trang công thức khi chưa có dữ liệu |
| `no-results.svg` | Không có kết quả tìm | Pink | thinking | Kính lúp rỗng | Kết quả tìm/lọc rỗng |
| `empty-favorites.svg` | Yêu thích trống | Mint | default | Trái tim rỗng | Trang yêu thích |
| `empty-shopping-list.svg` | Danh sách đi chợ trống | Beige | holding-recipe | Tờ giấy + dòng | Danh sách mua sắm |
| `loading.svg` | Đang tải | Mint | happy | Vòng xoay | Skeleton/trạng thái chờ |
| `error.svg` | Lỗi | Pink | error | Dấu "!" trong vòng | Lỗi tải/lỗi hệ thống |
| `404.svg` | Không tìm thấy trang | Beige | thinking | Chữ "404" | Trang 404 |
| `success.svg` | Thành công | Mint | success | Dấu ✓ trong vòng | Lưu/xuất/gửi thành công |
| `welcome.svg` | Chào mừng | Pink | waving | Sparkle + sóng chào | Onboarding, người dùng mới |

## 3. Quy tắc dùng / không dùng

**Được:** dùng đúng trạng thái tương ứng; giữ tỉ lệ; đặt căn giữa trong khối state.
**Không được:**
- Dùng minh họa sai ngữ cảnh (vd `success` cho lỗi).
- Phóng quá lớn hoặc đặt sau nội dung làm rối mắt.
- Thay đổi nền blob/nhân vật tùy tiện (phá hệ thống).
- Dùng minh họa thay cho thông báo lỗi cần đọc (phải có text).

## 4. Accessibility

- `role="img"` + `aria-label` mô tả ngắn (vd `"Minh họa: chưa có công thức"`).
- Nếu minh họa **thuần trang trí** (text đã mô tả đủ) → `aria-hidden="true"`.
- Trạng thái loading: vùng chứa có `aria-busy="true"`, và tôn trọng `prefers-reduced-motion` (đứng yên khi giảm chuyển động).

## 5. Truy vết
PC-04 (user-friendly), PC-06, PC-07; [MOTION_GUIDELINES.md](../P03/MOTION_GUIDELINES.md); [COMPONENT_SPECIFICATIONS.md](../P03/COMPONENT_SPECIFICATIONS.md).
