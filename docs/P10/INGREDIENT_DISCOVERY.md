# INGREDIENT DISCOVERY — Tìm món theo nguyên liệu đang có (P10.3)

> WALE COOKING · Phase P10 · Ngày: 2026-11-28.
> Logic thuần: [`lib/kitchen/ingredient-match.ts`](../../lib/kitchen/ingredient-match.ts) ·
> Service: [`lib/services/recipe.service.ts`](../../lib/services/recipe.service.ts) (`matchByIngredients`) ·
> Repository: [`prisma-recipe.repository.ts`](../../lib/db/repositories/prisma-recipe.repository.ts) (`listPublicIngredientCandidates`) ·
> API: [`app/api/v1/kitchen/ingredient-match/route.ts`](../../app/api/v1/kitchen/ingredient-match/route.ts) ·
> UI: [`components/kitchen/ingredient-search.tsx`](../../components/kitchen/ingredient-search.tsx).

## 1. Mục tiêu

Người dùng nhập những nguyên liệu **mình đang có** (ví dụ: trứng, cà chua, hành lá) → website trả về
những công thức **có thật trong dữ liệu** khớp với các nguyên liệu đó, kèm nguyên liệu **đã có** và
**còn thiếu**.

**Không** dùng AI/dịch vụ trả phí, **không** tự tạo công thức, **không** đoán hai nguyên liệu khác tên
là tương đương.

## 2. Chuẩn hoá đầu vào

`normalizeText` (thuần): bỏ **dấu tiếng Việt** (NFD + loại combining marks), `đ/Đ → d`, chữ thường,
bỏ ký tự đặc biệt, gộp khoảng trắng. `dedupeIngredients`: loại trùng theo dạng đã chuẩn hoá
(không phân biệt hoa/thường/dấu), giữ hình thức hiển thị đầu tiên.

## 3. So khớp

`ingredientMatches(userNorm, ing)`: khớp theo **tên đã chuẩn hoá** (khớp nguyên từ/đầu/cuối — tránh
khớp một phần tuỳ tiện) hoặc theo **slug định danh** khi có. Không có bảng đồng nghĩa tự phát; mọi
so khớp dựa trên tên/định danh thật trong DB.

## 4. Điểm phù hợp & xếp hạng

`matchRecipesByIngredients(userIngredients, candidates, { minMatched = 1 })` trả về mỗi ứng viên:

| Trường | Ý nghĩa |
| --- | --- |
| `matched[]` | Tên nguyên liệu của công thức **đã có** trong danh sách người dùng |
| `missing[]` | Tên nguyên liệu của công thức **còn thiếu** |
| `missingRequired[]` | Trong số thiếu, những nguyên liệu **bắt buộc** (`required !== false`) |
| `userMatchedCount` | Số nguyên liệu **người dùng** khớp được (đếm theo phía người dùng) |
| `matchedCount` / `missingCount` / `totalIngredients` / `coverage` | Tỷ lệ nguyên liệu công thức đã có (`matched/total`) |
| `userCoverage` | `userMatchedCount / số nguyên liệu người dùng` |
| `completeRequired` | Đã đủ mọi nguyên liệu **bắt buộc** chưa |

Sắp xếp: `userMatchedCount ↓` → `coverage ↓` → `missingRequired` ít hơn → `missingCount` ít hơn → tiêu đề.
Chỉ trả công thức khớp ≥ `minMatched` nguyên liệu người dùng (`minMatched` mặc định 1).

> **Không khẳng định "nấu được"**: `missingRequired` được tách riêng và hiển thị nổi bật, kể cả khi
> tỷ lệ khớp cao.

## 5. Tầng dữ liệu & API

- Repository `listPublicIngredientCandidates(locale, limit)`: lấy công thức `status="published",
  deletedAt=null`, `take = clamp(1..500)`, kèm translation + ảnh chính + nguyên liệu
  (`displayName`, `ingredient.slug`, `isRequired`). Trả DTO `RecipeIngredientCandidateDto`.
- Service `matchByIngredients(rawIngredients, { limit })`: dedupe → validate (`matchByIngredientsQuerySchema`:
  1..30 nguyên liệu, mỗi cái ≤ 80 ký tự) → nạp ứng viên (`DEFAULT_MATCH_CANDIDATE_LIMIT = 300`) → chấm điểm.
- `GET /api/v1/kitchen/ingredient-match` — nhận `q=trứng,cà chua` hoặc lặp `ingredient=...`;
  trả `{ ingredients, count, results }`. Chỉ công khai, không cần đăng nhập.

## 6. UI

[`IngredientSearch`](../../components/kitchen/ingredient-search.tsx): nhập nguyên liệu → chip (`IngredientChip`)
có nút xoá; nút **Tìm công thức** gọi API; trạng thái **idle/loading/success/error** rõ ràng; kết quả là
lưới `RecipeMatchCard`. Khi không có kết quả → `EmptyState` gợi ý **bỏ bớt điều kiện** hoặc thêm nguyên liệu.
Giới hạn UI 30 nguyên liệu (khớp schema).

## 7. Trường hợp không tìm thấy

Hiển thị "Không tìm thấy công thức phù hợp" + gợi ý bỏ bớt điều kiện — **không** hiển thị kết quả giả,
**không** bịa công thức, **không** gợi ý nguyên liệu ngoài dữ liệu thực.

## 8. Chưa xác minh

Không có PostgreSQL trong sandbox → **integration test đã viết nhưng chưa chạy** (xem
`tests/integration/kitchen.ingredient-match.test.ts`, B-P10-02). Thuật toán khớp ở tầng miền được
phủ đầy đủ bằng unit test.
