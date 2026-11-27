# P06 — DATABASE IMPLEMENTATION

> Triển khai nền tảng dữ liệu thực tế theo kiến trúc P02.
> Chỉ ghi **kết quả đã thực hiện/đã kiểm**; phần chưa xác minh ghi rõ.
> Cập nhật: 2026-11-28 (P06).

---

## 1. Phạm vi P06

P06 dựng **nền tảng dữ liệu** cho WALE COOKING: Prisma schema đầy đủ theo P02, Prisma client
dùng chung, migration tái lập được, seed hệ thống idempotent, lớp repository/service, validation
và authorization interface. **Không** triển khai đăng nhập thật (Auth.js) hay module nghiệp vụ
Recipe đầy đủ (thuộc P07).

Stack đã chốt (D2): Next.js + TypeScript + pnpm + Prisma + **Neon PostgreSQL** + Auth.js + Cloudflare R2.

---

## 2. Số liệu thực tế đã triển khai

| Hạng mục | Giá trị | Nguồn kiểm chứng |
| --- | --- | --- |
| Enum (Prisma) | **22** | `prisma/schema.prisma`, `grep -c "^CREATE TYPE"` migration = 22 |
| Model (Prisma) | **57** | `prisma/schema.prisma` |
| Bảng trong DB | **58** (57 model + `_prisma_migrations`) | `information_schema.tables` trên `wale_dev` |
| Extension bật | 3 — `citext`, `pg_trgm`, `unaccent` | migration `CREATE EXTENSION` |
| Migration baseline | 1 — `20261127175936_init` | `prisma/migrations/` |
| Seed hệ thống | 9 taxonomy type / 83 term / 166 translation / 25 alias; 22 unit / 44 translation / 5 conversion; 10 equipment / 20 translation; 40 ingredient / 80 translation; 1 content_source | truy vấn `wale_dev` (xem §6) |
| Dữ liệu Recipe | **0** (chưa có — thuộc P07) | `SELECT count(*) FROM recipes` = 0 |

> **Nhóm entity đã bao phủ:** User & Account (`User`, `Account`, `Session`, `VerificationToken`,
> `UserProfile`, `UserPreference`, `UserDietaryPreference`, `UserAllergen`); Taxonomy
> (`TaxonomyType`, `TaxonomyTerm`, `TaxonomyTermTranslation`, `TaxonomyTermAlias`); Đơn vị & nguyên liệu
> (`Unit`, `UnitTranslation`, `UnitConversion`, `Ingredient`, `IngredientTranslation`,
> `IngredientAlias`, `IngredientSubstitution`, `IngredientAllergen`, `IngredientDensity`,
> `IngredientUnit`); Media (`MediaAsset`, `RecipeImage`); Recipe & nội dung
> (`Recipe`, `RecipeTranslation`, `RecipeStep`, `RecipeStepTranslation`, `RecipeStepTimer`,
> `RecipeEquipment`, `Equipment`, `EquipmentTranslation`, `RecipeTaxonomyTerm`, `RecipeSource`,
> `RecipeVersion`, `RecipeSlugRedirect`, `RecipeIngredient`, `RecipeIngredientSubstitute`,
> `RecipeNutrition`, `RecipeAllergen`); Tương tác (`Favorite`, `Collection`, `CollectionRecipe`,
> `RecipeNote`, `CookedHistory`, `CookingSession`, `CookingProgress`, `MealPlan`, `MealPlanDay`,
> `MealPlanItem`, `ShoppingList`, `ShoppingListItem`); Nguồn & kiểm duyệt (`ContentSource`,
> `SourceAttribution`, `ContentReviewRecord`, `ContentReview`, `AuditLog`).

---

## 3. Cấu trúc mã nguồn P06

```
prisma/
  schema.prisma                     # 22 enum + 57 model (nguồn: docs/P02)
  seed.ts                           # CLI: pnpm db:seed
  seed/
    data.ts                         # dữ liệu seed hệ thống (không định lượng)
    run.ts                          # runSystemSeed() / runDevSeed() — idempotent
  migrations/
    20261127175936_init/migration.sql
    migration_lock.toml

lib/
  config/env.ts                     # kiểm tra biến môi trường phía server
  db/
    prisma.ts                       # PrismaClient singleton (guard server-only)
    prisma-errors.ts                # map lỗi Prisma → AppError an toàn
    repositories/
      index.ts                      # cổng `repositories` (adapter Prisma)
      unit.repository.ts  prisma-unit.repository.ts
      taxonomy.repository.ts  prisma-taxonomy.repository.ts
      ingredient.repository.ts  prisma-ingredient.repository.ts
      types.ts
  errors/app-error.ts               # AppError + Validation/NotFound/Forbidden/Unauthorized/Conflict
  validation/
    common.ts                       # schema dùng chung + phân trang + parseInput
    catalog.ts                      # schema taxonomy term & ingredient
  auth/
    authorization.ts                # RBAC tập trung (role/permission)
    session.ts                      # getCurrentActor() — hiện trả null (guest)
  services/
    catalog.service.ts              # nghiệp vụ dữ liệu tham chiếu
    index.ts
```

---

## 4. Quy ước schema (theo P02 — không đổi)

