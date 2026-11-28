# P09 — CHECKPOINT: COOKING EXPERIENCE

> Phase: **P09** · Ngày: 2026-11-28 · Trạng thái: **HOÀN THÀNH (trong giới hạn môi trường)**
> Commit: commit chứa tài liệu này (xem `git log -1` trên `origin/main`).

## 1. Bối cảnh

Tiếp sau **P08** (taxonomy & khám phá), P09 biến website từ "tra cứu công thức" thành "hỗ trợ nấu ăn":
chế độ nấu từng bước, chỉnh khẩu phần, checklist nguyên liệu — ngay trên trang chi tiết công thức.
Tận dụng shared UI **P05**, Recipe domain/view-model **P07**, taxonomy/discovery **P08**.
**Không** mở rộng sang tài khoản khách/cộng đồng; yêu thích vẫn dùng cookie.

## 2. Phạm vi đã hoàn thành

| Tiểu mục | Nội dung | Tài liệu |
| --- | --- | --- |
| P09.1 | Audit dữ liệu công thức (phân loại trường, quyết định thiết kế) | [RECIPE_DATA_AUDIT.md](../P09/RECIPE_DATA_AUDIT.md) |
| P09.2 | Cooking Mode (chế độ nấu toàn màn hình) | [COOKING_MODE.md](../P09/COOKING_MODE.md) |
| P09.3 | Portion Scaling (nhân định lượng theo khẩu phần) | [PORTION_SCALING.md](../P09/PORTION_SCALING.md) |
| P09.4 | Ingredient Checklist | [INGREDIENT_CHECKLIST.md](../P09/INGREDIENT_CHECKLIST.md) |
| P09.5 | Cooking Progress UI (component tái sử dụng) | (trong các tài liệu trên) |
| P09.6 | UX & Accessibility | [COOKING_MODE.md](../P09/COOKING_MODE.md) §7/§8 |
| P09.7 | Kiểm thử | [TEST_REPORT.md](../P09/TEST_REPORT.md) |
| P09.8 | Hoàn thành phase + checkpoint | Checkpoint này |

## 3. Thay đổi mã nguồn chính

**Thêm mới — logic thuần (`lib/cooking/`):**
- `portion.ts` — `servingFactor`, `clampServings`, `parseServingsInput`, `formatScaledNumber`,
  `scaleIngredientAmount`, `scaleIngredients` (+ `MIN_SERVINGS`/`MAX_SERVINGS`).
- `state.ts` — trạng thái phiên nấu/checklist, `version`, đọc/ghi `localStorage` an toàn SSR
  (`createCookingState`, `parseCookingState`, `serializeCookingState`, `normalizeCheckedIds`,
  `checklistProgress`, `load/save/clearCookingState`).

**Thêm mới — UI (`components/cooking/`):**
- `cooking-experience.tsx` (vỏ state chính), `cooking-mode.tsx` (`CookingModeLayout`, portal),
  `cooking-progress.tsx`, `ingredient-checklist.tsx`, `portion-selector.tsx`,
  `cooking-exit-confirmation.tsx`, `index.ts` (barrel export).

**Sửa đổi:**
- `components/recipe/types.ts` — thêm `IngredientQuantityData` + `quantityData?` vào `RecipeIngredient`;
  thêm `imageUrl?`/`imageAlt?` vào `RecipeStep` (đều **optional**).
- `lib/presentation/recipe-view.ts` — `toRecipeIngredient` điền `quantityData`;
  `toRecipeStep` điền ảnh bước từ `dto.images[0]`.
- `app/(public)/cong-thuc/[slug]/page.tsx` — thay `IngredientList` bằng `CookingExperience`
  trong khối "Nguyên liệu".

**Kiểm thử mới (+50 unit test):**
- `tests/lib/cooking.portion.test.ts` (21), `tests/lib/cooking.state.test.ts` (18),
  `tests/components/cooking.test.tsx` (11).

## 4. Schema / Migration

**Không có.** P09 **không** thay đổi schema, **không** tạo migration. Lý do ở
[RECIPE_DATA_AUDIT.md](../P09/RECIPE_DATA_AUDIT.md) §4: `CookingSession`/`CookingProgress` yêu cầu
`userId` (sản phẩm không có tài khoản khách) → dùng `localStorage`; `RecipeIngredient.isScalable`
đã tồn tại ở schema nên không cần thêm cột.

## 5. Kiểm thử đã chạy (kết quả thực tế)

| Kiểm tra | Kết quả |
| --- | --- |
| `pnpm typecheck` | ✅ **0 lỗi** |
| `pnpm lint` | ✅ **0 lỗi / 0 cảnh báo** |
| `pnpm test` | ✅ **249/249 pass** (27 file) — +50 test P09 |
| `pnpm build` | ✅ thành công (exit 0) — không thêm route mới (đặt `DATABASE_URL` placeholder) |
| `pnpm test:integration` | ⛔ Không chạy — không có PostgreSQL trong sandbox |
| E2E trình duyệt | ⛔ Không chạy — không có browser |

## 6. Chưa xác minh được (trung thực)

- Neon PostgreSQL, Cloudflare R2, Auth.js/HTTP 401-403, E2E trình duyệt, axe/Lighthouse —
  kế thừa blocker P07.1/P08.
- Cooking Mode/Checklist chưa kiểm trên **thiết bị thật khi đứng bếp** (touch target, khóa màn hình).

## 7. Blocker

Xem `BLOCKERS.md` mục **B-P09-01 … B-P09-03**.

## 8. Quyết định (ADR)

- **D67**: Tiến độ nấu & checklist lưu **cục bộ** (`localStorage`, có version) — **không** dùng
  `CookingSession`/`CookingProgress` (yêu cầu `userId`), **không** ghi DB, **không** tài khoản khách.
- **D68**: Portion Scaling **chỉ nhân số, giữ nguyên đơn vị**; **không** quy đổi khối lượng↔thể tích
  (thiếu tỷ trọng); định lượng dạng chữ giữ nguyên; làm tròn tối đa 2 chữ số thập phân.
- **D69**: Bổ sung trường **optional** vào view-model (`quantityData`, `imageUrl`, `imageAlt`) để client
  tự tính mà không cần surface DTO Prisma — **không** phá dữ liệu/component cũ.
- **D70**: **Không** mở rộng schema/migration cho P09 (tôn trọng quyết định không thêm cột P07.1/P08).

## 9. Điều kiện chuyển phase

P09 hoàn thành (trong giới hạn môi trường) → **commit + push lên `origin/main`**, xác minh remote HEAD
**trước khi** bắt đầu P10 (đúng quy trình prompt §VI). Các hạng mục "External Verification Pending"
theo dõi ở `BLOCKERS.md`, không chặn kết thúc P09.
