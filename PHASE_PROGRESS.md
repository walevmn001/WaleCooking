# PHASE PROGRESS — WALE COOKING

> Theo dõi tiến độ theo phase. Mỗi phase chỉ triển khai đúng phạm vi của nó.
> Cập nhật: 2026-11-28 (P10).

| Phase | Tên | Phạm vi | Trạng thái |
| --- | --- | --- | --- |
| P00 | Khảo sát dự án, xác lập yêu cầu và checkpoint nền tảng | Khảo sát môi trường/repo, tài liệu định hướng sản phẩm, giao diện, đề xuất công nghệ | ✅ Hoàn thành |
| P00-FIX | Hoàn thiện phạm vi sản phẩm và đồng bộ thương hiệu | Đồng bộ tên WALE COOKING, bổ sung 20 nhóm chức năng, chuẩn hóa 7 trục phân loại, tài liệu trạng thái | ✅ Hoàn thành |
| P01 | PRD & Product Constitution | Bộ đặc tả sản phẩm: PRD, Constitution, personas, journeys, 20 nhóm chức năng, quy tắc nghiệp vụ, NFR, MVP scope, acceptance criteria | ✅ Hoàn thành |
| P02 | Kiến trúc hệ thống, thiết kế database & API | Kiến trúc phân lớp, thiết kế module, schema database + ERD, hợp đồng API, bảo mật/phân quyền, tìm kiếm, media storage, triển khai | ✅ Hoàn thành |
| P03 | Design System & đặc tả giao diện | Bộ quy chuẩn giao diện Pastel Mint: design tokens máy đọc được, audit WCAG 2.2 AA (contrast đo thực tế), typography & layout, đặc tả component, responsive, motion, accessibility, QA checklist | ✅ Hoàn thành |
| P04 | Mascot & Illustration Assets | Bộ nhận diện minh họa: mascot đầu bếp (8 biến thể), logo/brand mark (5), bộ icon (38), illustration trạng thái (9), quy chuẩn sử dụng & quản lý tài sản, QA checklist | ✅ Hoàn thành |
| P05 | Application Foundation & Shared UI System | (A) Nền tảng + Shared UI Components (tokens/global styles, basic, form, navigation/feedback, cooking-specific); (B) Application Shell (Root/Public/Auth/Admin layout, Header, Navigation, MobileMenu, Footer); trang kiểm tra dev-only; 6 tài liệu `docs/P05/`; 60 unit test | ✅ Hoàn thành |
| P06 | Database Foundation | Prisma schema theo P02 (22 enum/57 model, 58 bảng), Prisma client singleton, kiểm tra env, migration baseline tái lập (`20261127175936_init`), seed idempotent (taxonomy/unit/equipment/ingredient), repository + service + validation + authorization; 7 tài liệu `docs/P06/`; 78 unit + 28 integration test | ✅ Hoàn thành |
| P07 | Recipe Module | Domain công thức + CRUD/workflow (draft→in_review→published→archived, xóa mềm), API `/api/v1/recipes*` + `/api/v1/admin/recipes` + `/api/v1/media*` theo contract P02, media adapter (R2 mục tiêu/local dev), frontend listing/detail + quản trị create/edit tái sử dụng component P05, authorization tập trung, transaction; 8 tài liệu `docs/P07/`; 124 unit + 50 integration test | ✅ Hoàn thành |
| P07.1 | Integration Verification & Blocker Closure | Audit tích hợp thực tế; điều chỉnh phạm vi theo mô hình **không tài khoản khách** (bỏ `/tai-khoan`); giữ Auth.js chỉ cho admin; **module yêu thích bằng cookie** (HttpOnly + Server Actions, version, giới hạn 50); phân loại bảng DB + ADR (không drop); xác minh Neon/R2 → **External Verification Pending**; 6 tài liệu `docs/P07_1/` + checkpoint; thêm 29 unit test (module cookie) | ✅ Hoàn thành (trong giới hạn môi trường) |
| P08 | Taxonomy & Recipe Discovery | Hệ thống phân loại & khám phá công thức: **6 trục khám phá** (nhóm món/ẩm thực/bữa ăn/phương pháp/đặc điểm/nguyên liệu) trên taxonomy P06 (không thêm cột/model); **Recipe Discovery** (lọc/tìm/phân trang/sắp xếp chỉ theo dữ liệu thật); **trang danh mục công khai** (`/danh-muc*`, breadcrumb, SEO, JSON-LD); **quản trị taxonomy** (`/admin/danh-muc*` + API `/api/v1/admin/taxonomy*`, xoá có điều kiện); **Recipe UX foundation**; 6 tài liệu `docs/P08/` + checkpoint; thêm 46 unit test | ✅ Hoàn thành (trong giới hạn môi trường) |
| P09 | Cooking Experience | Không gian hỗ trợ nấu trên trang công thức: **Audit dữ liệu** công thức; **Cooking Mode** (chế độ nấu toàn màn hình, focus trap, từng bước); **Portion Scaling** (nhân định lượng theo khẩu phần, không đổi dữ liệu gốc, không quy đổi đơn vị); **Ingredient Checklist** (tick/tiến độ/reset); **lưu tiến độ cục bộ** (`localStorage` có version — không tài khoản khách, không DB); component tái sử dụng; 5 tài liệu `docs/P09/` + checkpoint; thêm 50 unit test | ✅ Hoàn thành (trong giới hạn môi trường) |
| P10 | Smart Kitchen Tools | Bộ công cụ nhà bếp: **Multi Timer** (nhiều đồng hồ, `deadline` là nguồn sự thật — đúng khi tab ẩn/khoá màn hình, lưu `localStorage` có version); **Unit Converter** (khối lượng/thể tích/nhiệt độ, không quy đổi mass↔volume, logic thuần tách khỏi UI); **Ingredient-Based Recipe Discovery** (tìm món theo nguyên liệu đang có, thuật toán xác định trên dữ liệu thật, không AI); **khu vực `/cong-cu`** + 8 component tái sử dụng; API `/api/v1/kitchen/ingredient-match`; 5 tài liệu `docs/P10/` + checkpoint; thêm 88 unit test | ✅ Hoàn thành (trong giới hạn môi trường) |

