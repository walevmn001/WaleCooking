# P02 — DATABASE SCHEMA: WALE COOKING

> Schema PostgreSQL ở mức **thiết kế** (chưa chạy migration, chưa tạo DB production). Tên bảng/cột dùng `snake_case` (map với Prisma models).
> Tuân thủ [PRODUCT_CONSTITUTION.md](../P01/PRODUCT_CONSTITUTION.md) và quy tắc nghiệp vụ [BUSINESS_RULES.md](../P01/BUSINESS_RULES.md).
> ERD: [ENTITY_RELATIONSHIP_DIAGRAM.md](./ENTITY_RELATIONSHIP_DIAGRAM.md).
> Quy ước chung: mọi bảng có `id` (PK), `created_at`, `updated_at` (timestamptz) trừ bảng join thuần; xóa mềm bằng `deleted_at` khi cần.

## 0. Quy ước chung

| Hạng mục | Quy ước |
| --- | --- |
| **Khóa chính** | `id` — `uuid` (default `gen_random_uuid()`), trừ bảng dùng khóa tự nhiên (vd `verification_tokens`). |
| **Khóa ngoại** | `*_id`, ràng buộc `REFERENCES`, mặc định `ON DELETE RESTRICT` (xem §6). |
| **Timestamp** | `created_at timestamptz NOT NULL DEFAULT now()`, `updated_at timestamptz NOT NULL`. |
| **Timezone** | Lưu **UTC** (`timestamptz`); chuyển sang `Asia/Ho_Chi_Minh` ở lớp trình bày. |
| **Slug** | `text` + `UNIQUE`; ổn định cho SEO; đổi slug tạo bản ghi redirect (xem §6). |
| **Đa ngôn ngữ** | Bảng `*_translations` với `locale` (`vi` mặc định, `en` mở rộng), `UNIQUE(entity_id, locale)`. |
| **Enum** | Dùng PostgreSQL enum (hoặc bảng tra) cho tập nhỏ, ổn định (`status`, `role`, `difficulty`…). |
| **JSONB** | Chỉ dùng cho dữ liệu **không cần truy vấn quan hệ/ràng buộc** (audit diff, snapshot phiên bản, settings). **Không** dùng thay quan hệ cốt lõi. |
| **Soft delete** | `deleted_at` cho dữ liệu người dùng (favorites, collections) khi cần khôi phục; nội dung công khai dùng `status='archived'` thay vì xóa. |

---

## 5.1. Identity & User (tương thích Auth.js Prisma Adapter)

> Bảng Auth.js dùng **đúng** mô hình của adapter (không tạo schema trùng lặp). Ánh xạ bảng bằng `@@map`.

**`users`** (Auth.js `User` + mở rộng)
| Cột | Kiểu | Ràng buộc/Ghi chú |
| --- | --- | --- |
| id | uuid | PK |
| name | text | nullable |
| email | citext | **UNIQUE**, nullable (OAuth có thể không email) |
| email_verified | timestamptz | nullable (Auth.js) |
| image | text | URL avatar ngoài (Auth.js) hoặc `media_asset_id` |
| role | app_role enum | `user`(default)/`editor`/`admin` — RBAC server-side |
| preferred_locale | text | default `vi` |
| created_at, updated_at | timestamptz | |

> **Ghi chú RBAC:** dùng **cột `role`** thay vì bảng `user_roles` riêng (tránh bảng thừa). Chỉ tách `user_roles` khi cần **đa vai trò đồng thời** (chưa có nhu cầu) — xem [ARCHITECTURE_DECISIONS.md](./ARCHITECTURE_DECISIONS.md) D-P02-03.

**`accounts`** (Auth.js, `@@map "accounts"`) — OAuth liên kết: `id`, `user_id`(FK users, OAuth cascade), `type`, `provider`, `provider_account_id`, `refresh_token`, `access_token`, `expires_at int`, `token_type`, `scope`, `id_token`, `session_state`. UNIQUE(`provider`,`provider_account_id`).

