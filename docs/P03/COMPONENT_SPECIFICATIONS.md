# P03 — COMPONENT SPECIFICATIONS: WALE COOKING

> Đặc tả component để các phase triển khai dựng **thống nhất**. Giá trị màu/chữ/spacing lấy từ [tokens/design-tokens.json](./tokens/design-tokens.json).
> Mỗi component gồm: **Mục đích · Cấu trúc · Kích thước · Màu · Typography · Border/radius · Spacing · Variant · Trạng thái · Mobile · A11y**.
> P03 **không code** component — đây là đặc tả.

## Quy ước chung (áp dụng cho mọi component)

- **Focus state (bắt buộc):** `border.focus` (`#52705C`) với `shadow.focusRing` = `0 0 0 3px #FFF9F0, 0 0 0 5px #52705C`; chỉ hiện khi `:focus-visible`.
- **Touch target:** mọi phần tử tương tác ≥ **44×44px** (`size.touchTarget.min`).
- **Transition:** dùng token `motion` (§ [MOTION_GUIDELINES.md](./MOTION_GUIDELINES.md)); tôn trọng `prefers-reduced-motion`.
- **Chữ tối thiểu:** 13px (caption). Không < 12px.
- **Round mặc định:** control `radius.md` (12px), card `radius.lg` (18px), chip `radius.pill`.
- **A11y nền tảng:** semantic HTML; label/`aria-*`; keyboard operability.

---

## 1. Buttons

### 1.1. Primary button
- **Mục đích:** hành động chính (nấu ngay, lưu, đăng nhập).
- **Cấu trúc:** `<button>` (hoặc `<a role="button">` khi là link hành động) chứa [icon?] + nhãn.
- **Kích thước:** md cao **44px** (padding ngang `space.5`), lg 52px, sm 36px. Min-width 44px.
- **Màu:** nền `primary.default` `#52705C`; chữ `text.inverse` `#FFFFFF` (ratio **5.48** ✅). Hover `primary.hover`; active `primary.active`.
- **Typography:** `button` (Nunito 600, 16px).
- **Border/radius:** không viền; `radius.md` (12px) hoặc `radius.pill`.
- **Spacing:** padding `space.3` (dọc) × `space.5` (ngang); gap icon–chữ `space.2`.
- **Variant:** sm / md / lg; block (full-width).
- **Trạng thái:** default · hover (`primary.hover`) · pressed (`primary.active`, dịch xuống 1px) · focus-visible (ring) · disabled (nền `text.disabled` `#A2937F`, chữ trắng, `cursor: not-allowed`, `aria-disabled`) · loading (spinner + giữ nhãn).
- **Mobile:** full-width cho CTA chính (nấu/lưu) khi đứng riêng.
- **A11y:** `<button type>` đúng; nhãn rõ nghĩa; khi loading dùng `aria-busy="true"`, không chặn nhãn; đảm bảo 44px.

### 1.2. Secondary button
- **Mục đích:** hành động phụ (chia sẻ, hủy).
- **Màu:** nền `secondary.default` `#F8DDE3`; chữ `text.primary` `#594B40` (ratio **6.56** ✅). Hover `secondary.hover`; active `secondary.active`.
- **Còn lại:** như primary. Không dùng chữ trắng trên nền pink.

### 1.3. Outline button
- **Mục đích:** hành động phụ, trung tính (lọc, xem thêm).
- **Màu:** nền trong suốt (`surface.default`); **viền `border.strong` `#8F7E66`** (3.93 trên trắng ✅ 3:1); chữ `text.primary`.
- **Border/radius:** viền `hairline` (1px); `radius.md`.
- **Trạng thái:** hover → nền `surface.muted`; active → nền `primary.subtle` + viền `primary.default`; focus-visible ring; disabled như trên (viền `text.disabled`).