## Sản phẩm bàn giao theo phase

### P00
- `docs/P00/00-khao-sat-moi-truong.md`
- `docs/P00/01-dinh-huong-san-pham.md` (bản đầu — đã được P00-FIX mở rộng)
- `docs/P00/02-dinh-huong-giao-dien.md`
- `docs/P00/03-de-xuat-cong-nghe.md`

### P00-FIX
- Cập nhật `docs/P00/01-dinh-huong-san-pham.md` (20 nhóm chức năng + 7 trục phân loại + brand)
- Cập nhật `docs/P00/02-dinh-huong-giao-dien.md` (tên phong cách)
- Cập nhật `docs/P00/00-khao-sat-moi-truong.md` (blockers/quyết định)
- Tạo `CURRENT_STATUS.md`, `PHASE_PROGRESS.md`, `DECISIONS.md`, `BLOCKERS.md`

### P01
- Tạo `docs/P01/PRD.md`
- Tạo `docs/P01/PRODUCT_CONSTITUTION.md`
- Tạo `docs/P01/USER_PERSONAS.md`
- Tạo `docs/P01/USER_JOURNEYS.md`
- Tạo `docs/P01/FUNCTIONAL_REQUIREMENTS.md`
- Tạo `docs/P01/BUSINESS_RULES.md`
- Tạo `docs/P01/NON_FUNCTIONAL_REQUIREMENTS.md`
- Tạo `docs/P01/MVP_SCOPE.md`
- Tạo `docs/P01/ACCEPTANCE_CRITERIA.md`
- Cập nhật `CURRENT_STATUS.md`, `PHASE_PROGRESS.md`, `DECISIONS.md`, `BLOCKERS.md`

### P02
- Tạo `docs/P02/SYSTEM_ARCHITECTURE.md`
- Tạo `docs/P02/MODULE_DESIGN.md`
- Tạo `docs/P02/DATABASE_SCHEMA.md`
- Tạo `docs/P02/ENTITY_RELATIONSHIP_DIAGRAM.md`
- Tạo `docs/P02/API_CONTRACT.md`
- Tạo `docs/P02/AUTHORIZATION_SECURITY.md`
- Tạo `docs/P02/SEARCH_ARCHITECTURE.md`
- Tạo `docs/P02/MEDIA_STORAGE.md`
- Tạo `docs/P02/DEPLOYMENT_ARCHITECTURE.md`
- Tạo `docs/P02/ARCHITECTURE_DECISIONS.md`
- Cập nhật `CURRENT_STATUS.md`, `PHASE_PROGRESS.md`, `DECISIONS.md`, `BLOCKERS.md`

