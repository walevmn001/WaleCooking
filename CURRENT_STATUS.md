# CURRENT STATUS — WALE COOKING

> Cập nhật: 2026-11-28 (P09).

## Tóm tắt
- **Sản phẩm:** WALE COOKING — website cá nhân chuyên công thức & hỗ trợ nấu ăn (**Recipe-focused Cooking Assistant**; tiếng Việt, sẵn sàng i18n EN). **Không** mạng xã hội, **không** cộng đồng, **không** tài khoản khách truy cập.
- **Phase hiện tại:** hoàn thành **P00**, **P00-FIX**, **P01**, **P02**, **P03**, **P04**, **P05**, **P06**, **P07**, **P07.1**, **P08** và **P09**; đang thực hiện **P10** (Smart Kitchen Tools).
- **Đã hoàn thiện P00:** khảo sát thực tế + tài liệu định hướng + đề xuất công nghệ.
- **Đã hoàn thiện P00-FIX:** đồng bộ thương hiệu sang WALE COOKING, bổ sung đầy đủ 20 nhóm chức năng, chuẩn hóa 7 trục phân loại, cập nhật tài liệu trạng thái.
- **Đã hoàn thiện P01:** bộ đặc tả sản phẩm có thể triển khai — PRD, Product Constitution, personas, user journeys, đặc tả 20 nhóm chức năng, quy tắc nghiệp vụ, NFR đo lường được, phạm vi MVP và tiêu chí nghiệm thu.
- **Đã hoàn thiện P02:** kiến trúc hệ thống, thiết kế module, thiết kế database, ERD, hợp đồng API, bảo mật/phân quyền, kiến trúc tìm kiếm, lưu trữ media, kiến trúc triển khai và nhật ký quyết định kiến trúc.
- **Đã hoàn thiện P03:** **Design System WALE COOKING — Pastel Mint** — bộ quy chuẩn giao diện + design tokens máy đọc được, audit WCAG 2.2 AA (contrast đo thực tế), đặc tả component, layout/spacing, responsive, motion, accessibility. **Chưa viết code ứng dụng / chưa dựng UI thật** (thuộc P05).
- **Đã hoàn thiện P04:** **Bộ nhận diện minh họa** — 60 asset SVG nguyên bản (5 logo/brand mark, 8 biến thể mascot, 38 icon, 9 illustration trạng thái) + 7 tài liệu quy chuẩn trong `docs/P04/`. Sinh/kiểm tự động bằng script; validator **0 lỗi, 0 cảnh báo**; tổng ~56.6 KB. **Chưa tích hợp vào UI** (thuộc P05); phần render pixel chưa xác minh do môi trường không có rasterizer.
- **Đã hoàn thiện P05:** **Application Foundation & Shared UI System** — (A) nền tảng + 60 component dùng chung (ui/forms/navigation/feedback/recipe/recipe-meta/layout) theo token P03, dùng Lucide + asset P04; (B) Application Shell: Root/Public/Auth/Admin layout, Header (desktop/tablet/mobile), Navigation, MobileMenu, Footer; trang kiểm tra dev-only `/dev/components`. **Kiểm chứng:** `typecheck` 0 lỗi · `lint` 0 lỗi/0 cảnh báo · **60/60 unit test pass** (11 file) · `build` thành công **15 route**. **Chưa** kiểm trình duyệt thật / axe / screen reader / zoom 200% → **không tuyên bố đạt WCAG 2.2 AA**.
- **Đã hoàn thiện P06:** **Database Foundation** — Prisma schema theo P02 (**22 enum / 57 model**; **58 bảng** trong DB), Prisma client singleton, kiểm tra biến môi trường, migration baseline tái lập được (`20261127175936_init`, chạy từ DB sạch), seed hệ thống **idempotent** (9 taxonomy type/83 term, 22 unit, 10 equipment, 40 ingredient, 1 content source), lớp **repository + service + validation + authorization tập trung**. **Kiểm chứng:** `prisma validate/generate` OK · migration áp thành công lên `wale_dev`+`wale_test` · seed chạy 2 lần không trùng · **78/78 unit test** (14 file) · **28/28 integration test** (5 file) · `typecheck` 0 lỗi · `lint` 0 lỗi · `build` 15 route. **Chưa kết nối Neon thật** (dùng PostgreSQL local); Auth.js **chưa nối** → `getCurrentActor()` trả `null` (không giả lập đăng nhập).
- **Đã hoàn thiện P07:** **Recipe Module** — domain công thức (Recipe/Translation/Ingredient/Step/Nutrition/Allergen/Source/Version) trên nền dữ liệu P06; **CRUD + workflow** (draft → in_review → published → archived, xóa mềm); **API** `/api/v1/recipes*` + `/api/v1/admin/recipes` + `/api/v1/media*` theo contract P02; **media adapter** (R2 mục tiêu + local cho dev/test; magic bytes, khóa do server sinh); **frontend** listing/detail công khai + quản trị create/edit **tái sử dụng component P05**; **authorization tập trung** (RBAC, actor=null ⇒ 401, không hardcode role); **transaction** bảo toàn thứ tự nguyên liệu/bước; JSON-LD schema.org/Recipe. **Kiểm chứng:** **124/124 unit test** (18 file) · **50/50 integration test** (7 file) · `typecheck` 0 lỗi · `lint` 0 lỗi · `build` **29 route**. **Chưa xác minh trên dịch vụ thật**: Auth.js chưa nối (chưa test 401/403 qua HTTP), chưa có credentials R2 (media chạy local provider); nội dung công thức trong test là **fixture**, không tuyên bố có công thức thật đã xuất bản.
- **Đã hoàn thiện P07.1:** **Integration Verification & Blocker Closure** — audit tích hợp thực tế sau P06/P07 (bảng thành phần, không giả định P07 đã chạy thật); điều chỉnh phạm vi theo mô hình **không tài khoản khách**; **module yêu thích bằng cookie** (HttpOnly `wale_favorites` + Server Actions, có **version**, dedupe, giới hạn **50**, xử lý cookie hỏng/quá lớn/version lạ, chỉ hiển thị công thức còn `published`; **không** ghi DB, **không** dùng localStorage); giữ **Auth.js** chỉ cho quản trị (không tạo hệ auth thứ hai); phân loại bảng DB + **2 ADR** (không drop/xóa bảng, không sửa lịch sử migration). **Kiểm chứng:** `typecheck` 0 lỗi · `lint` 0 lỗi · **153/153 unit test** (19 file, +29 test module cookie) · `build` **28 route** (đặt `DATABASE_URL` placeholder — dự án yêu cầu biến này để build route DB). **Chưa xác minh (External Verification Pending):** Neon PostgreSQL, Cloudflare R2, Auth.js/HTTP 401-403, E2E trình duyệt — sandbox không có credentials/browser/DB. Tài liệu `docs/P07_1/` + `docs/checkpoints/P07_1_CHECKPOINT.md`.
- **Đã hoàn thiện P08:** **Taxonomy & Recipe Discovery** — (1) **6 trục khám phá** (`food_type`/`cuisine`/`meal_type`/`cooking_method`/`dietary_preference`/`ingredient_category`) tận dụng taxonomy P06, **không** thêm model/cột (D62/D63); metadata trục trong `lib/constants/taxonomy.ts`, **term là dữ liệu DB**; (2) **Recipe Discovery** — bộ lọc khám phá (mealType/cookingMethod/dietary/ingredient/ingredientCategory/maxMinutes) chỉ dựa trên dữ liệu thật, tái dùng `listPublic` (D64/D66); `listPublicForCategory` cho trang danh mục; (3) **trang danh mục công khai** `/danh-muc`, `/danh-muc/{segment}` (SSG 6 trục), `/danh-muc/{segment}/{slug}` — breadcrumb, phân trang, canonical, JSON-LD BreadcrumbList; (4) **quản trị taxonomy** `/admin/danh-muc*` + API `POST/PATCH/DELETE /api/v1/admin/taxonomy*` — chỉ Admin, **xoá có điều kiện** (chặn khi còn công thức/term con, ưu tiên lưu trữ — D65); (5) **Recipe UX foundation** (badge phân loại có liên kết, nút yêu thích/chia sẻ). **Kiểm chứng:** `typecheck` 0 lỗi · `lint` 0 lỗi · **199/199 unit test** (24 file, +46 test P08) · `build` **34 route** (thêm `/danh-muc*`, `/admin/danh-muc*`, `/api/v1/admin/taxonomy*`). **Chưa xác minh:** integration test taxonomy (không có PostgreSQL), E2E/response/a11y (không có browser), Auth.js HTTP. Tài liệu `docs/P08/` + `docs/checkpoints/P08_CHECKPOINT.md`.
- **Đã hoàn thiện P09:** **Cooking Experience** — (1) **P09.1 Audit dữ liệu** công thức → quyết định thiết kế (D67–D70); (2) **Cooking Mode** — chế độ nấu toàn màn hình (portal, focus trap, đóng bằng Esc + xác nhận), tập trung từng bước, ảnh/mẹo/thời lượng, xem lại danh sách bước, không sinh/đổi thứ tự bước; (3) **Portion Scaling** — nhân định lượng theo khẩu phần (`định lượng mới = gốc × mới/gốc`), điều khiển tăng/giảm + nhập trực tiếp + khôi phục, **chỉ nhân số — giữ nguyên đơn vị** (không quy đổi mass↔volume — D68), không đổi dữ liệu gốc; (4) **Ingredient Checklist** — tick/tiến độ (chữ + số)/reset, dùng định lượng sau khi đổi khẩu phần; (5) **lưu tiến độ cục bộ** `localStorage` có `version` (không tài khoản khách, không DB — D67), xử lý JSON hỏng/slug khác/kẹp `stepIndex`/lọc id; component tái sử dụng `CookingModeLayout`/`CookingStepCard`(dùng lại)/`CookingProgress`/`IngredientChecklist`/`PortionSelector`/`CookingExitConfirmation`. **Kiểm chứng:** `typecheck` 0 lỗi · `lint` 0 lỗi · **249/249 unit test** (27 file, +50 test P09) · `build` thành công (không thêm route; đặt `DATABASE_URL` placeholder). **Chưa xác minh:** E2E/thiết bị thật, integration (P09 không thêm logic server/schema). Tài liệu `docs/P09/` + `docs/checkpoints/P09_CHECKPOINT.md`.

