# P07 — RECIPE DOMAIN

> Mô hình domain công thức: thực thể, trường, DTO, ánh xạ, quy tắc nghiệp vụ, vòng đời trạng thái.
> Nguồn thiết kế: [docs/P02/DATABASE_SCHEMA.md](../P02/DATABASE_SCHEMA.md) + [ENTITY_RELATIONSHIP_DIAGRAM.md](../P02/ENTITY_RELATIONSHIP_DIAGRAM.md).
> Cập nhật: 2026-11-28 (P07).

---

## 1. Thực thể Recipe (P02 §Recipes)

Bảng `recipes` — ánh xạ model `Recipe` trong [prisma/schema.prisma](../../prisma/schema.prisma).

| Trường (Prisma) | Kiểu DB | Ghi chú | DTO |
| --- | --- | --- | --- |
| `id` | `uuid` PK `gen_random_uuid()` | UUID theo P02 | `id` |
| `slug` | `citext` UNIQUE | định danh URL, chỉ `[a-z0-9-]` | `slug` |
| `authorId` | `uuid` FK→`users` (RESTRICT) | người tạo | `authorId` |
| `editorId` | `uuid` FK→`users` (SET NULL, nullable) | người sửa gần nhất | `editorId` |
| `defaultLocale` | `varchar` | mặc định `"vi"` | `defaultLocale` |
| `status` | enum `recipe_status` | `draft\|in_review\|published\|archived` | `status` |
| `difficulty` | enum `difficulty` | `easy\|medium\|hard` | `difficulty` |
| `verificationStatus` | enum `verification` | `untested\|tested\|verified` | `verificationStatus` |
| `prepMinutes` / `cookMinutes` / `totalMinutes` | `int` nullable | phút | như trên |
| `baseServings` | `numeric(6,2)` | khẩu phần nền (chuỗi trong DTO để giữ chính xác) | `baseServings` |
| `publishedAt` | `timestamptz` nullable UTC | thời điểm xuất bản | `publishedAt` |
| `deletedAt` | `timestamptz` nullable UTC | **xóa mềm** | (không expose) |
| `createdAt` / `updatedAt` | `timestamptz` UTC | tự động | `createdAt` / `updatedAt` |

**Nội dung đa ngôn ngữ** nằm ở bảng `recipe_translations` (`recipeId` + `locale` UNIQUE):
`title`, `summary`, `description`, `seoTitle`, `seoDescription`, `tips`, ...

> Vì P07 hiện chỉ hiển thị tiếng Việt (`locale: "vi"`), DTO "làm phẳng" bản dịch vi
> ra các trường `title`/`summary`/`description`/`seoTitle`/`seoDescription` ở cấp cao nhất.
> Việc "làm phẳng" chỉ áp dụng cho locale được yêu cầu — **không** gộp mọi locale.

**SEO fields** phục vụ `<title>`/`<meta>` + JSON-LD (`seoTitle`, `seoDescription`).

**Phân loại chính** (`foodTypeSlug`, `cuisineSlug`) lưu ở bảng liên kết riêng trong P02;
repository resolve slug → `termId` và trả slug về DTO.

---

## 2. Recipe Translation (sẵn sàng i18n EN)

- Bảng `recipe_translations` UNIQUE(`recipe_id`, `locale`).
- Repository nhận tham số `locale`; hiện truyền `"vi"` từ service.
- **Không** hardcode nội dung tiếng Việt trong logic DB: schema/query trung lập locale.
- Fallback: nếu bản dịch theo locale không có, DTO trả `null` cho `summary`/`description`
  → UI ẩn mục đó (không bịa nội dung).

---

## 3. Ingredients (nguyên liệu)

Bảng `recipe_ingredients` (con thuộc sở hữu của recipe → **CASCADE** khi recipe bị xóa cứng;
soft-delete giữ nguyên dữ liệu).