**`sessions`** (Auth.js) — `id`, `session_token` UNIQUE, `user_id`(FK users, CASCADE), `expires`.

**`verification_tokens`** (Auth.js) — PK(`identifier`,`token`), `expires`.

## 5.1b. User Profile & Preferences

**`user_profiles`** — PK/user: `user_id`(PK, FK users CASCADE), `display_name`, `bio`, `avatar_media_id`(FK media_assets, nullable), `locale`, `created_at`, `updated_at`.

**`user_preferences`** — `user_id`(PK, FK users CASCADE), `preferred_locale`, `measurement_system` enum(`metric`/`imperial`, default metric), `default_servings int`, `reduced_motion bool`, `settings jsonb` (tùy chọn phụ), `updated_at`.

**`user_dietary_preferences`** — `user_id`(FK users CASCADE), `taxonomy_term_id`(FK taxonomy_terms RESTRICT) — PK(`user_id`,`taxonomy_term_id`). (Trục `dietary_preference`.)

**`user_allergens`** — `user_id`(FK users CASCADE), `allergen_term_id`(FK taxonomy_terms RESTRICT) — PK(`user_id`,`allergen_term_id`). Dùng để cảnh báo/nhắc (không tự chặn nội dung).

---

## 5.2. Recipe

**`recipes`**
| Cột | Kiểu | Ràng buộc/Ghi chú |
| --- | --- | --- |
| id | uuid | PK |
| slug | text | **UNIQUE** (toàn hệ thống), ổn định |
| status | recipe_status enum | `draft`/`in_review`/`published`/`archived` (BR-13) |
| author_id | uuid | FK users RESTRICT — người chịu trách nhiệm |
| editor_id | uuid | FK users SET NULL — biên tập viên gần nhất |
| food_type_term_id | uuid | FK taxonomy_terms RESTRICT — 1 giá trị (trục food_type) |
| cuisine_term_id | uuid | FK taxonomy_terms RESTRICT — 1 giá trị (trục cuisine) |
| difficulty | difficulty enum | `easy`/`medium`/`hard` |
| prep_minutes | int | nullable, CHECK ≥ 0 |
| cook_minutes | int | nullable, CHECK ≥ 0 |
| total_minutes | int | nullable, CHECK ≥ 0 (suy ra nếu thiếu) |
| base_servings | numeric(6,2) | CHECK > 0 |
| verification_status | verification enum | `untested`/`tested`/`verified` — **không khẳng định đã thử nếu chưa** (BR-03) |
| default_locale | text | default `vi` |
| primary_image_id | uuid | FK media_assets SET NULL |
| published_at | timestamptz | nullable |
| archived_at | timestamptz | nullable |
| deleted_at | timestamptz | nullable (soft delete — hiếm dùng cho nội dung; ưu tiên archive) |
| created_at, updated_at | timestamptz | |

Index: `status`, `cuisine_term_id`, `food_type_term_id`, `(status, published_at desc)`, `total_minutes`, `difficulty`.

**`recipe_translations`** — `id`, `recipe_id`(FK recipes CASCADE), `locale`(`vi`/`en`), `title`, `summary`, `description`, `seo_title`, `seo_description`. UNIQUE(`recipe_id`,`locale`). *(Slug giữ ở `recipes.slug` cho kênh chính; slug theo locale là mở rộng sau.)*

**`recipe_steps`** — `id`, `recipe_id`(FK CASCADE), `step_no int` **≥1**, `sort_order int`. UNIQUE(`recipe_id`,`step_no`).

**`recipe_step_translations`** — `id`, `step_id`(FK recipe_steps CASCADE), `locale`, `instruction text`, `tip text` nullable. UNIQUE(`step_id`,`locale`).

