# SMART KITCHEN UI — Khu vực Công cụ nhà bếp (P10.4)

> WALE COOKING · Phase P10 · Ngày: 2026-11-28.
> Component: [`components/kitchen/`](../../components/kitchen/) · Trang: [`app/(public)/cong-cu/`](../../app/(public)/cong-cu/) · Điều hướng: [`lib/constants/navigation.ts`](../../lib/constants/navigation.ts).

## 1. Kiến trúc tách lớp

```
lib/kitchen/            (miền thuần, không React)     → timers.ts · units.ts · ingredient-match.ts · alerts.ts
components/kitchen/     (UI, "use client" khi cần)     → 8 component tái sử dụng
app/(public)/cong-cu/   (trang, Server Component vỏ)   → hub + 3 trang công cụ
```

Miền thuần **không** phụ thuộc React/browser (trừ tầng truy cập `localStorage`/Audio/Notification
được tách riêng và an toàn SSR). UI chỉ gọi hàm miền → dễ kiểm thử, không trộn logic vào giao diện.

## 2. Component tái sử dụng

| Component | Vai trò |
| --- | --- |
| `MultiTimer` | Bộ điều phối nhiều đồng hồ: state, interval, khôi phục `localStorage`, phát cảnh báo |
| `TimerCard` | Một đồng hồ: hiển thị thời gian/trạng thái/tiến độ, nút bắt đầu–tạm dừng–đặt lại–xoá–đổi tên |
| `TimerForm` | Form tạo đồng hồ (tên + phút + giây), validate 1 giây–24 giờ |
| `UnitConverter` | Quy đổi đơn vị (chọn nhóm, nhập giá trị, đổi chiều, kết quả + nguồn hệ số) |
| `IngredientSearch` | Nhập nguyên liệu → gọi API → lưới kết quả |
| `IngredientChip` | Nhãn nguyên liệu + nút xoá |
| `RecipeMatchCard` | Thẻ công thức gợi ý: tỷ lệ khớp, nguyên liệu đã có, còn thiếu |
| `MissingIngredients` | Liệt kê nguyên liệu thiếu, tách nhóm bắt buộc |

Barrel export: [`components/kitchen/index.ts`](../../components/kitchen/index.ts). Không tạo component
trùng chức năng với P05 — các thẻ/nút/nhãn đều tái dùng `Card`, `Badge`, `Chip`, `Button`, `IconButton`,
`Input`, `Select`, `EmptyState`, `ErrorState`, `Spinner`, `RecipeImage`, `CookingTime`/`ServingsBadge`/`DifficultyBadge`.

## 3. Điều hướng

- Trang hub **`/cong-cu`** — 4 lối vào rõ ràng: Chế độ nấu (dẫn tới danh sách công thức), Đồng hồ đếm ngược,
  Quy đổi đơn vị, Tìm món theo nguyên liệu.
- Trang công cụ: `/cong-cu/do-ng-ho`, `/cong-cu/quy-doi-don-vi`, `/cong-cu/tim-theo-nguyen-lieu`.
- `primaryNav` thêm mục **"Công cụ"**; `footerNavGroups` thêm **"Công cụ nhà bếp"** (nhóm "Khám phá").
- Không làm trang chủ quá tải: công cụ nằm ở khu vực riêng, chỉ lối vào ngắn gọn.

## 4. Trạng thái & khả năng truy cập

- **Empty/loading/error**: `IngredientSearch` có đủ 4 trạng thái; `MultiTimer` có empty state.
- **Không chỉ dùng màu**: mọi trạng thái (đồng hồ, mức khớp) đều kèm chữ; `MissingIngredients` nêu rõ
  số lượng và nhãn "bắt buộc".
- **ARIA**: `progressbar` có `aria-valuenow/min/max`; vùng cảnh báo `aria-live="assertive"`; kết quả quy
  đổi `aria-live="polite"`; nhãn nút rõ ("Bắt đầu", "Tạm dừng", "Xoá đồng hồ …", "Đổi chiều quy đổi").
- **Touch target lớn** (`Button size="lg"`, `IconButton size="lg"`), bố cục mobile-first.
- **Responsive**: lưới `sm:grid-cols-2` / `lg:grid-cols-3`; form dùng `sm:flex-row`.

## 5. Hiệu năng & giữ nguyên server-rendering

- Trang `/cong-cu*` là **Server Component** (tĩnh/SSG); chỉ phần tương tác là client component.
- Không fetching/polling thừa; đồng hồ chỉ chạy interval khi đã có đồng hồ và đã hydrate.
- Không thêm thư viện nặng: dùng **Web API nền tảng** (Web Audio, Notification, `localStorage`, `crypto.randomUUID`).

## 6. Tương thích

- Không phá vỡ công thức cũ, trang danh mục P08, trang quản trị, cookie yêu thích P07.1.
- Không đổi URL cũ; chỉ **thêm** route `/cong-cu*` + API `/api/v1/kitchen/ingredient-match`.
- Trường DTO/thành phần UI **thêm mới**, không đổi ngữ nghĩa cũ.

## 7. Chưa xác minh

Không có trình duyệt/thiết bị thật → chưa chạy axe/Lighthouse, chưa kiểm touch khi đứng bếp, chưa kiểm
responsive thực tế (kế thừa B-P07-04/B-P08-02/B-P09-02).
