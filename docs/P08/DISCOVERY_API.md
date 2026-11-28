# P08 — Recipe Discovery API & bộ lọc

> Phase: **P08** · Ngày: 2026-11-28.
> Phạm vi: P08 §P08.2 — danh sách/chi tiết công thức, danh mục, tìm kiếm, lọc, phân trang, sắp xếp.
> Nguyên tắc: **chỉ** triển khai bộ lọc dựa trên dữ liệu thật có trong schema/công thức — không bịa.

## 1. Bộ lọc khám phá (query string)

Mở rộng `listRecipesQuerySchema` tại [lib/validation/recipe.ts](../../lib/validation/recipe.ts):

| Tham số | Kiểu | Ý nghĩa | Nguồn dữ liệu |
| --- | --- | --- | --- |
| `q` | string ≤200 | Từ khoá tìm kiếm | tiêu đề/mô tả công thức |
| `foodType` | string | Loại món | `food_type` |
| `cuisine` | string | Xuất xứ | `cuisine` |
| `mealType` | string | Bữa ăn | `meal_type` |
| `cookingMethod` | string | Phương pháp chế biến | `cooking_method` |
| `dietary` | string | Đặc điểm món | `dietary_preference` |
| `ingredient` | string | Nguyên liệu cụ thể | nguyên liệu công thức |
| `ingredientCategory` | string | Nhóm nguyên liệu chính | nhóm nguyên liệu |
| `maxMinutes` | int 1–28800 | Tổng thời gian tối đa (phút) | `total_minutes` |
| `difficulty` | enum | Độ khó | `difficulty` |
| `sort` | `newest`/`az`/`popular` | Sắp xếp | — |
| `page` / `pageSize` | int | Phân trang | — |

Chỉ hiển thị/áp dụng ô lọc khi **có dữ liệu**: `RecipeFilters` nhận `mealTypes`/`cookingMethods`
tùy chọn và tự ẩn ô khi mảng rỗng.

## 2. Quy đổi tham số → bộ lọc repository

Hàm `buildDiscoveryFilters(parsed)` trong [lib/services/recipe.service.ts](../../lib/services/recipe.service.ts):

```ts
taxonomy = []                              // chỉ push khi CÓ giá trị
  mealType       → { typeCode: "meal_type",          slug }
  cookingMethod  → { typeCode: "cooking_method",     slug }
  dietary        → { typeCode: "dietary_preference", slug }
ingredient         → ingredientSlug
ingredientCategory → ingredientCategorySlug
maxMinutes         → maxTotalMinutes
```

`RecipeListFilters` ([lib/db/repositories/recipe.repository.ts](../../lib/db/repositories/recipe.repository.ts))
có thêm `taxonomy?` (kết hợp AND), `ingredientCategorySlug?`, `ingredientSlug?`, `maxTotalMinutes?`.
Nhiều term taxonomy trong 1 truy vấn = **AND** (món vừa ăn sáng vừa hấp).

## 3. Danh sách theo danh mục

`recipeService.listPublicForCategory({ typeCode, slug, filterKind, page, pageSize, sort, search })`:

- `filterKind === "direct"` → lọc qua `taxonomy: [{ typeCode, slug }]`.
- `filterKind === "ingredient_category"` → lọc qua `ingredientCategorySlug`.
- Mặc định: `pageSize = 12`, `sort = "newest"`.

Trang `/danh-muc/{segment}/{slug}` gọi hàm này (xem [CATEGORY_PAGES.md](./CATEGORY_PAGES.md)).

## 4. Hợp đồng đọc công khai

`recipeService.listPublic(query)` ([lib/services/recipe.service.ts](../../lib/services/recipe.service.ts)):

- **CHỈ** công thức `published` (BR-13) — điều kiện nằm ở repository.
- Trả `Paginated<RecipeSummaryDto>`: `{ items, total, page, pageSize, totalPages }`.
- An toàn: mọi tham số đi qua Zod (`parseInput`) ở server trước khi tới repository.

## 5. Helper đường dẫn (thuần)

[lib/presentation/recipe-links.ts](../../lib/presentation/recipe-links.ts) — dùng chung Server/Client:

- `parseRecipeListParams(searchParams)` — chuẩn hoá (bỏ rỗng, page 1, maxMinutes không hợp lệ).
- `buildRecipeListHref(params, overrides)` — bỏ giá trị mặc định (sort `newest`, page 1) cho URL gọn.
- `RECIPE_LIST_BASE = "/cong-thuc"`.

## 6. Endpoint / UI sử dụng

| Bề mặt | Vị trí |
| --- | --- |
| Danh sách công thức | `/cong-thuc` — [app/(public)/cong-thuc/page.tsx](../../app/(public)/cong-thuc/page.tsx) |
| Bộ lọc (client) | [components/recipe/recipe-filters.tsx](../../components/recipe/recipe-filters.tsx) |
| Theo danh mục | `/danh-muc/{segment}/{slug}` |
| API công khai (P07) | `GET /api/v1/recipes` (dùng cùng `listPublic`) |

## 7. Không triển khai (ngoài phạm vi)

- Bộ lọc theo **giá trị dinh dưỡng / nhiệt độ lò** — chưa có dữ liệu đủ tin cậy → **không** tạo.
- Xếp hạng "phổ biến" dựa trên lượt xem/đánh giá — chưa có dữ liệu (không có tài khoản/đánh giá);
  `sort=popular` chỉ là thứ tự mặc định có kiểm soát ở repository, **không** bịa chỉ số.
