# P15 — CHECKPOINT: PUBLIC DISCOVERY COMPLETION (FR-01 + FR-05)

> Phase: **P15** · Ngày: 2026-11-28 · Trạng thái: **HOÀN THÀNH** (trong giới hạn môi trường)
> Branch: `trae/agent-da4PT9` · `HEAD` = `origin/main` = `b8b96b3` (P15.4)
> Phạm vi: hoàn thiện **trang chủ dữ liệu thật (FR-01)** + **trang tìm kiếm công khai `/tim-kiem` (FR-05)**.
> **Không** thêm tính năng ngoài FR-01/FR-05; **không** thêm schema/migration; **không** kích hoạt Neon/R2/Vercel;
> **không** nâng lên FTS/autocomplete.

---

## 1. Git preflight (IV)

| Mục | Giá trị thực tế |
|---|---|
| Branch làm việc | `trae/agent-da4PT9` |
| `HEAD` | `b8b96b3cc476c10b525c4dcf2b7456b4ad8b26d5` |
| `origin/main` (sau `git fetch`) | `b8b96b3` (`HEAD == origin/main`) |
| Working tree | **Sạch** (`nothing to commit`) |
| Lịch sử | **shallow clone, 1 commit** (`git rev-list --count HEAD` = 1) |

> ⚠️ **Sai lệch so với dự kiến (đã báo cáo, KHÔNG tự ý reset/ghi đè):** đề bài dự kiến điểm xuất phát là
> **P14 @ `502a848`**. Thực tế repo là **snapshot 1 commit** ở trạng thái **đã bao gồm P15.1–P15.4**
> (`b8b96b3`, message `feat(P15.4): …`) — commit `502a848` **không tồn tại** trong clone này.
> Vì working tree sạch, không có thay đổi chưa commit, và P15.1–P15.4 đã có checkpoint + đã commit,
> milestone còn lại của P15 là **P15.5 (Full Verification & Documentation)** — đã thực hiện trong checkpoint này.
> **Không** thực hiện `reset`, `force-push` hay rewrite lịch sử.

---

## 2. Mốc công việc

| Milestone | Nội dung | Trạng thái | Checkpoint |
|---|---|---|---|
| P15.1 | Homepage data queries (`HomepageService`) | ✅ Hoàn thành (đã commit trong `b8b96b3`) | [P15.1_CHECKPOINT.md](./P15.1_CHECKPOINT.md) |
| P15.2 | Homepage UI (`app/(public)/page.tsx`) | ✅ Hoàn thành (đã commit trong `b8b96b3`) | [P15.2_CHECKPOINT.md](./P15.2_CHECKPOINT.md) |
| P15.3 | Public search page (`app/(public)/tim-kiem/page.tsx`) | ✅ Hoàn thành (đã commit trong `b8b96b3`) | [P15.3_CHECKPOINT.md](./P15.3_CHECKPOINT.md) |
| P15.4 | UX, error handling & accessibility | ✅ Hoàn thành (đã commit trong `b8b96b3`) | [P15.4_CHECKPOINT.md](./P15.4_CHECKPOINT.md) |
| P15.5 | Full verification & documentation | ✅ Hoàn thành (checkpoint này) | tài liệu này |

### Sản phẩm P15 (đã có trong `b8b96b3`)
- `lib/services/homepage.service.ts` — `HomepageService.load()` → `{ newest, categories }`; tái sử dụng `recipeService.listPublic` (chỉ `published`) + `taxonomyService.listDiscoveryGroups`; **tách lỗi độc lập** từng khối (`console.error`, không nuốt lỗi); **không N+1** (`Promise.all`).
- `app/(public)/page.tsx` — trang chủ động (`force-dynamic`): Hero, ô tìm kiếm → `/tim-kiem?q=…`, khối “Món mới” (`RecipeCard`, dữ liệu thật), khám phá danh mục (taxonomy thật → `/danh-muc*`), lối vào công cụ; khối rỗng bị ẩn; DB rỗng → `EmptyState` thân thiện.
- `app/(public)/tim-kiem/page.tsx` — thay hoàn toàn `PlaceholderPage`: nhận `q` + bộ lọc hiện có, phân trang, đồng bộ URL (chia sẻ được), Empty/Error state, giữ nguyên validation (`sanitizeRecipeListQuery`).
- `components/forms/search-form.tsx` — ô tìm kiếm điều hướng client sang `/tim-kiem?q=…` (không tự dựng search engine).

