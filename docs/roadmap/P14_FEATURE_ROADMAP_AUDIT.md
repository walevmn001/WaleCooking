# P14 — FEATURE ROADMAP AUDIT & NEXT FEATURE SELECTION

> Phase **audit** (không triển khai code). Mục tiêu: đối chiếu PRD/P01 với **source code thực tế**, phân loại toàn bộ 20 nhóm chức năng, xây dựng feature roadmap, và **chọn đúng một phase tiếp theo**.
> Nguyên tắc: chỉ đọc + tài liệu hoá; **không** sửa PRD/kiến trúc; **không** thêm tính năng mới; **không** kích hoạt Neon/R2 production; **không** tạo phase mới trong P14.
> Ngày: 2026-11-28 · 1 AI Agent · Không sub-agent.

---

## 1. GIT STATE

### 1.1 Trạng thái tại thời điểm audit

| Mục | Giá trị |
| --- | --- |
| Branch hiện tại | `trae/agent-VkDApw` |
| HEAD | `502a84885b609c67c418da85cfe952ca3f27bf3a` |
| `origin/main` | `502a84885b609c67c418da85cfe952ca3f27bf3a` (HEAD == origin/main) |
| Working tree | **Sạch** (không có thay đổi chưa commit) |
| Thay đổi chưa commit | Không |
| Phase dang dở | Không (P13.2 đã đóng tại `502a848`) |

### 1.2 Lịch sử commit (rút gọn)

```
502a848 docs(P13.2): audit cảnh báo build Vercel (tracing/Prisma/esbuild) & media production
8e2387a test/docs(P13.1.5-6): kiểm chứng tích hợp & báo cáo Neon PostgreSQL
10ec5bd docs(P13.1.4): xác minh quy trình migration (local PASS, Neon BLOCKED)
9cb3836 test(P13.1.3): kiểm chứng kết nối database (local PASS, Neon BLOCKED)
4af1440 test(P13.1.2): kiểm chứng hợp đồng cấu hình datasource Neon
eb0034c docs(P13.1.1): audit tích hợp Neon PostgreSQL production
b3936be docs(P12.7): tài liệu bàn giao & checkpoint cuối P12
97ec94e docs(P12.6): xác minh build production & cấu hình triển khai Vercel
```

### 1.3 Xác minh checkpoint P13.1 & P13.2

| Checkpoint | Commit | Trạng thái |
| --- | --- | --- |
| P13.1 (Neon PostgreSQL Integration) | `eb0034c`…`8e2387a` | ⚠️ MỘT PHẦN — Neon BLOCKED (local PASS) |
| P13.2 (Pre-check cảnh báo build Vercel) | `502a848` | ✅ Hoàn thành (không sửa mã) |
| P13.3 (Production Activation) | — | ⏸️ **PENDING** (theo chỉ thị, KHÔNG coi là hoàn thành) |

**Kết luận Git:** Repository ở **đúng trạng thái dự kiến**. Không cần reset/force-push/ghi đè. Điểm tiếp tục an toàn: **`origin/main` @ `502a848`**.

---

## 2. PHƯƠNG PHÁP & NGUỒN BẰNG CHỨNG

- **Quy tắc phân loại:** chỉ đánh dấu **DONE** khi có bằng chứng từ **code + test + tài liệu triển khai**. Thiếu bằng chứng → PARTIAL/MISSING, không suy diễn.
- **Đối chiếu 2 chiều:** (a) tài liệu định hướng (P00–P13) ↔ (b) source code thực tế trong `app/`, `lib/`, `components/`, `prisma/`, `tests/`.
- **Không chạy lại toàn bộ test** vì **code không đổi** kể từ P13.1/P13.2; kết quả test được **kế thừa có ghi nguồn** (mục 6).
- **Không** đọc/in/ghi bất kỳ secret nào; không chạy migration/seed trên Neon.

---

## 3. TÀI LIỆU ĐÃ ĐỌC

