# P03 — RESPONSIVE GUIDELINES: WALE COOKING

> Mobile-first (PC-05 / NFR-RESP). Token: `breakpoint`, `grid`, `container` trong [tokens/design-tokens.json](./tokens/design-tokens.json).

## 1. Breakpoints

| Tên | Min-width | Thiết bị (quy ước) |
| --- | --- | --- |
| `base` | 0 | Mobile nhỏ (bắt đầu 320px) |
| `sm` | 640px | Mobile lớn / tablet dọc |
| `md` | 768px | Tablet |
| `lg` | 1024px | Desktop |
| `xl` | 1280px | Desktop lớn |
| `2xl` | 1536px | Màn lớn |

**Quy ước thiết bị:** mobile `0–639` · tablet `640–1023` · desktop `≥1024`.

**Nguyên tắc:** thiết kế từ **320px** rồi mở rộng; **không** có cuộn ngang ở 320px.

## 2. Lưới & container theo thiết bị

| | Mobile | Tablet | Desktop |
| --- | --- | --- | --- |
| Columns | 4 | 8 | 12 |
| Gutter | 16px | 24px | 24px |
| Lề trang | 16px | 24px | 32px |
| Container | full + margin | 1024px | 1200px |

## 3. Hành vi navigation

| Thiết bị | Header | Nav |
| --- | --- | --- |
| Mobile (<640) | Logo + hamburger + search icon | Drawer off-canvas (mở toàn màn hình), focus trap, Esc đóng |
| Tablet (640–1023) | Logo + nav thu gọn + search | Nav hiển thị một phần; mục thừa vào "Xem thêm" |
| Desktop (≥1024) | Logo + nav ngang đầy đủ + search + account | Nav ngang; mục hiện tại có `aria-current="page"` |

- Header **sticky**; đổ `shadow.sm` khi cuộn.
- Search: mobile mở toàn màn hình; desktop là thanh inline.
- Account/menu người dùng: dropdown (desktop) / drawer mục (mobile).

## 4. Lưới nội dung điển hình

| Thành phần | Mobile | Tablet | Desktop |
| --- | --- | --- | --- |
| Recipe grid | 1 cột | 2 cột | 3–4 cột |
| Danh sách bước nấu | 1 cột | 1 cột (rộng) | 1 cột (`container.narrow`) |
| Bộ lọc | Bottom-sheet / accordion | Sidebar thu gọn | Sidebar cố định trái/phải |
| Form | 1 cột | 1 cột (narrow) | 1–2 cột |

## 5. Chế độ nấu (cooking mode)

- **Bắt buộc tối ưu cho màn hình nhỏ** (NFR-RESP): chữ lớn (body 20–22px), nút "xong" lớn, thao tác một tay.
- Ẩn thành phần không cần (sidebar, quảng bá); giữ màn hình tối giản.
- Timer lớn, dễ đọc từ xa; hỗ trợ giữ màn hình sáng (wake lock — cân nhắc, có kiểm soát).
- Vùng chạm lớn ≥ 44px; khoảng cách nút rộng để tránh bấm nhầm.

## 6. Responsive cho media & bảng

- Ảnh: dùng tỷ lệ cố định (Recipe card 4:3) + `next/image` (srcset, lazy-load) — không phục vụ ảnh gốc quá lớn (NFR-PERF).
- Bảng dữ liệu (dinh dưỡng): mobile → chuyển thành **danh sách key–value** hoặc cuộn ngang có kiểm soát với chỉ báo.
- Không dùng `position: fixed` che nội dung trên màn nhỏ.

## 7. Kiểm tra responsive (bắt buộc)

| # | Kiểm tra | Kỳ vọng |
| --- | --- | --- |
| R1 | 320px | Không cuộn ngang; chữ ≥ 13px; nút chạm ≥ 44px |
| R2 | 375/414px | Layout 1 cột, ảnh full-width, meta không tràn |
| R3 | 640/768px | Lưới 2 cột; nav thu gọn hợp lý |
| R4 | 1024/1280px | Lưới 3–4 cột; sidebar hiển thị |
| R5 | 1536px+ | Container `wide` 1200px canh giữa; không nội dung quá dài |
| R6 | Xoay ngang (landscape) | Cooking mode dùng tốt |
| R7 | Zoom 200% | Không mất nội dung/chức năng (WCAG 1.4.4) |

## 8. Truy vết
- PC-05, NFR-RESP; token `breakpoint/grid/container`.
