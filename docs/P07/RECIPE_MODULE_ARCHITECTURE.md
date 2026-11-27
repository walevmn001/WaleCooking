# P07 — RECIPE MODULE ARCHITECTURE

> Kiến trúc module công thức (Recipe) trên nền dữ liệu P06, tái sử dụng UI P05.
> Chỉ ghi cái **đã hiện thực**; phần chưa xác minh ghi rõ ở §8.
> Cập nhật: 2026-11-28 (P07).

---

## 1. Vị trí trong kiến trúc P02

P07 **không** thay đổi kiến trúc P02 (D11). Module Recipe được triển khai theo đúng
**4 lớp + Ports & Adapters**:

```
Presentation (app/, components/)
        │  Server Components / Client Components
        ▼
Application (lib/services/*.service.ts)
        │  nghiệp vụ + authorization + validation
        ▼
Domain (DTO + port interfaces)
        │  RecipeRepository (interface) · StoragePort
        ▼
Infrastructure (lib/db/repositories/prisma-*.ts · lib/storage/*.adapter.ts)
        │
        ▼
PostgreSQL (Prisma)          +       Cloudflare R2 / Local (storage)
```

**Ràng buộc bất biến đã giữ** (P02 D-P02-01, P06 D46):

- Component React **KHÔNG** import Prisma. Toàn bộ dữ liệu đi qua `lib/services`.
- DTO tách khỏi model Prisma; view-model (P05) tách khỏi DTO (xem §4).
- Chỉ thay nhà cung cấp lưu trữ = đổi adapter, **không** đổi application/domain.

---

## 2. Sơ đồ luồng yêu cầu

### 2.1 Đọc công khai (guest)

```
Browser ──GET /cong-thuc?q=pho──▶ app/(public)/cong-thuc/page.tsx (RSC, force-dynamic)
                                         │  await searchParams (Next 16)
                                         ▼
                              recipeService.listPublic(query)
                                         │  parseInput(listRecipesQuerySchema)  ← Zod
                                         ▼
                              recipeRepository.listPublic(filters)
                                         │  WHERE status='published' AND deleted_at IS NULL
                                         ▼
                              PostgreSQL ──▶ Paginated<RecipeSummaryDto>
                                         │
                                         ▼
                       toRecipeSummary(dto)  ← lib/presentation/recipe-view.ts (hàm thuần)
                                         ▼
                              <RecipeCard /> (component P05)
```

### 2.2 Ghi / quản trị (Editor/Admin)

```
<RecipeForm /> ("use client") ──POST /api/v1/recipes──▶ app/api/v1/recipes/route.ts
        │                                                      │ getCurrentActor()
        │                                                      ▼
        │                                            recipeService.create(actor, body)
        │                                                      │ requirePermission(actor,"recipe:create")
        │                                                      ├─▶ parseInput(createRecipeSchema)
        │                                                      └─▶ recipeRepository.create()  [$transaction]
        │                                                              ▼
        │                                                       PostgreSQL + snapshot/version
        ▼
  render kết quả / lỗi (map từ AppError → JSON)
```

Toàn bộ endpoint nằm dưới `/api/v1` (đúng base path P02 §1).

---

## 3. Cây mã nguồn module Recipe

