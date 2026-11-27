# P02 — ENTITY RELATIONSHIP DIAGRAM (ERD): WALE COOKING

> ERD Mermaid ở mức thiết kế. Để dễ đọc và đảm bảo syntax hợp lệ, ERD được **chia theo miền** (không phải một sơ đồ khổng lồ).
> Định nghĩa cột/ràng buộc đầy đủ: [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md). Ký hiệu Mermaid: `||` một, `o{` nhiều, `o|` không-hoặc-một.

## 1. Identity, Access & User Profile

```mermaid
erDiagram
  USERS ||--o{ ACCOUNTS : "đăng nhập qua"
  USERS ||--o{ SESSIONS : "có phiên"
  USERS ||--|| USER_PROFILES : "hồ sơ"
  USERS ||--|| USER_PREFERENCES : "tùy chọn"
  USERS ||--o{ USER_DIETARY_PREFERENCES : "chế độ ăn"
  USERS ||--o{ USER_ALLERGENS : "dị ứng"
  TAXONOMY_TERMS ||--o{ USER_DIETARY_PREFERENCES : "gắn"
  TAXONOMY_TERMS ||--o{ USER_ALLERGENS : "gắn"

  USERS {
    uuid id PK
    citext email UK
    app_role role
    text preferred_locale
    timestamptz created_at
  }
  ACCOUNTS {
    uuid id PK
    uuid user_id FK
    text provider
    text provider_account_id
  }
  SESSIONS {
    uuid id PK
    uuid user_id FK
    text session_token UK
    timestamptz expires
  }
  USER_PROFILES {
    uuid user_id PK
    text display_name
    uuid avatar_media_id FK
  }
  USER_PREFERENCES {
    uuid user_id PK
    text measurement_system
    int default_servings
  }
  USER_DIETARY_PREFERENCES {
    uuid user_id FK
    uuid taxonomy_term_id FK
  }
  USER_ALLERGENS {
    uuid user_id FK
    uuid allergen_term_id FK
  }
  TAXONOMY_TERMS {
    uuid id PK
    uuid taxonomy_type_id FK
    text slug
  }
```

> `verification_tokens` (Auth.js) không vẽ để gọn; xem [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md) §5.1.

## 2. Taxonomy & Ingredient

```mermaid
erDiagram
  TAXONOMY_TYPES ||--o{ TAXONOMY_TERMS : "gồm"
  TAXONOMY_TERMS ||--o{ TAXONOMY_TERMS : "cha-con"
  TAXONOMY_TERMS ||--o{ TAXONOMY_TERM_TRANSLATIONS : "dịch"
  TAXONOMY_TERMS ||--o{ TAXONOMY_TERM_ALIASES : "bí danh"
  INGREDIENTS ||--o{ INGREDIENT_TRANSLATIONS : "dịch"
  INGREDIENTS ||--o{ INGREDIENT_ALIASES : "bí danh"
  INGREDIENTS ||--o{ INGREDIENT_SUBSTITUTIONS : "thay thế"
  INGREDIENTS ||--o{ INGREDIENT_ALLERGENS : "chứa"
  INGREDIENTS ||--o{ INGREDIENT_DENSITIES : "mật độ"
  INGREDIENTS ||--o{ INGREDIENT_UNITS : "đơn vị riêng"
  TAXONOMY_TERMS ||--o{ INGREDIENTS : "phân loại (category)"
  TAXONOMY_TERMS ||--o{ INGREDIENT_ALLERGENS : "allergen term"
  UNITS ||--o{ INGREDIENT_DENSITIES : "đơn vị thể tích"
  UNITS ||--o{ INGREDIENT_UNITS : "đơn vị"

  TAXONOMY_TYPES {
    uuid id PK
    text code UK
    bool is_hierarchical
    bool is_multi_select
  }
  TAXONOMY_TERMS {
    uuid id PK
    uuid taxonomy_type_id FK
    uuid parent_id FK
    text slug
    text icon
    bool is_active
  }
  INGREDIENTS {
    uuid id PK
    text slug UK
    text original_name
    uuid category_term_id FK
    uuid default_unit_id FK
  }
  INGREDIENT_ALIASES {
    uuid id PK
    uuid ingredient_id FK
    text alias
    text kind
  }
  INGREDIENT_SUBSTITUTIONS {
    uuid id PK
    uuid ingredient_id FK
    uuid substitute_id FK
    numeric ratio_numeric
  }
  INGREDIENT_ALLERGENS {
    uuid ingredient_id FK
    uuid allergen_term_id FK
    text presence
  }
  INGREDIENT_DENSITIES {
    uuid id PK
    uuid ingredient_id FK
    uuid volume_unit_id FK
    numeric grams_per_unit
  }
  INGREDIENT_UNITS {
    uuid id PK
    uuid ingredient_id FK
    uuid unit_id FK
    numeric grams_per_unit
  }
  UNITS {
    uuid id PK
    text code UK
    text dimension
  }
```

## 3. Recipe core