| Nhóm | Tài liệu |
| --- | --- |
| PRD & sản phẩm | `docs/P01/PRD.md`, `docs/P01/PRODUCT_CONSTITUTION.md`, `docs/P01/MVP_SCOPE.md`, `docs/P01/FUNCTIONAL_REQUIREMENTS.md`, `docs/P01/BUSINESS_RULES.md`, `docs/P01/ACCEPTANCE_CRITERIA.md`, `docs/P01/NON_FUNCTIONAL_REQUIREMENTS.md`, `docs/P01/USER_JOURNEYS.md`, `docs/P01/USER_PERSONAS.md` |
| Kiến trúc & dữ liệu | `docs/P02/SYSTEM_ARCHITECTURE.md`, `ARCHITECTURE_DECISIONS.md`, `DATABASE_SCHEMA.md`, `ENTITY_RELATIONSHIP_DIAGRAM.md`, `API_CONTRACT.md`, `AUTHORIZATION_SECURITY.md`, `SEARCH_ARCHITECTURE.md`, `MEDIA_STORAGE.md`, `DEPLOYMENT_ARCHITECTURE.md`, `MODULE_DESIGN.md` |
| Design System & UI/UX | `docs/P03/DESIGN_SYSTEM.md`, `ACCESSIBILITY_GUIDELINES.md`, `RESPONSIVE_GUIDELINES.md`, `COMPONENT_SPECIFICATIONS.md`; `docs/P05/APPLICATION_SHELL.md`, `COMPONENT_CATALOG.md` |
| Tài nguyên nhận diện | `docs/P04/ASSET_CATALOG.md` |
| Dữ liệu & module | `docs/P06/DATABASE_IMPLEMENTATION.md`, `REPOSITORY_ARCHITECTURE.md`; `docs/P07/RECIPE_MODULE_ARCHITECTURE.md`, `RECIPE_API_IMPLEMENTATION.md`, `RECIPE_MEDIA.md`; `docs/P07_1/AUTHENTICATION_SCOPE.md`, `COOKIE_FAVORITES.md` |
| Khám phá & nấu & công cụ | `docs/P08/TAXONOMY_DISCOVERY.md`, `CATEGORY_PAGES.md`, `DISCOVERY_API.md`; `docs/P09/COOKING_MODE.md`, `PORTION_SCALING.md`, `INGREDIENT_CHECKLIST.md`; `docs/P10/MULTI_TIMER.md`, `UNIT_CONVERTER.md`, `INGREDIENT_DISCOVERY.md` |
| Chất lượng & production | `docs/P11/FULL_PROJECT_AUDIT.md`, `SEO_PERFORMANCE_AUDIT.md`, `SECURITY_AUDIT.md`, `BUG_FIX_REPORT.md`; `docs/P12/DATABASE_READINESS.md`, `STORAGE_READINESS.md`, `VERCEL_DEPLOYMENT_REPORT.md`, `E2E_TEST_REPORT.md`, `RESPONSIVE_UX_REPORT.md`, `P12_SUMMARY.md`; `docs/P13/P13.1_AUDIT.md`, `P13.1_NEON_INTEGRATION_REPORT.md` |
| Checkpoint | `docs/checkpoints/P07_1_CHECKPOINT.md`…`P13_CHECKPOINT.md`, `docs/checkpoints/P13.2_PRECHECK.md` |
| Trạng thái dự án | `PHASE_PROGRESS.md`, `BLOCKERS.md`, `DECISIONS.md`, `CURRENT_STATUS.md`, `README.md` |
| Backlog / debt | Trích từ `BLOCKERS.md` (B-P02-02, B-P07-03, B-P08-04, B-P11-*), `DECISIONS.md` (D64/D67/D68/D70/D74/D78) |

**Code đã đối chiếu:** `app/(public)/page.tsx`, `app/(public)/tim-kiem/page.tsx`, `app/(public)/kien-thuc/page.tsx`, `app/(public)/cong-thuc/page.tsx`, `app/(public)/cong-thuc/[slug]/page.tsx`, `app/(public)/yeu-thich/page.tsx`, `app/(public)/cong-cu/page.tsx`, `app/(admin)/admin/page.tsx`, `components/admin/recipe-form.tsx`, `components/recipe/share-recipe-button.tsx`, `components/recipe/recipe-filters.tsx`, `lib/constants/navigation.ts`, `lib/validation/recipe.ts`, `lib/presentation/recipe-links.ts`, `lib/db/repositories/prisma-recipe.repository.ts`, `prisma/schema.prisma`.

