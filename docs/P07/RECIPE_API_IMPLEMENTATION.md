# P07 — RECIPE API IMPLEMENTATION

> Hiện thực API module công thức theo [docs/P02/API_CONTRACT.md](../P02/API_CONTRACT.md) §2/§11/§12.
> Base path: `/api/v1`. Cập nhật: 2026-11-28 (P07).

---

## 1. Bảng endpoint đã triển khai

| Method | Đường dẫn | Handler | Quyền | Trạng thái P02 |
| --- | --- | --- | --- | --- |
| `GET` | `/api/v1/recipes` | [recipes/route.ts](../../app/api/v1/recipes/route.ts) | Guest | ✅ §2 |
| `POST` | `/api/v1/recipes` | [recipes/route.ts](../../app/api/v1/recipes/route.ts) | `recipe:create` | ✅ §2 (201) |
| `GET` | `/api/v1/recipes/{slug}` | [recipes/[id]/route.ts](../../app/api/v1/recipes/[id]/route.ts) | Guest | ✅ §2 |
| `PATCH` | `/api/v1/recipes/{id}` | [recipes/[id]/route.ts](../../app/api/v1/recipes/[id]/route.ts) | `recipe:update` | ✅ §2 |
| `DELETE` | `/api/v1/recipes/{id}` | [recipes/[id]/route.ts](../../app/api/v1/recipes/[id]/route.ts) | `recipe:delete` | ✅ §2 |
| `POST` | `/api/v1/recipes/{id}/submit-review` | [recipes/[id]/submit-review/route.ts](../../app/api/v1/recipes/[id]/submit-review/route.ts) | `recipe:submit_review` | ➕ bổ sung (D-P07-04) |
| `POST` | `/api/v1/recipes/{id}/publish` | [recipes/[id]/publish/route.ts](../../app/api/v1/recipes/[id]/publish/route.ts) | `recipe:publish` | ✅ §2 (422 nếu thiếu BR-01) |
| `POST` | `/api/v1/recipes/{id}/archive` | [recipes/[id]/archive/route.ts](../../app/api/v1/recipes/[id]/archive/route.ts) | `recipe:archive` | ✅ §2 |
| `GET` | `/api/v1/recipes/{id}/versions` | [recipes/[id]/versions/route.ts](../../app/api/v1/recipes/[id]/versions/route.ts) | `recipe:read:draft` | ✅ §2 |
| `GET` | `/api/v1/admin/recipes` | [admin/recipes/route.ts](../../app/api/v1/admin/recipes/route.ts) | `recipe:read:draft` | ✅ §11 |
| `POST` | `/api/v1/media` | [media/route.ts](../../app/api/v1/media/route.ts) | `media:upload` | ✅ §12 (201) |
| `GET` | `/api/v1/media/{id}` | [media/[id]/route.ts](../../app/api/v1/media/[id]/route.ts) | Guest (metadata) | ✅ §12 |
| `DELETE` | `/api/v1/media/{id}` | [media/[id]/route.ts](../../app/api/v1/media/[id]/route.ts) | `media:upload` | ✅ §12 (409 nếu còn tham chiếu) |
| `GET` | `/api/v1/media/file/{...key}` | [media/file/[...key]/route.ts](../../app/api/v1/media/file/[...key]/route.ts) | Guest | ➕ local provider |

> ➕ = endpoint **bổ sung có ghi nhận quyết định** (D-P07-04 / D-P07-05), không trùng contract.

---

## 2. Quy ước chung

### 2.1 Định dạng response

- Thành công: JSON của tài nguyên trực tiếp (`Paginated<...>` cho danh sách; `{ recipe }`,
  `{ asset }`, `{ versions }`, `{ ok: true }` cho thao tác).
- Lỗi (thống nhất, P02): 
  ```json
  { "error": { "code": "VALIDATION_ERROR", "message": "Dữ liệu không hợp lệ.", "details": { "slug": ["Slug đã được sử dụng."] } } }
  ```
- `handle()` bọc mọi handler → lỗi bất kỳ chuyển thành body an toàn. Lỗi **không xác định** →
  `500 INTERNAL` với thông điệp chung. **Không** trả stack trace / chi tiết DB.

### 2.2 Ánh xạ mã lỗi (P06 → P07)

| Kiểu | HTTP | Khi nào |
| --- | --- | --- |
| `ValidationError` | 422 | Zod thất bại; slug trùng; chưa đủ điều kiện publish; ảnh sai định dạng/quá lớn |
| `UnauthorizedError` | 401 | Guest gọi endpoint ghi (`getCurrentActor()` → `null`) |
| `ForbiddenError` | 403 | Đã đăng nhập nhưng thiếu permission |
| `NotFoundError` | 404 | Không tìm thấy recipe (hoặc không `published` khi đọc công khai) |
| `ConflictError` | 409 | Lưu trữ media còn công thức tham chiếu; khóa lưu trữ không hợp lệ |

Nguồn: [lib/errors/app-error.ts](../../lib/errors/app-error.ts), [lib/api/http.ts](../../lib/api/http.ts).

### 2.3 Validation

- **Mọi** input đi qua Zod phía server (`lib/validation/recipe.ts`, `catalog.ts`).
- Phân biệt hai loại slug (xem [DECISIONS.md](./../DECISIONS.md) D-P07-01):
  - `slugSchema` — slug **URL công thức**: `^[a-z0-9]+(?:-[a-z0-9]+)*$` (chỉ gạch ngang).
  - `termSlugSchema` — slug **từ vựng/nguyên liệu** (food type, cuisine, allergen, ingredient,
    equipment): cho phép thêm `_` vì seed P06 dùng `main_dish`, `gluten_free`, `stir_fry`.

