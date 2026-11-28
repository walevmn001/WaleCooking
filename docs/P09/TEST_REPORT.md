# TEST REPORT — P09 (Cooking Experience)

> WALE COOKING · Phase P09 · Ngày: 2026-11-28 · Môi trường: sandbox Linux, không có PostgreSQL/credentials/browser.

## 1. Tổng quan kết quả

| Kiểm tra | Lệnh | Kết quả |
| --- | --- | --- |
| Typecheck | `pnpm typecheck` | ✅ **0 lỗi** |
| Lint | `pnpm lint` | ✅ **0 lỗi / 0 cảnh báo** |
| Unit test | `pnpm test` | ✅ **249/249 pass** (27 file) — **+50 test P09** |
| Build | `pnpm build` | ✅ thành công (exit 0) — **không thêm route mới** |
| Integration test | `pnpm test:integration` | ⛔ Không chạy — sandbox **không có PostgreSQL** (`TEST_DATABASE_URL`) |
| E2E trình duyệt | — | ⛔ Không chạy — sandbox **không có browser headless** |

Trước P09: **199 unit test** (24 file). Sau P09: **249 unit test** (27 file) → **+50 test**.

## 2. Unit test mới

| File | Số test | Nội dung |
| --- | --- | --- |
| `tests/lib/cooking.portion.test.ts` | 21 | `servingFactor`, `clampServings`, `parseServingsInput` (số/thập phân/phân số/giá trị sai), `formatScaledNumber` (2 chữ số, "-0"), `scaleIngredientAmount` (decimal/fraction/range/text/đơn vị không hỗ trợ/thiếu dữ liệu/factor sai), `scaleIngredients` |
| `tests/lib/cooking.state.test.ts` | 18 | `createCookingState`, `normalizeCheckedIds` (dedupe/lọc), `parseCookingState` (JSON hỏng/version/slug/kẹp stepIndex/lọc id), `checklistProgress`, lưu–khôi phục–xoá `localStorage` (jsdom) |
| `tests/components/cooking.test.tsx` | 11 | `CookingProgress` (số bước + ARIA, kẹp), `PortionSelector` (tăng/giảm/khôi phục/nhập trực tiếp + kẹp trần), `IngredientChecklist` (tiến độ, toggle, reset), `CookingExperience` (nhân khẩu phần 200 g→400 g, mở chế độ nấu & chuyển bước, tick lưu `localStorage`) |
| **Tổng** | **50** | |

### Yêu cầu P09.7 ↔ độ phủ

- Tính tỷ lệ khẩu phần, định lượng mới, phân số, số thập phân, đơn vị không hỗ trợ, giá trị không hợp lệ → `cooking.portion`.
- Checklist, cooking progress, khôi phục trạng thái → `cooking.state` + `cooking.test.tsx`.
- Kịch bản E2E P09.7 (đổi khẩu phần → kiểm định lượng → đánh dấu → mở chế độ nấu → chuyển bước →
  tải lại → khôi phục) được phủ ở mức **component/integration trong jsdom** (không có browser thật).

## 3. Integration test

**Không chạy.** P09 **không thêm logic server/schema/migration** (xem [RECIPE_DATA_AUDIT.md](./RECIPE_DATA_AUDIT.md) §4):
Cooking Mode/Checklist/Portion Scaling chạy hoàn toàn ở client/trình bày. Do đó không có integration
test mới; các integration test hiện có (recipe/taxonomy) không bị ảnh hưởng.

## 4. E2E

**Không chạy** — sandbox không có trình duyệt headless (kế thừa B-P07_1-04/B-P08-02). Kịch bản E2E
mong muốn ghi lại ở [COOKING_MODE.md](./COOKING_MODE.md) §6 để chạy khi có môi trường.

## 5. Hồi quy

- Toàn bộ test cũ (P05–P08) vẫn pass.
- `components/recipe/types.ts` chỉ **thêm trường optional** (`quantityData`, `imageUrl`, `imageAlt`)
  → không phá test/component cũ.
- `lib/presentation/recipe-view.ts` bổ sung trường vào view-model; `recipe.presentation.test.ts` (17 test) vẫn pass.

## 6. Chưa xác minh (trung thực)

- E2E/axe/Lighthouse/screen reader/thiết bị thật — không có môi trường.
- Build cần biến `DATABASE_URL` (dự án yêu cầu cho route DB); sandbox chạy build với
  `DATABASE_URL` placeholder → exit 0.
