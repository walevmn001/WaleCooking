# P11.5 — MOBILE-FIRST UX AUDIT (WALE COOKING)

> Phase: **P11 — Real-World Verification & UX Polish**
> Nhãn: **Verified** / **Automated Test Passed** / **External Verification Pending** / **Known Limitation** / **Backlog**.

---

## 1. Responsive — viewport cần kiểm

| Thiết bị mô phỏng | Kích thước | Trạng thái |
|---|---|---|
| Mobile nhỏ | 320 × 568 | **External Verification Pending** |
| Mobile phổ biến | 375 × 812 | **External Verification Pending** |
| Mobile lớn | 430 × 932 | **External Verification Pending** |
| Tablet | 768 × 1024 | **External Verification Pending** |
| Desktop | 1366 × 768 | **External Verification Pending** |
| Desktop lớn | 1920 × 1080 | **External Verification Pending** |

**Lý do**: sandbox **không có trình duyệt/thiết bị** ⇒ không thể chụp ảnh/đo tràn ngang thực tế.
**Không giả lập kết quả** — chi tiết kiểm thủ công ở [MANUAL_VERIFICATION_CHECKLIST.md](./MANUAL_VERIFICATION_CHECKLIST.md).

### 1.1. Bằng chứng ở mức mã (Verified — read)

Cơ sở responsive dựa trên **token P03** và Tailwind v4 (mobile-first):
- Breakpoint: `sm 640` / `md 768` / `lg 1024` / `xl 1280` / `2xl 1536` (D27); grid 4/8/12 cột.
- Header có 3 biến thể (desktop/tablet/mobile) + `MobileMenu`; `Container` giới hạn bề rộng, `px` theo spacing token.
- Card/recipe card dùng `radius.lg/xl` (18–24px) nhất quán (D26).
- Chống tràn ngang: layout dùng grid/flex có wrap; `RecipeImage` với tỷ lệ khung; `next/image` `sizes`.
- Dialog/Modal: `components/feedback/modal.tsx` dùng overlay + panel giới hạn `max-h`/`max-w` (không tràn màn hình ở mức CSS).

### 1.2. Hạng mục cần sửa nếu kiểm thật phát hiện (chưa xác nhận)

Không có lỗi responsive **xác định được bằng mã**. Khi có browser thật, ưu tiên kiểm: tràn ngang, text overflow,
card lệch, ảnh sai tỷ lệ, menu khó thao tác, nút quá nhỏ (< 44px), khoảng cách không đồng đều, nội dung bị che, dialog vượt màn hình.

---

## 2. Visual consistency (Verified — read)

Giữ nguyên phong cách **WALE COOKING — Pastel Mint** (không tạo design system mới — D22/D7):

| Hạng mục | Kiểm tra | Kết quả |
|---|---|---|
| Màu | Cream / Pastel Mint / Soft Pink / Beige / Brown Text theo token | PASS (không dùng màu ngoài token) |
| Typography | **Baloo 2** (heading) + **Nunito** (body), scale cố định | PASS |
| Icon | **Lucide** + icon thương hiệu P04; không emoji ở UI chính | PASS |
| Bo góc | 18–24px cho card (radius.lg/xl) | PASS |
| Component | Button/Form/Card/Modal/Navigation/Header/Footer tái dùng P05 | PASS (không tạo trùng) |
| Empty states | `EmptyState`, `ErrorState`, `LoadingState` nhất quán | PASS |
| Spacing | Theo spacing token P03 | PASS |

**Kết luận**: nhất quán ở mức mã; **hiển thị thực tế = External Verification Pending**.

---

## 3. Accessibility (Verified ở mức mã + unit; runtime Pending)

| Hạng mục | Kiểm tra | Kết quả |
|---|---|---|
| Semantic HTML | `header`/`nav`/`main`/`footer`/`article`/`section`, heading `h1→h6` | PASS (read) |
| Heading hierarchy | Một `h1`/trang; cấp bậc logic ở page công khai | PASS (read) |
| Keyboard navigation | Toàn bộ control focus được; `Esc` đóng modal/cooking mode | PASS (unit) |
| Focus visibility | `focus-visible` ring theo token `border.focus` | PASS (read) |
| Focus management | Focus trap (Modal, Cooking Mode); trả focus khi đóng | PASS (unit) |
| Form labels | `FormField`/`FormLabel` gắn `htmlFor`; input có nhãn | PASS (unit) |
| Accessible names | Nút icon có `aria-label`; icon trang trí `aria-hidden` | PASS (read) |
| Color contrast | Token P03 đã đo contrast; cặp không đạt có quy tắc cấm + shade phụ trợ | PASS (P03 audit) — **contrast trên UI thật (alpha/overlay) Pending** |
| Alt text | `RecipeImage` có `alt`; ảnh trang trí alt rỗng | PASS (read) |
| Dialog accessibility | `role="dialog"`, `aria-modal`, nhãn, trap focus | PASS (unit) |
| Reduced motion | `prefers-reduced-motion` tôn trọng ở animation | PASS (globals.css) |

**Chưa chạy**: axe/Lighthouse/screen reader thật, zoom 200%, focus-not-obscured với header sticky → **External Verification Pending** (kế thừa B-P03-01/B-P05-01).

---

## 4. Kết luận

- **Verified (read/unit)**: consistency theo token P03; responsive foundations; a11y ở mức mã + unit.
- **External Verification Pending**: hiển thị thực tế 6 viewport, axe/Lighthouse, screen reader, zoom 200%, contrast runtime.
- **Không có thay đổi design system** trong P11 (đúng ràng buộc).
- **Backlog**: nếu kiểm thật phát hiện lỗi Medium/Low → đưa vào [BUG_FIX_REPORT.md](./BUG_FIX_REPORT.md) hoặc backlog phase sau.
