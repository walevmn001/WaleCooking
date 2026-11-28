# P12.4 — E2E TEST REPORT (WALE COOKING)

> Phase: **P12 — Production Deployment & Browser Verification**
> Ngày: 2026-11-28 · Người thực hiện: 1 AI Agent (không sub-agent)
> Môi trường: Chrome 150 @ CDP `127.0.0.1:9222` · Server production build (`next start`) @
> `127.0.0.1:3000` · `DATABASE_URL` trỏ Postgres **E2E riêng** (`wale_e2e`), đã `migrate deploy` +
> `pnpm e2e:seed`.

---

## 1. Tóm tắt kết quả

| Chỉ số | Giá trị |
|---|---|
| Tổng số test E2E | **28** |
| PASS | **28** |
| FAIL | 0 |
| File test | 5 (`public`, `cooking`, `tools`, `admin`, `api`) |
| Lệnh | `pnpm exec playwright test --reporter=list` |
| Kết quả | **28 passed** (chạy lại xác nhận ổn định 28/28) |

> Mỗi test kiểm tra **hành vi/kết quả thực tế** (định lượng đổi theo khẩu phần, tiến độ checklist,
> kết quả tính toán, mã trạng thái HTTP, hình dạng dữ liệu) — **không** chỉ "trang tải được".

---

## 2. Chi tiết theo nhóm

### §A. Public — [tests/e2e/public.e2e.ts](file:///workspace/tests/e2e/public.e2e.ts) (10 test · PASS)

| # | Test | Hành vi thực tế đã kiểm chứng |
|---|---|---|
| 1 | Trang chủ & điều hướng | h1 thương hiệu hiển thị; nav "Điều hướng chính"; click "Khám phá công thức" → URL `/cong-thuc` + h1 "Công thức" |
| 2 | Danh sách công thức | "2 công thức" chính xác; hiện 2 công thức published; bản nháp KHÔNG xuất hiện |
| 3 | Tìm kiếm | nhập "Canh" + Tìm → URL `?q=Canh`, còn "1 công thức", loại đúng công thức khác |
| 4 | Từ khoá không khớp | hiển thị heading "Không tìm thấy công thức", không lộ công thức |
| 5 | Lọc theo loại món | chọn `main_dish` → URL `?foodType=main_dish`, đúng 1 công thức |
| 6 | Chi tiết công thức | HTTP 200; h1 + "Nguyên liệu" + "Các bước nấu"; nguyên liệu/định lượng thật ("Trứng gà", "300 g"); nút "Bắt đầu nấu" |
| 7 | Nháp → 404 | `e2e-ban-nhap` trả **HTTP 404** + trang "Không tìm thấy trang" |
| 8 | Slug không tồn tại | HTTP 404 |
| 9 | Yêu thích (cookie) | bấm "Lưu vào yêu thích" → nút đổi "Đã lưu yêu thích"; sang `/yeu-thich` thấy công thức (cookie + Server Action) |
| 10 | Chia sẻ | mô phỏng không có `navigator.share` → bấm "Chia sẻ" → "Đã sao chép liên kết" và URL chứa `/cong-thuc/<slug>` (kiểm tra clipboard thực) |

### §B. Cooking — [tests/e2e/cooking.e2e.ts](file:///workspace/tests/e2e/cooking.e2e.ts) (3 test · PASS)

| # | Test | Hành vi thực tế |
|---|---|---|
| 1 | Portion Scaling | 4 khẩu phần → "300 g"; bấm "Tăng khẩu phần" → **"375 g"** (300×1,25) và không còn "300 g"; `role=status` "Đang chọn 5 khẩu phần"; "Khôi phục" → về "300 g" |
| 2 | Ingredient Checklist | 3 checkbox; tiến độ 0/3 → tick "Trứng gà" 1/3 → tick hết 3/3 + badge "Đã đủ nguyên liệu"; "Bỏ đánh dấu" → 0/3 |
| 3 | Cooking Mode | dialog "Chế độ nấu: <title>"; bước 1 (nút "Bước trước" **disabled**) → bước 2 (enabled) → bước 3 (nút **"Hoàn tất"**); "Kết thúc chế độ nấu" → dialog xác nhận "Kết thúc chế độ nấu?" → "Kết thúc" → dialog đóng |

### §B. Tools — [tests/e2e/tools.e2e.ts](file:///workspace/tests/e2e/tools.e2e.ts) (5 test · PASS)

| # | Test | Hành vi thực tế |
|---|---|---|
| 1 | Unit Converter (khối lượng) | nhập 1000 → **"1 kg"** |
| 2 | Unit Converter (nhiệt độ) | chọn nhóm "Nhiệt độ", nhập 100 → **"212 °F"** |
| 3 | Ingredient-based search | thêm "Trứng" + "Cà chua" → "Tìm công thức" → *"Tìm thấy N công thức phù hợp với 2 nguyên liệu"* + heading công thức E2E |
| 4 | Multi Timer | tạo "Luộc trứng" 1p30s → card 01:30 "Chưa chạy" → "Bắt đầu" → "Đang chạy" → "Đặt lại" → "Chưa chạy" + 01:30 |
| 5 | Multi Timer (validate) | chỉ nhập tên → submit → "Thời lượng tối thiểu là 1 giây."; không tạo đồng hồ rác ("Chưa có đồng hồ nào" vẫn hiển thị) |

> Dùng helper `fillStable` để chống **hydration race** của Client Component.