### 1.4. Ghost button
- **Mục đích:** hành động trong không gian chật (icon action, đóng).
- **Màu:** nền trong suốt; chữ/icon `text.primary`; hover nền `surface.muted`.
- **A11y:** nếu chỉ có icon → **bắt buộc** `aria-label`.

### 1.5. Icon button
- Kích thước tối thiểu **44×44px**; icon `size.icon.lg` (24px); `aria-label` bắt buộc.

---

## 2. Text link
- **Mục đích:** điều hướng trong câu.
- **Màu:** `primary.default` `#52705C` (trên cream 5.24 ✅); hover gạch chân + `primary.hover`.
- **Typography:** theo ngữ cảnh (`body`/`bodySm`).
- **Trạng thái:** default · hover (underline) · visited (giữ nguyên màu, không đổi để tránh rối) · focus-visible (ring) · active.
- **A11y:** không dùng màu làm **tín hiệu duy nhất** — thêm gạch chân khi hover/focus; mô tả link rõ nghĩa ("Xem công thức Phở bò", không "bấm vào đây").

---

## 3. Card
- **Mục đích:** gom một đơn vị nội dung.
- **Cấu trúc:** container + (media? + body + footer-tùy-chọn).
- **Màu:** nền `surface.default` `#FFFFFF` trên nền `background.default` cream; viền `border.subtle` hairline (trang trí) **hoặc** không viền + `shadow.md`.
- **Border/radius:** `radius.lg` 18px (mặc định) → `radius.xl` 24px (card lớn).
- **Shadow:** `shadow.md`; hover → `shadow.lg` + dịch lên `2px` (`motion.base`).
- **Spacing:** padding `space.4` (mobile) → `space.6` (desktop).
- **Trạng thái:** default · hover (nổi nhẹ) · focus-within (ring nếu card có thể bấm) · disabled (giảm opacity 60%, không tương tác).
- **A11y:** nếu toàn card là link → dùng 1 `<a>` bọc, hoặc kỹ thuật "stretched link" với **một** link chính; không để nhiều link cạnh tranh trong 1 card.

---

## 4. Recipe Card (quy chuẩn riêng — bắt buộc thống nhất)

- **Mục đích:** hiển thị công thức trong **thư viện** và **trang chủ** với cùng một quy chuẩn (PC-06).
- **Cấu trúc (thứ tự cố định):**
  1. **Ảnh** (tỷ lệ **4:3**, `radius.lg` trên cùng, `object-fit: cover`) + lớp badge (tùy chọn: độ khó / thời gian / chế độ ăn).
  2. **Tiêu đề** (H3/H4, tối đa 2 dòng, ellipsis).
  3. **Mô tả ngắn** (bodySm, tối đa 2 dòng, ellipsis) — tùy chọn.
  4. **Meta row:** ⏱ thời gian tổng · khẩu phần · độ khó (icon + chữ bodySm, `text.muted`).
  5. **Footer action:** nút ghost "Lưu" (trái tim) + (tùy chọn) nút "Nấu".
- **Kích thước:** rộng theo lưới (1/2/3–4 cột); ảnh cao theo tỷ lệ 4:3; min-height ~ nội dung; giữ tỷ lệ ổn định để tránh CLS.
- **Màu:** nền `surface.default`; tiêu đề `text.primary`; meta `text.muted`; badge dùng `chip.*`.
- **Typography:** tiêu đề `h4`; mô tả/meta `bodySm`; badge `caption`/`label`.
- **Border/radius:** `radius.lg`; ảnh bo `radius.lg` góc trên, góc dưới vuông (ảnh sát mép) **hoặc** ảnh inset bo `radius.md` (chọn **một** kiểu toàn hệ thống — khuyến nghị: ảnh sát mép bo góc trên).
- **Spacing:** body padding `space.4`; gap dọc giữa các phần `space.2`; meta gap `space.3`.
- **Variant:** `default` · `compact` (không mô tả, dùng ở carousel trang chủ) · `featured` (lớn, hero).
- **Trạng thái:** default · hover (nổi nhẹ + ảnh zoom nhẹ ≤1.03 trong `motion.slow`) · focus-visible · disabled/hidden (bài `archived` không hiển thị công khai).
- **Mobile:** 1 cột, ảnh full-width; meta giữ 1 hàng (đủ chỗ) hoặc xuống dòng có kiểm soát.
- **A11y:** ảnh có `alt` mô tả món; **không** đặt `alt` trùng tiêu đề một cách vô nghĩa — nếu ảnh chỉ trang trí, `alt=""`; meta dùng text (không chỉ icon màu); nút lưu là `<button>` với `aria-pressed` (lưu/bỏ lưu) + `aria-label` ("Lưu công thức Phở bò").