---

## 3. Danh sách công khai — `GET /api/v1/recipes`

- Query (schema `listRecipesQuerySchema`): `q`, `foodType`, `cuisine`, `difficulty`,
  `sort` (`newest|az|popular`), `page`, `pageSize`.
- Lọc: **chỉ** `status='published'` AND `deleted_at IS NULL` (BR-13).
- Trả `Paginated<RecipeSummaryDto>`: `{ items, page, pageSize, total, totalPages }`.
- Tìm kiếm không dấu nhờ extension `unaccent` + `pg_trgm` (P02 D-P02-05).

## 4. Chi tiết công khai — `GET /api/v1/recipes/{slug}`

- Tham số đường dẫn là **slug**. `getPublicBySlug` trả `NotFoundError` (→ 404) nếu
  không tồn tại **hoặc** không ở trạng thái `published` (draft/in_review/archived → 404).
- Dùng chung cho trang chi tiết + `generateMetadata`.

## 5. Tạo công thức — `POST /api/v1/recipes`

1. `getCurrentActor()` — hiện trả `null` → `requirePermission` ném 401.
2. `parseInput(createRecipeSchema, body)` — validate toàn bộ (thông tin, nguyên liệu, bước,
   phân loại, ảnh).
3. Kiểm `slugExists` → `ValidationError` nếu trùng.
4. `recipeRepository.create()` trong **transaction** (recipe + translation + ingredients +
   steps + images + taxonomy + allergens + sources).
5. Mặc định `status: "draft"`; `authorId` lấy từ **actor** (không tin client).
6. Trả `{ recipe }` với **201**.

## 6. Cập nhật — `PATCH /api/v1/recipes/{id}`

- Tham số là **id**. `updateRecipeSchema` (partial).
- Nếu truyền `ingredients`/`steps`/`images`/`taxonomyTerms`/`allergenSlugs` → **thay thế toàn bộ**
  danh sách tương ứng (trong transaction), đảm bảo bảo toàn `sortOrder`/`stepNo`.
- `editorId` gán từ actor.
- Xung đột unique (vd slug) → `mapPrismaError` → 409/422 an toàn.

## 7. Chuyển trạng thái

| Endpoint | Chuyển | Ghi chú |
| --- | --- | --- |
| `submit-review` | → `in_review` | bổ sung tối thiểu (D-P07-04) |
| `publish` | → `published` | kiểm BR-01/BR-03; `snapshotVersion` trước khi đổi |
| `archive` | → `archived` | `snapshotVersion` + ẩn khỏi công khai (BR-12) |
| `DELETE` | soft-delete | đặt `deletedAt` + `status='archived'`; chỉ Admin |

Body tùy chọn `{ reason?: string }` (schema `recipeVersionReasonSchema`) để ghi vào
`changeSummary` của version.

## 8. Danh sách quản trị — `GET /api/v1/admin/recipes`

- Quyền `recipe:read:draft`.
- Hỗ trợ `status=draft|in_review|published|archived|any` (mặc định `any`), + cùng bộ lọc/phân trang.

## 9. Media

- `POST /api/v1/media` — `multipart/form-data`, trường `file` (+ `altText?`).
  Loại tệp xác định bằng **magic bytes**; KHÔNG tin `Content-Type` client. Trả 201 `{ asset }`.
- `DELETE /api/v1/media/{id}` — soft-archive; **409** nếu còn recipe tham chiếu.
- `GET /api/v1/media/file/{...key}` — chỉ phục vụ khi dùng **local provider** (dev/test);
  khi có R2 → trả 404 (R2 tự phục vụ). Chặn path traversal. Chi tiết: [RECIPE_MEDIA.md](./RECIPE_MEDIA.md).

## 10. Pagination / Filtering / Sorting

- `paginationSchema`: `page` (≥1, mặc định 1), `pageSize` (mặc định 10, **max 100**) — coerce số.
- `sort`: `newest` (mặc định) / `az` / `popular`.
- Ghi chú: `popular` — P07 sắp xếp theo chỉ số sẵn có (chưa có bảng thống kê lượt xem;
  không bịa số liệu). Xem [RECIPE_CONTENT_POLICY.md](./RECIPE_CONTENT_POLICY.md) §6.

## 11. Bảo mật API

- Authorization kiểm ở **server** trong service (không ở route/UI). Xem
  [RECIPE_AUTHORIZATION.md](./RECIPE_AUTHORIZATION.md).
- Không trả trường nội bộ (`deletedAt`, `authorId` chi tiết nội bộ) cho guest.
- Không mass-assignment: service chỉ đọc trường có trong schema; `authorId`/`editorId` do
  server gán.
- Rate limiting / WAF: **chưa** triển khai ở P07 (không thuộc phạm vi; cân nhắc phase sau).

## 12. Kiểm thử API

- Integration: [recipe.service.test.ts](../../tests/integration/recipe.service.test.ts) —
  CRUD, authorization (guest 401, editor/admin pass), slug trùng, publish thiếu điều kiện,
  phân trang, rollback.
- Unit: [recipe-validation.test.ts](../../tests/lib/recipe-validation.test.ts) — schema,
  `termSlugSchema` vs `slugSchema`.
- HTTP end-to-end **chưa** chạy (Auth.js chưa nối — B-P06-02). Xem [TEST_REPORT.md](./TEST_REPORT.md) §6.
