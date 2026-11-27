# P06 — SEED GUIDE

> Hướng dẫn seed dữ liệu hệ thống & dữ liệu phát triển cho WALE COOKING.
> Cập nhật: 2026-11-28 (P06).

---

## 1. Nguyên tắc

- **Idempotent:** dùng `upsert` theo khóa duy nhất (code/slug) → chạy lại không tạo bản ghi trùng.
- **Phân tách rõ:** **SEED HỆ THỐNG** (luôn chạy) vs **DỮ LIỆU PHÁT TRIỂN** (chỉ khi `SEED_DEV=1`).
- **Không** chứa thông tin cá nhân thật.
- **Không** tạo công thức giả như nội dung đã xuất bản.
- Có thể chạy lại an toàn bất kỳ lúc nào.

---

## 2. Cấu trúc

```
prisma/
  seed.ts          # CLI: pnpm db:seed — chạy runSystemSeed, tùy chọn runDevSeed
  seed/
    data.ts        # dữ liệu hệ thống tĩnh (không định lượng, chỉ định danh)
    run.ts         # runSystemSeed(prisma, log) / runDevSeed(prisma, log)
```

`prisma.seed` trong `package.json` trỏ tới `tsx prisma/seed.ts`.

---

## 3. SEED HỆ THỐNG (`runSystemSeed`)

Thứ tự thực hiện: taxonomy → unit → equipment → ingredient → nguồn nội dung hệ thống.

| Nhóm | Nội dung | Khóa idempotent | Số lượng (thực tế) |
| --- | --- | --- | --- |
| **Taxonomy types** | 9 trục (food_type, cuisine, country, region, ingredient_category, cooking_method, meal_type, dietary_preference, allergen) | `code` | 9 |
| **Taxonomy terms** | hạng mục cho từng trục | `(taxonomyTypeId, slug)` | 83 |
| **Term translations** | vi + en cho mỗi term | `(termId, locale)` | 166 |
| **Term aliases** | alias tìm kiếm (vi) | `(termId, alias, locale)` | 25 |
| **Units** | 22 đơn vị (g, kg, mg, oz, lb, ml, l, tsp, tbsp, cup, fl_oz, piece, clove, slice, bunch, stalk, sprig, can, pack, pinch, to_taste, as_needed) | `code` | 22 |
| **Unit translations** | vi + en | `(unitId, locale)` | 44 |
| **Unit conversions** | 5 quy đổi (kg→g=1000, mg→g=0.001, lb→g=453.59237, oz→g=28.349523125, l→ml=1000) | `(fromUnitId, toUnitId)` | 5 |
| **Equipment** | 10 thiết bị cơ bản | `slug` | 10 |
| **Equipment translations** | vi + en | `(equipmentId, locale)` | 20 |
| **Ingredients** | 40 nguyên liệu nền (chỉ tên + nhóm + isCommon; **không** định lượng) | `slug` | 40 |
| **Ingredient translations** | vi + en | `(ingredientId, locale)` | 80 |
| **Content source hệ thống** | "WALE COOKING (tự biên soạn)" — phục vụ truy xuất nguồn ở P07 | `name` | 1 |

> **Nguồn dữ liệu:** đơn vị theo **SI** + hệ **avoirdupois** (oz/lb); nhóm dị ứng theo **14 nhóm EU FIC**.
> Đây là dữ liệu **tham chiếu/định danh**, không phải nội dung công thức.

### 3.1. Bảng nhóm dị ứng & taxonomy
9 trục taxonomy gồm `allergen` (14 nhóm) và `ingredient_category` (nhóm nguyên liệu, dùng cho
`ingredients.category_term_id`). `food_type`/`cuisine` là FK đơn trên `recipes` theo P02; các trục
khác liên kết qua `recipe_taxonomy_terms`.

---

## 4. DỮ LIỆU PHÁT TRIỂN (`runDevSeed`)

Chỉ chạy khi `SEED_DEV=1`:

```bash
SEED_DEV=1 pnpm db:seed
```

- Tạo **một** tài khoản tác giả dev: `dev-editor@wale.invalid` (role `editor`).
- Dùng **TLD `.invalid`** (dành riêng cho ví dụ) → **không** phải email thật; an toàn.
- Idempotent qua `upsert` theo `email`.

> **Không** được dùng tài khoản này như người dùng đã đăng nhập trong ứng dụng; đây thuần là dữ
> liệu dev.

---

## 5. Chạy seed

```bash
pnpm db:seed              # chỉ seed hệ thống
SEED_DEV=1 pnpm db:seed   # seed hệ thống + dữ liệu phát triển
```

Kết quả mẫu (log):
```
[seed:system] bắt đầu…
[seed:system] hoàn tất.
[seed:dev] bỏ qua (đặt SEED_DEV=1 để tạo dữ liệu phát triển).
```

---

## 6. Kiểm chứng idempotency (đã chạy thực tế)

Chạy `pnpm db:seed` **2 lần liên tiếp** trên `wale_dev`, đếm lại bằng truy vấn:

```
taxonomy_types=9   taxonomy_terms=83   taxonomy_term_translations=166
taxonomy_term_aliases=25   units=22   unit_translations=44   unit_conversions=5
equipment=10   equipment_translations=20   ingredients=40   content_sources=1   recipes=0
```

→ Số bản ghi **không đổi** giữa hai lần chạy ⇒ idempotent. Test tự động tương ứng:
[tests/integration/seed.test.ts](../../tests/integration/seed.test.ts) (3 test).

---

## 7. Lưu ý

- Seed **không** tạo recipe — dữ liệu công thức do P07 khởi tạo qua nghiệp vụ thật.
- `runSystemSeed`/`runDevSeed` nhận `PrismaClient` truyền vào → dùng được cả trong CLI
  (`prisma/seed.ts`) lẫn test (`tests/integration`).
- Mọi bản ghi seed đều có khóa duy nhất; không phụ thuộc `id` cứng.