---

## 5. Ingredient row
- **Mục đích:** một dòng nguyên liệu trong bảng nguyên liệu / shopping list.
- **Cấu trúc:** checkbox (nếu shopping list) + **định lượng** (trái, `tabular-nums`) + **tên** + (nhãn: bắt buộc/tùy chọn/thay thế) + (nút thay thế).
- **Kích thước:** min-height 44px; định lượng cột rộng cố định (≥ 72px) để thẳng hàng.
- **Màu:** chữ `text.primary`; định lượng `text.muted`; nhãn "tùy chọn" dùng `chip.neutral`.
- **Typography:** body; định lượng body (`tabular-nums`).
- **Spacing:** padding dọc `space.3`; gap cột `space.3`; zebra `surface.muted`.
- **Variant:** normal · optional · substituted (ghi "thay bằng …").
- **Trạng thái:** default · hover (nền `surface.muted`) · checked (shopping list: gạch ngang chữ, giảm tương phản vừa phải nhưng **không** dưới 4.5 cho nhãn còn cần đọc) · disabled.
- **Mobile:** định lượng + tên trên cùng hàng; nhãn/nút thay thế xuống dòng dưới.
- **A11y:** dùng `<ul>/<li>` hoặc bảng có header; checkbox có label gắn với tên nguyên liệu.

---

## 6. Recipe instruction step
- **Mục đích:** hiển thị từng bước nấu (chế độ nấu).
- **Cấu trúc:** số bước (badge tròn) + nội dung + (nhiệt độ/thời gian) + timer (nếu có) + nút "xong".
- **Kích thước:** min-height 44px; chữ lớn hơn bình thường ở cooking mode.
- **Màu:** badge số bước nền `primary.subtle` chữ `text.onBrand`; nội dung `text.primary`; bước đã xong → giảm nổi bật (opacity/strike tùy chọn) nhưng vẫn đọc được.
- **Typography:** body (cooking mode: 20–22px, line-height 1.7).
- **Spacing:** padding `space.4`; gap giữa các bước `space.3`.
- **Variant:** normal · active (bước đang làm) · completed · has-timer.
- **Trạng thái:** default · completed (đánh dấu) · disabled khi chưa tới bước (nếu áp dụng tuần tự).
- **Mobile:** mỗi bước chiếm phần lớn màn hình; nút "xong" lớn, một tay bấm được.
- **A11y:** `<ol>` cho thứ tự; nút "đánh dấu hoàn thành" là `<button>` với `aria-pressed`; timer đọc được bởi screen reader (`aria-live` khi đổi).

---

## 7. Search bar
- **Mục đích:** tìm công thức + gợi ý.
- **Cấu trúc:** input (icon kính lúp) + nút xóa + (dropdown gợi ý).
- **Kích thước:** md 44px → lg 52px ở header desktop.
- **Màu:** nền `surface.default`; viền `border.strong`; placeholder `text.subtle` (chỉ trên nền cream/white ✅); focus → viền `border.focus` + ring.
- **Typography:** body.
- **Border/radius:** `radius.pill` (thanh tròn) hoặc `radius.md`.
- **Spacing:** padding ngang `space.4`; icon–chữ `space.2`.
- **Variant:** header (gọn) · hero (lớn) · inline.
- **Trạng thái:** default · focus · filled · loading (gợi ý đang tải) · empty-results · disabled.
- **Mobile:** nút mở search toàn màn hình; autofocus khi mở; `inputmode`/`enterkeyhint="search"`.
- **A11y:** `role="search"`; label ẩn hoặc `aria-label`; gợi ý là `listbox` có `aria-activedescendant`; hỗ trợ bàn phím ↑↓ Enter Esc.

