# RECIPE_DATA_AUDIT — P09.1

> WALE COOKING · Phase P09 (Cooking Experience) · Cập nhật: 2026-11-28.
> Mục đích: kiểm tra dữ liệu công thức THỰC CÓ trong schema/repository hiện tại để thiết kế P09.2–P09.4
> mà **không giả định** mọi công thức đều đủ trường và **không bịa** dữ liệu.

## 1. Phạm vi kiểm tra

- `prisma/schema.prisma` — các model công thức (`Recipe`, `RecipeIngredient`, `RecipeStep`,
  `RecipeStepTimer`, `RecipeImage`, `Unit`, `UnitConversion`, `CookingSession`, `CookingProgress`).
- `lib/db/repositories/recipe.repository.ts` — DTO tầng dữ liệu.
- `lib/db/repositories/prisma-recipe.repository.ts` — adapter Prisma (mapping DTO).
- `lib/presentation/recipe-view.ts` — view-model tầng trình bày.
- `components/recipe/types.ts` — kiểu dữ liệu component.
- `prisma/seed/data.ts` + `prisma/seed/run.ts` — dữ liệu seed (đơn vị, quy đổi, nguyên liệu nền).
- `app/(public)/cong-thuc/[slug]/page.tsx` — trang chi tiết công thức.

## 2. Trường dữ liệu công thức — phân loại

### 2.1 Có dữ liệu BẮT BUỘC (điều kiện xuất bản BR-01/BR-03)

`assertPublishable()` trong `lib/services/recipe.service.ts` chặn xuất bản nếu thiếu:

| Trường | Nguồn | Ghi chú |
| --- | --- | --- |
| `title` | `Recipe` + translation | Tên công thức |
| `summary` | `Recipe` | Mô tả ngắn |
| `foodTypeSlug` | `Recipe.foodTypeTerm` | BR-01 |
| `cuisineSlug` | `Recipe.cuisineTerm` | BR-01 |
| `baseServings` | `Recipe.base_servings` (`Decimal(6,2)`) | **> 0** — nền tảng Portion Scaling |
| thời gian | `prep/cook/totalMinutes` | Ít nhất một trong ba |
| `ingredients` | `RecipeIngredient[]` | ≥ 1 |
| `steps` | `RecipeStep[]` | ≥ 1 |
| `primaryImage` | `RecipeImage` (role primary) | Ảnh đại diện |
| `sources` | `ContentSource` | ≥ 1 (kể cả nguồn tự biên soạn) |

→ Mọi công thức đã xuất bản **đảm bảo** có: tên, mô tả, phân loại, số khẩu phần > 0,
thời gian, ≥ 1 nguyên liệu, ≥ 1 bước, ảnh đại diện, nguồn.

### 2.2 Có dữ liệu TÙY CHỌN

| Trường | Ghi chú |
| --- | --- |
| `difficulty` | Enum `easy/medium/hard` — luôn có giá trị mặc định |
| `RecipeIngredient.quantityNumeric` / `quantityNumericMax` / `quantityText` | Tùy `quantityType` |
| `RecipeIngredient.unitId` → `Unit` | Có thể NULL (nguyên liệu không nêu đơn vị) |
| `RecipeIngredient.isRequired` | Mặc định `true` → nhãn "Tuỳ chọn" khi `false` |
| `RecipeIngredient.preparationNote` | Có thể NULL |
| `RecipeIngredient.groupLabel` | Có thể NULL (nhóm nguyên liệu) |
| `RecipeStep.tip` | Có thể NULL |
| `RecipeStepTimer` | Có thể không có bước nào có timer |
| `RecipeStepImage` | Có thể không có ảnh cho bước |
| `RecipeNutrition` | Có thể rỗng (không hiển thị gì) |
| `RecipeAllergen` | Có thể rỗng |
| `RecipeSource` | ≥ 1 do BR-03 nhưng nội dung (url/license) có thể NULL |

### 2.3 CHƯA có dữ liệu / không dùng cho P09

