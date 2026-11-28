# P11.1 — FULL PROJECT AUDIT (WALE COOKING)

> Phase: **P11 — Real-World Verification & UX Polish**
> Nguyên tắc: *ổn định & hoàn thiện*, KHÔNG thêm tính năng mới, KHÔNG làm lại P00–P10, KHÔNG triển khai P12.
> Tài liệu này được hoàn thành **trước khi sửa code** (theo yêu cầu P11 §II).

---

## 0. Phương pháp & phạm vi

- Chỉ dùng 01 agent. Không đổi stack/kiến trúc. Đọc tài liệu + checkpoint P07.1–P10 trước khi đánh giá.
- Bằng chứng thu thập bằng: đọc mã nguồn, `pnpm typecheck`, `pnpm lint`, `pnpm test`, `pnpm test:integration` (PostgreSQL thật), `pnpm build` (production), và gọi HTTP thực tế trên dev + production server.
- Mọi kết luận dưới đây gắn nhãn: **Verified** / **Automated Test Passed** / **External Verification Pending** / **Known Limitation** / **Backlog**.

## 0.1. Trạng thái Git (Verified — trước khi làm)

| Hạng mục | Giá trị |
|---|---|
| Branch hiện tại | `trae/agent-1nGkPH` |
| HEAD | `be41af13675f517b3145a3beb573905eeb6a4512` |
| Commit P10 (tham chiếu) | `be41af1` — khớp báo cáo |
| `origin/main` | `be41af1…` (trùng HEAD) |
| Đồng bộ local/remote | ahead 0 / behind 0 → **đồng bộ** |
| Working tree | **sạch** |
| Loại clone | **shallow (1 commit)** — lịch sử P00–P09 không có trong sandbox, chỉ tham chiếu checkpoint |

## 0.2. Môi trường xác minh đã dựng trong sandbox

- `pnpm install --frozen-lockfile` + `pnpm prisma generate` (PASS).
- PostgreSQL 16.15 cài cục bộ; role `wale`; DB `wale_test` + `wale_dev`; migrate + seed (PASS).
- Scripts kiểm chứng trong `package.json`: `dev`, `build`, `start`, `lint`, `typecheck`, `test`, `test:integration`, `db:*`.

---

## 1. Bảng audit 16 khu vực

