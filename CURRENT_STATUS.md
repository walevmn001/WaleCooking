# CURRENT STATUS — WALE COOKING

> Cập nhật: 2026-11-28 (P18 — Auth.js Integration).

## Tóm tắt
- **Sản phẩm:** WALE COOKING — website cá nhân chuyên công thức & hỗ trợ nấu ăn (**Recipe-focused Cooking Assistant**; tiếng Việt, sẵn sàng i18n EN). **Không** mạng xã hội, **không** cộng đồng, **không** tài khoản khách truy cập.
- **Phase hiện tại:** hoàn thành **P00**, **P00-FIX**, **P01**, **P02**, **P03**, **P04**, **P05**, **P06**, **P07**, **P07.1**, **P08**, **P09**, **P10**, **P11**, **P12**, **P13.1** (Neon PostgreSQL), **P14** (feature roadmap audit), **P15** (Public Discovery Completion — trang chủ FR-01 + tìm kiếm công khai FR-05), **P16** (Recipe Discovery & Importer Architecture Design — thiết kế kiến trúc, **không** triển khai code), **I1 (P17)** (Hạ tầng & tiền đề Recipe Importer) và **P18** (**Auth.js Integration** — xác thực & phân quyền nền tảng, giải quyết blocker **B-P06-02**). **I2 (URL Import) chưa bắt đầu** (chờ đánh giá của chủ dự án).
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
- **Đã hoàn thiện P10:** **Smart Kitchen Tools** — (1) **P10.1 Multi Timer** — nhiều đồng hồ cùng lúc (tạo/đặt tên/bắt đầu/tạm dừng/tiếp tục/đặt lại/xoá/cảnh báo hết giờ), **nguồn sự thật là `deadline` (epoch ms)** — `setInterval` chỉ re-render (đúng khi tab ẩn/khoá màn hình), tạm dừng chốt `pausedRemaining`, lưu **cục bộ** `localStorage` (`wale_timers_v1`, có `version`, khôi phục khi tải lại), cảnh báo 4 kênh (banner / Web Audio mở khoá qua tương tác / Notification API xin quyền khi người dùng bấm / rung thiết bị), **không** xin quyền không liên quan; (2) **P10.2 Unit Converter** — khối lượng (SI/avoirdupois), thể tích (US customary + **metric cup** 250 ml), nhiệt độ; **chỉ quy đổi khi có hệ số xác định**, **không** quy đổi mass↔volume/giữa đơn vị đếm, `convertUnit` không ném lỗi, logic **tách khỏi UI**; (3) **P10.3 Ingredient-Based Discovery** — tìm món theo nguyên liệu đang có: chuẩn hoá bỏ dấu + loại trùng + so khớp tên/slug, điểm phù hợp (`matched`/`coverage`/`missingRequired`) trên **dữ liệu thật**, **không** AI, **không** tự tạo công thức; (4) **P10.4 UI** — khu vực `/cong-cu` (hub + 3 công cụ) + **8 component** tái sử dụng (`MultiTimer`/`TimerCard`/`TimerForm`/`UnitConverter`/`IngredientSearch`/`IngredientChip`/`RecipeMatchCard`/`MissingIngredients`), tận dụng P05 + Recipe Discovery P08 (D74). **Kiểm chứng:** `typecheck` 0 lỗi · `lint` 0 lỗi · **337/337 unit test** (31 file, **+88 test P10**) · `build` thành công (thêm `/cong-cu*` + `/api/v1/kitchen/ingredient-match`; `DATABASE_URL` placeholder). **Chưa xác minh:** integration P10.3 (không có PostgreSQL), E2E/thiết bị thật (khoá màn hình/throttle/âm thanh/Notification). Tài liệu `docs/P10/` + `docs/checkpoints/P10_CHECKPOINT.md`.
- **Đã hoàn thiện P11:** **Real-World Verification & UX Polish** (phase ổn định & hoàn thiện — **không** thêm tính năng mới) — (1) **P11.1 Full Project Audit** 16 khu vực (Foundation/Database/Recipe/Admin/Media/Taxonomy/Discovery/Favorites/Cooking/Portion/Checklist/Multi Timer/Unit Converter/Ingredient Discovery/SEO/Responsive) + phân loại Critical/High/Medium/Low; (2) **P11.2–P11.4** xác minh luồng khách & quản trị (HTTP thật), trải nghiệm nấu & công cụ nhà bếp (bảng ca kiểm thử Portion Scaling + Unit Converter); (3) **P11.5–P11.6** audit mobile/SEO/performance/security; (4) **P11.9 sửa 3 lỗi Medium**: **BUG-01** soft-404 (xóa 3 `loading.tsx` tạo Suspense boundary → route động trả **404** đúng), **BUG-02** thêm `app/sitemap.ts` + `app/robots.ts` (trước đây 404), **BUG-03** thêm security headers + ẩn `X-Powered-By`; (5) **P11.7** chạy lại toàn bộ test. **Kiểm chứng:** `typecheck` 0 lỗi · `lint` 0 lỗi · **337/337 unit test** (31 file) · **59/59 integration test** (9 file — PostgreSQL thật, gồm `kitchen.ingredient-match` **khắc phục B-P10-02**) · `build` thành công **42 route** (có `/sitemap.xml`, `/robots.txt`). **Chưa xác minh (External Verification Pending):** hiển thị thực tế 6 viewport, E2E/axe/Lighthouse/screen reader, timer nền (khóa màn hình/chuyển app), đăng nhập admin thật (Auth.js chưa nối). 10 tài liệu `docs/P11/` + `docs/checkpoints/P11_CHECKPOINT.md`.
- **Đã hoàn thiện P12:** **Production Deployment & Browser Verification** (tiếp nối P00–P11; **không** thêm tính năng, **không** đổi kiến trúc/framework/DB/design system; **1 AI Agent**, không sub-agent) — (1) **P12.1** audit trạng thái thực tế; (2) **P12.2** DB readiness — sửa **FIND-04**: `lib/db/prisma.ts` chuyển sang **Proxy lazy** → `pnpm build` **không còn cần `DATABASE_URL`**, loại bỏ lỗi Vercel *"Failed to collect configuration for /api/v1/admin/recipes"*; (3) **P12.3** storage readiness — sửa **FIND-07**: `getStorage()` ở `NODE_ENV=production` thiếu `R2_*` → **ném lỗi rõ ràng** (không ghi FS tạm Vercel), `MediaService` resolve storage **lazy**; chấp nhận **FIND-05** (cảnh báo tracing media local); (4) **P12.4** thiết lập **Playwright** kết nối Chrome qua **CDP** (không có Chromium binary) + DB E2E **riêng** (`wale_e2e`, seed idempotent tiền tố `e2e-`) → **28/28 E2E PASS** (public/cooking/tools/admin/api); (5) **P12.5** responsive & UX — **14/14 PASS** (viewport 375/390/768/1440; tràn ngang, nav, menu mobile, console/network, bàn phím/focus); (6) **P12.6** xác minh build production **PASS** khi thiếu `DATABASE_URL` + checklist deploy (ghi rõ `DIRECT_URL` cần cho migration Neon). **Kiểm chứng:** `typecheck` 0 lỗi · `lint` 0 lỗi · **337/337 unit** (31 file) · **59/59 integration** (9 file) · **42/42 E2E** (6 file) · `build` thành công **40 route**. **BLOCKED (thiếu môi trường):** Neon thật, R2 thật, Vercel production, đăng nhập Admin thật/RBAC (Auth.js chưa nối). 9 tài liệu `docs/P12/` + `docs/checkpoints/P12_CHECKPOINT.md`.
- **Đã hoàn thiện P13.1:** **Neon PostgreSQL Production Integration** (tiếp nối P12; **1 AI Agent**, không sub-agent; **không** thêm tính năng, **không** đổi schema/kiến trúc; **không** triển khai R2/Auth.js) — (1) **P13.1.1** audit (`docs/P13/P13.1_AUDIT.md`); (2) **P13.1.2** kiểm cấu hình Neon: `prisma/schema.prisma` (`url=env("DATABASE_URL")` POOLED + `directUrl=env("DIRECT_URL")` DIRECT) + `lib/config/env.ts` **đã đúng**, **không cần sửa mã**; bổ sung `tests/lib/config/env.test.ts` (**6 test**); (3) **P13.1.3** kết nối: thêm `scripts/verify-db.ts` (chỉ đọc, không lộ secret) — chạy thực tế trên PostgreSQL 16.15 local **PASS**; **Neon thật BLOCKED** (sandbox không có credentials); (4) **P13.1.4** migration: `prisma migrate status` OK, `prisma migrate deploy` trên **DB trống mới `wale_p13`** → áp `20261127175936_init`, **58 bảng**; **Neon BLOCKED**; **không** dùng `db push`/`migrate reset`; (5) **P13.1.5** kiểm chứng: `typecheck`/`lint` 0 lỗi · **343/343 unit** (32 file) · **59/59 integration** (9 file) · `build` **PASS** (không cần `DATABASE_URL`); (6) **P13.1.6** tài liệu + checkpoint. **BLOCKED (thiếu môi trường):** kết nối Neon thật, `migrate deploy`/seed/xác minh CRUD trên Neon. Tài liệu `docs/P13/` + `docs/checkpoints/P13_CHECKPOINT.md`.
- **Đã hoàn thiện P14:** **Feature Roadmap Audit & Next Feature Selection** (phase **audit**, không triển khai code) — đối chiếu PRD/P01 với source code thực tế; phân loại **20/20 nhóm chức năng** (DONE **8** · PARTIAL **6** · MISSING **5** · DEFERRED **1**); ma trận hạ tầng (DONE 4 · BLOCKED 4 · MISSING 2); **technical debt** TD-01…TD-14; **feature roadmap** và chọn **P15 = Public Discovery Completion (FR-01 + FR-05)**. Tài liệu `docs/roadmap/P14_FEATURE_ROADMAP_AUDIT.md`.
- **Đã hoàn thiện P15:** **Public Discovery Completion — Trang chủ (FR-01) & Tìm kiếm công khai (FR-05)** (1 AI Agent, không sub-agent; **không** thêm schema/migration; **không** FTS/autocomplete; **không** phụ thuộc Neon/R2) — (1) **P15.1** `lib/services/homepage.service.ts` — `HomepageService.load()` → `{ newest, categories }`: **món mới** `published` sắp theo `publishedAt` giảm dần + giới hạn 6, **danh mục** taxonomy khám phá thật; **tách lỗi độc lập** từng khối (khối lỗi → `null`, `console.error`, không nuốt lỗi), **không N+1** (`Promise.all`), tái sử dụng `recipeService.listPublic` + `taxonomyService.listDiscoveryGroups`; (2) **P15.2** `app/(public)/page.tsx` — thay landing P05 tĩnh bằng **trang chủ dữ liệu thật** (`force-dynamic`): Hero (WALE COOKING + CTA), **ô tìm kiếm** → `/tim-kiem?q=…` (`SearchForm`), khối **“Món mới”** (`RecipeCard`), **Khám phá danh mục** (taxonomy thật → `/danh-muc*`), **Lối vào công cụ**; khối rỗng bị **ẩn**, DB rỗng → `EmptyState` thân thiện; (3) **P15.3** `app/(public)/tim-kiem/page.tsx` — **thay hoàn toàn `PlaceholderPage`** bằng trang tìm kiếm công khai: nhận `q` + bộ lọc (`foodType`/`cuisine`/`difficulty`/`mealType`/`cookingMethod`/`dietary`/`maxMinutes`/`sort`), phân trang, **đồng bộ URL** (chia sẻ được), Empty/Error state, giữ nguyên validation (`sanitizeRecipeListQuery` loại trường sai thay vì lỗi server); (4) **P15.4** UX/trợ năng + mở rộng E2E (semantic heading, `aria-live` số kết quả thật, keyboard/focus, back/forward, 4 viewport); (5) **P15.5** kiểm chứng đầy đủ + tài liệu. **Kiểm chứng P15.5 (thực tế):** `typecheck` 0 lỗi · `lint` 0 lỗi · **363/363 unit** (34 file) · **59/59 integration** (9 file, PostgreSQL 16.15 local `wale_test`) · **52/52 E2E** (Chrome CDP + DB `wale_e2e`) · `build` PASS (26 trang tĩnh; `/` và `/tim-kiem` Dynamic). **14/14 Acceptance Criteria PASS**. Tài liệu `docs/checkpoints/P15.1…P15.4_CHECKPOINT.md` + `docs/checkpoints/P15_CHECKPOINT.md`.
- **Đã hoàn thiện P16:** **Recipe Discovery & Importer Architecture Design** (phase **audit & thiết kế kiến trúc** — **KHÔNG** triển khai importer, **không** sửa `prisma/schema.prisma`/mã nguồn, **không** thêm dependency, **không** chạy migration/seed; **1 AI Agent**, không sub-agent) — (1) **P16.0** preflight & audit trạng thái thực tế; (2) **P16.1** `SOURCE_DISCOVERY_STRATEGY.md` — 9 phương thức discovery (D1–D9) + 5 tầng phân loại nguồn (discoverable/accessible/extractable/permitted/manual) + **Source Registry** (`ImportSource` + enum `support_status`) + phân tích robots.txt/ToS/copyright/attribution/rate limit/ảnh/opt-out; (3) **P16.2** `EXTRACTION_ENGINE.md` — pipeline **5 bậc E1–E5** (JSON-LD → metadata → site adapter → heuristic → AI), ánh xạ **21 trường** sang DTO thật, **trạng thái trường** `MISSING/UNREADABLE/CONFIRMED/DERIVED/CONFLICT` + bậc + bằng chứng, interface `RecipeExtractor`/`ExtractionEngine`, lưu raw; **không bịa/không quy đổi đơn vị**; (4) **P16.3** `VIETNAMESE_LOCALIZATION.md` — quy trình **7 bước**, lưu song song gốc↔Việt (`RecipeTranslationDraft`), **9 loại lỗi I1–I9**, **không** auto-publish; (5) **P16.4** `DUPLICATE_DETECTION.md` — **6 lớp kiểm** L1–L6, **4 nhãn** EXACT/LIKELY/SIMILAR/DIFFERENT, không tự xoá/ghi đè, quality score; (6) **P16.5** `BATCH_PROCESSING_ARCHITECTURE.md` — **DB-backed queue** + worker stateless + checkpoint/resume/retry/**idempotency**, **16 thành phần**, trần **500 item/đợt**, đánh giá Vercel Hobby (không chạy worker dài hạn); (7) **P16.6** `ADMIN_REVIEW_WORKFLOW.md` — tinh gọn **12→9 trạng thái**, 11 thao tác admin; (8) **P16.7** `DATABASE_DESIGN.md` + `API_DESIGN.md` — **6 entity mới** + **11 enum**, **10 endpoint admin**; (9) **P16.8** `SECURITY_LEGAL_RESOURCE_LIMITS.md` — SSRF/private IP/DNS rebinding/prompt injection, bản quyền & attribution, giới hạn tài nguyên/chi phí; (10) **P16.9** `IMPLEMENTATION_ROADMAP.md` — **11 phase I1–I11**, URL Import trước. Tổng **11 tài liệu `docs/P16/` + 11 checkpoint `docs/checkpoints/P16.*`**; **18/18 Acceptance Criteria PASS**. **Chưa** triển khai code/không sửa schema; blocker hạ tầng Auth.js (B-P06-02) là điều kiện tiên quyết của phase I1.
- **Đã hoàn thiện I1 (P17):** **Hạ tầng & tiền đề Recipe Importer** — phase **triển khai đầu tiên** sau P16 (theo `docs/P16/IMPLEMENTATION_ROADMAP.md`; **1 AI Agent**, không sub-agent) — (1) **Schema:** mở rộng `prisma/schema.prisma` thêm **11 enum** + **6 entity** (`ImportSource`/`ImportJob`/`ImportJobItem`/`RecipeExtraction`/`RecipeTranslationDraft`/`DuplicateCandidate`) + back-relations trên `User`/`Recipe`; (2) **Migration** `20261128104202_add_recipe_importer_schema` — **chỉ** áp trên DB **dev/test local** (`wale_test`, `wale_e2e`), **KHÔNG** chạm production; (3) **Permission importer** `import:read/manage/approve/publish` + `source:manage` (**admin-only**) trong `lib/auth/authorization.ts`; (4) **Port** `ImportRepository` (+DTO) + **service khung** `ImportService` (guard `import:*`, `createdById` lấy từ actor — không tin client). **Quyết định chủ dự án: HOÃN Auth.js** → giữ `getCurrentActor() → null`, ghi B-P06-02 là **tiền đề bắt buộc** của I2/I6. **Không** triển khai URL Import (I2); **không** API; **không** thêm dependency; **không** tạo tài khoản admin/public registration/social login. **Kiểm chứng:** `typecheck`/`lint` 0 lỗi · **371/371 unit** (35 file) · **59/59 integration** (9 file) · **52/52 E2E** (Chrome CDP + `wale_e2e`) · `build` PASS · **4/4 AC PASS**. Checkpoint [P17_I1_CHECKPOINT.md](./docs/checkpoints/P17_I1_CHECKPOINT.md). **Chưa** xác minh 401/403 qua HTTP phiên thật (Auth.js chưa nối) — **không** tuyên bố production authentication hoạt động.
- **Đã hoàn thiện P18:** **Auth.js Integration** (xác thực & phân quyền nền tảng — **giải quyết B-P06-02**; tiếp nối I1 tại `9ca6537`; **1 AI Agent**, không sub-agent) — (1) **P18.1 kiến trúc:** chốt **Credentials provider** (email + mật khẩu) + **session strategy JWT (BẮT BUỘC)** — Auth.js **không hỗ trợ database session** cho Credentials; tái dùng bảng `users` (không đổi `sessions`/`accounts`, dành cho OAuth tương lai); role lấy từ `users.role` ký trong JWT; **không BLOCKED** (không cần credentials bên thứ ba); (2) **P18.2 Authentication:** `auth.ts` (NextAuth + callbacks `jwt`/`session`), `app/api/auth/[...nextauth]/route.ts`, trang đăng nhập thật `/dang-nhap` (`AdminSignInForm`), nút **Đăng xuất**; băm mật khẩu **scrypt** (`node:crypto`, không thêm dependency); **chỉ admin/editor** đăng nhập; **không** public registration/tài khoản mặc định/hardcode secret; (3) **P18.3 Authorization:** `getCurrentActor()` nối `await auth()` (điểm nối actor duy nhất), guard `/admin` (layout redirect) + `/api/v1/admin` (401/403); **giữ nguyên** permission importer I1; role **không** lấy từ client; (4) **P18.4 Env & provisioning:** thêm `AUTH_SECRET`/`AUTH_URL` (`.env.example`), script `pnpm admin:create` (băm scrypt, **không** tài khoản mặc định), **không** ghi secret thật; (5) **P18.5 Tests:** `tests/lib/{password,session}.test.ts` (10) + **E2E HTTP thật** `tests/e2e/auth.e2e.ts` (8). **Không** triển khai I2; **không** sửa schema/API importer; migration `20261128123000_add_user_password_hash` **chỉ** dev/test local. **Kiểm chứng:** `typecheck`/`lint` 0 lỗi · **381/381 unit** (37 file) · **59/59 integration** (9 file) · **60/60 E2E** (Chrome CDP + `wale_e2e`) · `build` PASS · **10/10 AC PASS**. Checkpoint [P18_AUTHJS_CHECKPOINT.md](./docs/checkpoints/P18_AUTHJS_CHECKPOINT.md). **Còn lại (ngoài phạm vi P18):** xác minh trên **Neon/Vercel production thật**.

> ⚠️ **Git preflight P15:** repo là **shallow clone 1 commit** ở trạng thái **đã gồm P15.1–P15.4** (`b8b96b3`, message `feat(P15.4)`); commit dự kiến `502a848` (P14) **không tồn tại** trong clone này. Working tree **sạch** → milestone còn lại **P15.5** đã hoàn tất; **không** reset/force-push/rewrite.

## Git
| Mục | Giá trị |
| --- | --- |
| Branch hiện tại | `trae/agent-GnjYMp` (đồng bộ `origin/main`) |
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
| Commit P08 | `ca1b4e9` — feat(P08): taxonomy & khám phá công thức (danh mục, bộ lọc, quản trị) |
| Commit P09 | `c8f9b91` — feat(P09): cooking experience — chế độ nấu, khẩu phần, checklist |
| Commit P10 | `be41af1` — feat(P10): công cụ nhà bếp — đồng hồ, quy đổi đơn vị, tìm món theo nguyên liệu |
| Commit P11 | `f19f970` — fix(P11): kiểm thử thực tế & hoàn thiện — sửa soft-404, bổ sung sitemap/robots, security headers |
| Commit P12.1 | `ce8d4fc` — docs(P12.1): audit trạng thái thực tế & checkpoint P12 |
| Commit P12.2 | `0c05a8e` — fix(P12.2): lazy Prisma init — build không còn cần DATABASE_URL (sửa FIND-04) |
| Commit P12.3 | `5fe16be` — fix(P12.3): chặn local storage ở production + giải mã storage lazy (sửa FIND-07) |
| Commit P12.4 | `63f46f0` — test(P12.4): bộ kiểm thử trình duyệt Playwright E2E (28/28 PASS) |
| Commit P12.5 | `399eb39` — test(P12.5): kiểm thử responsive & UX trên 4 viewport (14/14 PASS) |
| Commit P12.6 | `97ec94e` — docs(P12.6): xác minh build production & cấu hình triển khai Vercel |
| Commit P12.7 | `b3936be` — docs(P12.7): tài liệu bàn giao & checkpoint cuối P12 |
| Commit P13.1.1 | `eb0034c` — docs(P13.1.1): audit tích hợp Neon PostgreSQL production |
| Commit P13.1.2 | `4af1440` — test(P13.1.2): kiểm chứng hợp đồng cấu hình datasource Neon |
| Commit P13.1.3 | `9cb3836` — test(P13.1.3): kiểm chứng kết nối database (local PASS, Neon BLOCKED) |
| Commit P13.1.4 | `10ec5bd` — docs(P13.1.4): xác minh quy trình migration (local PASS, Neon BLOCKED) |
| Commit P13.1.5–6 | *(commit chứa tài liệu này — xem `git log -1`)* — test/docs(P13.1.5–6): kiểm chứng tích hợp & báo cáo Neon |
| Commit P14 | `b8b96b3` (kế thừa) — docs(P14): audit lộ trình chức năng & định hướng P15+ |
| Commit P15.1–P15.4 | `b8b96b3` — feat(P15.1–P15.4): truy vấn trang chủ, UI homepage, trang tìm kiếm công khai, UX/a11y |
| Commit P15.5 | *(commit chứa tài liệu này — xem `git log -1`)* — docs(P15.5): kiểm chứng đầy đủ & checkpoint cuối P15 |
| Commit P16.0 | `cc20ce3` — docs(p16): P16.0 audit trạng thái thực tế trước khi thiết kế Recipe Importer |
| Commit P16.1 | `dcbf3ec` — docs(p16): P16.1 source discovery strategy & source registry |
| Commit P16.2 | `4822771` — docs(p16): P16.2 recipe extraction engine design |
| Commit P16.3 | `572b83a` — docs(p16): P16.3 vietnamese localization pipeline design |
| Commit P16.4 | `f53b1c4` — docs(p16): P16.4 duplicate detection & data quality design |
| Commit P16.5 | `db810e5` — docs(p16): P16.5 batch processing architecture design |
| Commit P16.6 | `a9678f3` — docs(p16): P16.6 admin review workflow design |
| Commit P16.7 | `b34d754` — docs(p16): P16.7 database & API design for importer |
| Commit P16.8 | `19dcc31` — docs(p16): P16.8 security, legal & resource limits design |
| Commit P16.9 | `e3e28a3` — docs(p16): P16.9 implementation roadmap design |
| Commit P16 final | `3ed47c7` — docs(p16): P16 final report, checkpoint & status update |
| Commit I1 (P17) | `9ca6537` — feat(P17/I1): hạ tầng & tiền đề Recipe Importer (schema 6 entity + 11 enum, permission importer, khung repository/service) |
| Commit P18 | *(commit chứa tài liệu này — xem `git log -1`)* — feat(P18): tích hợp Auth.js (Credentials + JWT), xác thực quản trị & phân quyền nền tảng (giải quyết B-P06-02) |
| Working tree | Sạch sau khi commit P18 |
| `origin/main` | `9ca6537` (I1/P17) trước P18; cập nhật **fast-forward** sau khi push P18 (xem báo cáo push) |

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

## Sản phẩm bàn giao P09 (`docs/P09/` + mã nguồn)
**Tài liệu (`docs/P09/`):** `RECIPE_DATA_AUDIT.md` · `COOKING_MODE.md` · `PORTION_SCALING.md` · `INGREDIENT_CHECKLIST.md` · `TEST_REPORT.md` + checkpoint `docs/checkpoints/P09_CHECKPOINT.md`.

**Logic thuần (`lib/cooking/`):**
- `portion.ts` — `servingFactor`, `clampServings`, `parseServingsInput`, `formatScaledNumber`, `scaleIngredientAmount`, `scaleIngredients`.
- `state.ts` — trạng thái phiên nấu/checklist, `version`, đọc/ghi `localStorage` an toàn SSR (`createCookingState`, `parseCookingState`, `serializeCookingState`, `normalizeCheckedIds`, `checklistProgress`, `load/save/clearCookingState`).

**UI (`components/cooking/`):** `cooking-experience.tsx`, `cooking-mode.tsx` (`CookingModeLayout` + portal), `cooking-progress.tsx`, `ingredient-checklist.tsx`, `portion-selector.tsx`, `cooking-exit-confirmation.tsx` (+ `index.ts`).

**Sửa đổi:** `components/recipe/types.ts` (thêm `IngredientQuantityData`/`quantityData`, `imageUrl`/`imageAlt` — optional); `lib/presentation/recipe-view.ts`; `app/(public)/cong-thuc/[slug]/page.tsx`.

**Kiểm thử:** `tests/lib/cooking.portion.test.ts` (21), `tests/lib/cooking.state.test.ts` (18), `tests/components/cooking.test.tsx` (11) — **50 unit**. Tổng toàn bộ **249 unit test** (27 file).

## Sản phẩm bàn giao P10 (`docs/P10/` + mã nguồn)
**Tài liệu (`docs/P10/`):** `MULTI_TIMER.md` · `UNIT_CONVERTER.md` · `INGREDIENT_DISCOVERY.md` · `SMART_KITCHEN_UI.md` · `TEST_REPORT.md` + checkpoint `docs/checkpoints/P10_CHECKPOINT.md`.

**Logic thuần (`lib/kitchen/`):**
- `timers.ts` — `KitchenTimer`, `deadline` là nguồn sự thật; `createTimer`, `remainingSeconds`, `isFinished`, `startTimer`, `pauseTimer`, `resetTimer`, `setTimerDuration`, `renameTimer`, `tickTimer`, `formatClock`, `clampDurationSeconds` + `localStorage` (`wale_timers_v1`, `parseTimers`/`normalizeTimers`/`serializeTimers`/`load/save/clearTimers`).
- `units.ts` — `UNIT_DEFINITIONS` (khối lượng/thể tích/nhiệt độ/đếm/tùy biến), `convertUnit` (→ `ConversionResult`), `convertTemperature`, `getUnit`/`unitsByDimension`/`convertibleTargets`, `parseAmountInput`, `formatConvertedValue`.
- `ingredient-match.ts` — `normalizeText`, `dedupeIngredients`, `ingredientMatches`, `matchRecipesByIngredients`.
- `alerts.ts` — `notificationsSupported`/`getNotificationPermission`/`requestNotificationPermission`/`notifyTimerFinished`, `isAudioUnlocked`/`unlockAudio`/`playTimerChime`, `vibrateTimer` (+ `index.ts`).

**UI (`components/kitchen/`), 8 component:** `multi-timer.tsx`, `timer-card.tsx`, `timer-form.tsx`, `unit-converter.tsx`, `ingredient-search.tsx`, `ingredient-chip.tsx`, `recipe-match-card.tsx`, `missing-ingredients.tsx` (+ `index.ts`).

**Trang & API:** `app/(public)/cong-cu/{page,do-ng-ho/page,quy-doi-don-vi/page,tim-theo-nguyen-lieu/page}.tsx`; `app/api/v1/kitchen/ingredient-match/route.ts`.

**Sửa đổi (chỉ thêm):** `db/repositories/recipe.repository.ts` (+`RecipeIngredientCandidateDto`, `listPublicIngredientCandidates`), `prisma-recipe.repository.ts`; `services/recipe.service.ts` (`matchByIngredients`); `validation/recipe.ts` (`matchByIngredientsQuerySchema`); `constants/navigation.ts`.

**Kiểm thử:** `tests/lib/kitchen/{timers(31),units(23),ingredient-match(17)}.test.ts` + `tests/components/kitchen.test.tsx` (17) — **88 unit** + `tests/integration/kitchen.ingredient-match.test.ts` (4 — chưa chạy, thiếu DB). Tổng toàn bộ **337 unit test** (31 file).

## Sản phẩm bàn giao P11 (`docs/P11/` + mã nguồn)
**Tài liệu (`docs/P11/`):** `FULL_PROJECT_AUDIT.md` · `USER_FLOW_VERIFICATION.md` · `COOKING_FEATURE_VERIFICATION.md` · `SMART_KITCHEN_VERIFICATION.md` · `MOBILE_UX_AUDIT.md` · `SEO_PERFORMANCE_AUDIT.md` · `SECURITY_AUDIT.md` · `BUG_FIX_REPORT.md` · `TEST_REPORT.md` · `MANUAL_VERIFICATION_CHECKLIST.md` + checkpoint `docs/checkpoints/P11_CHECKPOINT.md`.

**Xóa (FIX-A — sửa soft-404):** `app/loading.tsx`, `app/(public)/cong-thuc/loading.tsx`, `app/(public)/cong-thuc/[slug]/loading.tsx`.

**Thêm mới (FIX-B — SEO):** `app/sitemap.ts` (chỉ nội dung công khai; try/catch quanh DB), `app/robots.ts` (chặn `/admin`,`/api/`,`/dev/`).

**Sửa đổi:** `next.config.ts` (FIX-C — security headers + ẩn `X-Powered-By`); `app/(public)/cong-thuc/page.tsx` (cập nhật chú thích).

**Không** thêm schema/migration/dependency; **không** đổi design system/kiến trúc.

## Sản phẩm bàn giao P12 (`docs/P12/` + mã nguồn & kiểm thử)
**Tài liệu (`docs/P12/`):** `DEPLOYMENT_AUDIT.md` · `DATABASE_READINESS.md` · `STORAGE_READINESS.md` · `PLAYWRIGHT_SETUP.md` · `E2E_TEST_REPORT.md` · `RESPONSIVE_UX_REPORT.md` · `VERCEL_DEPLOYMENT_REPORT.md` · `MANUAL_VERIFICATION_CHECKLIST.md` · `P12_SUMMARY.md` + checkpoint `docs/checkpoints/P12_CHECKPOINT.md`.

**Sửa lỗi (production readiness):**
- **FIND-04 (P12.2):** `lib/db/prisma.ts` → **Proxy lazy** (không khởi tạo Prisma khi module import) → `pnpm build` không còn cần `DATABASE_URL`; loại bỏ lỗi Vercel *"Failed to collect configuration for /api/v1/admin/recipes"*.
- **FIND-07 (P12.3):** `lib/storage/index.ts` → `getStorage()` **ném lỗi rõ ràng** ở `NODE_ENV=production` khi thiếu `R2_*` (không ghi filesystem tạm Vercel); `services/media.service.ts` resolve storage **lazy**.
- **FIND-05 (chấp nhận, known warning):** 3 cảnh báo Turbopack "Dynamic filesystem access" tại `app/api/v1/media/file/[...key]/route.ts` — do local adapter; không bỏ qua bằng `turbopackIgnore` khi chưa có bằng chứng.

**Kiểm thử trình duyệt (Playwright qua CDP — `127.0.0.1:9222`):**
- `tests/e2e/` — `public.e2e.ts` · `cooking.e2e.ts` · `tools.e2e.ts` · `admin.e2e.ts` · `api.e2e.ts` · `responsive.e2e.ts` + `fixtures.ts` · `seed-e2e.ts`.
- DB E2E **riêng** (`wale_e2e`), seed idempotent tiền tố `e2e-`; **không** chạm dữ liệu production.
- `playwright.config.ts` + scripts `pnpm e2e` / `e2e:seed` trong `package.json`.

**Kiểm thử:** `typecheck` 0 lỗi · `lint` 0 lỗi · **337/337 unit** (31 file) · **59/59 integration** (9 file) · **42/42 E2E** (6 file) · `build` **40 route** (không cần `DATABASE_URL`).

**Không** thêm schema/migration/feature; **không** đổi framework/DB/design system.

## Sản phẩm bàn giao P13.1 (`docs/P13/` + script & test)
**Tài liệu (`docs/P13/`):** `P13.1_AUDIT.md` · `P13.1_NEON_INTEGRATION_REPORT.md` + checkpoint `docs/checkpoints/P13_CHECKPOINT.md`.

**Thêm mới (không đổi mã nguồn ứng dụng, không đổi schema):**
- [scripts/verify-db.ts](file:///workspace/scripts/verify-db.ts) — kiểm chứng kết nối database (**chỉ đọc**, không lộ secret): runtime `DATABASE_URL` (pooled) + migration `DIRECT_URL` (direct), version, quyền schema/bảng, Prisma Client đọc, lịch sử migration.
- [tests/lib/config/env.test.ts](file:///workspace/tests/lib/config/env.test.ts) — **6 test** hợp đồng env: bắt buộc/scheme `DATABASE_URL`, `DIRECT_URL` tùy chọn, không lộ giá trị trong thông báo lỗi, memoized, `hasR2Config`.

**Xác nhận (không sửa):** `prisma/schema.prisma` (`url=env("DATABASE_URL")` pooled + `directUrl=env("DIRECT_URL")` direct) và `lib/config/env.ts` (Zod lazy+memoized) **đã đúng cho Neon**; Prisma **6.19.3** tương thích `directUrl` + `?pgbouncer=true`; lazy Proxy (FIND-04) **giữ nguyên** → build vẫn không cần `DATABASE_URL`.

**Kiểm chứng:** `typecheck` 0 lỗi · `lint` 0 lỗi · **343/343 unit** (32 file) · **59/59 integration** (9 file) · `prisma migrate deploy` trên **DB trống `wale_p13`** → **58 bảng** · `build` **PASS** (không cần `DATABASE_URL`).

**BLOCKED (thiếu môi trường sandbox — không giả lập PASS):** kết nối Neon thật, `migrate deploy`/seed/xác minh CRUD trên Neon. Hướng dẫn thủ công ở [P13.1_NEON_INTEGRATION_REPORT.md](./docs/P13/P13.1_NEON_INTEGRATION_REPORT.md) §7.

## Sản phẩm bàn giao P16 (`docs/P16/` + checkpoint — **tài liệu-only, không mã nguồn**)
**Tài liệu thiết kế (`docs/P16/`, 11 file):** `SOURCE_DISCOVERY_STRATEGY.md` (P16.1) · `EXTRACTION_ENGINE.md` (P16.2) · `VIETNAMESE_LOCALIZATION.md` (P16.3) · `DUPLICATE_DETECTION.md` (P16.4) · `BATCH_PROCESSING_ARCHITECTURE.md` (P16.5) · `ADMIN_REVIEW_WORKFLOW.md` (P16.6) · `DATABASE_DESIGN.md` + `API_DESIGN.md` (P16.7) · `SECURITY_LEGAL_RESOURCE_LIMITS.md` (P16.8) · `IMPLEMENTATION_ROADMAP.md` (P16.9) · `P16_FINAL_REPORT.md` (báo cáo 12 mục).

**Checkpoint (`docs/checkpoints/`, 11 file):** `P16.0_AUDIT.md` · `P16.1_CHECKPOINT.md` … `P16.9_CHECKPOINT.md` · `P16_CHECKPOINT.md`.

**Nội dung cốt lõi:**
- **Discovery:** 9 phương thức (D1–D9), 5 tầng phân loại nguồn, **Source Registry** (`ImportSource` + enum `support_status`), phân tích robots.txt/ToS/copyright/attribution/rate limit/ảnh/opt-out.
- **Extraction:** pipeline **5 bậc E1–E5**, ánh xạ **21 trường** sang DTO thật, trạng thái trường `MISSING/UNREADABLE/CONFIRMED/DERIVED/CONFLICT`, interface adapter, lưu raw.
- **Localization:** 7 bước, lưu song song gốc↔Việt, **9 loại lỗi I1–I9**, không auto-publish.
- **Dedupe:** 6 lớp kiểm L1–L6, 4 nhãn EXACT/LIKELY/SIMILAR/DIFFERENT, không tự xoá/ghi đè, quality score.
- **Batch:** DB-backed queue + worker stateless + checkpoint/resume/retry/idempotency, 16 thành phần, trần **500 item/đợt**.
- **Admin review:** tinh gọn 12→9 trạng thái, 11 thao tác admin, chỉ admin.
- **Database/API:** **6 entity mới** + **11 enum**; **10 endpoint admin**.
- **Bảo mật/pháp lý:** SSRF/private IP/DNS rebinding, 8 bước kiểm tra URL, bản quyền & attribution, giới hạn tài nguyên/chi phí.
- **Roadmap:** 11 phase nhỏ **I1–I11** (URL Import trước, Auto Discovery/batch 500 sau).

**Không** sửa `prisma/schema.prisma`/mã nguồn; **không** thêm dependency; **không** chạy migration/seed/destructive; **không** secrets. **18/18 Acceptance Criteria PASS.**

## Sản phẩm bàn giao P18 (`docs/checkpoints/P18_AUTHJS_CHECKPOINT.md` + mã nguồn & kiểm thử)
**Checkpoint:** `docs/checkpoints/P18_AUTHJS_CHECKPOINT.md` (báo cáo 11 mục).

**Xác thực (Auth.js v5 — Credentials + JWT):**
- [auth.ts](file:///workspace/auth.ts) — `NextAuth`: `session.strategy="jwt"`, `pages.signIn="/dang-nhap"`, `trustHost`, Credentials provider, callbacks `jwt`/`session`; module augmentation `next-auth`.
- [app/api/auth/[...nextauth]/route.ts](file:///workspace/app/api/auth/%5B...nextauth%5D/route.ts) — re-export `handlers` (`GET`/`POST`).
- [lib/auth/password.ts](file:///workspace/lib/auth/password.ts) — băm/kiểm mật khẩu **scrypt** (`node:crypto`, N=16384/r=8/p=1/keylen=64/salt 16B), format `scrypt$N$r$p$salt$hash`, `timingSafeEqual`.
- [components/auth/admin-sign-in-form.tsx](file:///workspace/components/auth/admin-sign-in-form.tsx) + [app/(auth)/dang-nhap/page.tsx](file:///workspace/app/(auth)/dang-nhap/page.tsx) — cổng đăng nhập quản trị thật.

**Phân quyền:**
- [lib/auth/session.ts](file:///workspace/lib/auth/session.ts) — `getCurrentActor()` nối `await auth()` (điểm nối actor duy nhất).
- [app/(admin)/layout.tsx](file:///workspace/app/(admin)/layout.tsx) — guard server + nút Đăng xuất.
- Giữ nguyên [lib/auth/authorization.ts](file:///workspace/lib/auth/authorization.ts) (RBAC + 5 permission importer từ I1).

**Provisioning & env:**
- [scripts/create-admin.ts](file:///workspace/scripts/create-admin.ts) — `pnpm admin:create` (băm scrypt; **không** tài khoản/mật khẩu mặc định).
- [.env.example](file:///workspace/.env.example) — `AUTH_SECRET` (bắt buộc runtime) + `AUTH_URL` + hướng dẫn provisioning.
- `prisma/schema.prisma` — `User.passwordHash`; migration `20261128123000_add_user_password_hash` (**chỉ** dev/test local).

**Kiểm thử:** `tests/lib/password.test.ts` (4) · `tests/lib/session.test.ts` (6) · `tests/e2e/{auth.e2e.ts (8), accounts.ts}` + cập nhật `seed-e2e.ts`/`admin.e2e.ts`/`api.e2e.ts`.

**Kiểm chứng:** `typecheck` 0 lỗi · `lint` 0 lỗi · **381/381 unit** (37 file) · **59/59 integration** (9 file) · **60/60 E2E HTTP thật** (Chrome CDP + `wale_e2e`) · `build` PASS · **10/10 AC PASS**.

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
- **B-P06-02:** ~~**Auth.js chưa nối**~~ → **✅ ĐÃ GIẢI QUYẾT (P18)** — Auth.js (Credentials + JWT) đã nối; `getCurrentActor()` trả actor từ phiên thật; 401/403 kiểm chứng qua HTTP thật (E2E). Xem [P18_AUTHJS_CHECKPOINT.md](./docs/checkpoints/P18_AUTHJS_CHECKPOINT.md).
- **B-P07-01:** chưa xác minh media trên **Cloudflare R2 thật** (chạy local provider).
- **B-P07-02:** ~~chưa có test HTTP end-to-end cho authorization~~ → **✅ ĐÃ GIẢI QUYẾT (P18)** — thêm `tests/e2e/auth.e2e.ts` (8 test HTTP thật: 200/401/403/client sửa role/cookie giả mạo).
- **B-P07-03:** chưa nối luồng **upload ảnh trong form quản trị** với `POST /api/v1/media`.
- **B-P07-04:** chưa kiểm **UI module Recipe trên trình duyệt thật** (kế thừa B-P05-01).
- **B-P07-05:** chưa siết BR-03 "nội dung tự biên soạn" & chưa có quy trình reviewer nhiều bước.
- **B-P07_1-01:** chưa xác minh **Neon PostgreSQL thật** (External Verification Pending; kế thừa B-P06-01).
- **B-P07_1-02:** chưa xác minh **Cloudflare R2 thật** (External Verification Pending; media chạy local provider).
- **B-P07_1-03:** ~~chưa xác minh **đăng nhập quản trị (Auth.js)**~~ → **✅ ĐÃ GIẢI QUYẾT (P18)** — đăng nhập quản trị + 401/403 kiểm chứng qua HTTP thật.
- **B-P07_1-04:** chưa chạy **E2E trình duyệt thật** (yêu thích cookie, responsive, a11y).
- **B-P08-01:** chưa chạy **integration test taxonomy** (đã viết, sandbox không có PostgreSQL — External Verification Pending).
- **B-P08-02:** chưa kiểm **trang danh mục trên trình duyệt thật** (responsive, SEO/canonical/JSON-LD, a11y).
- **B-P08-03:** ~~chưa xác minh **phân quyền quản trị taxonomy qua HTTP phiên thật**~~ → **✅ ĐÃ GIẢI QUYẾT (P18)** — E2E: editor tạo taxonomy → 403; admin → được phép.
- **B-P08-04:** chưa có **ảnh đại diện/SEO cho danh mục** (schema chưa có cột — ghi backlog).
- **B-P10-01:** chưa kiểm **đồng hồ đếm ngược trên thiết bị thật khi đứng bếp** (tab ẩn/throttle, khoá màn hình, phát âm thanh, Notification API, rung) — External Verification Pending.
- **B-P10-02:** chưa chạy **integration test P10.3 (tìm món theo nguyên liệu)** → **ĐÃ GIẢI QUYẾT (P11)** — `tests/integration/kitchen.ingredient-match.test.ts` (4 test) đã **chạy thành công trên PostgreSQL thật** trong P11 (59/59 integration test pass).
- **B-P10-03:** chưa **đối chiếu hệ số quy đổi với dụng cụ đo vật lý** (hệ số theo định nghĩa chuẩn đã ghi nguồn; không áp dụng tỷ trọng nguyên liệu) — chấp nhận theo thiết kế.
- **B-P11-01:** chưa kiểm **hiển thị thực tế 6 viewport** (320–1920) trên trình duyệt/thiết bị thật (tràn ngang, dialog, kích thước nút) — **MỘT PHẦN — ĐÃ CHẠY P12** (responsive E2E 4 viewport 375/390/768/1440, 14/14 PASS); thiết bị thật vẫn Pending.
- **B-P11-02:** chưa chạy **E2E/axe/Lighthouse/screen reader** (a11y/runtime/perf thực) — **ĐÃ GIẢI QUYẾT MỘT PHẦN (P12)** — Playwright E2E qua CDP đã chạy **42/42 PASS**; axe/Lighthouse/screen reader vẫn Pending.
- **B-P11-03:** chưa kiểm **timer nền trên thiết bị thật** (khóa màn hình/chuyển app/rung/âm thanh/Notification) — kế thừa B-P10-01.
- **B-P12-01:** chưa xác minh **Neon PostgreSQL thật** (External Verification Pending) — sandbox không có credentials Neon; đã xác minh gián tiếp qua PostgreSQL 16.15 local + `prisma migrate deploy` chờ chủ dự án chạy.
- **B-P12-02:** chưa xác minh **Cloudflare R2 thật** (External Verification Pending) — cần cấu hình `R2_*` trên Vercel; thiếu → production **ném lỗi rõ ràng** (guard P12.3), không ghi FS tạm.
- **B-P12-03:** chưa xác minh **Vercel production deployment** — không có quyền truy cập Vercel; đã xác minh **build local PASS** khi thiếu `DATABASE_URL`.
- **B-P12-04:** ~~chưa xác minh **đăng nhập Admin thật / RBAC qua HTTP**~~ → **✅ ĐÃ GIẢI QUYẾT (P18)** — Auth.js đã nối; E2E kiểm đăng nhập Admin thật + RBAC (admin 200 / editor 403 / guest 401).
- Hạn mức gói miễn phí đã ghi theo thời điểm **11/2026** — cần kiểm tra lại trước khi deploy.

## Phase tiếp theo
- **P18 hoàn thành** (trong giới hạn môi trường) — **Auth.js Integration**: xác thực quản trị (Credentials + JWT) + phân quyền nền tảng; **giải quyết B-P06-02**. **10/10 AC PASS**. Checkpoint [P18_AUTHJS_CHECKPOINT.md](./docs/checkpoints/P18_AUTHJS_CHECKPOINT.md). **DỪNG — KHÔNG** tự chuyển sang I2.
- **I1 (P17) hoàn thành** — hạ tầng & tiền đề Recipe Importer: schema 6 entity + 11 enum, migration dev/test, permission importer admin-only, khung repository/service. **4/4 AC PASS**. Checkpoint [P17_I1_CHECKPOINT.md](./docs/checkpoints/P17_I1_CHECKPOINT.md).
- **Bước kế tiếp — I2 (Core URL Import): CHƯA triển khai — chờ đánh giá của chủ dự án.** Theo roadmap `docs/P16/IMPLEMENTATION_ROADMAP.md` (11 phase I1–I11): **I2 (Core URL Import)** → I6 (duyệt admin). **URL Import hoạt động ổn định trước**, rồi mới Auto Discovery (I8) & batch 500 (I7).
- **Điều kiện tiên quyết của I2 (và I6): ✅ ĐÃ GỠ** — **B-P06-02** đã giải quyết ở P18 (Auth.js đã nối; 401/403 kiểm qua HTTP thật).
- **BLOCKED (thiếu môi trường)** — cần chủ dự án thao tác thủ công: chạy `prisma migrate deploy` trên Neon, cấu hình `R2_*` + `AUTH_SECRET` trên Vercel, kiểm tra deployment Vercel, tạo tài khoản admin đầu tiên bằng `pnpm admin:create` trên môi trường thật. Xem [MANUAL_VERIFICATION_CHECKLIST.md](./docs/P12/MANUAL_VERIFICATION_CHECKLIST.md).
- Các hạng mục "External Verification Pending" (Neon/R2/Vercel, thiết bị thật, a11y chuyên sâu) tiếp tục theo dõi ở `BLOCKERS.md`.
- **Backlog định hướng tương lai** (chưa triển khai): thực đơn theo ngày; bộ lọc theo thời gian/độ khó; hướng dẫn sơ chế & bảo quản; danh sách đi chợ; đồng bộ tiến độ nấu giữa thiết bị.

## Tham chiếu
- [PHASE_PROGRESS.md](./PHASE_PROGRESS.md) · [DECISIONS.md](./DECISIONS.md) · [BLOCKERS.md](./BLOCKERS.md)
- Checkpoint: [docs/checkpoints/P07_1_CHECKPOINT.md](./docs/checkpoints/P07_1_CHECKPOINT.md) · [docs/checkpoints/P08_CHECKPOINT.md](./docs/checkpoints/P08_CHECKPOINT.md) · [docs/checkpoints/P09_CHECKPOINT.md](./docs/checkpoints/P09_CHECKPOINT.md) · [docs/checkpoints/P10_CHECKPOINT.md](./docs/checkpoints/P10_CHECKPOINT.md) · [docs/checkpoints/P11_CHECKPOINT.md](./docs/checkpoints/P11_CHECKPOINT.md) · [docs/checkpoints/P12_CHECKPOINT.md](./docs/checkpoints/P12_CHECKPOINT.md) · [docs/checkpoints/P15_CHECKPOINT.md](./docs/checkpoints/P15_CHECKPOINT.md) · [docs/checkpoints/P16_CHECKPOINT.md](./docs/checkpoints/P16_CHECKPOINT.md) · [docs/checkpoints/P17_I1_CHECKPOINT.md](./docs/checkpoints/P17_I1_CHECKPOINT.md) · [docs/checkpoints/P18_AUTHJS_CHECKPOINT.md](./docs/checkpoints/P18_AUTHJS_CHECKPOINT.md)
- Tài liệu P00: [docs/P00](./docs/P00/) · P01: [docs/P01](./docs/P01/) · P02: [docs/P02](./docs/P02/) · P03: [docs/P03](./docs/P03/) · P04: [docs/P04](./docs/P04/) · P05: [docs/P05](./docs/P05/) · P06: [docs/P06](./docs/P06/) · P07: [docs/P07](./docs/P07/) · P07.1: [docs/P07_1](./docs/P07_1/) · P08: [docs/P08](./docs/P08/) · P09: [docs/P09](./docs/P09/) · P10: [docs/P10](./docs/P10/) · P11: [docs/P11](./docs/P11/) · P12: [docs/P12](./docs/P12/) · P16: [docs/P16](./docs/P16/)