## Git
| Mục | Giá trị |
| --- | --- |
| Branch hiện tại | `trae/agent-8KQLUd` (đồng bộ `origin/main`); trước P08, `origin/main` = `4c88ed6` (P07.1) |
| Remote | `origin` → `https://github.com/walevmn001/WaleCooking` |
| Commit P00 | `a7c3ee5` — docs(P00): khảo sát dự án, xác lập yêu cầu và checkpoint nền tảng |
| Commit P00-FIX | `59ca67a` — docs(P00-FIX): đồng bộ thương hiệu WALE COOKING và hoàn thiện phạm vi sản phẩm |
| Commit P01 | `59f3059` — docs(P01): PRD và Product Constitution cho WALE COOKING |
| Commit P02 | `ebb9acb` (nhánh agent) → merge `49213e2` vào `main` |
| Commit P03 | `84b3618` — docs(P03): Design System WALE COOKING — Pastel Mint |
| Commit P04 | `1eb7f2f` — feat(P04): bộ nhận diện minh họa WALE COOKING — mascot, logo, icon, illustration |
| Commit P05 | `e44a62a` — feat(P05): nền tảng ứng dụng WALE COOKING & hệ thống UI dùng chung |
| Commit P06 | *(commit chứa tài liệu này — xem `git log -1`)* — feat(P06): nền tảng dữ liệu (Prisma + migration + seed + repository) |
| Commit P07 | `82fd189` — feat(P07): module công thức — domain, API, media, frontend, kiểm thử |
| Commit P07.1 | `4c88ed6` — feat(P07.1): điều chỉnh phạm vi không tài khoản khách + yêu thích bằng cookie |
| Commit P08 | *(commit chứa tài liệu này — xem `git log -1`)* — feat(P08): taxonomy & khám phá công thức (danh mục, bộ lọc, quản trị) |
| Working tree | Sạch sau khi commit P08 |
| `origin/main` | Cập nhật checkpoint P08 (xem báo cáo push) |