---

## 4. FEATURE IMPLEMENTATION MATRIX

Bảng đối chiếu **20/20 nhóm chức năng** (FR-01..FR-20) giữa PRD/P01 và code thực tế.

| ID | Tính năng | Ưu tiên MVP | Trạng thái | Bằng chứng chính |
| --- | --- | --- | --- | --- |
| FR-01 | Trang chủ (khối dữ liệu thật) | Must | **MISSING** | `app/(public)/page.tsx` vẫn là landing P05: badge “Nền tảng giao diện P05”, `quickLinks` tĩnh + khối “Trạng thái các module”. **Không** có khối món nổi bật/mới/phổ biến/danh mục theo dữ liệu |
| FR-02 | Thư viện công thức | Must | **DONE** | `app/(public)/cong-thuc/page.tsx` dùng `recipeService.listPublic`, phân trang, `EmptyState`/`ErrorState`, favorite cookie |
| FR-03 | Chi tiết công thức | Must | **DONE** | `app/(public)/cong-thuc/[slug]/page.tsx`: đầy đủ trường, JSON-LD, `CookingExperience`, `NutritionSummary`, `AllergenBadges`, nguồn, liên kết danh mục, 404 |
| FR-04 | Hệ thống phân loại (7 trục) | Must | **DONE** | Taxonomy lưu DB (`prisma/schema.prisma`), 6 trục khám phá `DISCOVERY_TAXONOMIES` (`lib/constants/taxonomy.ts`), trang `/danh-muc*`, quản trị `/admin/danh-muc*`, API taxonomy |
| FR-05 | Tìm kiếm | Must | **PARTIAL** | Ô tìm kiếm hoạt động trong `RecipeFilters` (`/cong-thuc?q=`); **nhưng** trang chuyên `/tim-kiem` là **placeholder** (`PlaceholderPage`), tìm kiếm dùng `contains` + `mode: "insensitive"` (`prisma-recipe.repository.ts` dòng 127/131) — **chưa** FTS `unaccent`/`pg_trgm`/`tsvector`, chưa autocomplete, chưa xếp hạng theo độ liên quan |
| FR-06 | Tìm món từ nguyên liệu sẵn có | Should | **DONE** | `lib/kitchen/ingredient-match.ts`, API `GET /api/v1/kitchen/ingredient-match`, trang `/cong-cu/tim-theo-nguyen-lieu` |
| FR-07 | Bộ lọc | Must (cơ bản) | **DONE** | `components/recipe/recipe-filters.tsx` + `listRecipesQuerySchema` (foodType/cuisine/difficulty/mealType/cookingMethod/dietary/maxMinutes/sort) |
| FR-08 | Điều chỉnh khẩu phần | Must | **DONE** | `lib/cooking/portion.ts` + `portion-selector`, tích hợp P09 |
| FR-09 | Chế độ nấu từng bước | Must (cơ bản) | **DONE** | `components/cooking/cooking-experience.tsx`, `cooking-mode.tsx` (P09) |
| FR-10 | Thư viện kiến thức nấu ăn | Should | **MISSING** | `app/(public)/kien-thuc/page.tsx` là `PlaceholderPage` phase="P08" |
| FR-11 | Sổ tay cá nhân | Must (yêu thích) / Should | **PARTIAL** | **Yêu thích DONE**: cookie `HttpOnly` (`lib/favorites/*`), trang `/yeu-thich`, Server Actions. **Chưa có** bộ sưu tập/lịch sử nấu/ghi chú (Should — chủ động hoãn) |
| FR-12 | Meal Planner | Could | **MISSING** | Không có code |
| FR-13 | Shopping List | Should | **MISSING** | Không có code |
| FR-14 | Dinh dưỡng & dị ứng | Should | **PARTIAL** | Component `NutritionSummary`/`AllergenBadges` đã render trong chi tiết (ẩn khi thiếu dữ liệu); **phụ thuộc** dữ liệu dinh dưỡng/allergen nhập qua admin (chưa có luồng nhập đầy đủ) |
| FR-15 | Trợ lý AI nấu ăn | Could | **MISSING** | Cố ý ngoài phạm vi (rủi ro Honest AI, dịch vụ ngoài) |
| FR-16 | Tài khoản (khách) | Must | **DEFERRED** | Quyết định P07.1: **không có tài khoản khách**; Auth.js chỉ cho admin và **chưa nối** (`getCurrentActor()` trả `null`). Không thêm hệ auth thứ hai |
| FR-17 | CMS/Admin | Must (cơ bản) | **PARTIAL** | CRUD công thức + workflow draft→in_review→published→archived, quản trị taxonomy, validation server-side đã có; **nhưng** admin auth **chưa nối** (thao tác ghi trả 401) và **upload ảnh trong form chưa tích hợp** `POST /api/v1/media` (B-P07-03) |
| FR-18 | Bản quyền & nguồn nội dung | Must (trường nguồn) | **DONE** | Trường sources bắt buộc khi không phải nội dung gốc; hiển thị nguồn công khai ở chi tiết |
| FR-19 | SEO, chia sẻ, in, đa ngôn ngữ | Must (SEO/print) / Should (i18n) | **PARTIAL** | SEO DONE (`metadata`, JSON-LD Recipe, `app/sitemap.ts`, `app/robots.ts`); chia sẻ DONE (`share-recipe-button.tsx` Web Share API + clipboard); **in** chưa có `@media print` chuyên biệt; **i18n EN** chưa có (Should — hoãn) |
| FR-20 | Bảo mật, sao lưu, giám sát, kiểm thử | Must (cơ bản) | **PARTIAL** | Security headers + ẩn `X-Powered-By` (P11), RBAC tập trung + test đầy đủ; **chưa có** logging/error monitoring; **backup/restore** phụ thuộc Neon (BLOCKED) |

