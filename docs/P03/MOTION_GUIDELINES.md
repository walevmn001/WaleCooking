# P03 — MOTION GUIDELINES: WALE COOKING

> Chuyển động **nhẹ, ấm áp**, không gây khó chịu (PC-08). Token: `motion.*` trong [tokens/design-tokens.json](./tokens/design-tokens.json).
> **Bắt buộc** hỗ trợ `prefers-reduced-motion`. Chức năng **không** phụ thuộc animation.

## 1. Nguyên tắc

1. Animation phục vụ **định hướng** và **phản hồi**, không trang trí quá mức.
2. Ưu tiên **GPU-friendly**: chỉ animate `transform` và `opacity` (tránh animate `width/height/top/left` gây reflow).
3. Thời lượng ngắn (80–280ms); không để người dùng chờ.
4. **Không** animation lặp vô hạn gây phân tâm (trừ skeleton shimmer nhẹ, được tắt khi reduced-motion).
5. Cảm giác "lật trang sách" nhẹ nhàng — đúng định hướng P00 ("chuyển cảnh mềm, card nổi nhẹ").

## 2. Duration & easing

| Token | Giá trị | Dùng cho |
| --- | --- | --- |
| `duration.instant` | 80ms | Đổi màu nhỏ, ripple |
| `duration.fast` | 120ms | Hover, trạng thái nút |
| `duration.base` | 180ms | Dropdown, tooltip, tab, card hover |
| `duration.slow` | 280ms | Modal, drawer, chuyển cảnh |
| `duration.slower` | 420ms | Skeleton shimmer, minh họa |

| Easing | Giá trị | Dùng cho |
| --- | --- | --- |
| `standard` | `cubic-bezier(0.2, 0, 0, 1)` | Mặc định |
| `emphasized` | `cubic-bezier(0.2, 0, 0, 1.2)` | Xuất hiện (enter) |
| `exit` | `cubic-bezier(0.4, 0, 1, 1)` | Biến mất (exit) |

## 3. Đặc tả theo ngữ cảnh

| Ngữ cảnh | Thuộc tính | Thời lượng / easing | Ghi chú |
| --- | --- | --- | --- |
| **Hover transition (chung)** | `background-color`, `opacity` | `fast` / standard | Không đổi kích thước |
| **Button** | `background-color`, `box-shadow`; pressed dịch `translateY(1px)` | `fast` / standard | Không nhảy layout |
| **Card hover** | `transform: translateY(-2px)`, `box-shadow` (md→lg) | `base` / standard | "Nổi nhẹ" |
| **Card ảnh hover** | `transform: scale(1.03)` (ảnh) | `slow` / standard | Trong khung `overflow:hidden` |
| **Modal enter** | `opacity 0→1`, `scale .96→1` | `slow` / emphasized | Overlay fade `slow` |
| **Modal exit** | `opacity 1→0`, `scale 1→.98` | `base` / exit | |
| **Dropdown enter** | `opacity 0→1`, `translateY(-4px)→0` | `base` / emphasized | |
| **Drawer (mobile nav)** | `translateX` vào/ra | `slow` / standard | Kèm overlay fade |
| **Tab switch** | `opacity` + gạch dưới trượt `transform` | `base` / standard | |
| **Toast enter/exit** | `opacity` + `translateY` | `base` / standard | Exit dùng `exit` easing |
| **Loading shimmer** | `background-position`/`opacity` nhẹ lặp chậm | `slower` / linear | Tắt khi reduced-motion |
| **Feedback thành công** | dấu tick icon scale nhẹ + màu `status.success` | `base` | Không pháo giấy rối |
| **Feedback thất bại** | rung nhẹ (`translateX ±2px`) ≤ 2 lần, hoặc chỉ đổi màu | `fast` | Tránh gây khó chịu |

## 4. Accessibility & prefers-reduced-motion

```css
/* Mẫu — sẽ áp dụng ở phase triển khai */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

- Khi reduced-motion: chuyển trạng thái **tức thời**; skeleton **tĩnh**; không parallax/auto-play.
- Không dùng animation như phương tiện truyền tải thông tin **duy nhất**.
- Cho phép người dùng tắt chuyển động ở cấp hệ điều hành (đã tôn trọng qua media query).

## 5. Hiệu năng

- Chỉ animate `transform`/`opacity`; thêm `will-change` **hạn chế** và gỡ sau animation.
- Tránh animation đồng thời nhiều phần tử lớn (giữ INP < 200ms — NFR-PERF).
- Kiểm tra không gây CLS (skeleton giữ đúng kích thước).

## 6. Truy vết
- PC-08, NFR-PERF, NFR-A11Y; token `motion.*`.