## Kiến trúc đã chốt (không thay đổi)
- Stack lớp rời: **Next.js + Prisma + Neon PostgreSQL + Auth.js + Cloudflare R2**.
- Ưu tiên gói miễn phí. Dự án **phi thương mại**. Giao diện **WALE COOKING — Pastel Mint**.
- P02: kiến trúc phân lớp (Presentation / Application / Domain / Infrastructure + Database, Auth, Media, Search, CMS, External Services) với adapter cho các điểm cần thay thế (DB, Storage, Search, Mail). Xem [ARCHITECTURE_DECISIONS.md](./docs/P02/ARCHITECTURE_DECISIONS.md).
- P03: **Design tokens là nguồn tham chiếu duy nhất** cho UI (màu/typography/spacing/radius/shadow/breakpoint/z-index/motion). Không dùng giá trị nằm ngoài token.

## Sản phẩm bàn giao P01 (`docs/P01/`)
`PRD.md` · `PRODUCT_CONSTITUTION.md` · `USER_PERSONAS.md` · `USER_JOURNEYS.md` · `FUNCTIONAL_REQUIREMENTS.md` · `BUSINESS_RULES.md` · `NON_FUNCTIONAL_REQUIREMENTS.md` · `MVP_SCOPE.md` · `ACCEPTANCE_CRITERIA.md`

