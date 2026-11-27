# P05 — ACCESSIBILITY REPORT

> Báo cáo trợ năng của Phần A + Phần B. Mục tiêu tham chiếu: **WCAG 2.2 AA** (D9/P03), nhưng
> **P05 KHÔNG tuyên bố đạt WCAG 2.2 AA** vì chưa đo trên UI thật (xem §6).
> Cập nhật: 2026-11-28.

---

## 1. Nền tảng chung

| Hạng mục | Hiện thực | File |
| --- | --- | --- |
| Focus visible | `:focus-visible` toàn cục (outline 2px `--color-line-focus`, offset 2px) + utility `focus-ring` cho control | [styles/globals.css](../../styles/globals.css) |
| Skip link | "Bỏ qua tới nội dung chính" → `#main-content` (`z-skip-link`) | [app/layout.tsx](../../app/layout.tsx) |
| Reduced motion | Tắt animation/transition khi `prefers-reduced-motion: reduce` | globals.css |
| Semantic HTML | `header/main/footer/nav/aside/article/section/ol/ul/dl/fieldset/legend/table` | toàn bộ layout & component |
| Ngôn ngữ | `<html lang="vi">` | app/layout.tsx |
| Touch target | `--touch-target-min: 44px`; nút chính `h-11`; IconButton `size-11` (=44px) | globals.css, button/icon-button |

---

## 2. Không truyền đạt chỉ bằng màu (1.4.1)

- **FormError:** icon `AlertCircle` + chữ + `role="alert"` (không chỉ viền đỏ).
- **DifficultyBadge:** luôn kèm nhãn chữ "Độ khó: Dễ/Trung bình/Khó".
- **Chip `selected`:** thêm ring `ring-2 ring-primary-ring` **và** `font-bold` (không chỉ đổi màu).
- **CookingStepCard `done`:** dấu ✓ + nhãn "Đã xong" + gạch ngang, không chỉ đổi nền.
- **Trạng thái lỗi control:** `aria-invalid` + FormError (chữ + icon).
- **Link inline:** gạch chân `underline` (không chỉ màu).

---

## 3. Form accessibility (1.3.1, 3.3.1, 3.3.2, 1.3.5)

- **FormField** tự nối: `FormLabel htmlFor=controlId`, `aria-describedby = [user, errorId (khi lỗi), hintId]`, `aria-invalid`, `aria-required`.
- Control (Input/Textarea/Select/Checkbox/Radio/Switch) đọc ngữ cảnh FormField và **kế thừa** id/aria/disabled khi không truyền tường minh.
- `required` hiển thị `*` (aria-hidden) + sr-only "(bắt buộc)".
- `FormError` có `role="alert"` → screen reader đọc khi lỗi xuất hiện.
- `RadioGroup` dùng `<fieldset>`+`<legend>` (nhóm có tên); `Switch` dùng `role="switch"`+`aria-checked`, bắt buộc `aria-label` khi không có `label`.
- `SearchInput` bọc `role="search"`, input có `aria-label`, nút xoá có `aria-label`.
- `IngredientRow` khi `checkable`: `<label htmlFor>` bọc chính tên nguyên liệu → checkbox có accessible name.

---

## 4. Navigation & focus management