| Trường / model | Trạng thái | Ảnh hưởng P09 |
| --- | --- | --- |
| `RecipeIngredient.isScalable` | **Có trong schema**, KHÔNG được trả ra DTO | Xem §4 (quyết định) |
| `CookingSession` / `CookingProgress` | Có model nhưng **yêu cầu `userId` (FK → User)** | **Không dùng cho khách** → P09 lưu tiến độ phía client |
| `IngredientDensity` (tỷ trọng khối lượng↔thể tích) | Model tồn tại, **seed KHÔNG có dữ liệu** | **Không** quy đổi g↔ml (P09/P10) |
| `UnitConversion` | Chỉ **5 dòng** (kg→g, mg→g, lb→g, oz→g, l→ml) | tsp/tbsp/cup **không có hệ số** → P10.2 xử lý riêng |
| `RecipeIngredientSubstitute` | Model tồn tại, chưa seed/không dùng UI | Không dùng ở P09 |

## 3. Shape định lượng & đơn vị (quan trọng cho Portion Scaling)

`RecipeIngredientDto` (P07) trả:

```ts
quantityType: "decimal" | "fraction" | "range" | "text";  // enum QuantityType
quantityNumeric: string | null;       // Decimal(10,3) → chuỗi giữ chính xác
quantityNumericMax: string | null;    // cho dạng khoảng
quantityText: string | null;          // cho dạng chữ ("vừa đủ")
unitCode / unitName / unitSymbol: string | null;
isRequired: boolean;
```

- Định lượng là **số gốc** (nguồn) dạng chuỗi; `lib/presentation/recipe-view.ts::formatIngredientAmount`
  chỉ **định dạng lại** để hiển thị (không bịa đơn vị, không suy diễn).
- `quantityType = "fraction"` lưu **giá trị thập phân** (Decimal), chỉ khác cách hiển thị.
- Đơn vị (`Unit`) có `dimension`: `mass | volume | count | custom`. Đơn vị `custom`
  (`pinch`/`to_taste`/`as_needed`) thường đi kèm `quantityType = "text"`.

Hệ quả cho P09.3:
- Nhân định lượng = nhân **số**, **giữ nguyên đơn vị** (không quy đổi mass↔volume).
- `quantityType = "text"` (vừa đủ, tùy ý…) **không nhân** — giữ nguyên.
- `quantityType = "range"` → nhân cả min và max.

## 4. Quyết định thiết kế (ghi nhận, không thay đổi kiến trúc)

1. **Không dùng `CookingSession`/`CookingProgress`** (P09.2/P09.4): hai model này bắt buộc
   `userId` (FK `User`), trong khi sản phẩm **không có tài khoản khách** (P07.1). Do đó tiến độ
   nấu và checklist **lưu cục bộ phía client** (localStorage, có `version`, giống module
   yêu thích-cookie), **không** ghi DB, **không** đưa dữ liệu cá nhân lên dịch vụ ngoài.
2. **Không mở rộng schema**: `RecipeIngredient.isScalable` đã tồn tại ở schema nên **không cần
   migration**. P09.3 áp dụng công thức nhân khẩu phần cho mọi định lượng **số**
   (`decimal`/`fraction`/`range`); định lượng dạng chữ giữ nguyên. Không surface `isScalable`
   ra DTO để tránh thay đổi lan rộng (quy tắc over-engineering) — ghi nhận là backlog tương lai.
3. **Không quy đổi đơn vị khi nhân khẩu phần**: `UnitConversion` thiếu hệ số cho tsp/tbsp/cup và
   `IngredientDensity` rỗng → không suy ra g↔ml. Chỉ nhân **số lượng**, giữ **nguyên đơn vị**.
4. **View-model tầng trình bày** (`components/recipe/types.ts`) được **bổ sung trường tùy chọn**
   chứa số gốc + đơn vị để client tự nhân khẩu phần mà **không** cần DTO Prisma.
   Bổ sung này **không phá** dữ liệu/component cũ (trường optional).

## 5. Kết luận

- Dữ liệu để Portion Scaling (P09.3): **đủ** — `baseServings` (>0) + định lượng số/đơn vị.
- Dữ liệu để Ingredient Checklist (P09.4): **đủ** — danh sách nguyên liệu + định lượng đã nhân.
- Dữ liệu để Cooking Mode (P09.2): **đủ** — `RecipeStep[]` (thứ tự, hướng dẫn, mẹo, thời lượng,
  ảnh bước nếu có). P09 bổ sung `imageUrl` tùy chọn vào `RecipeStep` view-model để hiển thị ảnh bước.
- **Không cần migration.** Không thay đổi model/database.
- Rủi ro đã biết: công thức có thể không có ảnh bước / không có timer → UI phải chịu được thiếu dữ liệu.
