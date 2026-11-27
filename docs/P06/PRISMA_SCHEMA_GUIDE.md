# P06 — PRISMA SCHEMA GUIDE

> Hướng dẫn đọc/duy trì `prisma/schema.prisma` của WALE COOKING.
> Nguồn thiết kế: [docs/P02/DATABASE_SCHEMA.md](../P02/DATABASE_SCHEMA.md) + [ENTITY_RELATIONSHIP_DIAGRAM.md](../P02/ENTITY_RELATIONSHIP_DIAGRAM.md).
> Cập nhật: 2026-11-28 (P06).

---

## 1. Cấu hình Prisma

**Phiên bản:** Prisma CLI + `@prisma/client` **6.19.3** (khớp Next.js 16.4.6).

`generator`:
```prisma
generator client {
  provider        = "prisma-client-js"
  previewFeatures = ["postgresqlExtensions"]
}
```

`datasource`:
```prisma
datasource db {
  provider   = "postgresql"
  url        = env("DATABASE_URL")     // POOLED — runtime
  directUrl  = env("DIRECT_URL")       // DIRECT — migration/seed
  extensions = [citext, pgTrgm(map: "pg_trgm"), unaccent]
}
```

- `previewFeatures = ["postgresqlExtensions"]` là **bắt buộc** để khai báo `extensions` (ADR-P06-01).
- `url` (pooled) dùng cho runtime; `directUrl` (direct) bắt buộc cho `prisma migrate` khi chạy qua
  pooler của Neon. Với PostgreSQL local, hai biến có thể trỏ cùng URL.
- Không hardcode connection string — luôn qua biến môi trường.

Vì sao chọn `prisma-client-js` (không `prisma-client` mới): giữ tương thích với đường dẫn import
`@prisma/client` đang dùng trong repo và tránh phát sinh `output` path. Có thể chuyển sang generator
mới ở phase sau nếu cần.

---

## 2. Quy ước chung

| Quy ước | Prisma | Ghi chú |
| --- | --- | --- |
| Tên model | PascalCase, số ít | `RecipeIngredient`, `TaxonomyTerm` |
| Tên bảng | `@@map("snake_case_số_nhiều")` | `@@map("recipe_ingredients")` |
| Tên cột | camelCase ↔ `@map("snake_case")` | `createdAt @map("created_at")` |
| Khóa chính | `id String @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid` | UUID toàn hệ thống |
| Thời gian | `@db.Timestamptz(6)` | Lưu UTC |
| Định lượng | `Decimal @db.Decimal(10, 3)` | Không dùng `Float`/`String` |
| Enum | block `enum` + `@@map("snake_case")` | giá trị enum giữ chữ thường |
| Index | `@@index([...])`, `@@unique([...])` | cho truy vấn & ràng buộc thường gặp |

Ví dụ mẫu (rút gọn từ `Unit`):
```prisma
model Unit {
  id         String         @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  code       String         @unique
  dimension  UnitDimension
  isBase     Boolean        @default(false) @map("is_base")
  sortOrder  Int            @default(0) @map("sort_order")
  createdAt  DateTime       @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt  DateTime       @updatedAt @map("updated_at") @db.Timestamptz(6)

  translations UnitTranslation[]
  conversionsFrom UnitConversion[] @relation("UnitConversionFrom")
  conversionsTo   UnitConversion[] @relation("UnitConversionTo")

  @@map("units")
}
```

---

## 3. Delete behavior (ràng buộc quan trọng — D18)

- **RESTRICT (mặc định):** áp cho tham chiếu tới dữ liệu tham chiếu dùng chung — taxonomy term,
  unit, ingredient, content source, người dùng. Ví dụ: `Ingredient.category` → `onDelete: Restrict`
  (ADR-P06-04); không thể xóa taxonomy term đang được nguyên liệu tham chiếu.
- **CASCADE (có chọn lọc):** chỉ cho **dữ liệu con thuộc sở hữu của cha** — bản dịch
  (`RecipeTranslation`, `UnitTranslation`, …), bước nấu (`RecipeStep`) khi xóa recipe,
  `RecipeIngredientSubstitute` khi xóa `RecipeIngredient`.
- **SET NULL:** chỉ cho tham chiếu **hiển thị/tùy chọn** — ví dụ `Ingredient.defaultUnit` khi xóa unit.