| Component | Bảo đảm a11y |
| --- | --- |
| **PrimaryNav** | `aria-label="Điều hướng chính"`; `aria-current="page"` cho mục đang mở |
| **Breadcrumb** | `aria-label="Đường dẫn"`; mục cuối `aria-current="page"` |
| **Tabs** | `role=tablist/tab/tabpanel`; ← → Home End; roving `tabIndex` (tab chọn `0`, còn lại `-1`); `aria-selected`/`aria-controls`/`aria-labelledby` |
| **Pagination** | `aria-label="Phân trang"`; `aria-current="page"`; nút trước/sau `aria-label` + `aria-disabled` + `tabIndex=-1` khi vô hiệu |
| **Dropdown** | `role=menu/menuitem`; ↑ ↓ Home End Esc Tab; click-ngoài đóng; trả focus về trigger; trigger có `aria-haspopup`/`aria-expanded`/`aria-controls` |
| **Modal** | `role="dialog" aria-modal="true"`; `aria-labelledby` (title) + `aria-describedby` (description); focus trap; Esc đóng; khoá cuộn; trả focus |
| **ConfirmDialog** | Kế thừa Modal; nút xác nhận/huỷ rõ nhãn |
| **MobileMenu** | `role="dialog" aria-modal`; focus trap; Esc; khoá cuộn; focus đầu tiên khi mở; trả focus khi đóng |
| **Tooltip** | `role="tooltip"`; `aria-describedby` chỉ gắn khi mở; Esc đóng; không chứa hành động tương tác |
| **Toast** | Vùng `aria-live="polite"`; `role="status"` (info/success/warning) / `role="alert"` (error); nút đóng có `aria-label` |
| **Spinner/LoadingState** | `role="status"` + `aria-live="polite"` + nhãn sr-only |

Tránh trùng `role="status"`: `LoadingState` bọc `Spinner` trong `<span aria-hidden="true">` để chỉ còn **một** vùng status.

---

## 5. Screen reader labels & trạng thái

- Mọi nút chỉ có icon dùng `IconButton` **bắt buộc** `aria-label` (qua type, không thể bỏ qua).
- Icon trang trí `aria-hidden="true"`; illustration không có alt → `aria-hidden`.
- Trạng thái động có `aria-busy` (Button/IconButton khi `loading`), `aria-pressed` (Chip, nút yêu thích RecipeCard, nút hoàn thành bước), `aria-current` (nav/breadcrumb/pagination), `aria-expanded` (menu/dropdown).
- `EmptyState`/`ErrorState` nêu rõ nguyên nhân + cách tiếp tục (không chỉ báo trạng thái).

---

## 6. Phần CHƯA kiểm (ghi trung thực — không tuyên bố đạt AA)

| Hạng mục | Trạng thái |
| --- | --- |
| **axe-core / Lighthouse** | ❌ Chưa chạy |
| **Screen reader thật** (NVDA/VoiceOver/TalkBack) | ❌ Chưa test |
| **Zoom 200% / 320px reflow** | ❌ Chưa đo (đã có `max-width:100%` và mobile-first, nhưng chưa xác minh runtime) |
| **Contrast trên UI thật** (alpha/overlay, badge trên nền ảnh) | ❌ Chưa đo — P03 mới đo ở mức token ([COLOR_ACCESSIBILITY_AUDIT.md](../P03/COLOR_ACCESSIBILITY_AUDIT.md)) |
| **Touch target thực tế** trên thiết bị | ❌ Chưa đo |
| **Focus not obscured** với header sticky | ❌ Chưa kiểm |
| **Keyboard-only end-to-end** trên trình duyệt | ⚠️ Đã có test đơn vị mô phỏng (Tab/Arrow/Esc) nhưng chưa kiểm trong trình duyệt thật |

Kết luận: P05 **đã hiện thực** các yêu cầu a11y ở mức code + đặc tả, **nhưng chưa nghiệm thu** trên UI thật. Không đưa ra tuyên bố "đạt WCAG 2.2 AA". Việc nghiệm thu thuộc **B-P03-01**.

---

## 7. Hướng khắc phục/kiểm tiếp

1. Chạy `@axe-core/playwright` trên các route chính + `/dev/components` khi môi trường có trình duyệt.
2. Kiểm keyboard-only end-to-end: skip link → header → nav → nội dung → footer.
3. Đo contrast runtime cho badge/chip trên nền ảnh và overlay.
4. Kiểm zoom 200% và viewport 320px.
5. Đo touch target thực tế cho các control nhỏ (nút xoá chip, nút đóng toast).