- **Khóa chính:** UUID `gen_random_uuid()` cho mọi bảng.
- **Thời gian:** `timestamptz` lưu UTC; cột `created_at` / `updated_at`.
- **Đặt tên:** Prisma camelCase (field) ↔ SQL `snake_case` qua `@map`/`@@map`; bảng số nhiều.
- **Khóa ngoại & delete behavior:** mặc định **RESTRICT** (D18/D-P02-08); **CASCADE** chỉ cho dữ liệu
  con thuộc sở hữu (ví dụ bản dịch, bước nấu, nguyên liệu của recipe); `SET NULL` chỉ cho tham chiếu
  hiển thị (ví dụ `ingredients.default_unit_id`).
- **Định lượng:** lưu **số** — `quantity_numeric numeric(10,3)` + `unit_id` + `quantity_type`
  (`decimal`/`fraction`/`range`/`text`); **phân số là lớp hiển thị** (D17/D-P02-07). Không lưu định
  lượng dưới dạng chuỗi tùy tiện.
- **JSONB:** chỉ dùng cho `audit_logs.before/after`, `recipe_versions.snapshot`,
  `user_preferences.settings` (D19/D-P02-09); không thay quan hệ cốt lõi.
- **Soft delete:** `deleted_at` ở các thực thể nội dung cần lưu vết.
- **RBAC:** cột `users.role` enum `app_role` (`user`/`editor`/`admin`) — **không** bảng `user_roles`,
  **không** vai trò `moderator` (D13/D-P02-03).
- **Taxonomy:** mô hình tổng quát `taxonomy_types` + `taxonomy_terms` cho **9 trục độc lập**
  (D14/D-P02-04); `food_type`/`cuisine` là FK đơn trên `recipes`, các trục khác qua
  `recipe_taxonomy_terms`.
- **Extension:** `citext` (email), `pg_trgm` + `unaccent` (tìm kiếm không dấu — D15/D-P02-05).

---

## 5. ADR — sai lệch so với tài liệu P02 và cách xử lý

Mọi sai lệch đều là **sửa để khớp P02** hoặc **tinh chỉnh kỹ thuật nội bộ**, không thay đổi kiến trúc.

| # | Vấn đề phát hiện | Nguyên nhân | Phương án | Trạng thái |
| --- | --- | --- | --- | --- |
| ADR-P06-01 | `prisma validate` lỗi `P1012`: `extensions` chỉ dùng được với preview feature | Prisma yêu cầu bật cờ khi khai báo `pg_trgm`/`unaccent` trong `datasource` | Thêm `previewFeatures = ["postgresqlExtensions"]` vào `generator client` | ✅ Đã sửa |
| ADR-P06-02 | Model `RecipeIngredientSubstitute` có 2 relation trỏ cùng `recipe_ingredient_id`, một relation tham chiếu sai (`references: [recipeIngredientId]`) | Lỗi sao chép khi dựng schema | Giữ `recipeIngredient RecipeIngredient @relation(fields:[recipeIngredientId], references:[id], onDelete: Cascade)` + `substitute Ingredient @relation("IngredientSubstituteOption", …)`; bỏ relation ngược sai trên `Ingredient` | ✅ Đã sửa |
| ADR-P06-03 | Model dịch thiết bị đặt tên tạm `IngredientEquipmentTranslationPlaceholder` | Tên tạm khi dựng | Đổi tên thành `EquipmentTranslation`; **giữ nguyên** `@@map("equipment_translations")` và quan hệ trên `Equipment` | ✅ Đã sửa (không đổi bảng DB) |
| ADR-P06-04 | `Ingredient.category` đặt `onDelete: SetNull` | Mặc định khi dựng schema | Đổi sang **`onDelete: Restrict`** — theo P02 §6 (taxonomy term đang được dùng phải RESTRICT); `SET NULL` chỉ giữ cho `default_unit_id` | ✅ Đã sửa — **tương ứng test integration `constraints.test.ts`** |

> ADR-P06-01..04 đã được ghi vào [DECISIONS.md](../../DECISIONS.md) (D42–D45).
> Không có thay đổi nào ảnh hưởng tới 22 enum / 57 model về mặt nghiệp vụ so với P02.

---

## 6. Kiểm chứng thực tế (đã chạy)

| Kiểm tra | Lệnh / cách | Kết quả |
| --- | --- | --- |
| Schema hợp lệ | `pnpm exec prisma validate` | ✅ hợp lệ |
| Sinh client | `pnpm exec prisma generate` | ✅ thành công |
| Migration từ DB sạch | `prisma migrate deploy` trên `wale_dev` + `wale_test` | ✅ 58 bảng, `migrate status` up-to-date |
| Seed idempotent | `pnpm db:seed` chạy 2 lần | ✅ số bản ghi không đổi (xem [SEED_GUIDE.md](./SEED_GUIDE.md)) |
| Repository/service | `pnpm test:integration` | ✅ 28/28 pass |

---

## 7. Phần CHƯA xác minh (ghi rõ, không tuyên bố đạt)

- **Chưa kết nối Neon thật**: toàn bộ kiểm chứng chạy trên PostgreSQL 16.15 **local**
  (`127.0.0.1:5432`, DB `wale_dev`/`wale_test`). Chưa có connection string Neon → chưa kiểm
  pooled/direct thật, chưa kiểm SSL/PgBouncer. Xem [MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md) §6.
- **Chưa có dữ liệu Recipe** (thuộc P07).
- **Auth.js chưa nối**: `getCurrentActor()` trả `null`; chưa xác minh luồng đăng nhập thật.
- **Backup/PITR** theo gói Neon free chưa xác minh (B-P02-02).