---

## 8. Input & Textarea
- **Mục đích:** nhập liệu.
- **Cấu trúc:** label (bắt buộc, ngoại trừ có lý do) + control + trợ giúp (tùy chọn) + thông báo lỗi.
- **Kích thước:** input cao 44px; textarea min 3 dòng, auto-grow tùy chọn.
- **Màu:** nền `surface.default`; viền `border.strong`; chữ `text.primary`; placeholder `text.subtle`; **lỗi** viền `status.danger` + chữ lỗi `status.danger`; focus → `border.focus` + ring.
- **Typography:** body; label `label`.
- **Border/radius:** `radius.md`; viền hairline.
- **Spacing:** padding `space.3`×`space.4`; label–input `space.2`; lỗi cách `space.1`.
- **Variant:** text · email · password (nút hiện/ẩn) · number · search · textarea.
- **Trạng thái:** default · focus · filled · error (`aria-invalid="true"`) · disabled (`surface.muted`, `text.disabled`) · readonly.
- **Mobile:** font ≥ 16px để tránh zoom tự động trên iOS; full-width.
- **A11y:** `<label for>` gắn id; lỗi gắn `aria-describedby`; **không** chỉ dùng màu đỏ báo lỗi — kèm icon + text.

---

## 9. Select & Dropdown
- **Mục đích:** chọn một/nhiều giá trị.
- **Cấu trúc:** nút/trigger + panel danh sách (dùng `<select>` gốc khi đơn giản; custom `listbox` khi cần).
- **Kích thước:** ≥ 44px; panel max-height có cuộn.
- **Màu:** như input; panel nền `surface.default` + `shadow.md`; mục hover `surface.muted`; mục chọn `primary.subtle`.
- **Border/radius:** `radius.md`.
- **Spacing:** item padding `space.3`×`space.4`.
- **Trạng thái:** default · open · focus · selected · disabled.
- **Mobile:** ưu tiên **`<select>` gốc** hoặc bottom-sheet để thân thiện cảm ứng.
- **A11y:** nếu custom → `role="combobox"`/`listbox`, `aria-expanded`, điều hướng bàn phím đầy đủ; ưu tiên native để đơn giản & accessible.

---

## 10. Checkbox · Radio · Switch
- **Checkbox:** ô 20×20px (vùng chạm 44px); viền `border.strong`; chọn → nền `primary.default`, dấu tick trắng; indeterminate hỗ trợ.
- **Radio:** tròn 20×20px; chọn → chấm `primary.default`.
- **Switch:** rãnh 44×24px; off → `border.strong`/`surface.muted`; on → `primary.default`; núm trắng; hiệu ứng trượt `motion.base`.
- **Typography:** nhãn `body`/`label`.
- **Spacing:** control ↔ nhãn `space.2`; giữa các mục `space.3`.
- **Trạng thái:** default · hover · focus-visible (ring) · checked · disabled · error (viền `status.danger`).
- **A11y:** dùng control gốc ẩn trực quan nhưng vẫn focus được, hoặc `role` + `aria-checked`; switch dùng `role="switch"` + `aria-checked`; radio nhóm trong `<fieldset>` + `<legend>`.

---

