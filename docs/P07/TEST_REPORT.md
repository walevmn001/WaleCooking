# P07 — TEST REPORT

> Báo cáo kiểm thử P07. Chỉ ghi kết quả **thực tế đã chạy**; phần chưa chạy ghi rõ.
> Môi trường: remote sandbox Linux, non-interactive, **không có trình duyệt headless**.
> PostgreSQL **16.15 local** (`127.0.0.1:5432`, DB `wale_dev` + `wale_test`).
> Auth.js **chưa nối**; Cloudflare R2 **chưa có credentials** (dùng local provider).
> Cập nhật: 2026-11-28 (P07).

---

## 1. Kết quả tổng hợp (đã chạy)

| Kiểm tra | Lệnh | Kết quả |
| --- | --- | --- |
| Unit test | `pnpm test` | ✅ **124/124 pass** (18 file) |
| Integration test | `pnpm test:integration` | ✅ **50/50 pass** (7 file) |
| TypeScript | `pnpm typecheck` | ✅ **0 lỗi** |
| ESLint | `pnpm lint` | ✅ **0 lỗi / 0 cảnh báo** |
| Production build | `pnpm build` | ✅ thành công, **29 route** |
| Prisma validate | `pnpm exec prisma validate` | ✅ hợp lệ (không đổi schema ở P07) |

> **Không** xóa/làm suy yếu test cũ để có kết quả xanh. 78 unit + 28 integration của P05/P06
> vẫn chạy nguyên; P07 **bổ sung** 46 unit + 22 integration.

---

## 2. Unit test P07 (46 test mới / 4 file)

| File | Số test | Nội dung kiểm |
| --- | --- | --- |
| [tests/lib/recipe-validation.test.ts](../../tests/lib/recipe-validation.test.ts) | 19 | `createRecipeSchema`/`updateRecipeSchema`/`listRecipesQuerySchema`; định lượng (`decimal/fraction/range/text`); **regression** `termSlugSchema` (chấp nhận `main_dish`, `gluten_free`, `stir_fry`) vs `slugSchema` (từ chối `_` cho slug URL) |
| [tests/lib/recipe.presentation.test.ts](../../tests/lib/recipe.presentation.test.ts) | 17 | `toRecipeSummary`/`toRecipeDetail`; `formatIngredientAmount` (không bịa đơn vị); `toNutritionViewModel` (chỉ chỉ số có dữ liệu + ghi chú nguồn); `toRecipeJsonLd` (bỏ trường thiếu) |
| [tests/components/recipe-filters.test.tsx](../../tests/components/recipe-filters.test.tsx) | 4 | Render bộ lọc; đẩy query lên URL; reset trang 1; hiển thị giá trị hiện tại |
| [tests/components/recipe-form.test.tsx](../../tests/components/recipe-form.test.tsx) | 6 | Render form tạo/sửa; thêm/xóa nguyên liệu & bước; tự sinh slug; trạng thái lỗi |
| **Tổng** | **46** | hợp nhất với 78 test P05/P06 → **124/124** |

---

## 3. Integration test P07 (22 test / 2 file)

Chạy trên PostgreSQL **thử nghiệm** `wale_test`
([vitest.integration.config.ts](../../vitest.integration.config.ts),
helper [helpers/db.ts](../../tests/integration/helpers/db.ts) — slug tiền tố duy nhất).

| File | Số test | Nội dung kiểm |
| --- | --- | --- |
| [tests/integration/recipe.repository.test.ts](../../tests/integration/recipe.repository.test.ts) | 8 | `create`/`update` transaction; **thứ tự** nguyên liệu & bước (`sortOrder`/`stepNo`); unique slug; **soft-delete** (ẩn khỏi truy vấn nhưng giữ bản ghi + `status=archived`); `listPublic` chỉ `published` |
| [tests/integration/recipe.service.test.ts](../../tests/integration/recipe.service.test.ts) | 14 | CRUD qua service; **authorization** (guest 401, user 403, editor/admin pass); slug trùng → 422; `publish` thiếu điều kiện BR-01 → 422; phân trang/lọc; snapshot version; rollback |
| **Tổng** | **22** | hợp nhất với 28 test P06 → **50/50** |

---

## 4. Chi tiết build