| # | Khu vực | Trạng thái | File/module liên quan | Kiểm thử hiện có | Lỗi phát hiện | Mức độ | Khả năng xác minh trong sandbox |
|---|---|---|---|---|---|---|---|
| 1 | **Foundation** (design system, shared components) | Ổn định | `styles/globals.css`, `components/ui/*`, `components/layout/*` | `tests/components/*` (13 file) | Không | — | Verified (read + unit test + render page) |
| 2 | **Database** (Prisma, migration, repository) | Ổn định | `lib/db/**`, `prisma/**` | `tests/integration/*` (9 file) | Không | — | Automated Test Passed (59/59, Postgres thật) |
| 3 | **Recipe** (CRUD, detail, listing) | Ổn định | `lib/services/recipe.service.ts`, `app/(public)/cong-thuc/**`, `app/api/v1/recipes/**` | `recipe.service.test.ts`, `recipe.validation.test.ts`, component tests | **BUG-01** soft-404 trang chi tiết | Medium | Verified (HTTP dev+prod) + Automated |
| 4 | **Admin** (auth, RBAC, CRUD) | Ổn định (auth chưa nối) | `lib/auth/**`, `app/(admin)/admin/**` | `authorization.test.ts`, `recipe-form.test.tsx` | Auth.js chưa nối → write luôn 401 (Known Limitation đã có từ P06/P07) | Low | Verified (guest 401 ở API & UI) |
| 5 | **Media** (upload, validation, storage) | Ổn định | `lib/storage/**`, `lib/services/media.service.ts`, `app/api/v1/media/**` | `recipe-validation`, `states` tests | Cảnh báo Turbopack “dynamic filesystem access” (media file route) | Low | Verified (read) + build warning |
| 6 | **Taxonomy** (danh mục, phân loại) | Ổn định | `lib/services/taxonomy.service.ts`, `lib/constants/taxonomy.ts`, `app/(public)/danh-muc/**` | `taxonomy.*.test.ts`, `category-links.test.ts` | **BUG-01** soft-404 trang danh mục chi tiết | Medium | Verified (HTTP dev+prod) + Automated |
| 7 | **Discovery** (search, filter, pagination) | Ổn định | `lib/services/recipe.service.ts` (`listPublic`), `components/recipe/recipe-filters.tsx` | `recipe-discovery.test.ts`, `recipe-filters.test.tsx` | Không | — | Automated Test Passed |
| 8 | **Favorites** (cookie-based) | Ổn định | `lib/favorites/**`, `app/actions/favorites.ts`, `app/(public)/yeu-thich/page.tsx` | `favorites.test.ts` | Cookie đúng cờ (HttpOnly/SameSite=Lax/secure prod/180d) | — | Verified (read) + Automated |
| 9 | **Cooking Mode** | Ổn định | `components/cooking/**`, `lib/cooking/state.ts` | `cooking.test.tsx`, `cooking.state.test.ts` | Không | — | Automated + code review |
| 10 | **Portion Scaling** | Ổn định | `lib/cooking/portion.ts` | `cooking.portion.test.ts` | Không (chỉ nhân số, giữ đơn vị, kẹp 1..100) | — | Automated Test Passed |
| 11 | **Checklist** (nguyên liệu) | Ổn định | `components/cooking/**`, `lib/cooking/state.ts` | `cooking.test.tsx` | Không | — | Automated + code review |
| 12 | **Multi Timer** | Ổn định | `lib/kitchen/timers.ts`, `components/kitchen/multi-timer.tsx` | `timers.test.ts`, `kitchen.test.tsx` | deadline là nguồn sự thật (Verified bằng logic test) | — | Automated; hành vi khóa màn hình = External Pending |
| 13 | **Unit Converter** | Ổn định | `lib/kitchen/units.ts` | `units.test.ts` | Không mass↔volume; phân biệt cup US/metric | — | Automated Test Passed |
| 14 | **Ingredient Discovery** | Ổn định | `lib/kitchen/ingredient-match.ts`, `lib/services/recipe.service.ts` | `ingredient-match.test.ts`, `kitchen.ingredient-match.test.ts` | Không (thuật toán xác định, không AI) | — | Automated Test Passed |
| 15 | **SEO** (metadata, sitemap, structured data) | **Thiếu sót** | `app/layout.tsx`, `app/(public)/cong-thuc/[slug]/page.tsx` | (không có test cho sitemap/robots) | **BUG-02** thiếu `/sitemap.xml` + `/robots.txt`; **BUG-01** soft-404 ảnh hưởng SEO | Medium | Verified (HTTP 404 cho cả hai) |
| 16 | **Responsive** (mobile/tablet/desktop) | Chưa xác minh hình ảnh thực | `components/**`, Tailwind tokens | `states.test.tsx`, `navigation.test.tsx` | Không có lỗi xác định bằng mã; cần browser thật | — | **External Verification Pending** |
| — | **Security headers** | **Thiếu sót** | `next.config.ts` | (không có) | **BUG-03** thiếu security headers + lộ `X-Powered-By` | Medium | Verified (header HTTP thực) |

---

## 2. Findings (lỗi phát hiện) — chi tiết & căn nguyên

### BUG-01 — Soft-404: route động trả HTTP 200 cho nội dung không tồn tại

