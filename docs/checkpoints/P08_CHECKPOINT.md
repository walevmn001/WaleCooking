# P08 — CHECKPOINT: TAXONOMY & RECIPE DISCOVERY

> Phase: **P08** · Ngày: 2026-11-28 · Trạng thái: **HOÀN THÀNH (trong giới hạn môi trường)**
> Commit: commit chứa tài liệu này (xem `git log -1` trên `origin/main`).

## 1. Bối cảnh

Tiếp sau **P07.1** (điều chỉnh mô hình không tài khoản khách + yêu thích bằng cookie), P08 xây
hệ thống **phân loại & khám phá công thức**, phục vụ khách truy cập tìm món để nấu. Tận dụng
taxonomy P06, module Recipe P07 và shared UI P05. **Không** mở rộng sang cộng đồng/tài khoản khách.

## 2. Phạm vi đã hoàn thành

| Tiểu mục | Nội dung | Tài liệu / Artifact |
| --- | --- | --- |
| P08.1 | Taxonomy domain (6 trục khám phá, `filterKind`) | [TAXONOMY_DISCOVERY.md](../P08/TAXONOMY_DISCOVERY.md) |
| P08.2 | Recipe Discovery API & bộ lọc | [DISCOVERY_API.md](../P08/DISCOVERY_API.md) |
| P08.3 | Trang danh mục công khai | [CATEGORY_PAGES.md](../P08/CATEGORY_PAGES.md) |
| P08.4 | Quản trị taxonomy (Admin) | [ADMIN_TAXONOMY.md](../P08/ADMIN_TAXONOMY.md) |
| P08.5 | Recipe UX foundation | [RECIPE_UX.md](../P08/RECIPE_UX.md) |
| P08.6 | Kiểm thử | [TEST_REPORT.md](../P08/TEST_REPORT.md) |
| P08.7 | Hoàn thành phase + checkpoint | Checkpoint này |

## 3. Thay đổi mã nguồn chính

**Thêm mới (domain/service/presentation):**
- `lib/constants/taxonomy.ts` — `DISCOVERY_TAXONOMIES` (6 trục), `RecipeFilterKind`,
  tra cứu `getDiscoveryTaxonomyByCode/BySegment`, `isDiscoveryTaxonomy`.
- `lib/services/taxonomy.service.ts` — `TaxonomyService` (đọc công khai + CRUD quản trị + xoá an toàn)
  + export `taxonomyService`, `CategoryGroup`, `CategoryDetail`.
- `lib/presentation/category-links.ts` — `CATEGORY_BASE`, `categoryIndexHref`, `categoryTypeHref`,
  `categoryTermHref`.
- `lib/validation/taxonomy.ts` — `createTaxonomyTermSchema`, `updateTaxonomyTermSchema`.

**Sửa đổi (repository/validation/service):**
- `lib/db/repositories/taxonomy.repository.ts` + `prisma-taxonomy.repository.ts` — thêm
  `listTermsWithCounts`, `findTermById`, `countActiveTermsByType`, `countRecipeUsage`, `updateTerm`,
  `setTermActive`, `deleteTermById`.
- `lib/db/repositories/recipe.repository.ts` + `prisma-recipe.repository.ts` — `RecipeTaxonomyFilter`,
  `RecipeListFilters` thêm `taxonomy?`, `ingredientCategorySlug?`, `ingredientSlug?`, `maxTotalMinutes?`.
- `lib/validation/recipe.ts` — `listRecipesQuerySchema` thêm mealType/cookingMethod/dietary/ingredient/
  ingredientCategory/maxMinutes.
- `lib/services/recipe.service.ts` — `listPublic`/`listAdmin` áp `buildDiscoveryFilters`;
  thêm `listPublicForCategory`.
- `lib/presentation/recipe-links.ts` — `RecipeListParams` + trục khám phá; `TEXT_KEYS` mở rộng.
- `lib/services/index.ts`, `lib/db/repositories/index.ts`, `components/recipe/index.ts` — export.

**UI thêm mới:**
- `components/recipe/category-tile.tsx`, `components/admin/taxonomy-manager.tsx`.
- `app/(public)/danh-muc/{page,[segment]/page,[segment]/[slug]/page}.tsx`.
- `app/(admin)/admin/danh-muc/{page,[type]/page}.tsx`.
- `app/api/v1/admin/taxonomy/{route,[id]/route}.ts`.
- Sửa: `components/recipe/recipe-filters.tsx` (thêm ô Bữa ăn/Phương pháp/Thời gian nấu), `app/layout.tsx`
  (`metadataBase`), `app/(public)/cong-thuc/{page,[slug]/page}.tsx` (badge phân loại có liên kết),
  `app/(admin)/admin/page.tsx` (lối vào quản lý danh mục).

**Kiểm thử mới (46 unit test):**
- `tests/lib/{taxonomy.constants,category-links,taxonomy-validation,taxonomy.service,recipe-discovery}.test.ts`.
- `tests/integration/taxonomy.service.test.ts` (integration — chưa chạy do thiếu DB).

## 4. Kiểm thử đã chạy (kết quả thực tế)

| Kiểm tra | Kết quả |
| --- | --- |
| `pnpm typecheck` | ✅ **0 lỗi** |
| `pnpm lint` | ✅ **0 lỗi** |
| `pnpm test` | ✅ **199/199 pass** (24 file) — +46 test P08 |
| `pnpm build` | ✅ thành công — **34 route** (thêm `/danh-muc*`, `/admin/danh-muc*`, `/api/v1/admin/taxonomy*`) |
| `pnpm test:integration` | ⛔ Không chạy — **không có PostgreSQL** trong sandbox |
| E2E trình duyệt | ⛔ Không chạy — **không có browser** |

## 5. Chưa xác minh được (trung thực)

- Neon PostgreSQL, Cloudflare R2, Auth.js/HTTP 401-403, E2E trình duyệt, axe/Lighthouse —
  kế thừa blocker P07.1.
- Integration test taxonomy: **chưa thực thi**.

## 6. Blocker

Xem `BLOCKERS.md` mục **B-P08-01 … B-P08-04**.

## 7. Quyết định (ADR)

- **D63**: Giữ mô hình taxonomy P06/P02, **không** thêm cột/model; 6 trục khám phá là **metadata**
  trong code, term là dữ liệu DB (linh hoạt, không hardcode frontend).
- **D64**: Bộ lọc khám phá chỉ dựa trên dữ liệu thật; **không** tạo bộ lọc cho dữ liệu chưa có.
- **D65**: Xoá danh mục có điều kiện — chặn khi còn công thức/term con, ưu tiên **lưu trữ** để giữ liên kết.
- **D66**: Bộ lọc khám phá là tham số truy vấn của cùng `listPublic` (không thêm endpoint trùng);
  `listPublicForCategory` chỉ là lớp tiện dụng.

## 8. Điều kiện chuyển phase

P08 **hoàn thành** trong giới hạn môi trường → dừng theo yêu cầu người dùng (**không** triển khai P09).
Các hạng mục "External Verification Pending" theo dõi ở `BLOCKERS.md`, không chặn việc kết thúc P08.