**Tổng hợp phân loại FR (20 nhóm):**

| Trạng thái | Số lượng | Danh sách |
| --- | :-: | --- |
| DONE | **8** | FR-02, FR-03, FR-04, FR-06, FR-07, FR-08, FR-09, FR-18 |
| PARTIAL | **6** | FR-05, FR-11, FR-14, FR-17, FR-19, FR-20 |
| MISSING | **5** | FR-01, FR-10, FR-12, FR-13, FR-15 |
| DEFERRED | **1** | FR-16 |
| BLOCKED (cấp FR) | **0** | (blocked thuộc hạ tầng — xem mục 5) |

---

## 5. INFRASTRUCTURE MATRIX

| Hạng mục | Trạng thái | Bằng chứng / ghi chú |
| --- | --- | --- |
| PostgreSQL / Prisma | **DONE** | Prisma 6.19.3, 22 enum/57 model/58 bảng; baseline `20261127175936_init`; `migrate deploy` PASS trên DB trống local; integration 59/59 |
| Neon integration | **BLOCKED** | Sandbox không có `DATABASE_URL`/`DIRECT_URL` → `scripts/verify-db.ts` in `[BLOCKED]` (B-P13-01..04). **Không giả lập PASS** |
| R2 storage | **BLOCKED** | Adapter R2 hoàn thiện về code nhưng chưa có `R2_*`; media chạy LocalStorageAdapter (B-P12-02) |
| Vercel deployment | **BLOCKED** | Build local PASS (không cần `DATABASE_URL`); sandbox không có quyền Vercel (B-P12-03) |
| Security headers | **DONE** | `next.config.ts` (P11 FIX-C): headers + `poweredByHeader: false` |
| SEO | **DONE** | `metadataBase`, metadata, JSON-LD Recipe, canonical |
| Sitemap / Robots | **DONE** | `app/sitemap.ts`, `app/robots.ts` (P11 FIX-B) |
| Logging | **MISSING** | Chưa có dịch vụ logging có cấu trúc (O4/DECISIONS — dịch vụ monitoring để giai đoạn sau) |
| Error monitoring | **MISSING** | Chưa tích hợp Sentry/giám sát lỗi (O4) |
| Backup / recovery | **BLOCKED** | Cơ chế PITR + export định kỳ theo gói Neon free chưa xác minh (B-P02-02) |