### P03
- Tạo `docs/P03/DESIGN_SYSTEM.md`
- Tạo `docs/P03/DESIGN_TOKENS.md`
- Tạo `docs/P03/COLOR_ACCESSIBILITY_AUDIT.md`
- Tạo `docs/P03/TYPOGRAPHY_AND_LAYOUT.md`
- Tạo `docs/P03/COMPONENT_SPECIFICATIONS.md`
- Tạo `docs/P03/RESPONSIVE_GUIDELINES.md`
- Tạo `docs/P03/MOTION_GUIDELINES.md`
- Tạo `docs/P03/ACCESSIBILITY_GUIDELINES.md`
- Tạo `docs/P03/DESIGN_QA_CHECKLIST.md`
- Tạo `docs/P03/tokens/design-tokens.json`
- Cập nhật `CURRENT_STATUS.md`, `PHASE_PROGRESS.md`, `DECISIONS.md`, `BLOCKERS.md`

### P04
- Tạo `docs/P04/BRAND_ASSET_GUIDELINES.md`
- Tạo `docs/P04/MASCOT_SPECIFICATION.md`
- Tạo `docs/P04/LOGO_USAGE_GUIDELINES.md`
- Tạo `docs/P04/ICON_SYSTEM.md`
- Tạo `docs/P04/ILLUSTRATION_GUIDELINES.md`
- Tạo `docs/P04/ASSET_CATALOG.md`
- Tạo `docs/P04/ASSET_QA_CHECKLIST.md`
- Tạo `public/assets/brand/` (5 SVG): logo-primary, logo-compact, logo-mark, favicon, app-icon
- Tạo `public/assets/mascot/` (8 SVG): default, happy, cooking, holding-recipe, thinking, success, error, waving
- Tạo `public/assets/icons/` (38 SVG): nav (7), cooking (9), interaction (13), content (9)
- Tạo `public/assets/illustrations/` (9 SVG): empty-recipes, no-results, empty-favorites, empty-shopping-list, loading, error, 404, success, welcome
- Tạo `scripts/p04_generate_assets.py` (sinh asset, idempotent) và `scripts/p04_validate_assets.py` (kiểm định)
- Cập nhật `CURRENT_STATUS.md`, `PHASE_PROGRESS.md`, `DECISIONS.md`, `BLOCKERS.md`

### P05
- Tạo `styles/globals.css` (tokens P03 → `@theme` Tailwind v4, reset, utilities, reduced-motion)
- Tạo `components/ui/` (14): Button, IconButton, Link, Badge, Chip, Avatar, Card, Divider, Tooltip, Skeleton, Spinner, EmptyState, ErrorState, LoadingState
- Tạo `components/forms/`: FormField, FormLabel, FormHint, FormError, Input, Textarea, Select, Checkbox, Radio/RadioGroup, Switch, SearchInput
- Tạo `components/navigation/` (4): Breadcrumb, Tabs, Pagination, Dropdown
- Tạo `components/feedback/` (3): Modal, ConfirmDialog, ToastProvider/useToast
- Tạo `components/recipe/` (13): RecipeImage, RecipeCard, RecipeCardCompact, IngredientRow/IngredientList, CookingStepCard, CookingTime/PreparationTime/ServingsBadge/DifficultyBadge, CategoryCard, NutritionSummary, AllergenBadges (+ `types.ts`)
- Tạo `components/layout/`: Container, SiteLogo, SiteHeader, PrimaryNav, MobileMenu, SiteFooter, PlaceholderPage
- Tạo `app/layout.tsx` (root), `app/loading.tsx`, `app/error.tsx`, `app/not-found.tsx`
- Tạo `app/(public)/` (12 route), `app/(auth)/` (1), `app/(admin)/` (1), `app/dev/components/` (dev-only)
- Tạo `lib/` (`utils/{cn,format}.ts`, `hooks/use-outside-click.ts`, `constants/{site,navigation}.ts`, `mock/recipes.ts`)
- Tạo `tests/` (11 file, 60 test) + cấu hình Vitest
- Tạo `docs/P05/`: `IMPLEMENTATION_REPORT.md`, `COMPONENT_CATALOG.md`, `APPLICATION_SHELL.md`, `RESPONSIVE_IMPLEMENTATION.md`, `ACCESSIBILITY_REPORT.md`, `TEST_REPORT.md`
- Cập nhật `CURRENT_STATUS.md`, `PHASE_PROGRESS.md`, `DECISIONS.md`, `BLOCKERS.md`