**`recipe_step_timers`** — `id`, `step_id`(FK recipe_steps CASCADE), `label text`, `duration_seconds int` CHECK > 0, `temperature_c numeric(5,1)` nullable, `temperature_note text` nullable. *(Nhiệt độ/thời gian chỉ khi có dữ liệu — BR-05.)*

**`recipe_images`** — `id`, `recipe_id`(FK recipes CASCADE), `media_asset_id`(FK media_assets RESTRICT), `step_id`(FK recipe_steps SET NULL, nullable), `role` enum(`hero`/`step`/`gallery`), `alt_text text` nullable, `sort_order int`. *(Nội dung ảnh nằm ở `media_assets`, không lưu file trong DB.)*

**`recipe_equipment`** — `id`, `recipe_id`(FK CASCADE), `equipment_id`(FK equipment RESTRICT), `is_optional bool`, `note text` nullable. UNIQUE(`recipe_id`,`equipment_id`).

**`equipment`** — `id`, `slug` UNIQUE, `name`, `icon` nullable, `is_active bool`. + `equipment_translations`(`equipment_id`,`locale`,`name`) UNIQUE(`equipment_id`,`locale`).

**`recipe_taxonomy_terms`** — `recipe_id`(FK recipes CASCADE), `taxonomy_term_id`(FK taxonomy_terms RESTRICT) — PK(`recipe_id`,`taxonomy_term_id`). Áp dụng cho các trục **nhiều giá trị** (cooking_method, meal_type, dietary_preference, allergen… **trừ** food_type & cuisine đã là FK đơn trên `recipes`).

**`recipe_sources`** — `id`, `recipe_id`(FK recipes CASCADE), `source_id`(FK content_sources RESTRICT), `is_primary bool`, `note text`. UNIQUE(`recipe_id`,`source_id`).

**`recipe_versions`** (audit lịch sử nội dung) — `id`, `recipe_id`(FK recipes CASCADE), `version_no int`, `snapshot jsonb`, `editor_id`(FK users SET NULL), `change_summary text`, `created_at`. UNIQUE(`recipe_id`,`version_no`). *(JSONB phù hợp: chỉ để lưu/khôi phục, không truy vấn quan hệ.)*

**Trạng thái kiểm chứng công thức:** cột `recipes.verification_status` (`untested`/`tested`/`verified`) + bản ghi `content_review_records` cho lần xác minh.

---

## 5.3. Ingredient

**`ingredients`** — `id`, `slug` UNIQUE, `original_name text` nullable (tên gốc), `category_term_id`(FK taxonomy_terms, trục `ingredient_category`, nullable), `default_unit_id`(FK units SET NULL, nullable), `is_common bool`, `created_at`, `updated_at`.

**`ingredient_translations`** — `id`, `ingredient_id`(FK CASCADE), `locale`, `name text`, `notes text` nullable. UNIQUE(`ingredient_id`,`locale`). *(VN = locale `vi`; EN = `en`.)*

**`ingredient_aliases`** — `id`, `ingredient_id`(FK CASCADE), `alias text`, `locale` nullable, `kind` enum(`synonym`/`local`/`search`). UNIQUE(`ingredient_id`,`alias`,`locale`). *(Tên gọi địa phương = kind `local`; từ đồng nghĩa = `synonym`; hỗ trợ tìm kiếm = `search`.)*

**`ingredient_substitutions`** — `id`, `ingredient_id`(FK ingredients RESTRICT), `substitute_id`(FK ingredients RESTRICT), `quality` enum(`exact`/`good`/`approximate`), `ratio_numeric numeric(8,4)` nullable, `ratio_note text`, `note text`. CHECK(`ingredient_id` <> `substitute_id`). UNIQUE(`ingredient_id`,`substitute_id`).

**`ingredient_allergens`** — `ingredient_id`(FK RESTRICT), `allergen_term_id`(FK taxonomy_terms RESTRICT), `presence` enum(`contains`/`may_contain`/`free`). PK(`ingredient_id`,`allergen_term_id`).