**Tổng hợp hạ tầng:** DONE = 4 · BLOCKED = 4 · MISSING = 2.

> ⚠️ **Cảnh báo diễn giải:** các hạng mục **BLOCKED (Neon, R2, Vercel, Backup)** là **hạ tầng production chưa kích hoạt**, **KHÔNG** phải tính năng đã hoàn thành. P13.3 Production Activation giữ **PENDING**.

---

## 6. KIỂM TRA CHẤT LƯỢNG (kế thừa bằng chứng)

Code **không đổi** kể từ P13.1/P13.2 ⇒ kết quả được **kế thừa** (không chạy lại), ghi rõ nguồn:

| Hạng mục | Kết quả | Nguồn |
| --- | --- | --- |
| TypeScript | 0 lỗi | P13.1 (`pnpm typecheck`) |
| ESLint | 0 lỗi | P13.1 (`pnpm lint`) |
| Unit tests | **343/343** (32 file) | P13.1 |
| Integration tests | **59/59** (9 file, PostgreSQL local) | P13.1 |
| E2E (Playwright/CDP) | **42/42** | P12.4 |
| Build production | PASS (≈28 route) | P13.2 (không cần `DATABASE_URL`) |
| API validation | Zod (`lib/validation/*`) + kiểm ở server | P06–P10 |
| Accessibility | Đã hiện thực ở mức code (skip-link, focus-ring, ARIA, focus trap, reduced-motion); **a11y runtime/axe chưa chạy** | B-P03-01/B-P05-01 |
| Mobile UX | Responsive 4 viewport PASS; thiết bị thật chưa kiểm | P12.5 / B-P11-01 |
| Security | Headers + RBAC + test authorization tập trung; **Auth.js chưa nối** | P11/P07_1 |
| Performance | Audit P11; **CWV thực tế chưa đo** | B-P11-02 |
| SEO | metadata + JSON-LD + sitemap/robots | P11/P08 |
| Error/Loading/Empty states | Đã có `ErrorState`/`EmptyState`; **`loading.tsx` đã bỏ có chủ đích** (P11 soft-404) | P11 FIX-A |

---

## 7. TECHNICAL DEBT & BACKLOG

| # | Hạng mục | Loại | Mức độ | Nguồn |
| --- | --- | --- | --- | --- |
| TD-01 | `package.json#prisma` deprecated → migrate `prisma.config.ts` (Prisma 7) | Debt | Thấp | P13.2 (W2) |
| TD-02 | Cảnh báo tracing Turbopack do FS động (media local) | Debt | Thấp (chấp nhận) | P12 FIND-05 / P13.2 (W1) |
| TD-03 | pnpm `Ignored build scripts: esbuild` | Debt | Thấp (không ảnh hưởng) | P13.2 (W3) |
| TD-04 | Luồng upload ảnh trong `RecipeForm` chưa nối `POST /api/v1/media` | Feature-debt | Thấp | B-P07-03 |
| TD-05 | Ảnh đại diện/SEO cho danh mục chưa có cột (D62) | Backlog | Thấp | B-P08-04 |
| TD-06 | CSP chưa đặt (chủ động hoãn P11) | Debt | Thấp | D77/P11 |
| TD-07 | Node.js version pinning | Debt | Thấp | PS/P00 |
| TD-08 | Rate limiting + audit log cho API ghi | Debt | Trung bình | PS/P02 audit |
| TD-09 | Media pipeline resize/optimize chưa có | Debt | Thấp | P02 |
| TD-10 | Dọn legacy user-role / `Favorite` model không dùng (mô hình không tài khoản khách) | Debt | Thấp | D-P07_1 (không drop) |
| TD-11 | Tìm kiếm dùng `contains` thay vì FTS `unaccent`/`pg_trgm`/`tsvector` | Feature-debt | Trung bình | PRD FR-05 / `SEARCH_ARCHITECTURE.md` |
| TD-12 | `loading.tsx` đã bỏ (tránh soft-404) → chưa có skeleton streaming thay thế | Debt | Thấp | P11 FIX-A |
| TD-13 | Chưa có dịch vụ logging/monitoring/backup | Debt | Trung bình | O4/B-P02-02 |
| TD-14 | Quy trình duyệt taxonomy editor→admin chưa chốt | Debt/decision | Trung bình | B-P01-01/B-P02-03 |

