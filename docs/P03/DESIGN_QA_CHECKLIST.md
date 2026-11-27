# P03 — DESIGN QA CHECKLIST: WALE COOKING

> Checklist nghiệm thu **Design System** trước khi phase triển khai UI (P05+) dùng.
> Nguyên tắc: **chỉ đánh dấu "Đạt" khi có bằng chứng thực tế**; phần chưa kiểm thử ghi "Chưa xác minh" (không tuyên bố đạt — theo PC-13/NFR-A11Y).
> Tham chiếu: [COLOR_ACCESSIBILITY_AUDIT.md](./COLOR_ACCESSIBILITY_AUDIT.md) · [ACCESSIBILITY_GUIDELINES.md](./ACCESSIBILITY_GUIDELINES.md) · [COMPONENT_SPECIFICATIONS.md](./COMPONENT_SPECIFICATIONS.md) · [RESPONSIVE_GUIDELINES.md](./RESPONSIVE_GUIDELINES.md) · [MOTION_GUIDELINES.md](./MOTION_GUIDELINES.md) · [tokens/design-tokens.json](./tokens/design-tokens.json).

Ký hiệu trạng thái: ✅ Đạt · ⚠️ Chưa xác minh (chưa dựng UI) · ❌ Không đạt.

---

## 1. Kiểm tra tự động được ở P03 (document/token level)

| # | Hạng mục kiểm tra | Cách kiểm tra | Kết quả |
| --- | --- | --- | --- |
| QA-01 | `tokens/design-tokens.json` là JSON hợp lệ | Parse bằng Python `json.load` | ✅ (xem mục 12 báo cáo) |
| QA-02 | Token có đủ nhóm bắt buộc: color/typography/space/size/radius/shadow/border/breakpoint/grid/container/zIndex/motion | Đối chiếu key top-level với yêu cầu §10 | ✅ |
| QA-03 | 6 màu brand KHÓA đúng HEX gốc (`#FFF9F0`/`#C9E8D5`/`#789B83`/`#F8DDE3`/`#E8DCC6`/`#594B40`) | So khớp với [02-dinh-huong-giao-dien.md](../P00/02-dinh-huong-giao-dien.md) | ✅ |
| QA-04 | Typography dùng đúng Baloo 2 (heading) + Nunito (body) | So khớp font family + P00 | ✅ |
| QA-05 | Card radius nằm trong 18–24px | `radius.lg=18px`, `radius.xl=24px` | ✅ |
| QA-06 | Breakpoint khớp NFR-RESP (mobile <640 / tablet 640–1024 / desktop >1024) | So `breakpoint.deviceRule` với NFR-RESP | ✅ |
| QA-07 | Touch target ≥ 44px | `size.touchTarget.min = 44px` | ✅ |
| QA-08 | Có đủ 10 file bàn giao trong `docs/P03/` (9 `.md` + 1 `.json`) | Liệt kê thư mục | ✅ |
| QA-09 | Liên kết nội bộ giữa các tài liệu P03 không gãy | Kiểm tra đường dẫn tương đối tồn tại | ✅ |
| QA-10 | Fence Mermaid cân bằng (mở/đóng) | Đếm ` ```mermaid ` vs ` ``` ` | ✅ (kiểm thủ công — không có mmdc) |
| QA-11 | Không có quyết định trái với P00–P02 | Đối chiếu D1–D21 + PC-01..14 | ✅ |
| QA-12 | Không dùng màu ngoài token trong đặc tả component | Rà soát COMPONENT_SPECIFICATIONS.md | ✅ |

## 2. Contrast WCAG 2.2 AA (đã đo thực tế ở P03)

> Số liệu đo bằng công thức WCAG `(L1+0.05)/(L2+0.05)` (xem [COLOR_ACCESSIBILITY_AUDIT.md](./COLOR_ACCESSIBILITY_AUDIT.md)).