### P06
- Tạo `prisma/schema.prisma` (22 enum + 57 model theo P02) + `generator/datasource` (preview `postgresqlExtensions`, `directUrl`)
- Tạo `prisma/migrations/20261127175936_init/migration.sql` (baseline: 3 extension + 22 enum + 57 bảng) + `migration_lock.toml`
- Tạo `prisma/seed.ts` + `prisma/seed/data.ts` + `prisma/seed/run.ts` (seed hệ thống idempotent + seed dev)
- Tạo `lib/config/env.ts`, `lib/db/prisma.ts`, `lib/db/prisma-errors.ts`
- Tạo `lib/db/repositories/` (ports + adapter Prisma: Unit, Taxonomy, Ingredient) + `index.ts`
- Tạo `lib/errors/app-error.ts`, `lib/validation/{common,catalog}.ts`
- Tạo `lib/auth/authorization.ts`, `lib/auth/session.ts`; `lib/services/catalog.service.ts` + `index.ts`
- Tạo `.env.example`; cập nhật `package.json` (scripts db:*, test:integration, `prisma.seed`) + `vitest.config.ts` + `vitest.integration.config.ts`
- Tạo test: `tests/lib/` (3 file, 18 test), `tests/integration/` (5 file, 28 test), `tests/stubs/server-only.ts`
- Tạo `docs/P06/`: `DATABASE_IMPLEMENTATION.md`, `PRISMA_SCHEMA_GUIDE.md`, `MIGRATION_GUIDE.md`, `SEED_GUIDE.md`, `REPOSITORY_ARCHITECTURE.md`, `DATABASE_SECURITY.md`, `TEST_REPORT.md`
- Cập nhật `CURRENT_STATUS.md`, `PHASE_PROGRESS.md`, `DECISIONS.md`, `BLOCKERS.md`

### P07
- Tạo domain + repository: `lib/db/repositories/recipe.repository.ts` (interface + DTO), `prisma-recipe.repository.ts` (adapter Prisma, transaction, resolve term/unit), `media.repository.ts` + `prisma-media.repository.ts`
- Tạo service: `lib/services/recipe.service.ts`, `media.service.ts` (+ cập nhật `lib/services/index.ts`)
- Tạo validation: `lib/validation/recipe.ts`; tách `termSlugSchema` (cho phép `_`) khỏi `slugSchema` trong `lib/validation/common.ts`; cập nhật `lib/validation/catalog.ts`
- Tạo storage adapter: `lib/storage/{storage.port,r2-storage.adapter,local-storage.adapter,image-validation,index}.ts`
- Tạo presentation mapper (thuần): `lib/presentation/{recipe-view,recipe-links,recipe-form-values,slug}.ts`
- Tạo API: `app/api/v1/recipes/route.ts`, `recipes/[id]/route.ts`, `recipes/[id]/{publish,archive,submit-review,versions}/route.ts`, `admin/recipes/route.ts`, `media/route.ts`, `media/[id]/route.ts`, `media/file/[...key]/route.ts`
- Tạo trang công khai: `app/(public)/cong-thuc/page.tsx` (danh sách), `loading.tsx`, `error.tsx`, `[slug]/page.tsx` (chi tiết + JSON-LD)
- Tạo trang quản trị: `app/(admin)/admin/cong-thuc/{page.tsx,moi/page.tsx,[id]/sua/page.tsx}`
- Tạo component: `components/admin/{recipe-form,recipe-status-actions,admin-access-notice}.tsx`, `components/recipe/recipe-filters.tsx`
- Tạo test: `tests/lib/recipe-validation.test.ts`, `tests/lib/recipe.presentation.test.ts`, `tests/components/{recipe-filters,recipe-form}.test.tsx`, `tests/integration/{recipe.repository,recipe.service}.test.ts`
- Tạo `docs/P07/`: `RECIPE_MODULE_ARCHITECTURE.md`, `RECIPE_DOMAIN.md`, `RECIPE_API_IMPLEMENTATION.md`, `RECIPE_FRONTEND.md`, `RECIPE_MEDIA.md`, `RECIPE_AUTHORIZATION.md`, `RECIPE_CONTENT_POLICY.md`, `TEST_REPORT.md`
- Cập nhật `CURRENT_STATUS.md`, `PHASE_PROGRESS.md`, `DECISIONS.md`, `BLOCKERS.md`