```mermaid
erDiagram
  USERS ||--o{ RECIPES : "tác giả/biên tập"
  TAXONOMY_TERMS ||--o{ RECIPES : "food_type"
  TAXONOMY_TERMS ||--o{ RECIPES : "cuisine"
  RECIPES ||--o{ RECIPE_TRANSLATIONS : "dịch"
  RECIPES ||--o{ RECIPE_STEPS : "bước"
  RECIPE_STEPS ||--o{ RECIPE_STEP_TRANSLATIONS : "dịch"
  RECIPE_STEPS ||--o{ RECIPE_STEP_TIMERS : "hẹn giờ"
  RECIPES ||--o{ RECIPE_IMAGES : "ảnh"
  RECIPES ||--o{ RECIPE_INGREDIENTS : "nguyên liệu"
  RECIPES ||--o{ RECIPE_EQUIPMENT : "dụng cụ"
  RECIPES ||--o{ RECIPE_TAXONOMY_TERMS : "phân loại nhiều giá trị"
  RECIPES ||--o{ RECIPE_SOURCES : "nguồn"
  RECIPES ||--o{ RECIPE_NUTRITION : "dinh dưỡng"
  RECIPES ||--o{ RECIPE_ALLERGENS : "dị ứng"
  RECIPES ||--o{ RECIPE_VERSIONS : "lịch sử"
  RECIPES ||--o{ RECIPE_SLUG_REDIRECTS : "redirect slug"
  INGREDIENTS ||--o{ RECIPE_INGREDIENTS : "được dùng"
  INGREDIENTS ||--o{ RECIPE_INGREDIENT_SUBSTITUTES : "thay thế trong món"
  RECIPE_INGREDIENTS ||--o{ RECIPE_INGREDIENT_SUBSTITUTES : "thay thế"
  UNITS ||--o{ RECIPE_INGREDIENTS : "đơn vị"
  EQUIPMENT ||--o{ RECIPE_EQUIPMENT : "dụng cụ"
  TAXONOMY_TERMS ||--o{ RECIPE_TAXONOMY_TERMS : "term"
  TAXONOMY_TERMS ||--o{ RECIPE_ALLERGENS : "allergen term"
  MEDIA_ASSETS ||--o{ RECIPE_IMAGES : "media"
  CONTENT_SOURCES ||--o{ RECIPE_SOURCES : "nguồn"

  RECIPES {
    uuid id PK
    text slug UK
    recipe_status status
    uuid author_id FK
    uuid food_type_term_id FK
    uuid cuisine_term_id FK
    difficulty difficulty
    numeric base_servings
    int total_minutes
    verification verification_status
    timestamptz published_at
  }
  RECIPE_TRANSLATIONS {
    uuid id PK
    uuid recipe_id FK
    text locale
    text title
    text summary
  }
  RECIPE_STEPS {
    uuid id PK
    uuid recipe_id FK
    int step_no
  }
  RECIPE_STEP_TIMERS {
    uuid id PK
    uuid step_id FK
    int duration_seconds
    numeric temperature_c
  }
  RECIPE_INGREDIENTS {
    uuid id PK
    uuid recipe_id FK
    uuid ingredient_id FK
    text quantity_type
    numeric quantity_numeric
    uuid unit_id FK
    bool is_required
    bool is_scalable
  }
  RECIPE_NUTRITION {
    uuid id PK
    uuid recipe_id FK
    text basis
    numeric calories
    text data_source_type
  }
  RECIPE_VERSIONS {
    uuid id PK
    uuid recipe_id FK
    int version_no
    jsonb snapshot
  }
```

## 4. User Cookbook (favorites, collections, notes, cooking)

```mermaid
erDiagram
  USERS ||--o{ FAVORITES : "yêu thích"
  RECIPES ||--o{ FAVORITES : "được yêu thích"
  USERS ||--o{ COLLECTIONS : "sở hữu"
  COLLECTIONS ||--o{ COLLECTION_RECIPES : "gồm"
  RECIPES ||--o{ COLLECTION_RECIPES : "trong"
  USERS ||--o{ RECIPE_NOTES : "ghi chú"
  RECIPES ||--o{ RECIPE_NOTES : "về"
  USERS ||--o{ COOKED_HISTORY : "đã nấu"
  RECIPES ||--o{ COOKED_HISTORY : "của"
  USERS ||--o{ COOKING_SESSIONS : "phiên nấu"
  RECIPES ||--o{ COOKING_SESSIONS : "của"
  COOKING_SESSIONS ||--o{ COOKING_PROGRESS : "tiến độ"
  RECIPE_STEPS ||--o{ COOKING_PROGRESS : "bước"

  FAVORITES {
    uuid user_id FK
    uuid recipe_id FK
    timestamptz created_at
  }
  COLLECTIONS {
    uuid id PK
    uuid user_id FK
    text title
    bool is_public
  }
  COLLECTION_RECIPES {
    uuid collection_id FK
    uuid recipe_id FK
    int sort_order
  }
  RECIPE_NOTES {
    uuid id PK
    uuid user_id FK
    uuid recipe_id FK
    text content
    smallint rating
  }
  COOKED_HISTORY {
    uuid id PK
    uuid user_id FK
    uuid recipe_id FK
    timestamptz cooked_at
  }
  COOKING_SESSIONS {
    uuid id PK
    uuid user_id FK
    uuid recipe_id FK
    text status
    timestamptz started_at
  }
  COOKING_PROGRESS {
    uuid id PK
    uuid session_id FK
    uuid step_id FK
    bool is_completed
  }
```