| # | Cặp màu | Ngưỡng | Kết quả |
| --- | --- | --- | --- |
| QA-C1 | `text.primary` `#594B40` / cream `#FFF9F0` | 4.5:1 | ✅ 8.01 |
| QA-C2 | `text.primary` / surface white | 4.5:1 | ✅ 8.38 |
| QA-C3 | `text.primary` / mint `#C9E8D5` | 4.5:1 | ✅ 6.38 |
| QA-C4 | `text.primary` / pink `#F8DDE3` | 4.5:1 | ✅ 6.56 |
| QA-C5 | `text.primary` / beige `#E8DCC6` | 4.5:1 | ✅ 6.18 |
| QA-C6 | `text.muted` `#6B5C4F` trên cream/white/pastel | 4.5:1 | ✅ 4.74–6.42 |
| QA-C7 | `text.subtle` `#7A6A5B` trên cream/white | 4.5:1 | ✅ 4.97 / 5.20 |
| QA-C8 | `text.subtle` trên nền pastel (mint/pink/beige) | 4.5:1 (chữ thường) | ❌ 3.83–4.07 → **cấm chữ thường**; chỉ dùng chữ lớn (≥3:1) |
| QA-C9 | white / `primary.default` `#52705C` | 4.5:1 | ✅ 5.48 |
| QA-C10 | white / status success·warning·danger·info | 4.5:1 | ✅ 4.89–6.54 |
| QA-C11 | white / `accent.brand` `#789B83` (mintDark) | 4.5:1 (chữ thường) | ❌ 3.08 → **cấm chữ thường trắng**; chỉ chữ lớn ≥3:1 / fill / icon |
| QA-C12 | `border.strong` `#8F7E66` trên cream/white (viền control) | 3:1 | ✅ 3.75 / 3.93 |
| QA-C13 | `border.focus` `#52705C` (focus ring) | 3:1 | ✅ 5.24 / 5.48 |
| QA-C14 | `border.subtle` `#E8DCC6` trên white (hairline trang trí) | 3:1 | ❌ 1.36 — **không dùng cho control** (chỉ trang trí) |
| QA-C15 | Chip color pairs (5 cặp nền/chữ) | 4.5:1 | ✅ 5.78–8.12 |

**Kết luận contrast:** các cặp chữ/UI chính **đạt AA**. Các cặp KHÔNG đạt (QA-C8/C11/C14) đã có **quy tắc cấm dùng** + shade phụ trợ thay thế; màu brand gốc vẫn giữ trong palette (đúng yêu cầu §3).

## 3. Accessibility runtime (⚠️ cần UI thật để xác minh — thuộc P05+)

| # | Hạng mục | Yêu cầu | Trạng thái P03 | Kiểm thử ở P05+ |
| --- | --- | --- | --- | --- |
| QA-A1 | Contrast trên UI thật (có alpha/overlay/gradient) | AA | ⚠️ | axe + đo thủ công |
| QA-A2 | Keyboard navigation toàn luồng chính | Dùng được chỉ bằng bàn phím | ⚠️ | Đi luồng bằng Tab/Enter/Esc |
| QA-A3 | Visible focus (2.4.7) | Focus ring hiển thị rõ | ⚠️ | Kiểm Tab qua từng component |
| QA-A4 | Focus not obscured (2.4.11) | Không bị header sticky che | ⚠️ | Kiểm với header sticky thật |
| QA-A5 | Semantic HTML + heading theo cấp (1.3.1) | Đúng landmark/heading | ⚠️ | axe + đọc DOM |
| QA-A6 | Accessible labels (3.3.2 / 4.1.2) | Mọi control có label | ⚠️ | axe forms |
| QA-A7 | Form error messages (3.3.1 / 3.3.3) | Bằng chữ + gợi ý, không chỉ màu | ⚠️ | Submit lỗi, kiểm đọc |
| QA-A8 | Alt text (1.1.1) | Ảnh nội dung có alt; trang trí `alt=""` | ⚠️ | axe images |
| QA-A9 | Touch target ≥ 44×44 (2.5.8) | Vùng chạm hành động chính | ⚠️ | Đo trên mobile thật |
| QA-A10 | Screen reader | Landmark/heading/form/aria-live đọc đúng | ⚠️ | NVDA/VoiceOver |
| QA-A11 | Reduced motion (2.3.3) | Tôn trọng `prefers-reduced-motion` | ⚠️ | Bật cờ, kiểm chuyển cảnh |
| QA-A12 | Responsive zoom / reflow (1.4.4 / 1.4.10) | Zoom 200% & 320px không mất nội dung / không cuộn ngang | ⚠️ | Trình duyệt thật |
| QA-A13 | Status messages (4.1.3) | Toast/lỗi dùng `aria-live`/`role="alert"` | ⚠️ | Kích hoạt thông báo |