**`ingredient_densities`** — `id`, `ingredient_id`(FK CASCADE), `volume_unit_id`(FK units RESTRICT), `grams_per_unit numeric(10,4)` CHECK > 0, `source text` nullable, `confidence` enum(`high`/`medium`/`low`). UNIQUE(`ingredient_id`,`volume_unit_id`). *(Dùng cho quy đổi volume→mass — chỉ khi có dữ liệu mật độ đáng tin, BR-06.)*

**`ingredient_units`** — `id`, `ingredient_id`(FK CASCADE), `unit_id`(FK units RESTRICT), `grams_per_unit numeric(10,4)` nullable (vd 1 quả trứng ≈ 50 g), `is_default bool`. UNIQUE(`ingredient_id`,`unit_id`).

---

## 5.4. Taxonomy (cấu trúc tổng quát cho các trục độc lập)

**`taxonomy_types`** — `id`, `code text` UNIQUE (`food_type`/`cuisine`/`country`/`region`/`ingredient_category`/`cooking_method`/`meal_type`/`dietary_preference`/`allergen`), `is_hierarchical bool`, `is_multi_select bool`, `is_required bool`, `is_active bool`, `sort_order int`.

**`taxonomy_terms`** — `id`, `taxonomy_type_id`(FK taxonomy_types RESTRICT), `parent_id`(FK taxonomy_terms SET NULL — quan hệ cha-con), `slug text`, `icon text` nullable, `is_active bool`, `sort_order int`. UNIQUE(`taxonomy_type_id`,`slug`).

**`taxonomy_term_translations`** — `id`, `term_id`(FK CASCADE), `locale`, `name`, `description`. UNIQUE(`term_id`,`locale`).

**`taxonomy_term_aliases`** — `id`, `term_id`(FK CASCADE), `alias text`, `locale` nullable. UNIQUE(`term_id`,`alias`,`locale`).

> **Khi nào bảng riêng vs taxonomy tổng quát?**
> - **Bảng riêng (dedicated):** cho **thực thể có quan hệ/ thuộc tính phong phú**: `ingredients`, `equipment`, `recipes`, `users`, `content_sources`.
> - **Taxonomy tổng quát:** cho **từ vựng phân loại** có cấu trúc giống nhau (slug, icon, thứ tự, cha-con, i18n, bật/tắt): food type, cuisine, country, region, ingredient category, cooking method, meal type, dietary preference, allergen.
> - **Lý do:** tránh 9 bảng gần như trùng nhau; vẫn giữ **7+ trục độc lập** vì mỗi trục là một `taxonomy_type` riêng (BR-04), dữ liệu hóa (BR-15). Mở rộng trục mới = thêm 1 dòng `taxonomy_types`, không đổi schema.

---

## 5.5. User Cookbook

**`favorites`** — `user_id`(FK users CASCADE), `recipe_id`(FK recipes CASCADE), `created_at`. PK(`user_id`,`recipe_id`).

**`collections`** — `id`, `user_id`(FK users CASCADE), `title`, `description`, `is_public bool` default false, `created_at`, `updated_at`, `deleted_at` nullable.

**`collection_recipes`** — `collection_id`(FK collections CASCADE), `recipe_id`(FK recipes CASCADE), `sort_order int`, `added_at`. PK(`collection_id`,`recipe_id`).

**`recipe_notes`** — `id`, `user_id`(FK users CASCADE), `recipe_id`(FK recipes CASCADE), `content text`, `rating smallint` nullable CHECK(1..5), `created_at`, `updated_at`. UNIQUE(`user_id`,`recipe_id`). *(Ghi chú/đánh giá riêng tư.)*

**`cooked_history`** — `id`, `user_id`(FK users CASCADE), `recipe_id`(FK recipes RESTRICT), `servings_made numeric(6,2)` nullable, `note text`, `cooked_at timestamptz`.