---

## 8. FEATURE ROADMAP

Nguyên tắc: **không trùng** tính năng đã DONE; ưu tiên FR quan trọng trong PRD + hoàn thiện trải nghiệm người dùng; **không** thêm registration/comments/ratings/community/social; **không** thương mại hoá; phân biệt **feature mới** với **technical debt**.

| ID | Tính năng | Trạng thái | Ưu tiên | Phụ thuộc | Phase đề xuất |
| --- | --- | --- | --- | --- | --- |
| FR-01 | Trang chủ — khối dữ liệu thật | MISSING | **Cao** | `recipeService.listPublic`, taxonomy | **P15** |
| FR-05 | Trang tìm kiếm công khai `/tim-kiem` | PARTIAL | **Cao** | `recipeService.listPublic` (`q`) | **P15** |
| TD-11 | Nâng tìm kiếm lên FTS (unaccent/pg_trgm) | Debt | Trung bình | PostgreSQL extension (đã ở baseline) | P16 |
| FR-17 | Nối Auth.js admin + upload ảnh trong form | PARTIAL | Cao | Credentials/secrets (vận hành) | P16+ (cần chủ dự án) |
| FR-10 | Thư viện kiến thức nấu ăn | MISSING | Trung bình | Nội dung biên tập | P16+ |
| FR-13 | Shopping List | MISSING | Trung bình | FR-09/FR-08 (đã có) | P16+ |
| FR-14 | Dinh dưỡng & dị ứng (hoàn thiện luồng nhập) | PARTIAL | Trung bình | Dữ liệu admin | P16+ |
| FR-19 | Print CSS công thức | PARTIAL | Thấp | — | P16+ |
| FR-16 | Tài khoản khách | DEFERRED | Thấp (theo sản phẩm) | Quyết định sản phẩm | Không (quyết định) |
| FR-12 | Meal Planner | MISSING | Thấp (Could) | Tài khoản | Chưa xếp lịch |
| FR-15 | Trợ lý AI | MISSING | Thấp (Could) | Dịch vụ ngoài | Chưa xếp lịch |
| TD-08/13 | Rate limiting, audit log, logging/monitoring, backup | Debt | Trung bình | Hạ tầng production | Sau ACTIVATION |
| — | Neon/R2/Vercel activation + backup PITR | BLOCKED | Cao (vận hành) | Credentials | **P13.3 (PENDING)** |

---

## 9. PHASE TIẾP THEO ĐƯỢC ĐỀ XUẤT

### 9.1 Tên phase

**P15 — Public Discovery Completion: Trang chủ dữ liệu thật (FR-01) & Trang tìm kiếm công khai (FR-05).**

### 9.2 Mục tiêu

Hoàn thiện **hai entry point khám phá công khai** đang thiếu/placeholder nhưng thuộc **MVP bắt buộc (Must)**:
1. **Trang chủ (FR-01)** hiển thị **dữ liệu công thức thật** (chỉ `published`) thay cho landing P05 tĩnh.
2. **Trang tìm kiếm công khai `/tim-kiem` (FR-05)** thay cho `PlaceholderPage`, dùng chính ô tìm kiếm + bộ lọc đã có trên `/cong-thuc`.

### 9.3 Lý do ưu tiên

- **Căn cứ PRD:** FR-01 và FR-05 đều là **MVP bắt buộc (Must)**. `MVP_SCOPE.md` §2 xác định năng lực #1 “Khám phá công thức — vào **trang chủ**” và #2 “**Tìm kiếm và lọc**”.
- **Căn cứ code:** Trang chủ vẫn là landing P05 không có dữ liệu thật; `/tim-kiem` là `PlaceholderPage` — **nhưng trang chủ lại liên kết tới `/tim-kiem`** (`quickLinks`) ⇒ trải nghiệm công khai có lỗ hổng rõ ràng.
- **Không phụ thuộc kích hoạt production:** chỉ dùng tầng service/repository đã có (`recipeService.listPublic`, taxonomy) ⇒ **không** cần Neon/R2/Vercel; **không** cần schema/migration mới.
- **Giá trị cao, rủi ro thấp:** tăng trực tiếp trải nghiệm người dùng, tận dụng nền tảng P05–P10 sẵn có.

