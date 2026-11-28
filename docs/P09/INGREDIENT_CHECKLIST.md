# INGREDIENT CHECKLIST — P09.4

> WALE COOKING · Phase P09 · Cập nhật: 2026-11-28.
> Checklist nguyên liệu để người dùng tích dần khi chuẩn bị (đi chợ/sơ chế).

## 1. Mục tiêu

Cho phép người dùng **tự đánh dấu** từng nguyên liệu đã chuẩn bị, theo dõi tiến độ, và xem lại sau.

## 2. Thành phần

`components/cooking/ingredient-checklist.tsx` — dựng trên `IngredientList` (P05) với `checkable`:

- Tick/bỏ tick nguyên liệu (checkbox có **nhãn là tên nguyên liệu** — accessible name đúng).
- Tiến độ dạng **chữ + số**: "Đã chuẩn bị x/y nguyên liệu" (`role="status" aria-live="polite"`).
- Badge **"Đã đủ nguyên liệu"** khi đủ (không chỉ dựa vào màu).
- Nút **Bỏ đánh dấu** (reset) — disabled khi chưa tick gì.
- Trạng thái đã tick: gạch ngang + đổi màu chữ (không dùng màu đơn thuần để truyền đạt).

## 3. Dùng định lượng SAU khi đổi khẩu phần

Checklist nhận danh sách nguyên liệu **đã nhân khẩu phần** (`scaleIngredients`) từ `CookingExperience`.
Ví dụ: đổi 2 → 4 khẩu phần thì số lượng trong checklist cũng cập nhật theo, **trạng thái tick giữ nguyên**
(vì tick lưu theo `id` nguyên liệu, không theo chuỗi định lượng).

## 4. Tiến độ

`checklistProgress(validIngredientIds, checkedIds)` (module thuần) trả `{ done, total, ratio }`,
chỉ tính `id` còn tồn tại trong công thức hiện tại (id lạ bị bỏ qua).

## 5. Lưu trạng thái

- Lưu **cục bộ** trong `localStorage` (cùng bản ghi với tiến độ nấu — `checkedIds`), **không** ghi DB,
  **không** cần tài khoản. Xem [lib/cooking/state.ts](../../lib/cooking/state.ts).
- Checklist **không tự tick** — chỉ người dùng đánh dấu.
- Có thể reset để chuẩn bị lại từ đầu.

## 6. Trạng thái rỗng & tương thích

- Công thức không có nguyên liệu → hiển thị "Chưa có thông tin nguyên liệu" (không bịa).
- Đổi khẩu phần/khôi phục khẩu phần **không** mất trạng thái tick.
- Tải lại trang/đóng tab → khôi phục từ `localStorage` nếu bản ghi còn hợp lệ cho công thức.

## 7. Kiểm thử

- `tests/lib/cooking.state.test.ts` — chuẩn hóa id, tiến độ, khôi phục, loại id không tồn tại.
- `tests/components/cooking.test.tsx` — hiển thị tiến độ, gọi toggle, reset, lưu `localStorage`.