**`cooking_sessions`** — `id`, `user_id`(FK users CASCADE), `recipe_id`(FK recipes RESTRICT), `status` enum(`active`/`paused`/`completed`/`abandoned`), `servings numeric(6,2)` nullable, `started_at`, `finished_at` nullable.

**`cooking_progress`** — `id`, `session_id`(FK cooking_sessions CASCADE), `step_id`(FK recipe_steps RESTRICT), `is_completed bool` default false, `completed_at timestamptz` nullable. UNIQUE(`session_id`,`step_id`).

> **Data isolation:** mọi bảng §5.5 có `user_id`; truy vấn luôn kèm `user_id` từ session (xem [AUTHORIZATION_SECURITY.md](./AUTHORIZATION_SECURITY.md)).

---

## 5.6. Meal Planner & Shopping List

**`meal_plans`** — `id`, `user_id`(FK users CASCADE), `title`, `start_date date`, `end_date date` nullable, `created_at`, `updated_at`. CHECK(`end_date` IS NULL OR `end_date` >= `start_date`).

**`meal_plan_days`** — `id`, `meal_plan_id`(FK CASCADE), `date date`. UNIQUE(`meal_plan_id`,`date`).

**`meal_plan_items`** — `id`, `day_id`(FK meal_plan_days CASCADE), `meal_type` enum(`breakfast`/`lunch`/`dinner`/`snack`), `recipe_id`(FK recipes RESTRICT), `servings numeric(6,2)` CHECK > 0, `sort_order int`, `note text` nullable.

**`shopping_lists`** — `id`, `user_id`(FK users CASCADE), `title`, `source_meal_plan_id`(FK meal_plans SET NULL, nullable), `status` enum(`active`/`completed`), `created_at`, `updated_at`.

**`shopping_list_items`** — `id`, `list_id`(FK shopping_lists CASCADE), `ingredient_id`(FK ingredients SET NULL, nullable — cho mục thủ công), `display_name text` (fallback), `quantity_numeric numeric(10,3)` nullable, `unit_id`(FK units SET NULL), `group_label text` nullable, `is_checked bool` default false, `is_manual bool` default false, `note text`, `sort_order int`.

> **Quy tắc gộp (BR-06/07):** chỉ cộng khi **cùng chiều đơn vị** và quy đổi đáng tin; nếu không → giữ **dòng riêng** + `note`. Không tự chuyển volume↔mass thiếu mật độ.

---

## 5.7. Nutrition & Allergen

**`recipe_nutrition`** — `id`, `recipe_id`(FK recipes CASCADE), `basis` enum(`per_serving`/`per_100g`/`total`), `calories numeric(8,2)` nullable, `protein_g numeric(8,2)` nullable, `carbs_g numeric(8,2)` nullable, `fat_g numeric(8,2)` nullable, `fiber_g numeric(8,2)` nullable, `sugar_g numeric(8,2)` nullable, `sodium_mg numeric(8,2)` nullable, `data_source_type` enum(`measured`/`calculated`/`estimated`/`unknown`), `source_note text`, `created_at`. UNIQUE(`recipe_id`,`basis`).

> **Hiển thị:** `estimated`/`calculated` phải gắn nhãn "ước tính"; `unknown` ẩn khối — **không hiển thị số 0 giả** (BR-05, BR-14). Không tuyên bố chữa bệnh.

**`recipe_allergens`** — `recipe_id`(FK recipes CASCADE), `allergen_term_id`(FK taxonomy_terms RESTRICT), `source` enum(`derived`/`declared`), `computed_at timestamptz`. PK(`recipe_id`,`allergen_term_id`). *(Dẫn xuất từ `ingredient_allergens`; xem BR-09.)*

---

## 5.8. Content Source & Copyright