## 11. Tags & Chips
- **Chip (nhãn trạng thái):** nền/chữ theo `color.chip.*`; `radius.pill`; padding `space.1`×`space.3`; typography `caption`/`label`; không tương tác.
- **Tag (có thể xóa/lọc):** như chip + nút × (icon button 44px vùng chạm); trạng thái selected (nền `primary.subtle`, viền `primary.default`).
- **Trạng thái:** default · selected · hover · focus-visible · disabled.
- **A11y:** tag lọc dùng `<button aria-pressed>`; chip trang trí không cần focus.

---

## 12. Header · Navigation · Footer
### 12.1. Header
- **Cấu trúc:** logo (trái) + nav (giữa/trái) + search + account (+ menu mobile).
- **Kích thước:** cao 64px (mobile) → 72px (desktop).
- **Màu:** nền `background.default` cream (hoặc `surface.default`); sticky dùng `shadow.sm` khi cuộn; chữ `text.primary`.
- **Trạng thái:** sticky (top), scrolled (đổ bóng), menu mở.
- **Mobile:** logo + hamburger + search icon (nav ẩn vào drawer).
- **A11y:** `<header role="banner">`; skip-link tới main; nav dùng `<nav aria-label>`.

### 12.2. Navigation
- **Desktop:** nav ngang, mục active có gạch chân `primary.default` hoặc chữ đậm.
- **Mobile:** drawer/off-canvas; nút đóng rõ; focus trap khi mở; Esc để đóng.
- **A11y:** `aria-current="page"` cho mục hiện tại; điều hướng bàn phím; nút menu `aria-expanded`.

### 12.3. Footer
- **Cấu trúc:** cột liên kết + thông tin thương hiệu + bản quyền + (ghi nguồn).
- **Màu:** nền `background.inverse` `#594B40`, chữ `text.inverse` trắng (8.38 ✅); hoặc nền cream với chữ nâu.
- **Mobile:** cột xếp dọc (accordion tùy chọn).
- **A11y:** `<footer role="contentinfo">`; nhóm liên kết có tiêu đề.

---

## 13. Breadcrumbs
- **Mục đích:** định vị trong cấu trúc.
- **Cấu trúc:** dãy link + dấu phân cách (›) + trang hiện tại (không phải link).
- **Typography:** `bodySm`; hiện tại `text.primary` đậm, các mục trước `text.muted`.
- **Mobile:** cho phép rút gọn (chỉ hiện cấp gần nhất) hoặc cuộn ngang nhẹ.
- **A11y:** `<nav aria-label="breadcrumb">` + `<ol>`; mục cuối `aria-current="page"`.

---

## 14. Tabs
- **Cấu trúc:** danh sách tab + panel nội dung.
- **Màu:** tab active chữ `primary.default` + gạch dưới `primary.default`; tab thường `text.muted`.
- **Trạng thái:** default · hover · active/selected · focus-visible · disabled.
- **Mobile:** cho phép cuộn ngang hoặc chuyển thành segmented control.
- **A11y:** `role="tablist"/"tab"/"tabpanel"`; điều hướng ←→, Home/End; `aria-selected`.

---

## 15. Modal / Dialog
- **Mục đích:** tác vụ tập trung (xác nhận, form ngắn).
- **Cấu trúc:** overlay + hộp (tiêu đề, nội dung, hành động) + nút đóng.
- **Kích thước:** max-width 480–640px; mobile gần full-width, có thể bottom-sheet.
- **Màu:** hộp `surface.default`; overlay nền `background.inverse` với alpha (ví dụ 40–50%); `shadow.xl`.
- **Border/radius:** `radius.xl`.
- **Spacing:** padding `space.6`; gap hành động `space.3`.
- **Trạng thái:** opening (fade+scale nhẹ) · open · closing.
- **Mobile:** bottom-sheet cho tác vụ ngắn; tránh che bàn phím.
- **A11y:** `role="dialog"` + `aria-modal="true"` + nhãn tiêu đề; **focus trap**; Esc đóng; trả focus về trigger; không dùng nếu chỉ để thông báo (dùng toast/inline).

