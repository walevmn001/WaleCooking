# P08 — Trang danh mục công khai

> Phase: **P08** · Ngày: 2026-11-28.
> Phạm vi: P08 §P08.3 — danh sách danh mục, chi tiết danh mục, breadcrumb, phân trang, SEO, structured data.
> Giao diện: mobile-first, tái sử dụng component P05/P07.

## 1. Bản đồ route

| Route | File | Mô tả |
| --- | --- | --- |
| `/danh-muc` | [app/(public)/danh-muc/page.tsx](../../app/(public)/danh-muc/page.tsx) | Tổng quan mọi trục khám phá |
| `/danh-muc/{segment}` | [app/(public)/danh-muc/[segment]/page.tsx](../../app/(public)/danh-muc/[segment]/page.tsx) | Mọi term của một trục |
| `/danh-muc/{segment}/{slug}` | [app/(public)/danh-muc/[segment]/[slug]/page.tsx](../../app/(public)/danh-muc/[segment]/[slug]/page.tsx) | Công thức thuộc một danh mục |

6 `segment` hợp lệ: `nhom-mon`, `am-thuc`, `bua-an`, `phuong-phap`, `dac-diem`, `nguyen-lieu`.
Segment khác → `notFound()`.

## 2. Trang tổng quan `/danh-muc`

- `dynamic = "force-dynamic"`.
- Gọi `taxonomyService.listDiscoveryGroups()` → `CategoryGroup[]` (trục **có** term; trục rỗng bị ẩn).
- Mỗi trục: `<section aria-labelledby>` + `CategoryTile` cho term gốc + link "Xem tất cả" (`categoryTypeHref`).
- `EmptyState` khi tất cả trục rỗng; `ErrorState` khi service lỗi.
- Danh sách **trục** là metadata thiết kế; danh sách **term** lấy từ DB.

## 3. Trang một trục `/danh-muc/{segment}`

- `generateStaticParams()` từ `DISCOVERY_TAXONOMIES` → 6 segment (SSG).
- `generateMetadata` → title/description theo trục.
- `notFound()` nếu segment không thuộc khu vực khám phá.
- `listTypeTerms(code)` → render term gốc (`parentId === null`) kèm chip term con.

## 4. Trang chi tiết danh mục `/danh-muc/{segment}/{slug}`

- `loadCategory()` → `getCategoryBySegment(segment, slug)`; `NotFoundError` → `notFound()`.
- `PAGE_SIZE = 12`; phân trang server-side qua `?page=N`.
- `listPublicForCategory({ typeCode, slug, filterKind, page, pageSize })` — chỉ công thức `published`.
- Render `RecipeCard` + `FavoriteButton` (`readFavorites` — không cần đăng nhập).
- `Pagination` với `categoryTermHref(segment, slug, page)`.
- Nút lưu yêu thích dùng cookie (P07.1) — khách không cần tài khoản.

## 5. Breadcrumb

`buildBreadcrumb(detail)`:
`Trang chủ → Danh mục (/danh-muc) → {trục} (/danh-muc/{segment}) → …tổ tiên → {term}`.

- Dùng component `Breadcrumb` (P05).
- Tổ tiên lấy từ `detail.ancestors` (gốc → cha trực tiếp), term hiện tại **không** có href.

## 6. SEO & structured data

- Mỗi trang có `generateMetadata` (title, description).
- Trang chi tiết danh mục đặt `alternates.canonical = categoryTermHref(segment, slug)`.
- **JSON-LD `BreadcrumbList`** dựng từ cùng dữ liệu breadcrumb (có căn cứ từ term tổ tiên).
- **Không** phát `ItemList`/`Recipe` cho danh mục vì thiếu căn cứ đầy đủ; tránh structured data sai.
- Root `metadataBase` đặt ở [app/layout.tsx](../../app/layout.tsx) để canonical/OG tuyệt đối.

## 7. Giao diện & tái sử dụng

- **Mobile-first**: lưới 1 → 2 → 3 cột (`sm:grid-cols-2 lg:grid-cols-3`).
- Tái sử dụng: `Container`, `Breadcrumb`, `Pagination`, `CategoryTile`, `RecipeCard`, `FavoriteButton`,
  `EmptyState`, `ErrorState`, `Link` (tất cả từ P05/P07).
- Không nhồi bộ lọc vào trang danh mục (giữ tối giản, dễ tìm món).

## 8. Trạng thái lỗi/rỗng

| Tình huống | Xử lý |
| --- | --- |
| Service lỗi | `ErrorState` (có breadcrumb) |
| Trục/term không tồn tại | `notFound()` (404) |
| Chưa có danh mục | `EmptyState` |
| Chưa có công thức trong danh mục | `EmptyState` trong khu vực danh sách |