### 9.4 Phạm vi triển khai

- **(A) Trang chủ FR-01:** các khối dữ liệu thật, tuân thủ BR-02/BR-13, **ẩn khối khi không đủ dữ liệu**:
  - Món mới (sắp theo `publishedAt`/`createdAt`).
  - Khối danh mục/ẩm thực (từ taxonomy, dẫn tới `/danh-muc*`).
  - Điểm vào tìm kiếm + thư viện + công cụ.
  - **“Nổi bật/Phổ biến” chỉ khi có tín hiệu thật** — schema hiện **không** có `viewCount`/`favoriteCount`/`isFeatured` ⇒ **không** tạo khối giả (BR-02); nếu không có tín hiệu → omit.
- **(B) Trang tìm kiếm FR-05:** dựng `/tim-kiem` dùng `listRecipesQuerySchema` (`q` + bộ lọc), kết quả phân trang, trạng thái rỗng (gợi ý nới điều kiện) + lỗi; tái sử dụng `RecipeCard`, `RecipeFilters`, `Pagination`, `EmptyState`/`ErrorState`.
- **Milestone nhỏ** (mục 9.6).

### 9.5 Những phần KHÔNG được phép làm trong P15

- **Không** thêm tính năng ngoài FR-01/FR-05 (không Meal Planner, Shopping List, kiến thức, AI…).
- **Không** kích hoạt Neon/R2/Vercel; **không** chạy migration/seed trên production.
- **Không** thêm schema/migration/model/cột (nếu cần tín hiệu “phổ biến” → **ẩn khối**, không thêm cột).
- **Không** tạo dữ liệu giả/nội dung giả để lấp khối (BR-02).
- **Không** nối Auth.js, **không** thêm tài khoản khách/registration/comments/ratings/community/social.
- **Không** đổi kiến trúc/stack/design system; **không** viết lại component dùng chung đã có.
- **Không** nâng lên FTS `unaccent`/`pg_trgm` trong P15 (tách sang P16/TD-11) — P15 giữ nguyên hành vi tìm kiếm hiện có.
- **Không** sửa PRD/kiến trúc gốc.

### 9.6 Danh sách milestone

| MS | Nội dung | Deliverable |
| --- | --- | --- |
| MS1 | Bổ sung truy vấn homepage (repository/service): list mới nhất + đếm theo taxonomy | Hàm thuần + test đơn vị |
| MS2 | Dựng khối Trang chủ dữ liệu thật (ẩn khối rỗng) | `app/(public)/page.tsx` |
| MS3 | Dựng trang `/tim-kiem` (search + filter + phân trang) | `app/(public)/tim-kiem/page.tsx` |
| MS4 | Trạng thái rỗng/lỗi/không kết quả + liên kết chéo | Empty/Error states |
| MS5 | Kiểm thử + tài liệu + checkpoint P15 | test + `docs/checkpoints/P15_CHECKPOINT.md` |

### 9.7 Acceptance Criteria

- **AC-01:** Trang chủ chỉ hiển thị công thức `published`; khối thiếu dữ liệu bị ẩn (không hiện khối trống); không có dữ liệu giả.
- **AC-02:** Trang chủ có tối thiểu khối “Món mới” và khối danh mục liên kết `/danh-muc*`.
- **AC-03:** `/tim-kiem` nhận `q` + bộ lọc, trả kết quả phân trang đúng; từ khoá không có kết quả → trạng thái rỗng + gợi ý nới điều kiện.
- **AC-04:** `/tim-kiem` **không** còn `PlaceholderPage`.
- **AC-05:** Lỗi tải dữ liệu một khối không làm fail toàn trang (FR-01 luồng lỗi).
- **AC-06:** Tất cả trang dùng dữ liệu thật, **không** truy cập FS local/storage production; chạy được khi **không** có `DATABASE_URL` (build vẫn PASS).
- **AC-07:** a11y & responsive: semantic heading, skip-link, focus ring, không tràn ngang ở 375/390/768/1440.
- **AC-08:** `pnpm typecheck`, `pnpm lint`, `pnpm test`, `pnpm build` **PASS** (integration tùy DB local).

