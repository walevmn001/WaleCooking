# P12.5 — RESPONSIVE & UX VERIFICATION (WALE COOKING)

> Phase: **P12 — Production Deployment & Browser Verification**
> Ngày: 2026-11-28 · Người thực hiện: 1 AI Agent (không sub-agent)
> Môi trường: Chrome 150 @ CDP `127.0.0.1:9222` · server production build (`next start`) @
> `127.0.0.1:3000` · DB E2E riêng (`wale_e2e`).
> Bộ kiểm thử: [tests/e2e/responsive.e2e.ts](file:///workspace/tests/e2e/responsive.e2e.ts)

---

## 1. Phạm vi & phương pháp

Kiểm thử **tự động thật** bằng Playwright trên Chrome (không phải suy đoán). Mỗi kiểm thử xác minh
**hành vi/kết quả đo được** (giá trị `scrollWidth` vs `innerWidth`, trạng thái hiển thị phần tử,
tập hợp lỗi console/network), không chỉ "trang tải được".

| Viewport | Kích thước | Loại |
|---|---|---|
| mobile-375 | 375 × 812 | Mobile |
| mobile-390 | 390 × 844 | Mobile |
| tablet-768 | 768 × 1024 | Tablet |
| desktop-1440 | 1440 × 900 | Desktop |

Trang kiểm tra: `/` (chủ) · `/cong-thuc` (danh sách) · `/cong-thuc/e2e-canh-trung-ca-chua` (chi tiết)
· `/cong-cu/quy-doi-don-vi` (form) · `/cong-cu/do-ng-ho` (timer) · `/admin/cong-thuc` (bảng điều
khiển admin, chặn khách) · `/dang-nhap` (đăng nhập).

---

## 2. Kết quả: 14/14 PASS

```
pnpm exec playwright test responsive --reporter=list
→ 14 passed
```

| Nhóm kiểm thử (× 4 viewport) | Kiểm chứng thực tế | Kết quả |
|---|---|---|
| Không tràn ngang | `document.documentElement.scrollWidth ≤ window.innerWidth + 1px` trên cả 7 trang | **PASS** |
| Header & biến thể nav | `role="banner"` hiển thị; mobile/tablet: nút "Mở menu" hiện + nav desktop ẩn; desktop ≥1024: nav "Điều hướng chính" hiện + nút menu ẩn | **PASS** |
| Console/JS & network | không `console.error`, không `pageerror`, không request HTTP ≥ 400, không request failed (ngoài các prefetch RSC bị huỷ hợp lệ) | **PASS** |
| Menu ngăn kéo (mobile 375) | mở menu → `role="dialog"` "Menu điều hướng" + nav "Điều hướng chính (di động)"; Esc đóng | **PASS** |
| Bàn phím & focus | Tab chuyển focus khỏi `BODY`; phần tử focus có `outline`/`box-shadow` hiển thị (`focus-visible`) | **PASS** |

---

## 3. Ghi nhận trong quá trình kiểm thử

### 3.1. Prefetch RSC bị huỷ khi điều hướng (bình thường, không phải lỗi)

Khi điều hướng liên tiếp, Next.js App Router phát **prefetch** (`?_rsc=…`) cho các `<Link>` rồi
**huỷ** (`net::ERR_ABORTED`) khi rời trang. Đây là hành vi có chủ đích của framework, **không** phải
request lỗi. Bộ kiểm thử lọc đúng trường hợp này (chỉ tính lỗi mạng thực sự).

### 3.2. Không phát hiện

- **Tràn ngang:** không có ở bất kỳ trang/viewport nào.
- **Lỗi hydration:** không có (`pageerror` rỗng trên toàn bộ điểm đo).
- **Request 404/500 khi tải trang chính:** không có (favicon được bỏ qua đúng mức).
- **Asset/font/ảnh lỗi:** không có trong tập response ≥ 400.

---

## 4. Trạng thái 4 mức

| Hạng mục | Trạng thái |
|---|---|
| Tràn ngang (4 viewport × 7 trang) | **PASS** |
| Header/nav theo breakpoint | **PASS** |
| Menu ngăn kéo (mobile) + Esc | **PASS** |
| Console/JS + network sạch | **PASS** |
| Bàn phím & focus visible | **PASS** |
| Kiểm thử hình ảnh/so khớp pixel trên thiết bị thật | **PENDING** — cần thiết bị/trình duyệt thật; checklist thủ công ở `MANUAL_VERIFICATION_CHECKLIST.md` |
| Kiểm thử trợ năng chuyên sâu (axe/WCAG audit) | **PENDING** — ngoài phạm vi P12 (chỉ kiểm tra cơ bản ở trên) |

---

## 5. Kết luận

- Bố cục responsive **không tràn ngang** và **điều hướng đúng theo breakpoint** trên cả 4 viewport
  bắt buộc; các trang chính tải **không có lỗi console/network**.
- Điều hướng menu ngăn kéo (mobile) và điều hướng bàn phím + focus hiển thị đều hoạt động.
- Các hạng mục cần thiết bị thật / audit trợ năng chuyên sâu giữ **PENDING** kèm checklist thủ công —
  **không** đánh dấu PASS khi chưa thực hiện.