```
lib/
  services/
    recipe.service.ts          # nghiệp vụ công thức (đọc/ghi/publish/archive/version)
    media.service.ts           # nghiệp vụ tệp media (upload/archive)
    catalog.service.ts         # dữ liệu tham chiếu (đơn vị, taxonomy, nguyên liệu)
    index.ts                   # barrel export singleton
  db/repositories/
    recipe.repository.ts       # interface RecipeRepository + DTO
    prisma-recipe.repository.ts# adapter Prisma (transactions, mapping, term/unit resolve)
    media.repository.ts        # interface MediaRepository + DTO
    prisma-media.repository.ts # adapter Prisma cho media_assets
    index.ts                   # cổng `repositories`
  validation/
    recipe.ts                  # Zod: createRecipeSchema, updateRecipeSchema, listRecipesQuerySchema, ...
    catalog.ts                 # Zod cho taxonomy/ingredient
    common.ts                  # paginationSchema, slugSchema, termSlugSchema, parseInput, Paginated
  presentation/                # THUẦN (client & server dùng chung)
    recipe-view.ts             # DTO → view-model P05 + JSON-LD schema.org/Recipe
    recipe-links.ts            # parse/build query string danh sách công thức
    recipe-form-values.ts      # DTO → giá trị khởi tạo form
    slug.ts                    # slugify (xử lý tiếng Việt NFD + đ→d)
  auth/
    authorization.ts           # RBAC tập trung (can/requirePermission)
    session.ts                 # getCurrentActor() → null (Auth.js chưa nối)
  storage/
    storage.port.ts            # StoragePort (put/delete/publicUrl/getSignedUrl?)
    r2-storage.adapter.ts      # Cloudflare R2 (S3-compatible)
    local-storage.adapter.ts   # dev/test (ghi đĩa + route proxy)
    image-validation.ts        # magic bytes + giới hạn 8 MB / 8192px
    index.ts                   # getStorage() chọn adapter theo env

app/
  (public)/cong-thuc/
    page.tsx                   # danh sách công khai (lọc/phân trang)
    loading.tsx                # skeleton khi tải
    error.tsx                  # error boundary
    [slug]/page.tsx            # chi tiết công khai + JSON-LD + generateMetadata
  (admin)/admin/cong-thuc/
    page.tsx                   # bảng quản trị + lọc trạng thái
    moi/page.tsx               # tạo mới (gate recipe:create)
    [id]/sua/page.tsx          # sửa (gate recipe:update)
  api/v1/
    recipes/route.ts           # GET (public list) · POST (create)
    recipes/[id]/route.ts      # GET (public by slug) · PATCH · DELETE
    recipes/[id]/publish/route.ts
    recipes/[id]/archive/route.ts
    recipes/[id]/submit-review/route.ts
    recipes/[id]/versions/route.ts
    admin/recipes/route.ts     # GET danh sách quản trị
    media/route.ts             # POST upload
    media/[id]/route.ts        # GET/DELETE metadata
    media/file/[...key]/route.ts # GET phục vụ tệp (local provider)

components/
  admin/
    recipe-form.tsx            # form tạo/sửa (client)
    recipe-status-actions.tsx  # nút submit/publish/archive
    admin-access-notice.tsx    # thông báo khi thiếu quyền
  recipe/
    recipe-filters.tsx         # bộ lọc (client, cập nhật query string)
    + các component P05 tái sử dụng (recipe-card, ingredient-row, cooking-step-card, ...)
```

---

## 4. Ba tầng mô hình dữ liệu (quan trọng)

| Tầng | Kiểu | Ở đâu | Ai dùng |
| --- | --- | --- | --- |
| Prisma model | `Recipe`, `RecipeTranslation`, ... | `prisma/schema.prisma` | chỉ adapter repository |
| DTO | `RecipeDetailDto`, `RecipeSummaryDto`, ... | `lib/db/repositories/recipe.repository.ts` | service + presentation mapper |
| View-model | `RecipeSummary`, `RecipeDetailViewModel`, ... | `lib/presentation/recipe-view.ts` + `components/recipe/types.ts` | component React |

**Quy tắc:** mapper `lib/presentation/*` là **hàm thuần**, chỉ `import type` → an toàn cho
bundle client và dễ kiểm thử độc lập (không cần DB). Xem
[RECIPE_DOMAIN.md](./RECIPE_DOMAIN.md) để biết chi tiết ánh xạ.

---

## 5. Nguyên tắc bất biến của module

1. **Guest chỉ thấy `published`** (BR-13): `listPublic` lọc `status='published'` +
   `deleted_at IS NULL`; `getPublicBySlug` trả 404 nếu không `published`.
2. **Không hardcode role**: mọi kiểm tra quyền đi qua `can()` / `requirePermission()`
   (`lib/auth/authorization.ts`). Xem [RECIPE_AUTHORIZATION.md](./RECIPE_AUTHORIZATION.md).
3. **Không tin dữ liệu client**: mọi input qua Zod ở **server**; `parseInput` ném
   `ValidationError` (422). Không mass-assignment — service chỉ lấy trường được khai báo.