| Trường | Ghi chú |
| --- | --- |
| `quantityType` | enum `quantity_type`: `decimal\|fraction\|range\|text` |
| `quantityNumeric` | `numeric(10,3)` — **nguồn** định lượng (số) |
| `quantityNumericMax` | `numeric(10,3)` — cho `range` |
| `quantityText` | fallback dạng chữ (chỉ khi `quantityType='text'`) |
| `unitId` | FK→`units` (RESTRICT) — đơn vị chuẩn |
| `isRequired` | bool — `false` = tùy chọn |
| `preparationNote` | ghi chú sơ chế (ví dụ "thái hạt lựu") |
| `groupLabel` | nhóm nguyên liệu (nếu có) |
| `sortOrder` | **thứ tự hiển thị** (bảo toàn) |
| `ingredientId` | FK→`ingredients` nullable (liên kết nguyên liệu nền) |
| `displayName` | tên hiển thị (có thể khác tên nền) |

**Nguyên tắc định lượng (P02 D-P02-07):** số là nguồn; phân số chỉ là lớp hiển thị.
**Không** ép định lượng về chuỗi tùy tiện. Định dạng hiển thị:
[formatIngredientAmount()](../../lib/presentation/recipe-view.ts) — chỉ đổi định dạng,
không bịa đơn vị.

---

## 4. Cooking Steps (bước nấu)

Bảng `recipe_steps` (con thuộc sở hữu → CASCADE khi xóa cứng).

| Trường | Ghi chú |
| --- | --- |
| `stepNo` | số thứ tự bước (1-based) |
| `sortOrder` | thứ tự sắp xếp (bảo toàn) |
| `instruction` | nội dung bước |
| `tip` | ghi chú/mẹo (tùy chọn) |

**Bộ đếm thời gian** (`recipe_step_timers`) và **ảnh bước** (`recipe_images` với `stepNo`)
là các bảng con; timer có `durationSeconds`, `temperatureC`, `temperatureNote`.

> ⚠️ P07 **không** tự bịa thời gian/nhiệt độ: nếu người dùng không nhập, timer/ảnh không
> được tạo. Xem [RECIPE_CONTENT_POLICY.md](./RECIPE_CONTENT_POLICY.md).

---

## 5. Taxonomy, Media, Nutrition, Allergen, Source

| Nhóm | Bảng | Ánh xạ trong DTO |
| --- | --- | --- |
| Category & Taxonomy | `recipe_taxonomy_terms` → `taxonomy_terms`/`taxonomy_types` | `taxonomy: RecipeTaxonomyTermDto[]`, `foodTypeSlug`, `cuisineSlug` |
| Media | `recipe_images` → `media_assets` | `primaryImage`, `images[]`, ảnh bước |
| Nutrition | `recipe_nutrition` | `nutrition: RecipeNutritionDto[]` |
| Allergen | `recipe_allergens` → `taxonomy_terms(axis=allergen)` | `allergens: RecipeAllergenDto[]` |
| Source | `recipe_sources` → `content_sources` | `sources: RecipeSourceDto[]` |
| Version | `recipe_versions` | `listVersions() → RecipeVersionDto[]` |
| Favorite | `favorites` | (thuộc P08+, chưa dùng ở P07) |

**Allergen** phân biệt `source` (`AllergenSource`: `declared|derived|contains|may_contain`) —
không tự thêm cảnh báo dị ứng khi không có dữ liệu.

**Nutrition** mang `basis` (`per_serving|per_100g|total`), `dataSourceType`
(`measured|calculated|estimated|unknown`), `sourceNote` — UI **chỉ** hiển thị khi có số liệu
và ghi rõ cơ sở tính + nguồn.

---

## 6. Vòng đời trạng thái (state machine)

```
            recipe:create
  (none) ──────────────▶ draft
                          │  recipe:submit_review
                          ▼
                       in_review
                          │  recipe:publish  (BR-01 + BR-03)
                          ▼
                      published ─────recipe:archive────▶ archived
                          ▲                                  │
                          └──────── recipe:publish ──────────┘
                      (bất kỳ) ──recipe:delete (Admin)──▶ soft-delete (deletedAt)
```

