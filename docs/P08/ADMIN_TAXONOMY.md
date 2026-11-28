# P08 — Quản trị Taxonomy (Admin)

> Phase: **P08** · Ngày: 2026-11-28.
> Phạm vi: P08 §P08.4 — CRUD danh mục trong trang quản trị; **chỉ** Admin; xử lý danh mục đang được dùng.
> Nguyên tắc: giữ nguyên trang quản trị riêng; không có đăng ký/đăng nhập khách.

## 1. Route quản trị

| Route | File | Mô tả |
| --- | --- | --- |
| `/admin/danh-muc` | [app/(admin)/admin/danh-muc/page.tsx](../../app/(admin)/admin/danh-muc/page.tsx) | Điểm vào: liệt kê 6 trục + số danh mục |
| `/admin/danh-muc/{type}` | [app/(admin)/admin/danh-muc/[type]/page.tsx](../../app/(admin)/admin/danh-muc/[type]/page.tsx) | Quản trị term của một trục |

`{type}` = `taxonomy_types.code` (`food_type`, `cuisine`, `meal_type`, `cooking_method`,
`dietary_preference`, `ingredient_category`). `metadata.robots = noindex`.

## 2. API quản trị (REST)

| Method | Endpoint | Quyền | Mô tả |
| --- | --- | --- | --- |
| `POST` | `/api/v1/admin/taxonomy` | `taxonomy:manage` | Tạo term mới |
| `PATCH` | `/api/v1/admin/taxonomy/{id}` | `taxonomy:manage` | Cập nhật term (`isActive` = lưu trữ/khôi phục) |
| `DELETE` | `/api/v1/admin/taxonomy/{id}` | `taxonomy:manage` | Xóa term (có điều kiện) |

Files: [app/api/v1/admin/taxonomy/route.ts](../../app/api/v1/admin/taxonomy/route.ts),
[app/api/v1/admin/taxonomy/[id]/route.ts](../../app/api/v1/admin/taxonomy/[id]/route.ts).

- Actor lấy từ `getCurrentActor()`. Auth.js **chưa nối** → guest ⇒ **401** (không giả lập người dùng).
- **Kiểm tra quyền ở SERVER** (trong `TaxonomyService`), không chỉ ẩn nút ở UI.

## 3. Trường quản trị

Theo [lib/validation/taxonomy.ts](../../lib/validation/taxonomy.ts) — chỉ dùng **trường có thật** trong schema:

| Trường | Tạo | Sửa | Ghi chú |
| --- | --- | --- | --- |
| `name` | ✔ | ✔ | bắt buộc |
| `slug` | ✔ | — | không đổi sau khi tạo (URL ổn định) |
| `description` | ✔ | ✔ | ≤1000 |
| `icon` | ✔ | ✔ | ≤200 |
| `sortOrder` | ✔ | ✔ | số nhỏ hiển thị trước |
| `parentSlug` | ✔ | ✔ | `null` = danh mục gốc; phải **cùng trục** |
| `isActive` | — | ✔ | `false` = lưu trữ |
| `locale` | ✔ | ✔ | mặc định `vi` |

**Không** thêm cột SEO/ảnh đại diện taxonomy (schema chưa có — theo **ADR-P07_1-02**; ghi backlog).

## 4. Quy tắc an toàn dữ liệu

`TaxonomyService` ([lib/services/taxonomy.service.ts](../../lib/services/taxonomy.service.ts)):

- **Xóa** chỉ thành công khi:
  1. `countRecipeUsage(id) === 0` (không công thức nào dùng), **và**
  2. không còn **danh mục con** (`childCount === 0`).
- Ngược lại ném `ValidationError` hướng dẫn **lưu trữ** (archive) thay vì xóa — tránh mất liên kết.
- **Lưu trữ** (`isActive=false`): term biến mất khỏi công khai nhưng giữ liên kết dữ liệu; **khôi phục**
  (`isActive=true`) bật lại.
- **Danh mục cha/con**: `parentSlug` resolve trong cùng trục; chặn cha là chính nó.
- Xóa **cứng** chỉ khi an toàn; không cascade mất dữ liệu.

## 5. Giao diện quản trị

[components/admin/taxonomy-manager.tsx](../../components/admin/taxonomy-manager.tsx) (client component):

- Form **thêm/sửa** (tên, slug, mô tả, danh mục cha [chỉ trục phân cấp], thứ tự, trạng thái).
- `slugify` tự sinh slug từ tên khi tạo (khóa khi sửa).
- Bảng danh mục: tên + slug, danh mục cha, "**đang dùng**" (số công thức · số danh mục con), trạng thái.
- Nút **Sửa / Lưu trữ–Khôi phục / Xóa**; hiển thị lỗi server (kể cả lý do chặn xóa).
- `router.refresh()` sau thao tác để đồng bộ dữ liệu server.

## 6. Gắn danh mục vào công thức

- Công thức liên kết term qua `recipe_taxonomy_terms` (`taxonomyTerms: [{ typeCode, slug }]` trong
  `createRecipeSchema` — đã có ở P07). P08 **không** thay đổi hợp đồng này.
- Trục `ingredient_category` liên kết gián tiếp qua **nguyên liệu** của công thức (không gắn term trực tiếp).

## 7. Kiểm thử

Xem [TEST_REPORT.md](./TEST_REPORT.md) — unit (`taxonomy.service.test.ts`, `taxonomy-validation.test.ts`)
và integration (`tests/integration/taxonomy.service.test.ts`: CRUD, cha/con, chặn xóa khi đang dùng).