## 4. Responsive & layout

| # | Hạng mục | Yêu cầu | Trạng thái P03 |
| --- | --- | --- | --- |
| QA-R1 | Breakpoint nhất quán giữa token & RESPONSIVE_GUIDELINES | 640/768/1024/1280/1536 | ✅ (tài liệu) |
| QA-R2 | Grid columns/gutter khớp giữa token & tài liệu | 4/8/12 cột | ✅ (tài liệu) |
| QA-R3 | Navigation mobile/tablet/desktop có đặc tả | Drawer/rail/menu | ✅ (tài liệu) |
| QA-R4 | Không cuộn ngang ở 320px | Thực tế | ⚠️ (cần UI) |
| QA-R5 | Container width & padding khớp token | narrow/default/wide | ✅ (tài liệu) |

## 5. Component specification completeness

| # | Hạng mục | Yêu cầu | Trạng thái |
| --- | --- | --- | --- |
| QA-S1 | Mỗi component có đủ mục: mục đích/cấu trúc/kích thước/màu/typography/border-radius/spacing/variant/trạng thái/mobile/a11y | Theo template §6 | ✅ |
| QA-S2 | Có đủ nhóm component bắt buộc (buttons, link, cards, recipe card, ingredient row, step, search, input/textarea, select, checkbox/radio/switch, chips, header/nav/footer, breadcrumbs, tabs, modal, toast, pagination, skeleton, empty/error) | §6 prompt | ✅ |
| QA-S3 | Recipe Card có **quy chuẩn riêng** (tỉ lệ 4:3, thông tin bắt buộc) | §6 | ✅ |
| QA-S4 | Mỗi component liệt kê trạng thái hover/pressed/focus/disabled ở đâu áp dụng | Interactivity states | ✅ |
| QA-S5 | Component dùng token đã định nghĩa (không giá trị tùy tiện) | Rà soát chéo | ✅ |

## 6. Motion

| # | Hạng mục | Yêu cầu | Trạng thái |
| --- | --- | --- | --- |
| QA-M1 | Duration/easing có token | Có trong `motion.*` | ✅ |
| QA-M2 | Có hỗ trợ `prefers-reduced-motion` | CSS/rule cụ thể | ✅ (đặc tả) |
| QA-M3 | Animation nhẹ, GPU-friendly, không chặn chức năng | Duration ≤ 420ms | ✅ (đặc tả) |
| QA-M4 | Không glassmorphism/shadow quá đậm | Rà token shadow | ✅ |

---

## 7. Điều kiện "Definition of Done" cho P03

- [x] Đủ **10/10** tài liệu bàn giao trong `docs/P03/`.
- [x] `design-tokens.json` hợp lệ và đủ nhóm token bắt buộc.
- [x] Contrast đã **đo thực tế**; cặp không đạt có quy tắc cấm + shade thay thế.
- [x] Đặc tả component đủ trạng thái; Recipe Card có quy chuẩn riêng.
- [x] Motion + a11y có quy tắc cụ thể theo component.
- [x] Không có quyết định trái P00–P02.
- [x] Ghi rõ phần **chưa xác minh** (mục 3, 4).
- [ ] *(ngoài phạm vi P03)* Nghiệm thu a11y/responsive trên UI thật → thuộc **P05+**.

## 8. Truy vết
- PC-06 (design consistency), PC-07 (accessibility), PC-08 (performance); NFR-A11Y, NFR-RESP, NFR-PERF; [BLOCKERS.md](../../BLOCKERS.md) B-P01-02 (đã đo contrast ở P03).