### P07.1
- Tạo `lib/favorites/cookie.ts` (module thuần: version, dedupe, giới hạn 50, xử lý cookie hỏng/quá lớn/version lạ), `lib/favorites/server.ts` (đọc/ghi cookie HttpOnly), `app/actions/favorites.ts` (Server Actions add/remove/toggle/clear)
- Tạo component: `components/recipe/{favorite-button,share-recipe-button,clear-favorites-button}.tsx`; sửa `recipe-card.tsx` (thêm `favoriteSlot`), `components/recipe/index.ts` (export)
- Rewrite `app/(public)/yeu-thich/page.tsx` (danh sách yêu thích thật, chỉ công thức published); tích hợp nút yêu thích vào `cong-thuc/page.tsx` + `[slug]/page.tsx`
- Bỏ khái niệm **tài khoản khách**: xóa `app/(public)/tai-khoan/page.tsx`; sửa `site-header.tsx`, `mobile-menu.tsx`, `lib/constants/navigation.ts`; viết lại `app/(auth)/dang-nhap/page.tsx` thành cổng đăng nhập quản trị
- Thêm `listPublicSummariesBySlugs` (repository interface + Prisma adapter) và `getPublicSummariesBySlugs` (service)
- Tạo `tests/lib/favorites.test.ts` (29 test); cập nhật `vitest` không đổi cấu hình
- Tạo `docs/P07_1/`: `INTEGRATION_AUDIT.md`, `AUTHENTICATION_SCOPE.md`, `DATABASE_CLASSIFICATION.md`, `COOKIE_FAVORITES.md`, `EXTERNAL_VERIFICATION.md`, `E2E_VERIFICATION.md`
- Tạo `docs/checkpoints/P07_1_CHECKPOINT.md`
- Cập nhật `CURRENT_STATUS.md`, `PHASE_PROGRESS.md`, `DECISIONS.md`, `BLOCKERS.md`

### P08
- Tạo `lib/constants/taxonomy.ts` (6 trục khám phá `DISCOVERY_TAXONOMIES`, `RecipeFilterKind`, hàm tra cứu)
- Tạo `lib/presentation/category-links.ts`, `lib/validation/taxonomy.ts`
- Tạo `lib/services/taxonomy.service.ts` (đọc công khai + CRUD quản trị + xoá an toàn) + export trong `lib/services/index.ts`
- Mở rộng repository: `taxonomy.repository.ts` (+ `prisma-taxonomy.repository.ts`) và `recipe.repository.ts` (+ `prisma-recipe.repository.ts`) — thêm bộ lọc khám phá + truy vấn kèm số liệu
- Mở rộng `lib/validation/recipe.ts` (bộ lọc khám phá), `lib/services/recipe.service.ts` (`listPublicForCategory`, `buildDiscoveryFilters`), `lib/presentation/recipe-links.ts`
- Tạo component: `components/recipe/category-tile.tsx`, `components/admin/taxonomy-manager.tsx`; mở rộng `components/recipe/recipe-filters.tsx`
- Tạo trang công khai: `app/(public)/danh-muc/{page,[segment]/page,[segment]/[slug]/page}.tsx`; sửa `app/(public)/cong-thuc/{page,[slug]/page}.tsx` (badge phân loại có liên kết)
- Tạo trang quản trị: `app/(admin)/admin/danh-muc/{page,[type]/page}.tsx`; sửa `app/(admin)/admin/page.tsx`; `app/layout.tsx` (`metadataBase`)
- Tạo API: `app/api/v1/admin/taxonomy/{route,[id]/route}.ts`
- Tạo test: `tests/lib/{taxonomy.constants,category-links,taxonomy-validation,taxonomy.service,recipe-discovery}.test.ts` (46 unit); `tests/integration/taxonomy.service.test.ts`
- Tạo `docs/P08/`: `TAXONOMY_DISCOVERY.md`, `DISCOVERY_API.md`, `CATEGORY_PAGES.md`, `ADMIN_TAXONOMY.md`, `RECIPE_UX.md`, `TEST_REPORT.md`
- Tạo `docs/checkpoints/P08_CHECKPOINT.md`
- Cập nhật `CURRENT_STATUS.md`, `PHASE_PROGRESS.md`, `DECISIONS.md`, `BLOCKERS.md`