4. **Transaction** cho thao tác nhiều bảng (recipe + ingredients + steps + images + taxonomy).
5. **Không bịa nội dung**: presentation chỉ định dạng lại dữ liệu có thật; thiếu dữ liệu →
   ẩn mục đó, không suy diễn. Xem [RECIPE_CONTENT_POLICY.md](./RECIPE_CONTENT_POLICY.md).
6. **Không lưu bytes media vào Postgres**: bytes → storage adapter; DB chỉ metadata.

---

## 6. Tái sử dụng UI P05

Module Recipe **tái sử dụng** component P05, không viết lại:

| Component P05 | Dùng ở |
| --- | --- |
| `RecipeCard` / `RecipeCardCompact` | danh sách công khai |
| `RecipeImage` | chi tiết + card (mascot khi thiếu ảnh) |
| `IngredientList` / `IngredientRow` | chi tiết |
| `CookingStepCard` | chi tiết |
| `CookingTime` / `PreparationTime` / `ServingsBadge` / `DifficultyBadge` | chi tiết + card |
| `NutritionSummary` | chi tiết (chỉ khi có dữ liệu) |
| `AllergenBadges` | chi tiết |
| `Pagination` / `Breadcrumb` / `EmptyState` / `ErrorState` | danh sách |
| `FormField` / `Input` / `Textarea` / `Select` | form quản trị |

Chi tiết xem [RECIPE_FRONTEND.md](./RECIPE_FRONTEND.md).

---

## 7. Phân tách trách nhiệm (layer responsibilities)

| Layer | Trách nhiệm | Không được làm |
| --- | --- | --- |
| Page / Component | render, điều hướng, tương tác | gọi Prisma, chứa business rule |
| Service | nghiệp vụ, authorization, validation, transaction boundary (qua repo) | viết SQL, chạm React |
| Repository (port) | khai báo hợp đồng dữ liệu (DTO) | biết HTTP/React |
| Repository (adapter) | truy vấn Prisma, mapping, transaction | biết HTTP, biết quyền |
| Presentation mapper | DTO → view-model (thuần) | chạm DB/React |
| Storage adapter | lưu/đọc bytes | chạm DB quan hệ |

---

## 8. Phần CHƯA xác minh (ghi rõ, không tuyên bố)

- ⛔ **Auth.js chưa nối** → `getCurrentActor()` luôn trả `null`; mọi thao tác ghi qua HTTP
  trả **401**. Authorization đã kiểm ở tầng unit + integration (gọi service với actor giả
  **trong test**), **chưa** kiểm end-to-end qua phiên đăng nhập thật (B-P06-02).
- ⛔ **Cloudflare R2 chưa có credentials** → media chạy trên **LocalStorageAdapter** (dev/test);
  R2 adapter đã hoàn thiện nhưng **chưa** kết nối bucket thật (B-P06-03 / B-P07-01).
- ⛔ Không có trình duyệt headless → không chạy E2E/axe/Lighthouse; UI kiểm ở mức
  render + typecheck + build (kế thừa B-P05-01).
- ⛔ Nhánh i18n EN: schema & truy vấn đã sẵn (`defaultLocale` + bảng translation),
  nhưng nội dung hiển thị hiện **chỉ tiếng Việt** (`locale: "vi"`).

---

## 9. Tham chiếu

- [RECIPE_DOMAIN.md](./RECIPE_DOMAIN.md) · [RECIPE_API_IMPLEMENTATION.md](./RECIPE_API_IMPLEMENTATION.md)
- [RECIPE_FRONTEND.md](./RECIPE_FRONTEND.md) · [RECIPE_MEDIA.md](./RECIPE_MEDIA.md)
- [RECIPE_AUTHORIZATION.md](./RECIPE_AUTHORIZATION.md) · [RECIPE_CONTENT_POLICY.md](./RECIPE_CONTENT_POLICY.md)
- [TEST_REPORT.md](./TEST_REPORT.md)
- P02: [API_CONTRACT.md](../P02/API_CONTRACT.md) · [DATABASE_SCHEMA.md](../P02/DATABASE_SCHEMA.md) · [MEDIA_STORAGE.md](../P02/MEDIA_STORAGE.md)
- P06: [REPOSITORY_ARCHITECTURE.md](../P06/REPOSITORY_ARCHITECTURE.md)
