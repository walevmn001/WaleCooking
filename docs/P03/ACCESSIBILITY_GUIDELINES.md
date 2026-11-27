# P03 — ACCESSIBILITY GUIDELINES: WALE COOKING

> Mục tiêu **WCAG 2.2 AA** cho luồng chính (PC-07 / NFR-A11Y). Tài liệu này là **quy tắc kiểm tra cụ thể theo component**, không chỉ lý thuyết.
> ⚠️ P03 đặc tả quy tắc; **chưa** kiểm thử bằng công cụ/thiết bị thật (sẽ làm ở phase triển khai).

## 1. Checklist WCAG 2.2 AA (phạm vi áp dụng)

| # | Tiêu chí | Mức | Quy tắc kiểm tra trong WALE COOKING |
| --- | --- | --- | --- |
| 1.4.3 | Contrast (chữ) | AA | Chữ thường ≥ 4.5:1; chữ lớn ≥ 3:1. Dùng token đã đo ([audit](./COLOR_ACCESSIBILITY_AUDIT.md)). |
| 1.4.11 | Non-text contrast | AA | Viền control/focus/icon chức năng ≥ 3:1 → dùng `border.strong`/`border.focus`. |
| 1.4.4 | Resize text | AA | Zoom 200% không mất nội dung/chức năng. |
| 1.4.10 | Reflow | AA | 320px không cuộn ngang. |
| 1.4.12 | Text spacing | AA | Tăng line-height/letter-spacing/word-spacing không làm vỡ layout. |
| 2.1.1 | Keyboard | A | Mọi chức năng dùng được bằng bàn phím. |
| 2.4.3 | Focus order | A | Thứ tự focus hợp lý, theo DOM. |
| 2.4.7 | Focus visible | AA | Focus hiển thị rõ (ring `border.focus`). |
| 2.4.11 | Focus not obscured | AA (2.2) | Focus không bị header sticky/overlay che. |
| 2.5.8 | Target size | AA (2.2) | Touch target ≥ 24×24 (tối thiểu) — WALE COOKING dùng **≥ 44×44** cho hành động chính. |
| 2.4.4 | Link purpose | A | Nhãn link mô tả đích. |
| 3.3.1 | Error identification | A | Lỗi nêu rõ và bằng chữ, không chỉ màu. |
| 3.3.2 | Labels/instructions | A | Mọi input có label. |
| 3.3.3 | Error suggestion | AA | Gợi ý sửa lỗi. |
| 4.1.2 | Name/Role/Value | A | Control có tên/role/trạng thái đúng. |
| 4.1.3 | Status messages | AA | Toast/lỗi dùng `aria-live`/`role="alert"`. |
| 2.3.3 / 2.2.2 | Animation / Pause | A/AA | Tôn trọng `prefers-reduced-motion`; không animation bắt buộc. |
| 1.1.1 | Text alternative | A | Ảnh có `alt` phù hợp. |
| 1.3.1 | Info & relationships | A | Semantic HTML, heading theo cấp. |

> Ghi chú: WCAG 2.2 thêm các tiêu chí (2.4.11 Focus not obscured, 2.5.8 Target size, 3.3.7 Redundant entry, 3.3.8 Accessible authentication). P03 áp dụng phần liên quan UI; phần authentication xác minh ở phase xác thực.

## 2. Quy tắc theo component