## Sản phẩm bàn giao P02 (`docs/P02/`)
`SYSTEM_ARCHITECTURE.md` · `MODULE_DESIGN.md` · `DATABASE_SCHEMA.md` · `ENTITY_RELATIONSHIP_DIAGRAM.md` · `API_CONTRACT.md` · `AUTHORIZATION_SECURITY.md` · `SEARCH_ARCHITECTURE.md` · `MEDIA_STORAGE.md` · `DEPLOYMENT_ARCHITECTURE.md` · `ARCHITECTURE_DECISIONS.md`

## Sản phẩm bàn giao P03 (`docs/P03/`)
`DESIGN_SYSTEM.md` · `DESIGN_TOKENS.md` · `COLOR_ACCESSIBILITY_AUDIT.md` · `TYPOGRAPHY_AND_LAYOUT.md` · `COMPONENT_SPECIFICATIONS.md` · `RESPONSIVE_GUIDELINES.md` · `MOTION_GUIDELINES.md` · `ACCESSIBILITY_GUIDELINES.md` · `DESIGN_QA_CHECKLIST.md` · `tokens/design-tokens.json`

## Sản phẩm bàn giao P04 (`docs/P04/` + `public/assets/`)
**Tài liệu (`docs/P04/`):** `BRAND_ASSET_GUIDELINES.md` · `MASCOT_SPECIFICATION.md` · `LOGO_USAGE_GUIDELINES.md` · `ICON_SYSTEM.md` · `ILLUSTRATION_GUIDELINES.md` · `ASSET_CATALOG.md` · `ASSET_QA_CHECKLIST.md`

**Tài nguyên (60 SVG, ~56.6 KB):**
- `public/assets/brand/` (5): `logo-primary` · `logo-compact` · `logo-mark` · `favicon` · `app-icon`
- `public/assets/mascot/` (8): `mascot-default` · `mascot-happy` · `mascot-cooking` · `mascot-holding-recipe` · `mascot-thinking` · `mascot-success` · `mascot-error` · `mascot-waving`
- `public/assets/icons/nav/` (7) · `icons/cooking/` (9) · `icons/interaction/` (13) · `icons/content/` (9) → **38 icon**
- `public/assets/illustrations/` (9): `empty-recipes` · `no-results` · `empty-favorites` · `empty-shopping-list` · `loading` · `error` · `404` · `success` · `welcome`

**Script sinh/kiểm:** `scripts/p04_generate_assets.py` · `scripts/p04_validate_assets.py`. Chi tiết danh mục: [ASSET_CATALOG.md](./docs/P04/ASSET_CATALOG.md).

## Sản phẩm bàn giao P05 (`docs/P05/` + mã nguồn)
**Tài liệu (`docs/P05/`):** `IMPLEMENTATION_REPORT.md` · `COMPONENT_CATALOG.md` · `APPLICATION_SHELL.md` · `RESPONSIVE_IMPLEMENTATION.md` · `ACCESSIBILITY_REPORT.md` · `TEST_REPORT.md`

