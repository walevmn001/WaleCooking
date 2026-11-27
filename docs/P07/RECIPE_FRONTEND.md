# P07 — RECIPE FRONTEND

> Giao diện module công thức, tái sử dụng component P05. Cập nhật: 2026-11-28 (P07).
> Mọi trang dữ liệu dùng Server Component + `export const dynamic = "force-dynamic"`.

---

## 1. Bản đồ trang

| Trang | Route | Kiểu | Nguồn |
| --- | --- | --- | --- |
| Danh sách công khai | `/cong-thuc` | RSC | [page.tsx](../../app/(public)/cong-thuc/page.tsx) |
| Đang tải danh sách | `/cong-thuc` (loading) | RSC | [loading.tsx](../../app/(public)/cong-thuc/loading.tsx) |
| Lỗi danh sách | `/cong-thuc` (error) | Client boundary | [error.tsx](../../app/(public)/cong-thuc/error.tsx) |
| Chi tiết công khai | `/cong-thuc/{slug}` | RSC | [[slug]/page.tsx](../../app/(public)/cong-thuc/[slug]/page.tsx) |
| Quản trị — danh sách | `/admin/cong-thuc` | RSC | [page.tsx](../../app/(admin)/admin/cong-thuc/page.tsx) |
| Quản trị — tạo mới | `/admin/cong-thuc/moi` | RSC + form | [moi/page.tsx](../../app/(admin)/admin/cong-thuc/moi/page.tsx) |
| Quản trị — sửa | `/admin/cong-thuc/{id}/sua` | RSC + form | [[id]/sua/page.tsx](../../app/(admin)/admin/cong-thuc/[id]/sua/page.tsx) |

**Áp dụng Next.js 16:** `params` và `searchParams` là **Promise** → luôn `await`.

---

## 2. Danh sách công khai — `/cong-thuc`

- Đọc query thô (`await searchParams`) → `recipeService.listPublic(rawParams)`.
- Chỉ hiển thị công thức `published` (service đảm bảo — BR-13).
- Lấy thêm food types / cuisines từ `catalogService.listTaxonomyTerms(...)` để đổ vào bộ lọc
  (`Promise.all`, `.catch(() => [])` để trang không sập khi catalog lỗi).
- DTO → view-model bằng `toRecipeSummary` → render `<RecipeCard>` (component P05).
- **Trạng thái:**
  - Đang tải → `loading.tsx` (skeleton lưới, `aria-busy`, `aria-live`).
  - Không kết quả → `<EmptyState>` ("Không tìm thấy công thức").
  - Lỗi tải dữ liệu → `<ErrorState>` (bắt trong `try/catch` của RSC).
  - Thành công → lưới card + `<Pagination>` (server-driven, qua query string).

## 3. Chi tiết công khai — `/cong-thuc/{slug}`

- `getPublicBySlug(slug)`: không tồn tại **hoặc** không `published` → `notFound()` (404).
- `generateMetadata`: `<title>`/`description` từ `seoTitle`/`seoDescription` (fallback tiêu đề/mô tả),
  kèm OpenGraph ảnh nếu có ảnh đại diện.
- JSON-LD `schema.org/Recipe` qua `toRecipeJsonLd()` — **chỉ** đưa trường có dữ liệu thật.
- Bố cục 2 cột (≥lg): ảnh + thông tin ở cột trái; thời gian/khẩu phần/độ khó dùng
  `PreparationTime`/`CookingTime`/`ServingsBadge`/`DifficultyBadge`.
- Các mục (chỉ hiện khi có dữ liệu):
  - Nguyên liệu → `<IngredientList>` (giữ `sortOrder`; định lượng đã format).
  - Bước nấu → `<CookingStepCard>` (giữ `stepNo`).
  - Dinh dưỡng → `<NutritionSummary>` (kèm cơ sở tính + nguồn).
  - Dị ứng → `<AllergenBadges>`.
  - **Nguồn tham khảo** → mục riêng, ghi tên/tác giả/license/URL (P07 §17).

## 4. Quản trị — danh sách `/admin/cong-thuc`

- `getCurrentActor()` → nếu `!can(actor,"recipe:read:draft")` → `<AdminAccessNotice>` (không
  giả lập người dùng).
- Bảng công thức: tiêu đề + slug, trạng thái (`Badge` theo `RECIPE_STATUS_VARIANT`), ngày cập nhật,
  liên kết Sửa. Lọc trạng thái bằng nav (link + `aria-current`). Phân trang server.
- `metadata.robots = { index: false, follow: false }` — không lập chỉ mục trang quản trị.

## 5. Quản trị — tạo/sửa (`RecipeForm`)

[components/admin/recipe-form.tsx](../../components/admin/recipe-form.tsx) — client component.