**`content_sources`** — `id`, `name text`, `author_or_org text` nullable, `url text` nullable, `accessed_at date` nullable, `usage_conditions text` nullable, `license text` nullable, `verified_status` enum(`unverified`/`verified`/`rejected`), `verified_by`(FK users SET NULL), `verified_at timestamptz` nullable, `copyright_note text`, `created_at`, `updated_at`.

**`source_attributions`** — `id`, `source_id`(FK content_sources CASCADE), `recipe_id`(FK recipes CASCADE, nullable), `attribution_text text`, `license_snapshot text`. UNIQUE(`source_id`,`recipe_id`).

**`content_review_records`** — `id`, `entity_type text`, `entity_id uuid`, `reviewer_id`(FK users SET NULL), `decision` enum(`approved`/`rejected`/`changes_requested`), `notes text`, `created_at`.

> *(Mã `recipe_source_links` trong prompt tương ứng `recipe_sources` ở §5.2 — gộp để tránh trùng chức năng.)*
> **Quy tắc:** không lưu/tái sử dụng hình ảnh/nội dung không được phép (PC-03); chặn publish nếu thiếu nguồn khi không phải nội dung gốc (BR-03).

---

## 5.9. CMS & Audit

**`content_reviews`** — `id`, `recipe_id`(FK recipes CASCADE), `reviewer_id`(FK users SET NULL), `action` enum(`submit`/`approve`/`request_changes`/`publish`/`archive`), `comment text`, `created_at`.

**`audit_logs`** — `id`, `actor_id`(FK users SET NULL), `action text`, `entity_type text`, `entity_id uuid` nullable, `before jsonb` nullable, `after jsonb` nullable, `ip inet` nullable, `user_agent text` nullable, `created_at`. Index(`entity_type`,`entity_id`), (`actor_id`,`created_at desc`).

> *(JSONB cho `before/after` phù hợp: chỉ để truy vết hiển thị, không truy vấn quan hệ.)*
> **Vai trò `moderator`:** **chưa chốt** (B-P01-01/O7). Schema **không** thêm quyền moderator; mọi kiểm duyệt hiện dùng `editor`/`admin`.

---

## 7. Định lượng & đơn vị nguyên liệu (chi tiết)

### 7.1. Bảng đơn vị

**`units`** — `id`, `code text` UNIQUE, `dimension` enum(`mass`/`volume`/`count`/`custom`), `is_base bool`, `sort_order int`.
**`unit_translations`** — `unit_id`(FK CASCADE), `locale`, `name`, `symbol`. UNIQUE(`unit_id`,`locale`).
**`unit_conversions`** — `from_unit_id`(FK units RESTRICT), `to_unit_id`(FK units RESTRICT), `factor numeric(18,10)` CHECK > 0. PK(`from_unit_id`,`to_unit_id`). *(Chỉ cùng `dimension`.)*

Đơn vị hỗ trợ (MVP): `g, kg, ml, l, tsp, tbsp, cup, piece, clove, slice, pinch, bunch` + đơn vị địa phương (vd `bát`, `muỗng canh` alias của tbsp khi phù hợp).

| Đơn vị | Dimension | Ghi chú |
| --- | --- | --- |
| g, kg | mass | base = g |
| ml, l | volume | base = ml |
| tsp, tbsp, cup | volume | hệ số chuẩn (US) — cấu hình được |
| piece, clove, slice | count | đếm |
| pinch, bunch | custom/count | không quy đổi tự động |

### 7.2. Biểu diễn định lượng trong `recipe_ingredients`

**`recipe_ingredients`** — `id`, `recipe_id`(FK recipes CASCADE), `ingredient_id`(FK ingredients RESTRICT, nullable), `display_name text` (fallback khi không có entity), `quantity_type` enum(`decimal`/`fraction`/`range`/`text`), `quantity_numeric numeric(10,3)` nullable, `quantity_numeric_max numeric(10,3)` nullable (cho `range`), `quantity_text text` nullable (vd "một nhúm", "để nếm"), `unit_id`(FK units SET NULL, nullable), `is_required bool` default true, `is_scalable bool` default true, `preparation_note text` nullable, `group_label text` nullable, `sort_order int`. *(Nguyên liệu thay thế lưu ở `recipe_ingredient_substitutes`.)*