**Mã nguồn (Phần A — Shared UI Components):**
- `styles/globals.css` — design tokens P03 → `@theme` (Tailwind v4), reset/base, utilities, reduced-motion.
- `components/ui/` (14): Button, IconButton, Link, Badge, Chip, Avatar, Card, Divider, Tooltip, Skeleton, Spinner, EmptyState, ErrorState, LoadingState.
- `components/forms/` (10 export): FormField, FormLabel, FormHint, FormError, Input, Textarea, Select, Checkbox, Radio + RadioGroup, Switch, SearchInput.
- `components/navigation/` (4): Breadcrumb, Tabs, Pagination, Dropdown.
- `components/feedback/` (3): Modal, ConfirmDialog, ToastProvider/useToast.
- `components/recipe/` (13): RecipeImage, RecipeCard, RecipeCardCompact, IngredientRow, IngredientList, CookingStepCard, CookingTime, PreparationTime, ServingsBadge, DifficultyBadge, CategoryCard, NutritionSummary, AllergenBadges (+ `types.ts`).
- `lib/`: `utils/{cn,format}.ts`, `hooks/use-outside-click.ts`, `constants/{site,navigation}.ts`, `mock/recipes.ts` (dev-only).

**Mã nguồn (Phần B — Application Shell):**
- `app/layout.tsx` (root) · `app/loading.tsx` · `app/error.tsx` · `app/not-found.tsx`.
- `app/(public)/` (12 route) · `app/(auth)/` (1) · `app/(admin)/` (1) · `app/dev/components/` (dev-only).
- `components/layout/`: Container, SiteLogo, SiteHeader, PrimaryNav, MobileMenu, SiteFooter, PlaceholderPage.

**Kiểm thử:** `tests/` (11 file, **60 test pass**).

## Sản phẩm bàn giao P06 (`docs/P06/` + mã nguồn)
**Tài liệu (`docs/P06/`):** `DATABASE_IMPLEMENTATION.md` · `PRISMA_SCHEMA_GUIDE.md` · `MIGRATION_GUIDE.md` · `SEED_GUIDE.md` · `REPOSITORY_ARCHITECTURE.md` · `DATABASE_SECURITY.md` · `TEST_REPORT.md`

**Cơ sở dữ liệu & Prisma:**
- `prisma/schema.prisma` — **22 enum + 57 model** theo P02 (UUID PK, timestamptz UTC, numeric cho định lượng, JSONB giới hạn, FK RESTRICT mặc định; preview feature `postgresqlExtensions`).
- `prisma/migrations/20261127175936_init/migration.sql` — baseline (3 extension + 22 enum + 57 bảng); `migration_lock.toml`.
- `prisma/seed.ts` + `prisma/seed/{data,run}.ts` — seed hệ thống idempotent (taxonomy 9 trục, 22 đơn vị, 5 quy đổi, 10 thiết bị, 40 nguyên liệu, 1 nguồn nội dung) + seed dev (`SEED_DEV=1`).

**Mã nguồn (`lib/`):**
- `config/env.ts` (kiểm tra env, không lộ secret).
- `db/prisma.ts` (singleton), `db/prisma-errors.ts` (map lỗi Prisma an toàn).
- `db/repositories/` — ports + adapter Prisma: Unit, Taxonomy, Ingredient (+ `index.ts` cổng `repositories`).
- `errors/app-error.ts` (AppError + Validation/NotFound/Forbidden/Unauthorized/Conflict).
- `validation/{common,catalog}.ts` (Zod + phân trang + `parseInput`).
- `auth/authorization.ts` (RBAC tập trung), `auth/session.ts` (`getCurrentActor()` → `null`).
- `services/catalog.service.ts` (nghiệp vụ dữ liệu tham chiếu).

**Kiểm thử:** `tests/lib/` (3 file, 18 test) + `tests/integration/` (5 file, 28 test) + `tests/stubs/server-only.ts` + `vitest.integration.config.ts`. Tổng **78 unit + 28 integration test pass**.

## Sản phẩm bàn giao P07 (`docs/P07/` + mã nguồn)
**Tài liệu (`docs/P07/`):** `RECIPE_MODULE_ARCHITECTURE.md` · `RECIPE_DOMAIN.md` · `RECIPE_API_IMPLEMENTATION.md` · `RECIPE_FRONTEND.md` · `RECIPE_MEDIA.md` · `RECIPE_AUTHORIZATION.md` · `RECIPE_CONTENT_POLICY.md` · `TEST_REPORT.md`

