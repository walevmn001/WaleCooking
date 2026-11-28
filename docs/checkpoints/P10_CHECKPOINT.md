# P10 — CHECKPOINT: SMART KITCHEN TOOLS

> Phase: **P10** · Ngày: 2026-11-28 · Trạng thái: **HOÀN THÀNH (trong giới hạn môi trường)**
> Commit: commit chứa tài liệu này (xem `git log -1` trên `origin/main`).

## 1. Bối cảnh

Tiếp sau **P09** (trải nghiệm nấu trên trang công thức), P10 bổ sung **bộ công cụ nhà bếp thực dụng**
giúp chuẩn bị và thực hiện công thức thuận tiện hơn: nhiều đồng hồ đếm ngược, quy đổi đơn vị đo,
và tìm món theo nguyên liệu đang có. Tận dụng shared UI **P05**, Recipe domain/service **P07**,
Recipe Discovery **P08** và các nguyên tắc lưu cục bộ của **P09**.
**Không** mở rộng sang tài khoản khách/cộng đồng/AI; yêu thích vẫn dùng cookie.

## 2. Phạm vi đã hoàn thành

| Tiểu mục | Nội dung | Tài liệu |
| --- | --- | --- |
| P10.1 | Multiple Cooking Timers (nhiều đồng hồ, deadline là nguồn sự thật) | [MULTI_TIMER.md](../P10/MULTI_TIMER.md) |
| P10.2 | Unit Converter (quy đổi khối lượng/thể tích/nhiệt độ; không mass↔volume) | [UNIT_CONVERTER.md](../P10/UNIT_CONVERTER.md) |
| P10.3 | Ingredient-Based Recipe Discovery (tìm món theo nguyên liệu đang có) | [INGREDIENT_DISCOVERY.md](../P10/INGREDIENT_DISCOVERY.md) |
| P10.4 | Smart Kitchen Tools UI (8 component + khu vực `/cong-cu`) | [SMART_KITCHEN_UI.md](../P10/SMART_KITCHEN_UI.md) |
| P10.5 | Kiểm thử (+88 unit test) | [TEST_REPORT.md](../P10/TEST_REPORT.md) |
| P10.6 | Hoàn thành phase + checkpoint | Checkpoint này |

## 3. Thay đổi mã nguồn chính

**Thêm mới — logic thuần (`lib/kitchen/`):**
- `timers.ts` — mô hình `KitchenTimer`, `deadline` là nguồn sự thật; `createTimer`, `remainingSeconds`,
  `isFinished`, `startTimer`, `pauseTimer`, `resetTimer`, `setTimerDuration`, `renameTimer`,
  `tickTimer` (→ `{ timer, justFinished }`), `formatClock`, `clampDurationSeconds` + đọc/ghi
  `localStorage` an toàn SSR (`wale_timers_v1`, `parseTimers`/`normalizeTimers`/`serializeTimers`).
- `units.ts` — `UNIT_DEFINITIONS` (khối lượng SI/avoirdupois, thể tích US customary + metric cup,
  nhiệt độ, đếm, tùy biến), `convertUnit` (không ném lỗi → `ConversionResult`), `convertTemperature`,
  `getUnit`/`unitsByDimension`/`convertibleTargets`, `parseAmountInput`, `formatConvertedValue`.
- `ingredient-match.ts` — `normalizeText` (bỏ dấu tiếng Việt), `dedupeIngredients`, `ingredientMatches`,
  `matchRecipesByIngredients` (matched/missing/missingRequired/coverage/xếp hạng).
- `alerts.ts` — Web Audio (chỉ mở khoá qua tương tác), Notification API (chỉ xin quyền khi người dùng
  bấm), rung thiết bị, fallback trong trang; `index.ts` (barrel export).

**Thêm mới — UI (`components/kitchen/`), 8 component tái sử dụng:**
- `multi-timer.tsx`, `timer-card.tsx`, `timer-form.tsx`, `unit-converter.tsx`, `ingredient-search.tsx`,
  `ingredient-chip.tsx`, `recipe-match-card.tsx`, `missing-ingredients.tsx` (+ `index.ts`).
- Tái dùng `Card`, `Badge`, `Chip`, `Button`, `IconButton`, `Input`, `Select`, `EmptyState`,
  `ErrorState`, `Spinner`, `RecipeImage`, `CookingTime`/`ServingsBadge`/`DifficultyBadge` (P05) —
  **không** tạo component trùng chức năng.

**Thêm mới — trang & API:**
- `app/(public)/cong-cu/page.tsx` (hub 4 công cụ) + `cong-cu/{do-ng-ho,quy-doi-don-vi,tim-theo-nguyen-lieu}/page.tsx`.
- `app/api/v1/kitchen/ingredient-match/route.ts` — `GET`, nhận `q` (phân tách dấu phẩy) hoặc lặp
  `ingredient`; trả `{ ingredients, count, results }`; chỉ công khai, không cần đăng nhập.