- `draft → in_review`: `submitForReview()` → `setStatus(id, "in_review")`.
- `publish()`: kiểm tra **đủ điều kiện xuất bản** (BR-01/BR-03) rồi `snapshotVersion()` + `publish()`.
- `archive()`: `snapshotVersion()` + `archive()` → giữ dữ liệu, **ẩn khỏi công khai**.
- `remove()`: **xóa mềm** (`deletedAt` + `status='archived'`) — chỉ Admin, giữ dữ liệu.

---

## 7. Quy tắc nghiệp vụ liên quan

| Mã | Quy tắc | Hiện thực |
| --- | --- | --- |
| BR-01 | Điều kiện xuất bản (tiêu đề, mô tả, loại món, xuất xứ, khẩu phần > 0, thời gian, ≥1 nguyên liệu, ≥1 bước, ảnh đại diện) | [assertPublishable()](../../lib/services/recipe.service.ts#L216-L243) |
| BR-03 | Yêu cầu nguồn tham khảo (kể cả nội dung tự biên soạn) | cùng hàm — `sources.length > 0` |
| BR-12 | Lưu trữ = giữ dữ liệu, ẩn khỏi công khai | `archive()` |
| BR-13 | Guest chỉ thấy `published` | `listPublic` + `getPublicBySlug` |

> Ghi chú: BR-03 được kiểm "có ít nhất một nguồn"; nội dung gốc tự khai báo bằng nguồn hệ
> thống "WALE COOKING (tự biên soạn)". Lý do: server **không** thể xác định chắc chắn tính
> "gốc" của nội dung. Xem [RECIPE_CONTENT_POLICY.md](./RECIPE_CONTENT_POLICY.md) §4.

---

## 8. Ánh xạ DTO → view-model (presentation)

Tất cả trong [lib/presentation/recipe-view.ts](../../lib/presentation/recipe-view.ts) (hàm thuần):

| DTO | View-model | Hàm |
| --- | --- | --- |
| `RecipeSummaryDto` | `RecipeSummary` | `toRecipeSummary` |
| `RecipeDetailDto` | `RecipeDetailViewModel` | `toRecipeDetail` |
| `RecipeIngredientDto` | `RecipeIngredient` | `toRecipeIngredient` + `formatIngredientAmount` |
| `RecipeStepDto` | `RecipeStep` | `toRecipeStep` (timer[0] → `durationMinutes`) |
| `RecipeAllergenDto` | `Allergen` | `toAllergenView` |
| `RecipeNutritionDto[]` | `NutritionViewModel` | `toNutritionViewModel` (chỉ chỉ số có dữ liệu) |
| `RecipeSourceDto` | `RecipeSourceView` | `toRecipeSourceView` |
| `RecipeAdminSummaryDto` | `AdminRecipeRowViewModel` | `toAdminRecipeRow` |
| `RecipeDetailViewModel` | JSON-LD | `toRecipeJsonLd` (schema.org/Recipe) |

**Quy tắc mapper:** không suy diễn, không bịa; thiếu trường → `undefined`/bỏ khỏi JSON-LD.
Ví dụ: không có `cookMinutes` → JSON-LD không có `cookTime`.

---

## 9. Kiểm thử domain

- Unit: [tests/lib/recipe-validation.test.ts](../../tests/lib/recipe-validation.test.ts) (19),
  [tests/lib/recipe.presentation.test.ts](../../tests/lib/recipe.presentation.test.ts) (17).
- Integration: [tests/integration/recipe.repository.test.ts](../../tests/integration/recipe.repository.test.ts) (8),
  [tests/integration/recipe.service.test.ts](../../tests/integration/recipe.service.test.ts) (14).
- Chi tiết kết quả: [TEST_REPORT.md](./TEST_REPORT.md).