**Domain & dữ liệu (`lib/`):**
- `db/repositories/recipe.repository.ts` (interface + DTO) + `prisma-recipe.repository.ts` (adapter Prisma: transaction, resolve term/unit, mapping).
- `db/repositories/media.repository.ts` + `prisma-media.repository.ts`.
- `services/recipe.service.ts` (CRUD + publish/archive/submit-review/version + BR-01/BR-03), `services/media.service.ts`.

**Validation & auth:**
- `validation/recipe.ts` (Zod); `validation/common.ts` tách `termSlugSchema` (cho phép `_`) khỏi `slugSchema` (URL).
- `auth/authorization.ts` (RBAC tập trung: `can`/`requirePermission`), `auth/session.ts` (`getCurrentActor()` → `null`).

**Storage (media adapter):** `storage/{storage.port,r2-storage.adapter,local-storage.adapter,image-validation,index}.ts`.

**Presentation (thuần):** `presentation/{recipe-view,recipe-links,recipe-form-values,slug}.ts` (DTO → view-model P05 + JSON-LD).

**API (`app/api/v1/`):** `recipes` (list/create), `recipes/[id]` (get/patch/delete), `recipes/[id]/{publish,archive,submit-review,versions}`, `admin/recipes`, `media` (upload), `media/[id]`, `media/file/[...key]`.

**Frontend:** `app/(public)/cong-thuc/{page,loading,error,[slug]/page}.tsx`; `app/(admin)/admin/cong-thuc/{page,moi/page,[id]/sua/page}.tsx`; `components/admin/{recipe-form,recipe-status-actions,admin-access-notice}.tsx`; `components/recipe/recipe-filters.tsx`.

**Kiểm thử:** `tests/lib/{recipe-validation,recipe.presentation}.test.ts` (36) + `tests/components/{recipe-filters,recipe-form}.test.tsx` (10) + `tests/integration/{recipe.repository,recipe.service}.test.ts` (22). Tổng **124 unit + 50 integration test pass**.

## Sản phẩm bàn giao P07.1 (`docs/P07_1/` + mã nguồn)
**Tài liệu (`docs/P07_1/`):** `INTEGRATION_AUDIT.md` · `AUTHENTICATION_SCOPE.md` · `DATABASE_CLASSIFICATION.md` · `COOKIE_FAVORITES.md` · `EXTERNAL_VERIFICATION.md` · `E2E_VERIFICATION.md` + checkpoint `docs/checkpoints/P07_1_CHECKPOINT.md`.

**Yêu thích bằng cookie (`lib/` + `app/`):**
- `lib/favorites/cookie.ts` — module THUẦN: version (`v:1`), dedupe, giới hạn 50, xử lý cookie hỏng/quá lớn/version lạ.
- `lib/favorites/server.ts` — đọc/ghi cookie **HttpOnly** (`SameSite=Lax`, `Secure` prod, `Path=/`, 180 ngày).
- `app/actions/favorites.ts` — Server Actions add/remove/toggle/clear + revalidate.

**UI (`components/` + `app/`):**
- `components/recipe/{favorite-button,share-recipe-button,clear-favorites-button}.tsx`.
- `app/(public)/yeu-thich/page.tsx` — danh sách yêu thích thật (chỉ công thức `published`).
- Tích hợp nút yêu thích vào `cong-thuc/page.tsx` + `[slug]/page.tsx`.

**Điều chỉnh phạm vi (bỏ tài khoản khách):**
- Xóa `app/(public)/tai-khoan/page.tsx`; sửa `site-header`, `mobile-menu`, `lib/constants/navigation.ts`; `/dang-nhap` thành **cổng đăng nhập quản trị**.

**Repository/service:** thêm `listPublicSummariesBySlugs` (Prisma adapter) + `getPublicSummariesBySlugs` (service).

**Kiểm thử:** `tests/lib/favorites.test.ts` — **29 test**. Tổng toàn bộ **153 unit test** (19 file).

## Sản phẩm bàn giao P08 (`docs/P08/` + mã nguồn)
**Tài liệu (`docs/P08/`):** `TAXONOMY_DISCOVERY.md` · `DISCOVERY_API.md` · `CATEGORY_PAGES.md` · `ADMIN_TAXONOMY.md` · `RECIPE_UX.md` · `TEST_REPORT.md` + checkpoint `docs/checkpoints/P08_CHECKPOINT.md`.