**Sửa đổi (chỉ thêm, không đổi ngữ nghĩa cũ):**
- `lib/db/repositories/recipe.repository.ts` — thêm DTO `RecipeIngredientCandidateDto` + method
  `listPublicIngredientCandidates`; `prisma-recipe.repository.ts` — hiện thực (published, deletedAt=null,
  `take` clamp 1..500).
- `lib/services/recipe.service.ts` — thêm `matchByIngredients` (`DEFAULT_MATCH_CANDIDATE_LIMIT = 300`) +
  `toIngredientMatchCandidate`.
- `lib/validation/recipe.ts` — thêm `matchByIngredientsQuerySchema` (1..30 nguyên liệu, ≤ 80 ký tự).
- `lib/constants/navigation.ts` — thêm mục **"Công cụ"** (primaryNav) + nhóm **"Công cụ nhà bếp"** (footer).

**Kiểm thử mới (+88 unit test):**
- `tests/lib/kitchen/timers.test.ts` (31), `tests/lib/kitchen/units.test.ts` (23),
  `tests/lib/kitchen/ingredient-match.test.ts` (17), `tests/components/kitchen.test.tsx` (17).
- `tests/integration/kitchen.ingredient-match.test.ts` (4 — **chưa chạy**, thiếu PostgreSQL).

## 4. Schema / Migration

**Không có.** P10 **không** thay đổi schema, **không** tạo migration (nhất quán **D62/D63/D70**).
Đồng hồ dùng `localStorage` có version (D71); quy đổi đơn vị và so khớp nguyên liệu là **logic thuần
ở tầng miền**; repository chỉ **thêm** method đọc công khai trên model hiện có.

## 5. Kiểm thử đã chạy (kết quả thực tế)

| Kiểm tra | Kết quả |
| --- | --- |
| `pnpm typecheck` | ✅ **0 lỗi** |
| `pnpm lint` | ✅ **0 lỗi / 0 cảnh báo** |
| `pnpm test` | ✅ **337/337 pass** (31 file) — **+88 test P10** |
| `pnpm build` | ✅ thành công (exit 0) — thêm `/cong-cu*` + `/api/v1/kitchen/ingredient-match` (đặt `DATABASE_URL` placeholder) |
| `pnpm test:integration` | ⛔ Không chạy — không có PostgreSQL trong sandbox |
| E2E trình duyệt | ⛔ Không chạy — không có browser |

## 6. Chưa xác minh được (trung thực)

- Integration test P10.3 (PostgreSQL), E2E trình duyệt, axe/Lighthouse/screen reader/thiết bị thật —
  kế thừa blocker P07.1/P08/P09.
- Đối chiếu dụng cụ đo vật lý (cân/ca đong) cho hệ số quy đổi: chưa có.
- Hành vi thực tế khi khoá màn hình điện thoại / throttle trình duyệt / phát âm thanh / Notification API:
  chưa kiểm (dù đã thiết kế đúng nguyên tắc `deadline`).

## 7. Blocker

Xem `BLOCKERS.md` mục **B-P10-01** (kế thừa B-P07-04/B-P08-02/B-P09-01/B-P09-02) và **B-P10-02**.

## 8. Quyết định (ADR)

- **D71**: Đồng hồ đếm ngược lưu **cục bộ** (`localStorage` key `wale_timers_v1`, có `version`);
  **nguồn sự thật là `deadline` (epoch ms)** — `setInterval` chỉ kích hoạt re-render, **không** trừ theo
  số lần tick (đúng khi tab ẩn/khoá màn hình); khôi phục được khi tải lại. Không tài khoản, không DB.
- **D72**: Quy đổi đơn vị **chỉ** khi có hệ số xác định; **không** quy đổi khối lượng↔thể tích (thiếu
  tỷ trọng), **không** quy đổi giữa các đơn vị đếm; phân biệt **cup US** vs **metric cup** (250 ml);
  nhiệt độ theo công thức chuẩn; `convertUnit` **không ném lỗi** (trả `ConversionResult`). Logic tách
  khỏi UI.
- **D73**: Tìm món theo nguyên liệu dùng **thuật toán xác định trên dữ liệu thật** (chuẩn hoá tên bỏ
  dấu + so khớp tên/slug; điểm theo `matched`/`coverage`/`missingRequired`), **không** AI/dịch vụ trả phí,
  **không** tự tạo công thức, **không** đoán hai nguyên liệu khác tên là tương đương.
- **D74**: Tận dụng **Recipe Discovery API P08** (repository/service hiện có) — chỉ **thêm** method đọc
  `listPublicIngredientCandidates` + endpoint `/api/v1/kitchen/ingredient-match`; **không** thêm
  model/cột/migration, **không** thêm dependency.

## 9. Điều kiện chuyển phase

P10 hoàn thành (trong giới hạn môi trường) → **commit + push lên `origin/main`**, xác minh remote HEAD.
Đây là **phase cuối theo yêu cầu** (prompt chỉ định P09 + P10): **không** triển khai P11. Các hạng mục
"External Verification Pending" theo dõi ở `BLOCKERS.md`, không chặn kết thúc P10.