**`recipe_ingredient_substitutes`** — `recipe_ingredient_id`(FK CASCADE), `substitute_ingredient_id`(FK ingredients RESTRICT), `note text`, `ratio_numeric numeric(8,4)` nullable. PK(`recipe_ingredient_id`,`substitute_ingredient_id`).

**Quy tắc biểu diễn:**
1. **Phân số & thập phân:** lưu giá trị số ở `quantity_numeric` (`0.5`); hiển thị phân số (`1/2`) qua lớp định dạng theo locale.
2. **"1/2 quả"** → `quantity_numeric=0.5`, `unit_id`=`piece`, `ingredient_id`=trứng.
3. **"2 tép"** → `quantity_numeric=2`, `unit_id`=`clove`.
4. **"một nhúm"** → `quantity_type=text`, `quantity_text='một nhúm'`, `is_scalable=false`.
5. **"để nếm"** → `quantity_type=text`, `is_scalable=false` (giữ nguyên khi đổi khẩu phần — BR-06).

### 7.3. Thuật toán quy đổi (mức thiết kế)

```
scalePortion(recipe_ingredient, factor):
  if recipe_ingredient.is_scalable == false: return giữ nguyên  # "để nếm", "một nhúm"
  if quantity_type == 'text': return giữ nguyên + ghi chú
  if quantity_type == 'range':
      return range(qmin*factor, qmax*factor), giữ nguyên unit
  # decimal/fraction:
  q_new = quantity_numeric * factor
  return (q_new, unit_id giữ nguyên)          # KHÔNG tự đổi đơn vị

convertUnit(q, fromUnit, toUnit, ingredient?):
  if fromUnit.dimension == toUnit.dimension:   # cùng chiều
      return q * factor(from->to)              # qua unit_conversions; an toàn
  if fromUnit.dimension=='volume' and toUnit.dimension=='mass':
      density = ingredient_densities[ingredient][fromUnit]   # phải có, độ tin cậy cao
      if density is null or confidence == 'low': return KHÔNG QUY ĐỔI + giữ đơn vị gốc
      return q * density.grams_per_unit
  else:
      return KHÔNG QUY ĐỔI (giữ đơn vị gốc + ghi chú)   # BR-07
```

**Nguyên tắc bắt buộc:** (1) chỉ đổi giữa đơn vị cùng loại khi có hệ số đáng tin; (2) volume→mass chỉ khi có **mật độ theo nguyên liệu**; (3) **không suy đoán mật độ**; (4) điều chỉnh khẩu phần **giữ đơn vị gốc**; (5) hỗ trợ phân số/thập phân; (6) nguyên liệu không tính tự động → giữ nguyên + `is_scalable=false`.

---

## 6. Quy tắc Database (ràng buộc & hành vi)