### §C. Admin — [tests/e2e/admin.e2e.ts](file:///workspace/tests/e2e/admin.e2e.ts) (3 test · PASS)

| # | Test | Hành vi thực tế |
|---|---|---|
| 1 | Guest vào `/admin/cong-thuc` | "Yêu cầu quyền truy cập" + h1 "Quản lý công thức" + link "Đăng nhập"; **không** lộ dữ liệu (`text /\(E2E\)/` count = 0) |
| 2 | Guest vào `/admin/cong-thuc/moi` | bị chặn ("Yêu cầu quyền truy cập") |
| 3 | Trang `/dang-nhap` | h1 "Đăng nhập quản trị" + text /chưa được cấu hình/; **không** có ô nhập giả (`textbox` count = 0) |

### §D. API — [tests/e2e/api.e2e.ts](file:///workspace/tests/e2e/api.e2e.ts) (6 test · PASS)

| # | Test | Hành vi thực tế |
|---|---|---|
| 1 | `GET /api/v1/recipes` | 200; `items[]` chứa `e2e-canh-trung-ca-chua`, **không** chứa `e2e-ban-nhap` (draft ẩn) |
| 2 | `GET /api/v1/recipes?page=abc` | **422** + `error.code` tồn tại (validate phân trang) |
| 3 | `GET /api/v1/kitchen/ingredient-match?q=Trứng,Cà chua` | 200; `count ≥ 1`; kết quả chứa slug E2E |
| 4 | `GET /api/v1/media/file/nope/khong-ton-tai.png` | **404** |
| 5 | `GET /api/v1/admin/recipes` (guest) | **401** |
| 6 | `POST /api/v1/recipes` (guest) | **401** |
| 7 | `POST /api/v1/media` (thiếu tệp) | **422** (validate trước khi xác thực) |

---

## 3. Kiểm tra chất lượng đi kèm (P12.4)

| Lệnh | Kết quả |
|---|---|
| `pnpm typecheck` | **PASS** (sau khi sửa generic `fixtures.ts`) |
| `pnpm lint` | **PASS** |
| `pnpm test` (unit) | **337/337 PASS** (31 file) |
| `TEST_DATABASE_URL=…wale_test pnpm test:integration` | **59/59 PASS** (9 file) |
| `pnpm build` (**không** có `DATABASE_URL`) | **exit=0 PASS** → xác nhận FIND-04 (lazy Prisma) đã sửa đúng |

---

## 4. Trạng thái 4 mức

| Hạng mục | Trạng thái |
|---|---|
| Public flows (A) | **PASS** (10/10 test hành vi thực) |
| Cooking + Tools (B) | **PASS** (8/8) |
| Admin guest guard (C) | **PASS** (3/3 — xác minh chặn truy cập đúng) |
| API (D) | **PASS** (7/7 mã trạng thái + dữ liệu) |
| Đăng nhập Admin **thật** + RBAC Editor/Admin | **BLOCKED** — Auth.js chưa được nối (`lib/auth/session.ts` luôn trả actor `null`) |
| Tạo/sửa công thức, Publish workflow, Media upload qua UI admin | **BLOCKED** — phụ thuộc đăng nhập thật ở trên |
| Media upload qua adapter test (UI) | **BLOCKED** — chưa có R2 credentials (xem STORAGE_READINESS §5) |

### BLOCKED — giải thích & điều kiện gỡ

Bộ test Admin hiện xác minh **đúng hành vi an toàn** đang có: khách bị chặn, không lộ dữ liệu, không
có biểu mẫu đăng nhập giả. Các luồng **đăng nhập thật → tạo/sửa/publish công thức → kiểm tra RBAC
Editor vs Admin** **chưa thể** chạy vì Auth.js chưa được cấu hình trong phạm vi P12 (không thay đổi
kiến trúc ngoài phạm vi). **Đây là BLOCKED, không phải PASS.**

**Điều kiện gỡ BLOCKED:** khi Auth.js được cấu hình (Credentials/OAuth + session), bổ sung test:
1. Đăng nhập bằng tài khoản editor test → thấy danh sách quản trị.
2. Editor tạo nháp → publish → công thức xuất hiện công khai.
3. RBAC: tài khoản role thấp hơn bị chặn khỏi thao tác admin.
4. Media upload qua UI với adapter test (local) hoặc R2 staging.

---

## 5. Cảnh báo đã ghi nhận (không phải lỗi test)

- Build sinh **3 cảnh báo Turbopack** *"Dynamic filesystem access causes tracing of the whole
  project"* tại [app/api/v1/media/file/[...key]/route.ts](file:///workspace/app/api/v1/media/file/[...key]/route.ts#L45)
  (`const data = await readFile(target)`). Đây là hành vi đã biết của LocalStorageAdapter (dùng cho
  dev/test) — **không** phải lỗi build; build vẫn PASS. Chi tiết: STORAGE_READINESS §2 (FIND-05).

---

## 6. Kết luận

- Đã bổ sung **bộ E2E thực tế 28 test PASS** phủ 4 nhóm luồng (Public/Cooking/Admin/API), tận dụng
  Chrome có sẵn qua CDP, không đổi stack, không cần credentials production.
- Các luồng phụ thuộc **Auth.js** và **R2 thật** được đánh dấu **BLOCKED** kèm điều kiện gỡ — **không**
  đánh dấu PASS khi chưa thực sự chạy.
