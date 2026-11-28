# P11.4 — SMART KITCHEN TOOLS VERIFICATION (WALE COOKING)

> Phase: **P11 — Real-World Verification & UX Polish**
> Nhãn: **Verified** / **Automated Test Passed** / **External Verification Pending** / **Known Limitation** / **Backlog**.

Mã liên quan: [timers.ts](file:///workspace/lib/kitchen/timers.ts) · [units.ts](file:///workspace/lib/kitchen/units.ts) · [ingredient-match.ts](file:///workspace/lib/kitchen/ingredient-match.ts) · `lib/kitchen/alerts.ts` · `components/kitchen/*`.
Test: `tests/lib/kitchen/{timers(31),units(23),ingredient-match(17)}.test.ts` + `tests/components/kitchen.test.tsx` (17) + `tests/integration/kitchen.ingredient-match.test.ts` (4).

---

## 1. Multi Timer

| Kiểm tra | Kết quả | Bằng chứng |
|---|---|---|
| Tạo timer | PASS | `createTimer` (clamp 1s..24h, nhãn mặc định "Đồng hồ") |
| Đặt tên | PASS | `renameTimer` (rỗng → giữ tên cũ) |
| Bắt đầu / Tạm dừng / Tiếp tục | PASS | `startTimer`/`pauseTimer` (pause chốt `pausedRemaining`) |
| Reset | PASS | `resetTimer` về `idle`, thời lượng gốc |
| Xóa | PASS | Loại khỏi danh sách + lưu lại |
| Nhiều timer cùng lúc | PASS | `MAX_TIMERS=12`, mỗi timer có `id` riêng |
| Hết giờ | PASS | `tickTimer` → `justFinished` (chỉ **một lần**) |
| Khôi phục sau reload | PASS | `loadTimers` từ `localStorage` (`wale_timers_v1`) |
| Dữ liệu timer không hợp lệ | PASS | `parseTimers`/`normalizeTimers` loại bản ghi sai, giới hạn số lượng, bỏ id trùng |

### 1.1. Xác minh đặc biệt (nguồn sự thật & nền)

- **`deadline` là nguồn sự thật**: `remainingSeconds` khi `running` = `ceil((deadline − now)/1000)` — suy trực tiếp từ mốc kết thúc.
- **Không phụ thuộc duy nhất vào `setInterval`**: hàm thuần không dùng số lần tick để trừ thời gian; interval chỉ kích hoạt re-render (Verified ở mức logic test).
- **Thời gian còn lại khi tab nền**: đúng **theo thiết kế** vì suy từ `deadline − now`; **External Verification Pending** cho hành vi thực tế khi tab ẩn/khoá màn hình (không có thiết bị thật).
- **Không chạy trùng timer**: `tickTimer` chỉ chuyển `running`→`finished` một lần; `notified` chặn phát lặp.
- **Không phát âm thanh ngoài ý muốn**: Web Audio **chỉ mở khoá qua tương tác người dùng** (`unlockAudio`); không tự phát khi tải trang.
- **Không yêu cầu Notification permission ngay khi vào trang**: quyền chỉ xin khi người dùng **bấm** nút (`requestNotificationPermission`); fallback banner trong trang.

### 1.2. Kiểm tra trên điện thoại

- **External Verification Pending**: chưa có thiết bị thật → **chưa** xác minh: chuyển sang app khác/quay lại, khoá màn hình/mở lại, thời gian còn lại, rung, âm thanh, Notification thật.
- **Không tuyên bố** timer hoạt động nền hoàn hảo khi chưa thử trên thiết bị thật.

---

## 2. Unit Converter — bảng ca kiểm thử

Hệ số theo định nghĩa chuẩn (SI / US customary / avoirdupois), ghi nguồn trong `UNIT_DEFINITIONS`.

### 2.1. Khối lượng (cơ sở gam)

| Từ → Đến | Nhập | Kỳ vọng | Kết quả |
|---|---|---|---|
| kg → g | 1 | 1000 | PASS |
| g → kg | 500 | 0.5 | PASS |
| mg → g | 1000 | 1 | PASS |
| oz → g | 1 | 28.349523125 | PASS |
| lb → g | 1 | 453.59237 | PASS |

### 2.2. Thể tích (cơ sở mililít)

| Từ → Đến | Nhập | Kỳ vọng | Kết quả |
|---|---|---|---|
| l → ml | 1 | 1000 | PASS |
| tsp → ml | 1 | 4.92892159375 | PASS |
| tbsp → ml | 1 | 14.78676478125 | PASS |
| fl oz → ml | 1 | 29.5735295625 | PASS |
| cup (US) → ml | 1 | 236.5882365 | PASS |
| metric cup → ml | 1 | 250 | PASS (phân biệt US vs metric) |
| cup (US) → tbsp | 1 | 16 | PASS |

### 2.3. Nhiệt độ (công thức)

| Từ → Đến | Nhập | Kỳ vọng | Kết quả |
|---|---|---|---|
| °C → °F | 0 | 32 | PASS |
| °C → °F | 100 | 212 | PASS |
| °C → °F | −40 | −40 | PASS |
| °F → °C | 212 | 100 | PASS |

### 2.4. Ca không hợp lệ / không tương thích

| Ca | Kỳ vọng | Kết quả |
|---|---|---|
| Khối lượng → Thể tích (g → ml) | `incompatible` (không quy đổi mass↔volume) | PASS |
| Đếm khác loại (cái → tép) | `not_convertible` | PASS |
| Tùy biến (nhúm → tùy ý) | `not_convertible` | PASS |
| Cùng đơn vị đếm (cái → cái) | ok, giữ nguyên | PASS |
| Khối lượng âm | `invalid_input` | PASS |
| Nhiệt độ âm | hợp lệ (công thức) | PASS |
| Giá trị rất lớn (> 1e12) | `invalid_input` | PASS |
| Input rỗng | `parseAmountInput` → null | PASS |
| Đơn vị không xác định | `unknown_unit` | PASS |
| Dấu phẩy thập phân ("1,5") | 1.5 | PASS |

### 2.5. Nguyên tắc

- **Không quy đổi mass ↔ volume** (thiếu tỷ trọng) — thỏa yêu cầu P11.
- **Phân biệt US cup (236.5882365 ml) vs metric cup (250 ml)**.
- **°C ↔ °F** dùng đúng công thức.
- **Không tự suy đoán khối lượng của một chén/một quả** (đơn vị đếm không quy đổi).
- `convertUnit` **không ném lỗi** → trả `ConversionResult` có cấu trúc.

**Trạng thái: Automated Test Passed** (23 ca trong `units.test.ts`).

---

## 3. Ingredient Discovery

| Kiểm tra | Kết quả | Ghi chú |
|---|---|---|
| Nhập nhiều nguyên liệu | PASS | Tách theo dấu phẩy / lặp `ingredient` |
| Xóa nguyên liệu | PASS | Cập nhật danh sách chip |
| Trùng nguyên liệu | PASS | `dedupeIngredients` (theo dạng chuẩn hoá) |
| Chữ hoa/thường | PASS | `normalizeText` → lowercase |
| Khoảng trắng | PASS | Gộp khoảng trắng, trim |
| Dấu tiếng Việt | PASS | Bỏ dấu NFD + `đ→d` |
| Từ khóa rỗng | PASS | Bị loại; danh sách rỗng → không kết quả |
| Không có kết quả | PASS | Trả mảng rỗng (EmptyState) |
| Có kết quả | PASS | Xếp hạng theo điểm |
| Công thức thiếu nguyên liệu | PASS | Trả `missing` + `missingRequired` |

### 3.1. Điểm phù hợp & nguyên liệu thiếu

- Điểm = f(`userMatchedCount`, `coverage` = matched/total, `missingRequired`); sắp xếp: userMatchedCount ↓ → coverage ↓ → missingRequired ↑ → missing ↑ → title.
- `completeRequired` = không còn thiếu nguyên liệu bắt buộc ⇒ không khẳng định "nấu được" khi thiếu nguyên liệu thiết yếu.
- **Không trả công thức không tồn tại**: chỉ chấm điểm trên ứng viên lấy từ `listPublicIngredientCandidates` (published, chưa xóa).
- **Không tự nhận định hai nguyên liệu tương đương** khi không có dữ liệu synonym: chỉ so khớp tên/slug đã có.

**Trạng thái: Automated Test Passed** — unit (17 ca) + component (17 ca) + **integration 4/4** (đã chạy trên PostgreSQL thật trong P11 — khắc phục B-P10-02).

---

## 4. Kết luận

- **Automated Test Passed**: Multi Timer (logic), Unit Converter (toàn bộ ca), Ingredient Discovery (unit + integration thật).
- **Verified (mã)**: deadline là nguồn sự thật; không xin quyền/âm thanh ngoài ý muốn; không mass↔volume; phân biệt cup US/metric.
- **External Verification Pending**: hành vi timer trên thiết bị thật (khoá màn hình/chuyển app/rung/âm thanh/Notification).
- **Known Limitation**: hệ số quy đổi chưa đối chiếu dụng cụ đo vật lý (B-P10-03, chấp nhận theo thiết kế).