## 5. Meal Planner & Shopping List

```mermaid
erDiagram
  USERS ||--o{ MEAL_PLANS : "lập"
  MEAL_PLANS ||--o{ MEAL_PLAN_DAYS : "gồm ngày"
  MEAL_PLAN_DAYS ||--o{ MEAL_PLAN_ITEMS : "gồm món"
  RECIPES ||--o{ MEAL_PLAN_ITEMS : "món"
  USERS ||--o{ SHOPPING_LISTS : "tạo"
  MEAL_PLANS ||--o{ SHOPPING_LISTS : "nguồn (tùy chọn)"
  SHOPPING_LISTS ||--o{ SHOPPING_LIST_ITEMS : "gồm"
  INGREDIENTS ||--o{ SHOPPING_LIST_ITEMS : "nguyên liệu"
  UNITS ||--o{ SHOPPING_LIST_ITEMS : "đơn vị"

  MEAL_PLANS {
    uuid id PK
    uuid user_id FK
    date start_date
    date end_date
  }
  MEAL_PLAN_DAYS {
    uuid id PK
    uuid meal_plan_id FK
    date date
  }
  MEAL_PLAN_ITEMS {
    uuid id PK
    uuid day_id FK
    text meal_type
    uuid recipe_id FK
    numeric servings
  }
  SHOPPING_LISTS {
    uuid id PK
    uuid user_id FK
    uuid source_meal_plan_id FK
    text status
  }
  SHOPPING_LIST_ITEMS {
    uuid id PK
    uuid list_id FK
    uuid ingredient_id FK
    text display_name
    numeric quantity_numeric
    uuid unit_id FK
    bool is_checked
    bool is_manual
  }
```

## 6. Content Source, Media & Audit

```mermaid
erDiagram
  CONTENT_SOURCES ||--o{ RECIPE_SOURCES : "liên kết"
  RECIPES ||--o{ RECIPE_SOURCES : "nguồn"
  CONTENT_SOURCES ||--o{ SOURCE_ATTRIBUTIONS : "ghi công"
  RECIPES ||--o{ SOURCE_ATTRIBUTIONS : "về"
  USERS ||--o{ CONTENT_SOURCES : "xác minh"
  USERS ||--o{ CONTENT_REVIEW_RECORDS : "duyệt"
  USERS ||--o{ CONTENT_REVIEWS : "duyệt công thức"
  RECIPES ||--o{ CONTENT_REVIEWS : "được duyệt"
  USERS ||--o{ AUDIT_LOGS : "hành động"
  RECIPES ||--o{ RECIPE_IMAGES : "ảnh"
  MEDIA_ASSETS ||--o{ RECIPE_IMAGES : "media"

  CONTENT_SOURCES {
    uuid id PK
    text name
    text author_or_org
    text url
    date accessed_at
    text license
    text verified_status
  }
  RECIPE_SOURCES {
    uuid id PK
    uuid recipe_id FK
    uuid source_id FK
    bool is_primary
  }
  SOURCE_ATTRIBUTIONS {
    uuid id PK
    uuid source_id FK
    uuid recipe_id FK
    text attribution_text
  }
  MEDIA_ASSETS {
    uuid id PK
    text storage_key
    text public_url
    text mime_type
    int size_bytes
    int width
    int height
    uuid created_by FK
  }
  RECIPE_IMAGES {
    uuid id PK
    uuid recipe_id FK
    uuid media_asset_id FK
    uuid step_id FK
    text role
    int sort_order
  }
  CONTENT_REVIEWS {
    uuid id PK
    uuid recipe_id FK
    uuid reviewer_id FK
    text action
    timestamptz created_at
  }
  CONTENT_REVIEW_RECORDS {
    uuid id PK
    text entity_type
    uuid entity_id
    uuid reviewer_id FK
    text decision
  }
  AUDIT_LOGS {
    uuid id PK
    uuid actor_id FK
    text action
    text entity_type
    uuid entity_id
    jsonb before
    jsonb after
    timestamptz created_at
  }
```

## 7. Ghi chú ERD

- **Trục phân loại độc lập:** `taxonomy_types` chứa 9 mã trục; mỗi trục là một nhóm `taxonomy_terms` riêng — **không gộp** (BR-04).
- **food_type / cuisine** là FK **đơn** trên `recipes`; các trục còn lại (cooking_method, meal_type, dietary_preference, allergen) qua `recipe_taxonomy_terms` (nhiều giá trị).
- **Media tách khỏi Recipe:** `media_assets` là thực thể độc lập, `recipe_images` là liên kết (M19).
- **Audit tách khỏi nghiệp vụ:** `audit_logs`, `content_reviews`, `content_review_records` là log truy vết (M18).
- Không có phụ thuộc vòng giữa các thực thể theo nghĩa module (xem [MODULE_DESIGN.md](./MODULE_DESIGN.md) §3).
