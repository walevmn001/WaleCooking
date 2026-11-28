# P11.3 — COOKING EXPERIENCE VERIFICATION (WALE COOKING)

> Phase: **P11 — Real-World Verification & UX Polish** · Khu vực **ưu tiên cao nhất**.
> Nhãn: **Verified** / **Automated Test Passed** / **External Verification Pending** / **Known Limitation** / **Backlog**.

---

## 0. Phạm vi & phương pháp

Kiểm 4 nhóm: **Cooking Mode**, **Portion Scaling**, **Ingredient Checklist**, **Local Persistence**.
Bằng chứng = đọc mã nguồn + bộ unit/component test hiện có (chạy lại P11, xem [TEST_REPORT.md](./TEST_REPORT.md)),
đối chiếu trực tiếp hành vi hàm thuần trong `lib/cooking/`.

Mã liên quan:
[portion.ts](file:///workspace/lib/cooking/portion.ts) · [state.ts](file:///workspace/lib/cooking/state.ts) ·
`components/cooking/*` (`cooking-experience`, `cooking-mode`, `cooking-progress`, `ingredient-checklist`, `portion-selector`, `cooking-exit-confirmation`).
Test: `tests/lib/cooking.portion.test.ts` (21), `tests/lib/cooking.state.test.ts` (18), `tests/components/cooking.test.tsx` (11).

---

## 1. Cooking Mode

| Kiểm tra | Kết quả | Bằng chứng |
|---|---|---|
| Mở chế độ nấu | PASS | `CookingModeLayout` (portal toàn màn hình), mở từ `CookingExperience` |
| Bước tiếp theo / quay lại | PASS | `stepIndex` ±1, kẹp trong `[0, stepCount-1]` |
| Chuyển tới bước bất kỳ | PASS | Danh sách bước cho phép chọn trực tiếp |
| Tiến độ hiển thị chính xác | PASS | `CookingProgress` tính từ `stepIndex`/`stepCount` |
| Focus trap | PASS (unit) | Portal + trap khi mở; `Esc` đóng kèm xác nhận (`CookingExitConfirmation`) |
| Keyboard navigation | PASS (unit) | Nút/điều khiển là phần tử focus được; `Esc` để thoát |
| Nút kết thúc | PASS | Kết thúc → `status="completed"` |
| Khôi phục phiên nấu | PASS | `loadCookingState` khôi phục `stepIndex`/`status`/`checkedIds` |
| Recipe đã thay đổi (số bước ít hơn) | PASS | `parseCookingState` **kẹp** `stepIndex` vào `[0, stepCount-1]` |
| Recipe không còn tồn tại | PASS | Trang chi tiết `notFound()` (404) ⇒ không mở được chế độ nấu; state cũ bị bỏ khi slug không khớp |

### 1.1. Kiểm tra trên màn hình điện thoại

- **External Verification Pending**: không có thiết bị/browser thật trong sandbox ⇒ **chưa** xác minh trực quan (tràn ngang, che nội dung, kích thước nút, cỡ chữ).
- **Thiết kế nhắm tới mobile (Verified ở mức mã)**: `CookingModeLayout` toàn màn hình, nút điều hướng lớn, tương phản theo token P03, `prefers-reduced-motion` được tôn trọng.
- Checklist thủ công: xem [MANUAL_VERIFICATION_CHECKLIST.md](./MANUAL_VERIFICATION_CHECKLIST.md) §Cooking Mode.

---

## 2. Portion Scaling — bảng ca kiểm thử

Công thức: `định lượng mới = định lượng gốc × (số khẩu phần mới / số khẩu phần gốc)` — **chỉ nhân SỐ, giữ nguyên ĐƠN VỊ** (D68).

| Ca | Dữ liệu nguồn | Kỳ vọng | Kết quả |
|---|---|---|---|
| 1 khẩu phần | base=2, target=1 | ×0.5 | PASS |
| 2 khẩu phần | base=2, target=2 | ×1 → **giữ nguyên chuỗi gốc** (không làm tròn lại) | PASS |
| 3 khẩu phần | base=2, target=3 | ×1.5 | PASS |
| 4 khẩu phần | base=2, target=4 | ×2 | PASS |
| Số khẩu phần lớn | target=100 | ×50, kẹp `MAX_SERVINGS=100` | PASS |
| Số thập phân | base=2, target=1.5 | ×0.75 | PASS |
| Nhập phân số | `"1/2"` | = 0.5 | PASS |
| Nhập dấu phẩy | `"1,5"` | = 1.5 | PASS |
| Giá trị 0 | target=0 | `parseServingsInput`→null / `clampServings`→1 | PASS |
| Giá trị âm | target=−2 | reject → giữ mặc định ≥1 | PASS |
| Giá trị rỗng | `""` | null → không đổi | PASS |
| Dữ liệu định lượng thiếu | `quantityData` null | trả `ingredient.amount` gốc | PASS |
| Đơn vị không hỗ trợ | `type="text"` ("vừa đủ") | **giữ nguyên**, không nhân | PASS |
| Khoảng giá trị | `type="range"` | nhân cả min và max | PASS |

### 2.1. Xác minh nguyên tắc

- **Công thức tính đúng**: `servingFactor` = `target/base`; trả `null` khi base ≤ 0/không hữu hạn → nơi gọi giữ nguyên gốc.
- **Không thay đổi dữ liệu gốc**: hàm thuần trả chuỗi hiển thị; không mutate DTO.
- **Không làm tròn sai lệch**: `formatScaledNumber` làm tròn tối đa **2 chữ số thập phân**, tránh `-0`.
- **Không tự quy đổi gram → ml**: khớp D68 — chỉ nhân số, giữ đơn vị.
- **Không tạo định lượng khi nguồn không có**: nếu `amount` rỗng/`quantityData` thiếu → trả nguyên trạng thái (không bịa).

**Trạng thái: Automated Test Passed** (21 ca trong `cooking.portion.test.ts`).

---

## 3. Ingredient Checklist

| Kiểm tra | Kết quả | Ghi chú |
|---|---|---|
| Đánh dấu / bỏ đánh dấu | PASS | `normalizeCheckedIds` (loại trùng, chỉ giữ id hợp lệ) |
| Reset | PASS | Xóa `checkedIds` |
| Tiến độ | PASS | `checklistProgress` trả `{checked, total, ratio}` (chữ + số + thanh) |
| Thay đổi khẩu phần | PASS | Checklist dùng định lượng **sau khi đổi khẩu phần**; id nguyên liệu không đổi |
| Khôi phục trạng thái | PASS | Lưu/đọc `localStorage` (xem §4) |
| Dữ liệu checklist bị lỗi | PASS | id không hợp lệ/KHÔNG thuộc công thức → bị **lọc bỏ** |
| Recipe thay đổi (mất nguyên liệu) | PASS | `validIngredientIds` lọc theo công thức hiện tại |
| Không hiển thị trạng thái sai | PASS | Chỉ đếm id hợp lệ; tiến độ không vượt tổng |

**Trạng thái: Automated Test Passed** (`cooking.test.tsx`, `cooking.state.test.ts`).

---

## 4. Local Persistence

Lưu cục bộ: prefix `wale_cooking_v1:`, `COOKING_STATE_VERSION = 1` (D67). Chỉ lưu slug, `stepIndex`, `checkedIds`, `servings`, `startedAt`, `status` — **không** dữ liệu nhạy cảm.

| Kiểm tra | Kết quả | Bằng chứng |
|---|---|---|
| Dữ liệu có version | PASS | `record.v !== COOKING_STATE_VERSION` → bỏ, dùng mặc định |
| Dữ liệu cũ (version lạ) | PASS | Trả trạng thái mặc định |
| Dữ liệu lỗi (JSON hỏng/không phải object) | PASS | `JSON.parse` trong try/catch → mặc định; không ném |
| Storage đầy / bị chặn | PASS | `setItem`/`getItem` bọc try/catch → bỏ qua an toàn |
| Storage không khả dụng (SSR/private mode) | PASS | `getStorage()` trả `null` → không thao tác |
| Recipe không còn tồn tại | PASS | slug không khớp → state bị bỏ; trang trả 404 |
| Khả năng khôi phục | PASS | `load/save/clearCookingState` |

**Cam kết an toàn**: mọi lỗi `localStorage` được xử lý cục bộ ⇒ **không** làm crash trang công thức.
**Trạng thái: Automated Test Passed**.

---

## 5. Kết luận

- **Automated Test Passed**: Portion Scaling, Checklist, Local Persistence, Cooking Mode (mức unit/component).
- **Verified (mã)**: xử lý recipe thay đổi/không tồn tại; nguyên tắc không quy đổi đơn vị; không bịa định lượng; không crash do storage.
- **External Verification Pending**: trải nghiệm thực tế trên điện thoại khi đứng bếp (touch, khóa màn hình, cỡ chữ, tràn ngang) — không có thiết bị thật.
- **Known Limitation**: tiến độ lưu cục bộ theo từng trình duyệt — **không** đồng bộ giữa thiết bị (B-P09-03, chấp nhận theo D67).
