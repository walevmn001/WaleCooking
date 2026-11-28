# TEST REPORT — P10 (Smart Kitchen Tools)

> WALE COOKING · Phase P10 · Ngày: 2026-11-28 · Môi trường: sandbox Linux, **không có PostgreSQL/credentials/browser**.

## 1. Tổng quan kết quả

| Kiểm tra | Lệnh | Kết quả |
| --- | --- | --- |
| Typecheck | `pnpm typecheck` | ✅ **0 lỗi** |
| Lint | `pnpm lint` | ✅ **0 lỗi / 0 cảnh báo** |
| Unit test | `pnpm test` | ✅ **337/337 pass** (31 file) — **+88 test P10** |
| Build | `pnpm build` | ✅ thành công (exit 0) — thêm `/cong-cu*` + `/api/v1/kitchen/ingredient-match` (đặt `DATABASE_URL` placeholder) |
| Integration test | `pnpm test:integration` | ⛔ Không chạy — sandbox **không có PostgreSQL** (`TEST_DATABASE_URL`) |
| E2E trình duyệt | — | ⛔ Không chạy — sandbox **không có browser headless** |

Trước P10: **249 unit test** (27 file). Sau P10: **337 unit test** (31 file) → **+88 test**.

## 2. Unit test mới (88)

| File | Số test | Nội dung |
| --- | --- | --- |
| `tests/lib/kitchen/timers.test.ts` | 31 | `clampDurationSeconds`, `createTimer`, `remainingSeconds` (running/paused/finished/quá hạn), `startTimer`/`pauseTimer` (tiếp tục giữ đúng còn lại), `tickTimer` (**một tick nhảy 10 phút vẫn finished đúng**), `resetTimer`/`setTimerDuration`/`renameTimer`, `formatClock`, `normalizeTimers`/`parseTimers`/`serializeTimers` (JSON hỏng/version/dedupe/giới hạn 12), `localStorage` (lưu–khôi phục–xoá, khôi phục đồng hồ đang chạy) |
| `tests/lib/kitchen/units.test.ts` | 23 | Khối lượng (SI/avoirdupois), thể tích (US customary + metric cup), nhiệt độ (kể cả −40), **từ chối** mass↔volume/khác nhóm (`incompatible`), đếm/tùy biến (`not_convertible`), đầu vào sai (unknown/NaN/âm/quá lớn), `parseAmountInput`, `formatConvertedValue`, `formatWithUnit`, `convertibleTargets` |
| `tests/lib/kitchen/ingredient-match.test.ts` | 17 | `normalizeText` (bỏ dấu tiếng Việt), `dedupeIngredients`, `ingredientMatches` (theo tên/slug, tránh khớp một phần), `matchRecipesByIngredients` (matched/missing/coverage, tách `missingRequired`, lọc `minMatched`, xếp hạng, chuẩn hoá) |
| `tests/components/kitchen.test.tsx` | 17 | `TimerForm` (tổng thời lượng, chặn 0 giây), `TimerCard` (nút/trạng thái/progressbar/đổi tên), `MultiTimer` (**thêm nhiều đồng hồ, chạy đồng thời, tạm dừng một cái không ảnh hưởng cái khác, khôi phục từ `localStorage`, empty state**), `UnitConverter` (quy đổi, input sai), `IngredientChip`/`MissingIngredients`, `RecipeMatchCard`, `IngredientSearch` (**tích hợp API: thêm nguyên liệu → fetch → hiển thị kết quả / lỗi mạng**) |
| **Tổng** | **88** | |

### Yêu cầu P10.5 ↔ độ phủ

- **Timer calculations / pause-resume / multiple / restoration** → `timers.test.ts` + `kitchen.test.tsx`.
- **Unit conversions / invalid pairs / temperature** → `units.test.ts`.
- **Ingredient normalization / duplicate removal / matching score / missing** → `ingredient-match.test.ts`.
- **Component** (timer card/form, multi-timer, converter, ingredient search/chip/match card) → `kitchen.test.tsx`.

## 3. Integration test

Đã viết **`tests/integration/kitchen.ingredient-match.test.ts`** (4 test): công thức `published` khớp
nguyên liệu trả kèm `missing`; chuẩn hoá/loại trùng đầu vào; **không** trả công thức không khớp; danh sách
rỗng → không kết quả.

**Chưa chạy** — sandbox **không có PostgreSQL** (`TEST_DATABASE_URL`). File đã được `typecheck`/`lint`
xác nhận hợp lệ. Đây là hạng mục **External Verification Pending** (B-P10-02).

## 4. E2E

**Không chạy** — sandbox không có trình duyệt headless (kế thừa B-P07_1-04/B-P08-02/B-P09-01).
Kịch bản mong muốn (tạo nhiều timer → chạy đồng thời → tạm dừng một cái → kiểm cái còn lại → quy đổi
đơn vị → nhập nguyên liệu → tìm công thức → mở công thức) được **phủ ở mức component/integration trong
jsdom**; bước cuối (điều hướng thật, khoá màn hình) cần môi trường thật.

## 5. Hồi quy

- Toàn bộ test cũ (P05–P09) vẫn pass: **337/337** (bao gồm 249 test trước P10).
- Thay đổi tương thích ngược: repository/service/validation **chỉ thêm** method/schema/DTO mới; UI **chỉ thêm**
  `components/kitchen/*`, route `/cong-cu*`, mục điều hướng — không sửa ngữ nghĩa cũ.

## 6. Chưa xác minh (trung thực)

- Integration test (PostgreSQL) và E2E/axe/Lighthouse/screen reader/thiết bị thật — không có môi trường.
- Kiểm thực tế khi đứng bếp (khoá màn hình, throttle trình duyệt, phát âm thanh, Notification API).
- Build cần biến `DATABASE_URL` (dự án yêu cầu cho route DB); sandbox chạy build với `DATABASE_URL` placeholder → exit 0.