---

## 3. Môi trường kiểm chứng (P15.5)

| Thành phần | Trạng thái |
|---|---|
| Node `v24.1.0` · pnpm `10.5.2` | ✅ |
| `node_modules` | ✅ `pnpm install --frozen-lockfile` (22s) |
| PostgreSQL | ✅ **PostgreSQL 16.15 local** (`wale_test`, `wale_e2e`) — cài & khởi tạo trong sandbox; **KHÔNG** dùng Neon/production |
| Chrome CDP `127.0.0.1:9222` | ✅ (Chrome 150) — dùng cho E2E qua `connectOverCDP` |
| `DATABASE_URL` Neon / `R2_*` / Vercel | ❌ không có (ngoài phạm vi P15) |

> **Không** dùng production database để chạy test. Migration áp bằng `prisma migrate deploy` lên **DB local** (`wale_test`: 58 bảng; `wale_e2e`: 58 bảng). Không `db push`/`migrate reset`.

---

## 4. Kiểm chứng cuối P15.5

| Kiểm tra | Lệnh | Kết quả |
|---|---|---|
| TypeScript | `pnpm typecheck` | ✅ **0 lỗi** — PASS |
| ESLint | `pnpm lint` | ✅ **0 lỗi / 0 cảnh báo** — PASS |
| Unit test | `pnpm test` | ✅ **363/363 pass** (34 file) — PASS |
| Integration test | `pnpm test:integration` | ✅ **59/59 pass** (9 file, PostgreSQL 16.15 local `wale_test`) — PASS |
| E2E | `pnpm e2e` | ✅ **52/52 pass** (Chrome CDP + DB `wale_e2e`) — PASS |
| Build production | `pnpm build` | ✅ exit=0 · 26 trang tĩnh · `/` và `/tim-kiem` là **Dynamic (ƒ)** · **3 cảnh báo** FIND-05 có sẵn (media local) — PASS |

### Luồng E2E đã kiểm chứng (thực tế)
- **Trang chủ → món mới → chi tiết**: `public.e2e.ts` — khối “Món mới” hiển thị công thức `published` thật; mở chi tiết hiển thị tiêu đề/nguyên liệu/bước.
- **Trang chủ → tìm kiếm → kết quả → chi tiết**: `public.e2e.ts` — gõ từ khoá ở hero chuyển sang `/tim-kiem?q=…` và hiển thị kết quả thật.
- **Tìm kiếm không kết quả**: trạng thái rỗng + nút “Xoá bộ lọc” về `/tim-kiem`.
- **Tìm kiếm với bộ lọc**: bộ lọc `/tim-kiem` cập nhật URL và kết quả; back/forward giữ trạng thái.
- **Phân trang & bảo toàn query/filter**: `buildRecipeListHref(params, { page }, "/tim-kiem")` (unit + hành vi URL trong E2E).
- **Responsive 4 viewport** (375/390/768/1440): không tràn ngang, console/network sạch, nav/breakpoint đúng.
- **Trợ năng**: đúng một `h1`/trang, heading ngữ nghĩa, nhãn bộ lọc, số kết quả qua `aria-live`, Tab tới ô tìm kiếm + focus hiển thị.

