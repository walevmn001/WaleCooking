# P08 — Báo cáo kiểm thử

> Phase: **P08** · Ngày: 2026-11-28.
> Ghi kết quả **thực tế** đã chạy; hạng mục không chạy được ghi rõ lý do, **không** giả lập.

## 1. Tổng hợp

| Kiểm tra | Lệnh | Kết quả |
| --- | --- | --- |
| Typecheck | `pnpm typecheck` | ✅ **0 lỗi** |
| Lint | `pnpm lint` | ✅ **0 lỗi / 0 cảnh báo** |
| Unit test | `pnpm test` | ✅ **199/199 pass** (24 file) |
| Production build | `pnpm build` | ✅ thành công — **34 route** |
| Integration test | `pnpm test:integration` | ⛔ Không chạy — **không có PostgreSQL** trong sandbox |
| E2E trình duyệt | — | ⛔ Không chạy — **không có browser** trong sandbox |

> Build cần `DATABASE_URL` (route DB đọc env khi build) — dùng placeholder
> `postgresql://user:pass@localhost:5432/wale_build` (không kết nối DB thật).

## 2. Unit test mới của P08 (46 test)

| File | Số test | Nội dung |
| --- | --- | --- |
| `tests/lib/taxonomy.constants.test.ts` | 8 | `DISCOVERY_TAXONOMIES`: code/segment duy nhất, metadata bắt buộc, segment không đụng vùng URL hệ thống, chỉ `ingredient_category` dùng `filterKind "ingredient_category"` + `isHierarchical`; tra cứu theo code/segment; `isDiscoveryTaxonomy`. |
| `tests/lib/category-links.test.ts` | 5 | `CATEGORY_BASE`, `categoryIndexHref`, `categoryTypeHref`, `categoryTermHref` (page 1 không query; `?page=2` khi phân trang). |
| `tests/lib/taxonomy-validation.test.ts` | 9 | `createTaxonomyTermSchema`/`updateTaxonomyTermSchema`: bắt buộc, locale mặc định, slug term cho phép `_`, từ chối slug sai, `parentSlug: null`, giới hạn độ dài, loại bỏ trường lạ. |
| `tests/lib/taxonomy.service.test.ts` | 14 | Đọc công khai (`listDiscoveryTaxonomies`, `getCategoryBySegment` dựng tổ tiên/cha/con, `listDiscoveryGroups` bỏ trục rỗng); ủy quyền (guest→Unauthorized, editor→Forbidden, admin OK); resolve `parentSlug`; **xoá an toàn** (chặn khi còn công thức/con, xoá khi trống); archive/restore. |
| `tests/lib/recipe-discovery.test.ts` | 10 | `listPublic`/`listAdmin` quy đổi bộ lọc khám phá (mealType/cookingMethod/dietary → taxonomy; ingredient/ingredientCategory/maxMinutes); `listPublicForCategory` (direct vs ingredient_category, pageSize 12, sort); `parseRecipeListParams`/`buildRecipeListHref`. |

**Tổng luỹ kế:** 153 (P07.1) + 46 = **199 unit test / 24 file**.

## 3. Integration test (chưa chạy)

File đã viết: `tests/integration/taxonomy.service.test.ts` — bao phủ:

- CRUD: admin tạo term; editor bị từ chối; cập nhật tên; archive/khôi phục.
- Cha/con: tạo danh mục con; chặn xoá khi còn con; xoá con rồi xoá cha.
- Gắn danh mục vào công thức: recipe `published` xuất hiện trong `listPublicForCategory`;
  `getCategoryBySegment(...).term.recipeCount ≥ 1`; chặn xoá term đang dùng; xoá recipe rồi mới xoá term.

⚠️ **Chưa thực thi** do sandbox không có PostgreSQL (`TEST_DATABASE_URL`). Đây là hạng mục
**External Verification Pending** — xem blocker B-P08-01.

## 4. Kiểm tra chất lượng khác

| Hạng mục | Trạng thái |
| --- | --- |
| Responsive (mobile-first) | Đã dùng lưới 1→2→3 cột + `min-w` cho bảng admin; **chưa** kiểm trình duyệt thật |
| Accessibility cơ bản | Heading phân cấp, `aria-labelledby`, skip-link/focus-ring (P05); **chưa** axe/Lighthouse |
| SEO | `generateMetadata` + canonical (`/danh-muc/{segment}/{slug}`) + JSON-LD BreadcrumbList/Recipe |
| Structured data | BreadcrumbList (danh mục), schema.org/Recipe (chi tiết) — chỉ phát trường có dữ liệu |
| Console runtime | **Chưa** kiểm (không có trình duyệt) |

## 5. Không xác minh được (trung thực)

- Neon PostgreSQL, Cloudflare R2, Auth.js/HTTP 401-403, E2E trình duyệt, axe/Lighthouse —
  sandbox thiếu credentials/browser/DB (kế thừa blocker P07.1).
- Integration test taxonomy **chưa chạy**.