---

## 16. Toast / Notification
- **Mục đích:** phản hồi ngắn (đã lưu, lỗi).
- **Cấu trúc:** icon trạng thái + thông điệp + (nút đóng / hành động).
- **Vị trí:** góc dưới/trên — cố định, không che thao tác chính; mobile: trên cùng dưới header.
- **Màu:** nền `surface.default`; viền trái 4px theo trạng thái (`status.*`); chữ `text.primary`.
- **Trạng thái:** success · warning · danger · info; auto-dismiss (4–6s) trừ lỗi nghiêm trọng; pause khi hover/focus.
- **A11y:** vùng `aria-live="polite"` (thông tin) / `role="alert"` (lỗi); không tự dismiss thông báo lỗi quan trọng; đảm bảo đọc được bởi screen reader.

---

## 17. Pagination
- **Cấu trúc:** prev · số trang · next (hoặc "Xem thêm").
- **Kích thước:** mỗi nút ≥ 44px.
- **Màu:** trang hiện tại nền `primary.default` chữ trắng; nút thường viền `border.strong`.
- **Mobile:** rút gọn (prev/next + "trang x/y") hoặc "Xem thêm".
- **A11y:** `<nav aria-label="Phân trang">`; `aria-current="page"`; nút disabled rõ.

---

## 18. Loading skeleton
- **Mục đích:** giữ bố cục khi tải (tránh CLS).
- **Màu:** nền `surface.muted` với shimmer nhẹ (gradient), **không** chói.
- **Hành vi:** shimmer dùng `motion.slower` lặp; **tắt** khi `prefers-reduced-motion` (tĩnh).
- **A11y:** `aria-hidden="true"`; đồng thời thông báo trạng thái qua `aria-busy` ở vùng chứa.

---

## 19. Empty state
- **Mục đích:** khi không có dữ liệu (chưa có yêu thích, không có kết quả).
- **Cấu trúc:** minh họa (mascot/icon) + tiêu đề + mô tả + CTA.
- **Màu:** minh họa dùng pastel brand; chữ `text.primary`/`text.muted`.
- **A11y:** mô tả rõ nguyên nhân + hướng khắc phục; CTA là link/button thật.

---

## 20. Error state
- **Mục đích:** khi tải/thao tác thất bại.
- **Cấu trúc:** icon/màu `status.danger` + thông điệp thân thiện (không lộ lỗi kỹ thuật) + nút "Thử lại".
- **A11y:** thông điệp cụ thể, không chỉ "Có lỗi xảy ra"; nút thử lại rõ; `role="alert"`.

---

## 21. Interaction states (chuẩn chung)

| Trạng thái | Quy tắc |
| --- | --- |
| Hover | Đổi nền (`surface.muted`/token tương ứng) hoặc shadow; **không** đổi kích thước gây nhảy; transition `motion.fast`. |
| Focus (focus-visible) | Ring `border.focus` + offset nền; **luôn** hiển thị rõ. Không dùng `outline: none` khi không có thay thế. |
| Pressed/Active | Giảm sáng/tối bằng token hover/active; dịch 1px (button). |
| Disabled | `text.disabled`/`surface.muted`; `cursor: not-allowed`; `aria-disabled="true"`; không nhận focus nếu không cần. |
| Loading | Spinner + `aria-busy`; giữ kích thước để tránh nhảy. |
| Selected | Nền `primary.subtle` + viền `primary.default` + `aria-selected`/`aria-pressed`. |

## 22. Truy vết
- PC-06 (design consistency), PC-07 (a11y), PC-08 (performance — motion nhẹ, skeleton chống CLS).
- Token: `color.*`, `typography.*`, `space.*`, `radius.*`, `shadow.*`, `motion.*`.
- Accessibility chi tiết: [ACCESSIBILITY_GUIDELINES.md](./ACCESSIBILITY_GUIDELINES.md).