### P09
- Tạo logic thuần `lib/cooking/{portion,state}.ts` (nhân khẩu phần + trạng thái phiên nấu/checklist, có `version`, `localStorage` an toàn SSR)
- Tạo UI `components/cooking/{cooking-experience,cooking-mode,cooking-progress,ingredient-checklist,portion-selector,cooking-exit-confirmation,index}.tsx`
- Sửa `components/recipe/types.ts` (thêm `IngredientQuantityData` + `quantityData`, `imageUrl`, `imageAlt` — optional); `lib/presentation/recipe-view.ts` (điền `quantityData` + ảnh bước); `app/(public)/cong-thuc/[slug]/page.tsx` (dùng `CookingExperience`)
- Tạo test: `tests/lib/cooking.portion.test.ts` (21), `tests/lib/cooking.state.test.ts` (18), `tests/components/cooking.test.tsx` (11) — **50 unit test**
- Tạo `docs/P09/`: `RECIPE_DATA_AUDIT.md`, `COOKING_MODE.md`, `PORTION_SCALING.md`, `INGREDIENT_CHECKLIST.md`, `TEST_REPORT.md`
- Tạo `docs/checkpoints/P09_CHECKPOINT.md`
- Cập nhật `CURRENT_STATUS.md`, `PHASE_PROGRESS.md`, `DECISIONS.md`, `BLOCKERS.md`

### P10
- Tạo logic thuần `lib/kitchen/{timers,units,ingredient-match,alerts,index}.ts` (multi-timer `deadline` là nguồn sự thật + `localStorage` có version; quy đổi đơn vị không ném lỗi; so khớp nguyên liệu chuẩn hoá bỏ dấu; cảnh báo Web Audio/Notification/vibrate an toàn)
- Tạo UI `components/kitchen/{multi-timer,timer-card,timer-form,unit-converter,ingredient-search,ingredient-chip,recipe-match-card,missing-ingredients,index}.tsx` (**8 component**)
- Tạo trang công khai `app/(public)/cong-cu/{page,do-ng-ho/page,quy-doi-don-vi/page,tim-theo-nguyen-lieu/page}.tsx` (hub + 3 công cụ)
- Tạo API `app/api/v1/kitchen/ingredient-match/route.ts` (`GET`, `q`/`ingredient`, trả kết quả khớp + thiếu)
- Sửa (chỉ thêm): `lib/db/repositories/recipe.repository.ts` (+`RecipeIngredientCandidateDto`, `listPublicIngredientCandidates`), `prisma-recipe.repository.ts` (impl), `lib/services/recipe.service.ts` (`matchByIngredients`), `lib/validation/recipe.ts` (`matchByIngredientsQuerySchema`), `lib/constants/navigation.ts` (mục "Công cụ" + "Công cụ nhà bếp")
- Tạo test: `tests/lib/kitchen/{timers(31),units(23),ingredient-match(17)}.test.ts`, `tests/components/kitchen.test.tsx` (17) — **88 unit test**; `tests/integration/kitchen.ingredient-match.test.ts` (4 — chưa chạy, thiếu DB)
- Tạo `docs/P10/`: `MULTI_TIMER.md`, `UNIT_CONVERTER.md`, `INGREDIENT_DISCOVERY.md`, `SMART_KITCHEN_UI.md`, `TEST_REPORT.md`
- Tạo `docs/checkpoints/P10_CHECKPOINT.md`
- Cập nhật `CURRENT_STATUS.md`, `PHASE_PROGRESS.md`, `DECISIONS.md`, `BLOCKERS.md`