```
✓ Compiled successfully
✓ Generating static pages
Route (app)
○ /            ○ /_not-found   ○ /admin
ƒ /admin/cong-thuc             ƒ /admin/cong-thuc/[id]/sua   ƒ /admin/cong-thuc/moi
ƒ /api/v1/admin/recipes        ƒ /api/v1/media               ƒ /api/v1/media/[id]
ƒ /api/v1/media/file/[...key]  ƒ /api/v1/recipes             ƒ /api/v1/recipes/[id]
ƒ /api/v1/recipes/[id]/archive ƒ /api/v1/recipes/[id]/publish
ƒ /api/v1/recipes/[id]/submit-review  ƒ /api/v1/recipes/[id]/versions
○ /ban-quyen   ○ /bao-mat      ƒ /cong-thuc                  ƒ /cong-thuc/[slug]
○ /dang-nhap   ○ /danh-muc     ○ /dev/components
○ /dieu-khoan  ○ /gioi-thieu   ○ /kien-thuc
○ /tai-khoan   ƒ /tim-kiem     ○ /yeu-thich
```

- **29 route** (13 static + 16 dynamic). So với P06 (15 route), P07 thêm **14 route**:
  1 trang danh sách công khai (giờ dynamic) + 1 trang chi tiết + 3 trang quản trị + 10 endpoint API.
- Route P05 khác **không đổi** → không phá vỡ route hiện có (regression OK).

---

## 5. Ma trận nghiệp vụ đã kiểm

| Nghiệp vụ (P07 §13/§19) | Kiểm ở đâu | Kết quả |
| --- | --- | --- |
| Recipe CRUD | `recipe.service.test.ts` | ✅ |
| Validation đầu vào | `recipe-validation.test.ts` + service | ✅ |
| Authorization (guest/user/editor/admin) | `authorization.test.ts` + service | ✅ |
| Guest chỉ đọc `published` | repository `listPublic` + service `getPublicBySlug` | ✅ |
| Ingredient ordering | `recipe.repository.test.ts` | ✅ |
| Cooking step ordering | `recipe.repository.test.ts` | ✅ |
| Transaction rollback | `recipe.service/repository.test.ts` + P06 `transaction.test.ts` | ✅ |
| Slug uniqueness | `recipe.repository.test.ts` + service | ✅ |
| Pagination | repository + presentation + service | ✅ |
| API error handling (map AppError) | `errors.test.ts` + service | ✅ |
| Media adapter (local) | `image-validation` + upload flow (kiểm logic) | ⚠️ chỉ local provider |
| Unauthorized requests | service (401/403) | ✅ (tầng service) |

---

## 6. Phần CHƯA kiểm / chưa xác minh

- ⛔ **Chưa có test HTTP end-to-end** (Auth.js chưa nối): 401/403 được kiểm ở **tầng service**
  với actor giả trong bộ nhớ, **chưa** qua phiên đăng nhập thật / route handler HTTP (B-P06-02).
- ⛔ **Chưa chạy trên Cloudflare R2 thật** (chưa có credentials) → media kiểm trên
  **LocalStorageAdapter**; R2 adapter chưa kết nối bucket thật (B-P07-01).
- ⛔ **Chưa chạy trên Neon PostgreSQL thật** → mọi test dùng PostgreSQL local (B-P06-01).
- ⛔ Không có trình duyệt headless → chưa chạy E2E/axe/Lighthouse; UI kiểm ở mức
  render (jsdom) + typecheck + build. Không tuyên bố đạt WCAG 2.2 AA (kế thừa B-P05-01).
- ⛔ Luồng **upload ảnh trong form quản trị** chưa nối `POST /api/v1/media` (xem
  [RECIPE_FRONTEND.md](./RECIPE_FRONTEND.md) §10).
- ⛔ Nhánh i18n EN: schema/truy vấn sẵn sàng nhưng UI mới hiển thị tiếng Việt.

---

## 7. Ghi chú kỹ thuật

- Hai tầng test: unit (jsdom, [vitest.config.ts](../../vitest.config.ts), loại trừ
  `tests/integration/**`) và integration (node + PostgreSQL thử nghiệm).
- `server-only` alias về stub trong test ([tests/stubs/server-only.ts](../../tests/stubs/server-only.ts)).
- Integration test cần `TEST_DATABASE_URL`; dùng slug tiền tố duy nhất (`uniqueSlug`) để
  **cô lập** dữ liệu và tránh ảnh hưởng lẫn nhau.
- Audit ảnh (magic bytes) kiểm qua `image-validation` — **không** tin `Content-Type` client.