### Kiểm chứng dữ liệu thật (không dữ liệu giả)
- `GET /` → **200**; HTML chỉ chứa fixture `published` (`Canh trứng cà chua (E2E)`, `Phở bò (E2E)`), **không** chứa fixture `draft` (`Món nháp (E2E)`) → xác nhận chỉ công thức `published`, không lộ bản nháp.
- `GET /tim-kiem`, `/tim-kiem?q=Canh`, `/cong-thuc` → **200**.

---

## 5. Acceptance Criteria

| AC | Nội dung | Kết quả | Bằng chứng |
|---|---|---|---|
| AC-01 | Homepage hiển thị recipe `published` thật | ✅ PASS | E2E trang chủ + kiểm HTML (chỉ 2 fixture published, không có draft) |
| AC-02 | Homepage có khu vực món mới + taxonomy thật | ✅ PASS | `page.tsx` + `homepageService.load()`; unit `homepage.service.test.ts`; E2E |
| AC-03 | Khối không có dữ liệu được ẩn hợp lý | ✅ PASS | Ẩn khối khi rỗng; `EmptyState` khi DB rỗng |
| AC-04 | Không dữ liệu giả, rating giả, popularity giả | ✅ PASS | Không có `viewCount`/`favoriteCount`/`isFeatured`; tổng số lấy từ DB |
| AC-05 | `/tim-kiem` không còn `PlaceholderPage` | ✅ PASS | `tim-kiem/page.tsx` viết lại; E2E xác nhận |
| AC-06 | Search nhận `q` và các bộ lọc hiện có | ✅ PASS | `listRecipesQuerySchema` + `RecipeFilters`; unit + E2E |
| AC-07 | Pagination hoạt động và giữ query/filter | ✅ PASS | `buildRecipeListHref(..., basePath)`; unit + E2E back/forward |
| AC-08 | Empty state và error state đúng | ✅ PASS | `EmptyState`/`ErrorState` (`role="alert"`) + nút Thử lại; E2E |
| AC-09 | Lỗi một khối homepage không làm fail toàn bộ trang | ✅ PASS | `loadSection` try/catch từng khối; unit test 5/6 |
| AC-10 | Không thêm schema/migration | ✅ PASS | Không đổi `prisma/schema.prisma`; không migration mới |
| AC-11 | Không phụ thuộc Neon/R2 production để build | ✅ PASS | `pnpm build` PASS; dùng DB local |
| AC-12 | Typecheck, lint, unit test và build PASS | ✅ PASS | §4 |
| AC-13 | Responsive 375/390/768/1440 không tràn ngang | ✅ PASS | E2E responsive 4 viewport |
| AC-14 | Không phát sinh chức năng ngoài phạm vi P15 | ✅ PASS | Không autocomplete/FTS/Meal Planner/Shopping List… |

**Tổng: 14/14 AC PASS.**

---

## 6. Blocker

**Không phát sinh blocker mới** trong P15. Blocker hạ tầng (Neon/R2/Vercel, Auth.js) **không thay đổi** và **ngoài phạm vi P15** — không cập nhật `BLOCKERS.md`.

- `pnpm test:integration` và `pnpm e2e` **chạy được trong sandbox** nhờ PostgreSQL 16.15 local (`wale_test`/`wale_e2e`) + Chrome CDP — **không** dùng production.
- Trong môi trường **không** có PostgreSQL, hai bộ test này sẽ **BLOCKED** (integration cần `TEST_DATABASE_URL`; E2E cần DB seed) — đã ghi rõ ở đây để minh bạch.

---

## 7. Kết luận

P15 **hoàn thành**: trang chủ FR-01 và trang tìm kiếm công khai FR-05 dùng **dữ liệu thật**, không dữ liệu giả, không thêm schema/migration, không phụ thuộc Neon/R2/Vercel.
Kiểm chứng P15.5: **typecheck / lint / 363 unit / 59 integration / 52 E2E / build** đều **PASS**; **14/14 Acceptance Criteria PASS**.