## Ràng buộc xuyên suốt
- Chỉ dùng 1 agent, không tạo sub-agent.
- Không code website / không tạo database / không triển khai backend trong P00, P00-FIX & P01; P02 thiết kế kiến trúc/schema/API nhưng **không viết code ứng dụng**; P03 chỉ xây **Design System + đặc tả giao diện**, P04 chỉ tạo **tài nguyên nhận diện (SVG) + quy chuẩn**, cả hai **không dựng UI/không triển khai website**. **P05 mới dựng UI thật** (Shared UI Components + Application Shell) nhưng **không** kết nối database/Auth/R2, **không** triển khai chức năng module (route chức năng là placeholder).
- Tài nguyên P04 phải nhất quán với palette/typography/phong cách đã khóa ở P03; không tự đổi thương hiệu; không dùng asset có bản quyền không rõ nguồn. P05 **tái sử dụng** token P03 (không tạo hệ thống token thứ hai) và asset P04.
- Giữ nguyên kiến trúc đã chốt (stack lớp rời, gói miễn phí, phi thương mại, Pastel Mint).
- **P06** chỉ triển khai **nền tảng dữ liệu** (Prisma/migration/seed/repository/service/validation/authorization); **không** triển khai đăng nhập thật (Auth.js) và **không** kết nối Neon/R2 thật khi chưa có credentials; **không** giả lập người dùng đã đăng nhập (`getCurrentActor()` trả `null`); **không** tạo công thức giả như nội dung đã xuất bản.
- **P07** chỉ triển khai **module Recipe** trên nền dữ liệu P06, **tái sử dụng** component P05 (không viết lại UI dùng chung); UI **không** gọi Prisma trực tiếp; quyền kiểm ở **server** (RBAC tập trung, không hardcode role); Auth.js vẫn **chưa nối** → mọi thao tác ghi trả **401**, **không** giả lập người dùng; media chạy **local provider** khi chưa có credentials R2 (R2 adapter đã hoàn thiện nhưng **chưa** xác minh kết nối thật); nội dung công thức trong test là **fixture**, **không** tuyên bố có công thức thật đã xuất bản; **không** tự chuyển sang P08.
- **P08** chỉ triển khai **phân loại & khám phá** trên taxonomy P06 + module Recipe P07, **không** thêm model/cột taxonomy (D62/D63), **không** tạo taxonomy trùng, **không** tạo bộ lọc cho dữ liệu chưa có (D64); xoá danh mục **có điều kiện** (ưu tiên lưu trữ — D65); **chỉ** Admin quản trị taxonomy (401 khi Auth.js chưa nối, kiểm quyền ở server); **không** mở rộng sang cộng đồng/tài khoản khách/chatbot; **không** triển khai P09.
- **P09** chỉ triển khai **trải nghiệm nấu** trên trang chi tiết công thức (Cooking Mode/Portion Scaling/Checklist), tận dụng shared UI P05 + view-model P07; **không** thêm schema/migration (D70); **không** dùng `CookingSession`/`CookingProgress` (yêu cầu `userId`) → lưu **cục bộ** `localStorage` có version (D67); Portion Scaling **chỉ nhân số, giữ nguyên đơn vị** — **không** quy đổi khối lượng↔thể tích (D68), **không** sửa dữ liệu công thức gốc; **không** bịa hướng dẫn/định lượng/nhiệt độ/thời gian; **không** tài khoản khách, **không** lưu dữ liệu nhạy cảm; **không** triển khai P10.
- **P10** chỉ triển khai **công cụ nhà bếp** (nhiều đồng hồ / quy đổi đơn vị / tìm món theo nguyên liệu), tận dụng shared UI P05 + Recipe Discovery P08; **không** thêm schema/migration (D74); đồng hồ **nguồn sự thật là `deadline`** — `setInterval` chỉ re-render (D71); quy đổi **chỉ khi có hệ số xác định** — **không** quy đổi mass↔volume/giữa đơn vị đếm, phân biệt cup US vs metric cup (D72); tìm món bằng **thuật toán xác định trên dữ liệu thật** — **không** AI/dịch vụ trả phí, **không** tự tạo công thức, **không** đoán nguyên liệu khác tên là tương đương (D73); không xin quyền không liên quan (camera/microphone), **không** tự xin quyền/thông báo khi tải trang; **không** tài khoản khách, **không** lưu dữ liệu nhạy cảm; **không** triển khai P11.
- Chỉ commit file thuộc phạm vi phase. P00/P00-FIX/P01 chỉ commit local; P02 trở đi được phép đưa checkpoint lên `origin/main` một cách an toàn (không force-push, không rewrite lịch sử).