**Taxonomy & khám phá (`lib/`):**
- `constants/taxonomy.ts` — `DISCOVERY_TAXONOMIES` (6 trục), `RecipeFilterKind`, `getDiscoveryTaxonomyByCode/BySegment`, `isDiscoveryTaxonomy`.
- `services/taxonomy.service.ts` — `TaxonomyService` (đọc công khai + CRUD quản trị + xoá an toàn).
- `presentation/category-links.ts` — `CATEGORY_BASE`, `categoryIndexHref`, `categoryTypeHref`, `categoryTermHref`.
- `validation/taxonomy.ts` — `createTaxonomyTermSchema`/`updateTaxonomyTermSchema`.
- Repository: `taxonomy.repository.ts` (+ adapter Prisma) — `listTermsWithCounts`, `countRecipeUsage`, `updateTerm`, `setTermActive`, `deleteTermById`; `recipe.repository.ts` (+ adapter) — `taxonomy?`/`ingredientCategorySlug?`/`ingredientSlug?`/`maxTotalMinutes?`.
- `services/recipe.service.ts` — `buildDiscoveryFilters` + `listPublicForCategory`; `validation/recipe.ts` + `presentation/recipe-links.ts` mở rộng bộ lọc khám phá.

**UI công khai (`app/` + `components/`):**
- `app/(public)/danh-muc/page.tsx`, `[segment]/page.tsx`, `[segment]/[slug]/page.tsx`.
- `components/recipe/category-tile.tsx`; mở rộng `components/recipe/recipe-filters.tsx`; badge phân loại có liên kết trong `cong-thuc/[slug]/page.tsx`; `app/layout.tsx` (`metadataBase`).

**Quản trị (`app/` + `components/`):**
- `app/(admin)/admin/danh-muc/{page,[type]/page}.tsx` + `components/admin/taxonomy-manager.tsx`.
- API: `app/api/v1/admin/taxonomy/{route,[id]/route}.ts` (`POST`/`PATCH`/`DELETE`, quyền `taxonomy:manage`).

**Kiểm thử:** `tests/lib/{taxonomy.constants(8),category-links(5),taxonomy-validation(9),taxonomy.service(14),recipe-discovery(10)}.test.ts` (**46 unit**) + `tests/integration/taxonomy.service.test.ts` (chưa chạy — thiếu DB). Tổng toàn bộ **199 unit test** (24 file).