| Component | Quy tắc a11y bắt buộc |
| --- | --- |
| Button | `<button type>`; nhãn rõ; loading `aria-busy`; disabled `aria-disabled`; icon-only có `aria-label`. |
| Link | Mô tả đích; không dùng màu làm tín hiệu duy nhất (underline khi hover/focus). |
| Recipe card | 1 link chính (stretched link) hoặc 1 `<a>` bọc; nút lưu `aria-pressed`; meta bằng text. |
| Ingredient row | `<ul>/<li>` hoặc bảng có header; checkbox gắn label tên nguyên liệu. |
| Recipe step | `<ol>`; nút hoàn thành `aria-pressed`; timer dùng `aria-live` khi đổi. |
| Search bar | `role="search"`; label/aria-label; gợi ý `listbox` + `aria-activedescendant`; hỗ trợ ↑↓ Enter Esc. |
| Input/Textarea | Label gắn id; lỗi `aria-describedby` + `aria-invalid`; font ≥ 16px trên mobile. |
| Select | Ưu tiên native `<select>`; nếu custom → combobox đầy đủ bàn phím. |
| Checkbox/Radio/Switch | Control gốc hoặc role + `aria-checked`; radio trong `<fieldset><legend>`. |
| Chip/Tag | Tag lọc là `<button aria-pressed>`; chip trang trí không focus. |
| Header/Nav | `role="banner"`/`<nav aria-label>`; `aria-current="page"`; skip-link. |
| Modal | `role="dialog" aria-modal="true"`; focus trap; Esc; trả focus về trigger. |
| Toast | `aria-live="polite"` (info) / `role="alert"` (lỗi); không tự ẩn lỗi quan trọng. |
| Tabs | tablist/tab/tabpanel; ←→ Home End; `aria-selected`. |
| Pagination | `<nav aria-label="Phân trang">`; `aria-current="page"`. |
| Skeleton | `aria-hidden="true"`; vùng chứa có `aria-busy`. |
| Empty/Error state | Mô tả nguyên nhân + cách khắc phục; CTA là control thật. |

## 3. Keyboard navigation

- Mọi luồng chính dùng được **chỉ bàn phím** (Tab, Shift+Tab, Enter, Space, Esc, mũi tên).
- **Skip link** "Bỏ qua tới nội dung chính" ở đầu trang.
- **Focus trap** trong modal/drawer; **Esc** đóng.
- Thứ tự focus theo DOM, không nhảy bất thường.
- Focus ring **luôn** thấy rõ (không `outline:none` khi không thay thế).

## 4. Form accessibility

- Mỗi field có `<label for>` (hoặc `aria-label` khi label ẩn có lý do).
- Trường bắt buộc đánh dấu bằng text (không chỉ dấu sao màu); thông báo lỗi cụ thể + gợi ý.
- Nhóm field liên quan dùng `<fieldset>`/`<legend>` (ví dụ nguyên liệu lọc).
- Trạng thái lỗi không chỉ dùng màu — kèm icon + text.
- **Redundant entry (3.3.7):** không yêu cầu nhập lại dữ liệu đã nhập trong cùng luồng khi có thể tự điền.
- **Accessible authentication (3.3.8):** cho phép đăng nhập không cần test nhận thức (cho hiện/ẩn mật khẩu, hỗ trợ password manager).

## 5. Nội dung & media

- Ảnh công thức: `alt` mô tả món; ảnh trang trí `alt=""`.
- Không truyền thông tin chỉ bằng màu (trạng thái nguyên liệu dị ứng → kèm biểu tượng + chữ).
- Nội dung số (dinh dưỡng) trình bày bằng text, có đơn vị; phần "ước lượng" ghi rõ (không trình bày như số chính xác — PC-02).
- Ngôn ngữ trang khai báo `lang="vi"` (và `lang` đúng cho nội dung EN).

## 6. Reduced motion & animation

- Tôn trọng `prefers-reduced-motion: reduce` (xem [MOTION_GUIDELINES.md](./MOTION_GUIDELINES.md)).
- Không auto-play media; nếu có, cho phép dừng.

## 7. Cách kiểm thử (quy trình)

1. **Audit tự động:** axe DevTools / Lighthouse a11y cho từng template chính.
2. **Kiểm thử bàn phím:** đi hết luồng chính chỉ bằng Tab/Enter/Esc.
3. **Screen reader:** tối thiểu kiểm tra landmark, heading, form, thông báo động.
4. **Zoom 200% + 320px:** không mất nội dung, không cuộn ngang.
5. **Contrast:** đối chiếu token (đã có số liệu P03) + kiểm lại trên thực tế có alpha/overlay.
6. **Ghi nhận khiếm khuyết** và theo dõi tới khi đạt.

## 8. Phần chưa xác minh (ghi rõ)

- Chưa kiểm thử bằng **screen reader thật** (NVDA/VoiceOver).
- Chưa chạy **axe/Lighthouse** trên template thật (chưa dựng UI).
- Chưa kiểm **focus not obscured (2.4.11)** với header sticky thực tế.
- Chưa kiểm contrast cho **overlay/alpha** (modal backdrop, gradient hero).

## 9. Truy vết
- PC-07, PC-04 (user-friendly); NFR-A11Y; [BLOCKERS.md](../../BLOCKERS.md) B-P01-02.