> Khi thêm quan hệ mới: mặc định chọn RESTRICT. Chỉ đổi sang CASCADE/SET NULL khi có lý do rõ và ghi
> lại trong ADR.

---

## 4. Bản đồ model theo nhóm

Xem danh sách đầy đủ 57 model tại [DATABASE_IMPLEMENTATION.md](./DATABASE_IMPLEMENTATION.md) §2.
Tóm tắt:

1. **Auth & người dùng** — `User`, `Account`, `Session`, `VerificationToken`, `UserProfile`,
   `UserPreference`, `UserDietaryPreference`, `UserAllergen`.
2. **Taxonomy (9 trục)** — `TaxonomyType`, `TaxonomyTerm`, `TaxonomyTermTranslation`,
   `TaxonomyTermAlias`.
3. **Đơn vị** — `Unit`, `UnitTranslation`, `UnitConversion`.
4. **Nguyên liệu** — `Ingredient`, `IngredientTranslation`, `IngredientAlias`,
   `IngredientSubstitution`, `IngredientAllergen`, `IngredientDensity`, `IngredientUnit`.
5. **Media** — `MediaAsset`, `RecipeImage`.
6. **Recipe & nội dung** — `Recipe`, `RecipeTranslation`, `RecipeStep`, `RecipeStepTranslation`,
   `RecipeStepTimer`, `RecipeEquipment`, `Equipment`, `EquipmentTranslation`, `RecipeTaxonomyTerm`,
   `RecipeSource`, `RecipeVersion`, `RecipeSlugRedirect`, `RecipeIngredient`,
   `RecipeIngredientSubstitute`, `RecipeNutrition`, `RecipeAllergen`.
7. **Tương tác/phiên nấu** — `Favorite`, `Collection`, `CollectionRecipe`, `RecipeNote`,
   `CookedHistory`, `CookingSession`, `CookingProgress`, `MealPlan`, `MealPlanDay`, `MealPlanItem`,
   `ShoppingList`, `ShoppingListItem`.
8. **Nguồn & kiểm duyệt** — `ContentSource`, `SourceAttribution`, `ContentReviewRecord`,
   `ContentReview`, `AuditLog`.

### Enum (22)

`AppRole`, `RecipeStatus`, `Difficulty`, `VerificationStatus`, `MeasurementSystem`, `UnitDimension`,
`QuantityType`, `IngredientAliasKind`, `SubstitutionQuality`, `AllergenPresence`, `DensityConfidence`,
`CookingSessionStatus`, `MealType`, `ShoppingListStatus`, `NutritionBasis`,
`NutritionDataSourceType`, `AllergenSource`, `SourceVerifiedStatus`, `ReviewDecision`,
`ContentReviewAction`, `MediaStatus`, `RecipeImageRole`.

---

## 5. Quy trình thay đổi schema

1. Sửa thiết kế trong `docs/P02/DATABASE_SCHEMA.md` trước (nguồn chuẩn).
2. Sửa `prisma/schema.prisma`.
3. `pnpm exec prisma validate` → `pnpm exec prisma format`.
4. `pnpm db:migrate` (dev, tạo migration mới) — không sửa migration đã áp dụng.
5. `pnpm db:generate` sinh lại client.
6. `pnpm typecheck` + `pnpm test` + `pnpm test:integration`.
7. Ghi ADR nếu có sai lệch kiến trúc.

```bash
pnpm db:generate    # prisma generate
pnpm db:migrate     # prisma migrate dev (tạo + áp migration mới)
pnpm db:deploy      # prisma migrate deploy (production/CI)
pnpm db:seed        # tsx prisma/seed.ts
pnpm db:studio      # prisma studio
```

---

## 6. Lưu ý khi bảo trì

- **Không** dùng `prisma db push` thay cho migration trong quy trình production (P06 §5).
- **Không** sửa file migration đã áp dụng theo cách phá vỡ lịch sử; thay đổi schema mới → migration mới.
- **Không** đổi `@map`/`@@map` tùy tiện — sẽ đổi tên bảng/cột thật.
- Cột JSONB chỉ cho `audit_logs.before/after`, `recipe_versions.snapshot`,
  `user_preferences.settings`.
- `Decimal` (không `Float`) cho mọi định lượng.