- **Chế độ:** `create` / `edit` (prop `mode`).
- **Trường:** slug (tự sinh từ tiêu đề qua `slugify`, sửa được), tiêu đề, mô tả ngắn, mô tả dài,
  food type, cuisine, độ khó, thời gian chuẩn bị/nấu/tổng, khẩu phần, dị ứng (nhiều),
  nguyên liệu (động), bước nấu (động).
- **Nguyên liệu (động):** thêm/xóa dòng; chọn `quantityType` (`decimal|fraction|range|text`),
  số/khoảng/văn bản tương ứng, đơn vị (`units`), bắt buộc/tùy chọn, ghi chú sơ chế, nhóm.
- **Bước (động):** thêm/xóa; nội dung, ghi chú, thời gian (phút), nhiệt độ + ghi chú nhiệt độ.
- **Kiểm tra dữ liệu:** ở client cho UX, nhưng **server là nơi quyết định** (Zod ở API).
  Lỗi từ API (`{ error: { message, details } }`) được hiển thị theo trường.
- **Lưu nháp:** `mode=create` → `POST /api/v1/recipes` (server đặt `status:"draft"`).
  `mode=edit` → `PATCH /api/v1/recipes/{id}`.
- **Hành động trạng thái:** [recipe-status-actions.tsx](../../components/admin/recipe-status-actions.tsx)
  — nút Gửi duyệt/Xuất bản/Lưu trữ/Xóa; **chỉ** hiển thị khi actor có quyền; server **vẫn** kiểm lại.

## 6. Bộ lọc `/cong-thuc` — `RecipeFilters`

[components/recipe/recipe-filters.tsx](../../components/recipe/recipe-filters.tsx):
tìm kiếm (`q`), food type, cuisine, độ khó, sắp xếp. Điều hướng phía client (đẩy query lên URL)
để Server Component tải lại; mọi thay đổi bộ lọc đưa về trang 1. Dùng `buildRecipeListHref()`.

---

## 7. Tái sử dụng component P05 (không viết lại)

| Component P05 | Dùng ở |
| --- | --- |
| `RecipeCard` / `RecipeCardCompact` | danh sách |
| `RecipeImage` | card + chi tiết (mascot khi thiếu ảnh) |
| `IngredientList` / `IngredientRow` | chi tiết + form |
| `CookingStepCard` | chi tiết |
| `CookingTime` / `PreparationTime` / `ServingsBadge` / `DifficultyBadge` | card + chi tiết + form |
| `NutritionSummary` | chi tiết |
| `AllergenBadges` | chi tiết |
| `Pagination` / `Breadcrumb` / `EmptyState` / `ErrorState` / `Skeleton` | danh sách |
| `FormField` / `Input` / `Textarea` / `Select` / `Checkbox` / `Button` | form quản trị |

---

## 8. Nguyên tắc hiển thị nội dung (đồng bộ §17)

- **Không bịa dữ liệu:** thiếu thời gian/khẩu phần/dinh dưỡng/dị ứng → ẩn mục đó.
- **Ảnh lỗi/chưa có:** `RecipeImage` hiển thị mascot P04 thay vì ảnh vỡ.
- **Định lượng:** format từ số (`numeric`) — không ép chuỗi tùy tiện.
- **Nguồn:** mục "Nguồn tham khảo" hiển thị khi công khai; khuyến khích LUÔN có (BR-03 yêu cầu
  khi xuất bản).

---

## 9. Trạng thái & lỗi (chi tiết)

| Tình huống | Xử lý |
| --- | --- |
| Danh sách tải | `loading.tsx` skeleton |
| Danh sách lỗi server | `error.tsx` error boundary (có `reset()`); RSC cũng bắt `try/catch` → `ErrorState` |
| Danh sách rỗng | `EmptyState` |
| Chi tiết 404 | `notFound()` (trang 404 của P05) |
| Form lỗi validate | hiển thị `details` theo trường + thông báo tổng |
| Thao tác trạng thái lỗi | thông báo `role="alert"`; thành công `role="status"` + `router.refresh()` |

---

## 10. Phần CHƯA xác minh

- ⛔ Không có trình duyệt headless → chưa kiểm responsive thực tế, focus, tràn ngang,
  console runtime (kế thừa B-P05-01; xem [TEST_REPORT.md](./TEST_REPORT.md) §6).
- ⛔ Form quản trị **chưa** truy cập được qua UI thật vì Auth.js chưa nối (guest bị chặn →
  hiển thị `AdminAccessNotice`). Đã kiểm ở mức unit test render (`recipe-form.test.tsx`).
- ⛔ Tải ảnh trong form: hiện gửi JSON (metadata ảnh), **chưa** tích hợp luồng `POST /api/v1/media`
  vào form (media adapter đã sẵn — xem [RECIPE_MEDIA.md](./RECIPE_MEDIA.md)).