## Việc còn chờ xác minh
- **B5:** repo là shallow clone (ảnh hưởng thấp).
- **B6:** chưa có tài khoản/môi trường triển khai (Neon, R2, Vercel/Cloudflare…).
- **B7:** chưa có asset thật (mascot, bộ icon minh họa riêng) → **ĐÃ GIẢI QUYẾT (P04)** — 60 SVG nguyên bản + quy chuẩn.
- **B-P01-01:** quy trình phê duyệt taxonomy giữa `editor` và `admin` chưa chốt.
- **B-P01-02:** tương phản màu Pastel Mint/Soft Pink trên nền Cream cần xác minh WCAG 2.2 AA → **đã ĐO thực tế ở P03** (xem [COLOR_ACCESSIBILITY_AUDIT.md](./docs/P03/COLOR_ACCESSIBILITY_AUDIT.md)); các cặp không đạt đã có quy tắc cấm dùng + shade phụ trợ.
- **B-P01-03:** cơ chế xuất/xóa dữ liệu cá nhân của người dùng chưa chốt.
- **B-P02-01:** CMS MVP dùng admin tự viết; Payload CMS chỉ là phương án nâng cấp — chưa chốt.
- **B-P02-02:** cơ chế backup điểm-trong-thời-gian (PITR) của Neon theo gói free chưa xác minh.
- **B-P03-01:** nghiệm thu a11y/responsive/motion **trên UI thật** (axe, screen reader, zoom 200%, 320px, header sticky) **chưa thực hiện** — P05 đã dựng UI + đặc tả a11y nhưng môi trường không có trình duyệt; **còn mở** (xem [ACCESSIBILITY_REPORT.md](./docs/P05/ACCESSIBILITY_REPORT.md) §6).
- **B-P04-01:** **render pixel & tương thích runtime** của asset P04 (mascot trên nền P03, logo ≥16–24px, `currentColor` trên Safari/Firefox) **chưa xác minh** — asset đã được tích hợp vào UI ở P05 (`SiteLogo`, `RecipeImage`, `EmptyState`, `ErrorState`, `not-found`), nhưng render thật vẫn chưa kiểm; **còn mở**.
- **B-P05-01:** chưa kiểm trình duyệt thật / E2E / console runtime; không tuyên bố đạt WCAG 2.2 AA.
- **B-P06-01:** chưa xác minh kết nối **Neon PostgreSQL thật** (dùng PostgreSQL 16.15 local).
- **B-P06-02:** **Auth.js chưa nối** → chưa kiểm 401/403 end-to-end (`getCurrentActor()` trả `null`).
- **B-P07-01:** chưa xác minh media trên **Cloudflare R2 thật** (chạy local provider).
- **B-P07-02:** chưa có test **HTTP end-to-end** cho authorization (mới kiểm ở tầng service).
- **B-P07-03:** chưa nối luồng **upload ảnh trong form quản trị** với `POST /api/v1/media`.
- **B-P07-04:** chưa kiểm **UI module Recipe trên trình duyệt thật** (kế thừa B-P05-01).
- **B-P07-05:** chưa siết BR-03 "nội dung tự biên soạn" & chưa có quy trình reviewer nhiều bước.
- **B-P07_1-01:** chưa xác minh **Neon PostgreSQL thật** (External Verification Pending; kế thừa B-P06-01).
- **B-P07_1-02:** chưa xác minh **Cloudflare R2 thật** (External Verification Pending; media chạy local provider).
- **B-P07_1-03:** chưa xác minh **đăng nhập quản trị (Auth.js)** → chưa kiểm 401/403 qua HTTP phiên thật.
- **B-P07_1-04:** chưa chạy **E2E trình duyệt thật** (yêu thích cookie, responsive, a11y).
- **B-P08-01:** chưa chạy **integration test taxonomy** (đã viết, sandbox không có PostgreSQL — External Verification Pending).
- **B-P08-02:** chưa kiểm **trang danh mục trên trình duyệt thật** (responsive, SEO/canonical/JSON-LD, a11y).
- **B-P08-03:** chưa xác minh **phân quyền quản trị taxonomy qua HTTP phiên thật** (Auth.js chưa nối).
- **B-P08-04:** chưa có **ảnh đại diện/SEO cho danh mục** (schema chưa có cột — ghi backlog).
- Hạn mức gói miễn phí đã ghi theo thời điểm **11/2026** — cần kiểm tra lại trước khi deploy.

## Phase tiếp theo
- **P08 hoàn thành** (trong giới hạn môi trường). Theo yêu cầu người dùng, **dừng tại đây — không triển khai P09.**
- Các hạng mục "External Verification Pending" (Neon/R2/Auth.js/E2E, integration test taxonomy) tiếp tục theo dõi ở `BLOCKERS.md`.
- **Backlog định hướng tương lai** (chưa triển khai): bộ chuyển đổi định lượng theo khẩu phần; checklist nguyên liệu đi chợ; chế độ nấu từng bước; hẹn giờ nấu; quy đổi đơn vị; gợi ý món theo nguyên liệu; thực đơn theo ngày; bộ lọc theo thời gian/độ khó; hướng dẫn sơ chế & bảo quản.

## Tham chiếu
- [PHASE_PROGRESS.md](./PHASE_PROGRESS.md) · [DECISIONS.md](./DECISIONS.md) · [BLOCKERS.md](./BLOCKERS.md)
- Checkpoint: [docs/checkpoints/P07_1_CHECKPOINT.md](./docs/checkpoints/P07_1_CHECKPOINT.md) · [docs/checkpoints/P08_CHECKPOINT.md](./docs/checkpoints/P08_CHECKPOINT.md)
- Tài liệu P00: [docs/P00](./docs/P00/) · P01: [docs/P01](./docs/P01/) · P02: [docs/P02](./docs/P02/) · P03: [docs/P03](./docs/P03/) · P04: [docs/P04](./docs/P04/) · P05: [docs/P05](./docs/P05/) · P06: [docs/P06](./docs/P06/) · P07: [docs/P07](./docs/P07/) · P07.1: [docs/P07_1](./docs/P07_1/) · P08: [docs/P08](./docs/P08/)
