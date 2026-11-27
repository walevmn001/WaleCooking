# P05 — RESPONSIVE IMPLEMENTATION

> Cách P05 hiện thực responsive theo Design System **P03** ([RESPONSIVE_GUIDELINES.md](../P03/RESPONSIVE_GUIDELINES.md)).
> Cập nhật: 2026-11-28.

---

## 1. Breakpoint & grid (đúng P03 / D27)

Định nghĩa trong [styles/globals.css](../../styles/globals.css) `@theme`:

| Tên | Giá trị | Utility Tailwind |
| --- | --- | --- |
| `sm` | 640px | `sm:` |
| `md` | 768px | `md:` |
| `lg` | 1024px | `lg:` |
| `xl` | 1280px | `xl:` |
| `2xl` | 1536px | `2xl:` |

Chiến lược **mobile-first**: style gốc cho màn nhỏ, dùng tiền tố `sm:`/`md:`/`lg:` để mở rộng.

Điểm ngắt type-scale: `@media (min-width: 1024px)` tăng `--text-display/h1..h4` (đúng P03 — display/h tăng ở desktop).

---

## 2. Container & padding

[components/layout/container.tsx](../../components/layout/container.tsx):

- Bề rộng: `narrow 720px` / `default 1024px` / `wide 1200px` / `full 100%`.
- Padding ngang: `px-4` (16px) → `sm:px-6` (24px) → `lg:px-8` (32px) — khớp P03.
- `.container-page` (trong globals) dùng cùng ngưỡng padding cho nội dung dạng prose.

---

## 3. Header/Footer responsive

**Header** ([site-header.tsx](../../components/layout/site-header.tsx)):

| Kích thước | Hành vi |
| --- | --- |
| **Mobile** (< 640px) | Logo + nút mở menu; ẩn ô search, yêu thích, tài khoản; nav desktop ẩn |
| **Tablet** (≥ 640px, < 1024px) | Hiện yêu thích + tài khoản (`sm:`); hiện ô search ở `md:`; nav chính vẫn ẩn → dùng menu |
| **Desktop** (≥ 1024px) | Nav đầy đủ (`hidden lg:block`); ô search `w-56 xl:w-64`; ẩn nút menu (`lg:hidden`) |

Header cao cố định 4rem (`h-16`), `sticky top-0` → không che nội dung, không chiếm quá nhiều diện tích trên điện thoại.

**MobileMenu**: drawer `w-[86%] max-w-xs`, chỉ tồn tại dưới `lg`.

**Footer** ([site-footer.tsx](../../components/layout/site-footer.tsx)): grid `md:grid-cols-4` (logo/mô tả + 3 nhóm liên kết); dòng cuối `flex-col → sm:flex-row`.

---

## 4. Responsive của component chính

| Component | Hành vi responsive |
| --- | --- |
| **RecipeImage** | Tỉ lệ cố định (`aspect-[4/3]`/`aspect-square`/`aspect-video`) → không nhảy layout |
| **RecipeCard** | Lưới do nơi gọi quyết định; thẻ giãn theo container; ảnh 4:3 |
| **RecipeCardCompact** | Ảnh 1:1 `w-20` cố định + nội dung `min-w-0 flex-1` |
| **Modal** | Mobile: neo đáy (`items-end`, `rounded-t-xl`, `max-h-[90dvh]`); ≥ sm: giữa (`sm:items-center`, `sm:rounded-xl`) |
| **Card padding** | `p-4` → `sm:p-5` |
| **EmptyState/ErrorState** | Illustration `size-32 sm:size-40` / `size-28 sm:size-36` |
| **Tabs** | Thanh tab `overflow-x-auto` (không tràn ngang) |
| **Dropdown** | `min-w-44`, canh `start`/`end`; nằm trong `relative` container |

---

## 5. Chống tràn ngang & nội dung dài

- `@layer base`: `img, svg, video, canvas { max-width: 100%; height: auto; }` (hỗ trợ 2.4.10 Reflow).
- Tiêu đề: `text-wrap: balance`; đoạn văn: `text-wrap: pretty`.
- RecipeCard/RecipeCardCompact: `line-clamp-2` cho mô tả/tiêu đề; `min-w-0` cho cột nội dung.
- `body { min-height: 100dvh }`; layout public = `flex min-h-dvh flex-col` với `<main class="flex-1">`.

---

## 6. Reduced motion (bắt buộc theo P03/D28)

[styles/globals.css](../../styles/globals.css):

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

Áp dụng cho mọi animation/transition của component (Spinner, Skeleton, fade/scale-in, hover của Card…).

---

## 7. Trạng thái kiểm chứng (trung thực)

| Hạng mục | Trạng thái |
| --- | --- |
| Ngưỡng breakpoint/type-scale trong CSS | ✅ Đã hiện thực & xác nhận trong source |
| Build production biên dịch đúng các lớp responsive | ✅ (`pnpm build` thành công) |
| Kiểm **trên trình duyệt thật** ở 320/375/768/1024/1440px | ❌ **Chưa thực hiện** — môi trường không có trình duyệt headless |
| Kiểm tràn ngang thực tế, touch target thực tế, zoom 200% | ❌ **Chưa thực hiện** |
| Kiểm `prefers-reduced-motion` trên thiết bị | ❌ **Chưa thực hiện** |

> Việc kiểm responsive thực tế chuyển sang bước kiểm trình duyệt (B-P03-01). Không tuyên bố đạt WCAG 2.2 AA khi chưa đo.