- **Mô tả**: `/cong-thuc/khong-ton-tai-xyz` và `/danh-muc/nhom-mon/khong-ton-tai-xyz` render đúng giao diện “Không tìm thấy trang” nhưng trả **HTTP 200** thay vì **404**.
- **Bằng chứng (Verified)**: curl trên dev (3001) và production (3000) đều `200`. Nội dung có `<meta name="robots" content="noindex">` (Next.js tự thêm cho not-found) → giảm rủi ro index, nhưng mã trạng thái sai (soft-404).
- **File/module liên quan**:
  - [app/loading.tsx](file:///workspace/app/loading.tsx) — Suspense boundary cấp gốc.
  - [app/(public)/cong-thuc/loading.tsx](file:///workspace/app/(public)/cong-thuc/loading.tsx).
  - [app/(public)/cong-thuc/[slug]/loading.tsx](file:///workspace/app/(public)/cong-thuc/[slug]/loading.tsx).
  - [app/(public)/cong-thuc/[slug]/page.tsx](file:///workspace/app/(public)/cong-thuc/[slug]/page.tsx) (`loadRecipe` → `notFound()`).
  - [app/(public)/danh-muc/[segment]/[slug]/page.tsx](file:///workspace/app/(public)/danh-muc/[segment]/[slug]/page.tsx).
- **Nguyên nhân gốc**: `loading.tsx` tạo **Suspense boundary** ở cấp segment. Next.js stream “shell” (loading UI) với status 200 ngay khi render; `notFound()` gọi sau đó không thể đổi mã trạng thái → 200. Đã kiểm chứng bằng thực nghiệm: **loại bỏ** các `loading.tsx` thì các route trên trả **404** đúng.
  - Thực nghiệm loại trừ: root `loading.tsx` gây soft-404 cho route danh mục; `cong-thuc/loading.tsx` + `cong-thuc/[slug]/loading.tsx` gây soft-404 cho route chi tiết công thức.
  - Thực nghiệm bổ sung: gọi `notFound()` trong `generateMetadata` **không** sửa được status (Next.js cũng stream metadata).
- **Mức độ**: **Medium** (đúng dữ liệu/UX nhưng sai HTTP/SEO; đã có `noindex` giảm thiểu).
- **Phương án xử lý**: xem §3 (FIX-A).

### BUG-02 — Thiếu sitemap.xml và robots.txt

- **Mô tả**: `/sitemap.xml` và `/robots.txt` trả **404**. Không có `app/sitemap.ts` / `app/robots.ts`, cũng không có file tĩnh tương ứng.
- **Bằng chứng (Verified)**: curl → `404  /sitemap.xml`, `404  /robots.txt`.
- **Mức độ**: **Medium** (SEO).
- **Phương án xử lý**: xem §3 (FIX-B).

### BUG-03 — Thiếu security headers và lộ `X-Powered-By`

- **Mô tả**: Mọi response chỉ có `X-Powered-By: Next.js`; thiếu `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`, `Strict-Transport-Security`.
- **Bằng chứng (Verified)**: `curl -D -` trên `/` (dev & prod).
- **File/module**: [next.config.ts](file:///workspace/next.config.ts) — chỉ có `reactStrictMode` + `images`.
- **Mức độ**: **Medium** (hardening; không phải lỗi khai thác trực tiếp).
- **Phương án xử lý**: xem §3 (FIX-C).

### FIND-04 — Production build yêu cầu `DATABASE_URL` (mâu thuẫn thiết kế “lazy env”)

- **Mô tả**: `pnpm build` **thất bại** khi thiếu `DATABASE_URL` với lỗi `Failed to collect configuration for /api/v1/admin/recipes` → `[env] Cấu hình môi trường không hợp lệ`.
- **Bằng chứng (Verified)**: build không env → FAIL; build có `DATABASE_URL` → PASS.
- **Nguyên nhân gốc**: [lib/db/prisma.ts](file:///workspace/lib/db/prisma.ts#L33) khởi tạo `PrismaClient` **eager** ở module scope (gọi `serverEnv()` khi import). Điều này mâu thuẫn với ghi chú thiết kế trong [lib/config/env.ts](file:///workspace/lib/config/env.ts#L10-L11) (“hàm lazy … để `next build` vẫn chạy được cho các route không dùng database”).
- **Mức độ**: **Medium** (reproducibility/DX; có workaround chuẩn: cấu hình `.env`). Không ảnh hưởng bảo mật.
- **Phương án**: ghi nhận; đề xuất lazy-init Prisma client (Proxy) ở Backlog — **không sửa trong P11** để tránh refactor hạ tầng lõi (rủi ro cao hơn lợi ích trong phase ổn định).

### FIND-05 — Cảnh báo Turbopack: dynamic filesystem access (media route)

- **Mô tả**: build in cảnh báo “Dynamic filesystem access causes tracing of the whole project” tại [lib/storage/local-storage.adapter.ts](file:///workspace/lib/storage/local-storage.adapter.ts) và [app/api/v1/media/file/[...key]/route.ts](file:///workspace/app/api/v1/media/file/[...key]/route.ts).
- **Mức độ**: **Low** (cảnh báo deploy-size, không lỗi chức năng).
- **Phương án**: Backlog (thêm `turbopackIgnore` hoặc giới hạn path tĩnh).

### FIND-06 — Seed dev không tạo công thức

- **Mô tả**: seed tạo 83 taxonomy_terms, 40 ingredients, 1 user, nhưng **0 recipes** → hạn chế kiểm thử luồng “có dữ liệu” (listing/detail/cooking) bằng HTTP thật.
- **Mức độ**: **Low** (giới hạn xác minh, không phải lỗi sản phẩm).
- **Phương án**: ghi nhận; dùng test integration + fixture để xác minh logic có dữ liệu.

---

## 3. Kế hoạch sửa (P11.9) — chỉ trong phạm vi P11

| ID | Mức độ | Sửa? | Hành động |
|---|---|---|---|
| BUG-01 | Medium | **Có** | **FIX-A**: loại bỏ 3 `loading.tsx` tạo Suspense boundary gây soft-404 → khôi phục HTTP 404 đúng cho route động. |
| BUG-02 | Medium | **Có** | **FIX-B**: thêm `app/sitemap.ts` + `app/robots.ts` (chỉ liệt kê nội dung công khai; KHÔNG đưa draft vào sitemap). |
| BUG-03 | Medium | **Có** | **FIX-C**: thêm security headers + `poweredByHeader: false` trong `next.config.ts`. |
| FIND-04 | Medium | Không (Backlog) | Ghi nhận; workaround cấu hình `DATABASE_URL` khi build. |
| FIND-05 | Low | Không (Backlog) | Cảnh báo build; không lỗi chức năng. |
| FIND-06 | Low | Không | Giới hạn xác minh; dùng test integration thay thế. |

### FIX-A — chi tiết & đánh đổi

- Loại bỏ: `app/loading.tsx`, `app/(public)/cong-thuc/loading.tsx`, `app/(public)/cong-thuc/[slug]/loading.tsx`.
- **Đánh đổi**: mất skeleton “đang tải” khi tải nguội vài route công khai (trước đây do `loading.tsx` cung cấp). Chấp nhận vì: (a) mã trạng thái HTTP đúng là yêu cầu kiểm thử của P11; (b) Next.js vẫn thể hiện trạng thái chờ khi điều hướng client-side; (c) không mất dữ liệu/chức năng.
- **Backlog**: tái giới thiệu loading UI **có phạm vi** (inline `<Suspense>` hoặc route-group) để không bọc `notFound()`.

### FIX-B — chi tiết

- `app/sitemap.ts`: liệt kê trang tĩnh công khai + trang chi tiết **published** + trang danh mục discovery. CHỈ nội dung công khai (BR-13).
- `app/robots.ts`: cho phép index nội dung công khai; chặn `/admin`, `/api`, `/dev`.

### FIX-C — chi tiết

- `poweredByHeader: false`; headers: `X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy` tối thiểu.
- CSP: cân nhắc sau (Next.js cần `unsafe-inline` cho style/script) → để Backlog nếu rủi ro.

---

## 4. Kết luận audit

- Sản phẩm P00–P10 **về cơ bản ổn định**: typecheck/lint/unit/integration/build đều chạy được; kiến trúc 4 lớp + Ports & Adapters nguyên vẹn; không phát hiện lỗi **Critical** (không có lỗ hổng leo quyền, không mất dữ liệu, chức năng cốt lõi hoạt động).
- 3 lỗi **Medium** có thể sửa an toàn trong phạm vi P11 (BUG-01/02/03).
- 1 **Medium** + 2 **Low** ghi nhận (FIND-04/05/06).
- Hạng mục **không** xác minh được trong sandbox: hiển thị thực tế đa viewport, hành vi timer khi khóa màn hình/chuyển app, đăng nhập admin thật (Auth.js chưa nối) → **External Verification Pending**.

### Phân loại nhãn

- **Verified**: Git state; HTTP status/headers; soft-404 (dev+prod); sitemap/robots 404.
- **Automated Test Passed**: typecheck, lint, 337 unit test, 59 integration test, production build.
- **External Verification Pending**: responsive thực (6 viewport), timer nền/khóa màn hình, browser E2E, đăng nhập admin.
- **Known Limitation**: Auth.js chưa nối (write = 401); build cần `DATABASE_URL`.
- **Backlog**: FIND-04, FIND-05; tái giới thiệu loading UI có phạm vi; CSP.