| Hạng mục | Quy tắc |
| --- | --- |
| **Primary key** | `uuid` (gen_random_uuid); bảng join dùng PK tổ hợp. |
| **Foreign key** | Mọi quan hệ có FK; index cột FK dùng để join/lọc. |
| **Unique** | `recipes.slug`, `ingredients.slug`, `taxonomy_terms(type,slug)`, `*(_id,locale)`, `(user_id,recipe_id)`… |
| **Check** | `base_servings>0`, `total_minutes>=0`, `duration_seconds>0`, `rating 1..5`, `end_date>=start_date`, `quantity_numeric>=0`. |
| **Composite index** | `(status,published_at desc)`, `(recipe_id,step_no)`, `(user_id,created_at desc)`, category/term lookups. |
| **Delete behavior** | Mặc định **RESTRICT**. **CASCADE** chỉ cho dữ liệu **con thuộc sở hữu**: `recipe_steps`, `recipe_translations`, `recipe_images`, `favorites`, `collection_recipes`, `cooking_progress`, profile/preferences. **Xóa tài khoản** = purge dữ liệu cá nhân (CASCADE có kiểm soát); nội dung do editor tạo không bị xóa theo user (FK `SET NULL`). |
| **Soft delete** | `deleted_at` cho `collections` và (hiếm) `recipes`; nội dung ưu tiên `status='archived'`. |
| **Transaction boundary** | Ranh giới = **một use-case** (vd tạo công thức + steps + ingredients + taxonomy: 1 transaction). Publish = transaction (validate → đổi status → tạo version → audit). |
| **Referential integrity** | **Không** cascade xóa taxonomy/nguyên liệu đang được dùng → **RESTRICT** + quy trình archive/deactivate (xem dưới). |
| **Timestamp/Timezone** | UTC (`timestamptz`); hiển thị theo timezone người dùng. |
| **Slug uniqueness** | Duy nhất; đổi slug → giữ bản ghi `recipe_slug_redirects` (bảng nhỏ, xem dưới) để không hỏng liên kết cũ. |
| **Data validation** | Kiểm tra ở Application (Zod) **và** ràng buộc ở DB (NOT NULL, CHECK, FK, UNIQUE). |

**Bảng hỗ trợ:** `recipe_slug_redirects`(`id`, `recipe_id`(FK CASCADE), `old_slug text` UNIQUE, `created_at`) — phục vụ BR-12 (liên kết cũ).

**Không dùng cascade bừa bãi:** cấm `ON DELETE CASCADE` từ taxonomy/ingredient/user(editor) sang `recipes`. Xóa một taxonomy term đang dùng → **chặn** (RESTRICT) và yêu cầu **archive/deactivate** (`is_active=false`); công thức `published` **không** mất dữ liệu quan trọng (yêu cầu §6 prompt).

**Không lạm dụng JSONB:** JSONB chỉ cho `audit_logs.before/after`, `recipe_versions.snapshot`, `user_preferences.settings`. Mọi dữ liệu cần truy vấn/ràng buộc (nguyên liệu, taxonomy, bước…) là **quan hệ thật**.

---

## 8. Kiểm tra độ phủ dữ liệu (tự nghiệm thu P02)

| Dữ liệu nghiệp vụ | Bảng lưu trữ | ✔ |
| --- | --- | --- |
| Tài khoản/phiên/vai trò | users, accounts, sessions, verification_tokens | ✔ |
| Hồ sơ & tùy chọn người dùng | user_profiles, user_preferences, user_dietary_preferences, user_allergens | ✔ |
| Công thức + dịch + bước + ảnh + version | recipes, recipe_translations, recipe_steps(_translations), recipe_step_timers, recipe_images, recipe_versions | ✔ |
| Nguyên liệu + alias + thay thế + mật độ | ingredients, ingredient_translations, ingredient_aliases, ingredient_substitutions, ingredient_densities, ingredient_units | ✔ |
| 7 trục phân loại | taxonomy_types, taxonomy_terms(_translations/_aliases) | ✔ |
| Yêu thích/bộ sưu tập/ghi chú/lịch sử | favorites, collections, collection_recipes, recipe_notes, cooked_history | ✔ |
| Phiên nấu & tiến độ | cooking_sessions, cooking_progress | ✔ |
| Meal plan & shopping list | meal_plans, meal_plan_days, meal_plan_items, shopping_lists, shopping_list_items | ✔ |
| Dinh dưỡng & dị ứng | recipe_nutrition, recipe_allergens, ingredient_allergens | ✔ |
| Nguồn & bản quyền | content_sources, recipe_sources, source_attributions, content_review_records | ✔ |
| CMS & audit | content_reviews, audit_logs, recipe_versions | ✔ |
| Media | media_assets | ✔ |
| Đơn vị & quy đổi | units, unit_translations, unit_conversions | ✔ |
