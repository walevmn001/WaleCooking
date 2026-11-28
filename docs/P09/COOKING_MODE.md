# COOKING MODE — P09.2

> WALE COOKING · Phase P09 (Cooking Experience) · Cập nhật: 2026-11-28.
> Chế độ nấu tập trung từng bước, dùng được trên điện thoại khi đang đứng bếp.

## 1. Mục tiêu

Biến trang chi tiết công thức từ "đọc" thành "làm theo": người dùng mở chế độ nấu, xem **một bước
mỗi lần**, chuyển bước, xem ảnh/mẹo của bước và tiếp tục được sau khi rời trang.

## 2. Điểm vào

- Nút **"Bắt đầu nấu"** trong khối Nguyên liệu của trang chi tiết
  ([app/(public)/cong-thuc/[slug]/page.tsx](../../app/(public)/cong-thuc/[slug]/page.tsx)).
- Chỉ hiện khi công thức có **≥ 1 bước** (`steps.length > 0`). Không có bước → hiển thị thông báo,
  không mở chế độ nấu (không bịa hướng dẫn).

## 3. Thành phần

| Component | File | Vai trò |
| --- | --- | --- |
| `CookingExperience` | `components/cooking/cooking-experience.tsx` | Vỏ state chung: khẩu phần + checklist + mở/đóng chế độ nấu + lưu cục bộ |
| `CookingModeLayout` | `components/cooking/cooking-mode.tsx` | Lớp phủ toàn màn hình (portal), focus trap, điều hướng bước |
| `CookingProgress` | `components/cooking/cooking-progress.tsx` | Thanh + chữ "Bước x/y" |
| `CookingExitConfirmation` | `components/cooking/cooking-exit-confirmation.tsx` | Xác nhận kết thúc (dựng trên `ConfirmDialog` P05) |

`CookingModeLayout` **không** sinh/đổi thứ tự bước — chỉ hiển thị `RecipeStep[]` đã có (từ P07).

## 4. Nội dung một bước

- Số thứ tự bước (badge tròn) + tiêu đề "Bước N".
- Nội dung hướng dẫn (`step.instruction`) — chữ lớn, dễ đọc.
- Ảnh bước nếu có (`step.imageUrl` — bổ sung tùy chọn ở view-model P09).
- Badge thời lượng nếu có timer (`step.durationMinutes`).
- Mẹo (`step.tip`) nếu có.

## 5. Điều hướng

- **Bước trước** / **Bước tiếp theo** (nút lớn, `size="lg"`); bước cuối hiện **Hoàn tất**.
- Nút **Xem danh sách bước** để xem lại / nhảy nhanh; danh sách tự ẩn khi chuyển bước.
- Đóng bằng nút X hoặc `Esc` → mở **xác nhận kết thúc** (tránh thoát nhầm).

## 6. Lưu tiến độ (rời trang & quay lại)

Vì sản phẩm **không có tài khoản khách** và model `CookingSession`/`CookingProgress` yêu cầu `userId`
(xem [RECIPE_DATA_AUDIT.md](./RECIPE_DATA_AUDIT.md) §4), tiến độ lưu **cục bộ trên thiết bị**
(`localStorage`) qua module thuần [lib/cooking/state.ts](../../lib/cooking/state.ts):

Lưu các trường: `slug` (định danh), `stepIndex` (bước hiện tại, 0-based), `servings`, `checkedIds`,
`startedAt` (epoch ms), `status` (`idle`/`active`/`completed`). Có `version` để đổi định dạng sau này.

**Không** lưu: nội dung công thức, thông tin cá nhân, dữ liệu nhạy cảm.

### Xử lý khi dữ liệu thay đổi

`parseCookingState` (hàm thuần) chống lỗi an toàn:
- JSON hỏng / version khác / **slug khác** → trả trạng thái mặc định (không lẫn tiến độ giữa các món).
- Công thức **ít bước hơn** (đổi phiên bản) → **kẹp** `stepIndex` vào `[0, stepCount-1]`.
- Nguyên liệu **bị xóa/đổi id** → lọc khỏi `checkedIds`.
- Công thức **bị ẩn/xóa** → trang chi tiết trả 404 (P07) → người dùng không mở được; dữ liệu cũ tự nhiên
  không còn được dùng. Không có dữ liệu "mồ côi" nào được hiển thị ra UI.

## 7. Accessibility

- `role="dialog"` + `aria-modal="true"` + `aria-label="Chế độ nấu: <tên>"`.
- Focus trap (Tab/Shift+Tab), đóng bằng `Esc`, khóa cuộn nền, trả focus về phần tử trước đó khi đóng.
- Nút chỉ có icon (X) có `aria-label`. Tiến độ không chỉ thể hiện bằng màu (luôn có chữ "Bước x/y").
- Danh sách bước dùng `aria-current="step"` cho bước hiện tại.

## 8. UX khi đứng bếp

- Nút lớn, khoảng cách rộng, chữ lớn (`text-body-lg`), mobile-first.
- Mỗi màn hình chỉ tập trung **một bước**; ẩn bớt thành phần gây rối.
- Không bắt buộc đăng nhập, không rung/âm thanh.

## 9. Giới hạn đã biết

- Chưa có ảnh bước cho mọi công thức → bỏ qua mềm khi thiếu.
- Chưa kiểm trên trình duyệt thật/thiết bị thật (xem `BLOCKERS.md` B-P09-02).