### 9.8 Test Plan

- **Unit:** hàm truy vấn homepage (lọc `published`, sắp xếp, đếm taxonomy) + chuẩn hoá param tìm kiếm; trường hợp rỗng.
- **Component:** render khối homepage (ẩn khi rỗng); render `/tim-kiem` (kết quả/rỗng/lỗi).
- **Integration:** `recipeService.listPublic` + truy vấn homepage trên PostgreSQL local.
- **E2E (Playwright):** luồng “Trang chủ → mở món mới → chi tiết”; “Nhập từ khoá → kết quả → mở chi tiết”; “Từ khoá không có kết quả → trạng thái rỗng”; responsive 4 viewport.
- **Không** chạy migration/seed trên Neon.

### 9.9 Rủi ro & dependencies

| Rủi ro | Mức | Giảm thiểu |
| --- | --- | --- |
| DB rỗng → homepage rỗng | Trung bình | Ẩn khối + trạng thái rỗng thân thiện; không bịa dữ liệu |
| “Phổ biến/Nổi bật” không có tín hiệu thật | Trung bình | Omit khối (BR-02); không thêm cột ngoài phạm vi |
| Tăng truy vấn trang chủ → hiệu năng | Thấp | Truy vấn giới hạn (`take`), song song, `catch` độc lập từng khối |
| Tìm kiếm chưa FTS → kết quả hạn chế | Thấp | Giữ `contains` (đúng hiện trạng); FTS tách sang P16 |
| Phụ thuộc | — | `recipeService`/`catalogService` (đã có); **không** phụ thuộc Neon/R2/Vercel |

---

## 10. QUYẾT ĐỊNH CẦN CHỦ DỰ ÁN XÁC NHẬN

| # | Câu hỏi | Đề xuất của audit |
| --- | --- | --- |
| Q1 | Chọn **P15 = Public Discovery Completion (FR-01 + FR-05)**? | Đồng ý — MVP bắt buộc, không phụ thuộc production |
| Q2 | Xử lý khối “Nổi bật/Phổ biến” khi **không** có tín hiệu thật? | **Ẩn khối** (không thêm cột, không dữ liệu giả) |
| Q3 | Tìm kiếm nâng lên FTS ngay trong P15 hay tách P16? | **Tách P16** (giữ P15 gọn, độc lập) |
| Q4 | Có mở lại **FR-16 (tài khoản khách)** không? | **Không** — giữ quyết định P07.1 (không tài khoản khách) |
| Q5 | Thời điểm kích hoạt **P13.3 Production Activation** (Neon/R2/Vercel)? | Chủ dự án quyết định khi có credentials — giữ **PENDING** |
| Q6 | Có cần xử lý **TD-11** (FTS) và **TD-08/13** (rate limit/logging/backup) theo thứ tự nào? | Sau P15; ưu tiên sau khi production được kích hoạt |

---

## 11. KẾT LUẬN P14

- **Git:** ổn định (`HEAD == origin/main == 502a848`, working tree sạch). Không reset/force-push.
- **20 FR:** DONE **8** · PARTIAL **6** · MISSING **5** · DEFERRED **1** · BLOCKED (cấp FR) **0**.
- **Hạ tầng:** DONE **4** · BLOCKED **4** · MISSING **2**.
- **Khoảng trống quan trọng:** (1) **FR-01 Trang chủ chưa có dữ liệu thật**; (2) **FR-05 `/tim-kiem` là placeholder**; (3) FR-17 admin auth + upload ảnh chưa nối; (4) logging/monitoring/backup chưa có; (5) Neon/R2/Vercel/backup **BLOCKED** (production **chưa** kích hoạt).
- **Phase tiếp theo:** **P15 — Public Discovery Completion (FR-01 + FR-05)**, phạm vi độc lập, có AC/test, **không** phụ thuộc kích hoạt Neon/R2.
- **Không** triển khai phase mới trong P14. **DỪNG SAU P14** — chờ chủ dự án xác nhận.
