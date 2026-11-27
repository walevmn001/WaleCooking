-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "citext";

-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "unaccent";

-- CreateEnum
CREATE TYPE "app_role" AS ENUM ('user', 'editor', 'admin');

-- CreateEnum
CREATE TYPE "recipe_status" AS ENUM ('draft', 'in_review', 'published', 'archived');

-- CreateEnum
CREATE TYPE "difficulty" AS ENUM ('easy', 'medium', 'hard');

-- CreateEnum
CREATE TYPE "verification" AS ENUM ('untested', 'tested', 'verified');

-- CreateEnum
CREATE TYPE "measurement_system" AS ENUM ('metric', 'imperial');

-- CreateEnum
CREATE TYPE "unit_dimension" AS ENUM ('mass', 'volume', 'count', 'custom');

-- CreateEnum
CREATE TYPE "quantity_type" AS ENUM ('decimal', 'fraction', 'range', 'text');

-- CreateEnum
CREATE TYPE "ingredient_alias_kind" AS ENUM ('synonym', 'local', 'search');

-- CreateEnum
CREATE TYPE "substitution_quality" AS ENUM ('exact', 'good', 'approximate');

-- CreateEnum
CREATE TYPE "allergen_presence" AS ENUM ('contains', 'may_contain', 'free');

-- CreateEnum
CREATE TYPE "density_confidence" AS ENUM ('high', 'medium', 'low');

-- CreateEnum
CREATE TYPE "cooking_session_status" AS ENUM ('active', 'paused', 'completed', 'abandoned');

-- CreateEnum
CREATE TYPE "meal_type" AS ENUM ('breakfast', 'lunch', 'dinner', 'snack');

-- CreateEnum
CREATE TYPE "shopping_list_status" AS ENUM ('active', 'completed');

-- CreateEnum
CREATE TYPE "nutrition_basis" AS ENUM ('per_serving', 'per_100g', 'total');

-- CreateEnum
CREATE TYPE "nutrition_data_source_type" AS ENUM ('measured', 'calculated', 'estimated', 'unknown');

-- CreateEnum
CREATE TYPE "allergen_source" AS ENUM ('derived', 'declared');

-- CreateEnum
CREATE TYPE "source_verified_status" AS ENUM ('unverified', 'verified', 'rejected');

-- CreateEnum
CREATE TYPE "review_decision" AS ENUM ('approved', 'rejected', 'changes_requested');

-- CreateEnum
CREATE TYPE "content_review_action" AS ENUM ('submit', 'approve', 'request_changes', 'publish', 'archive');

-- CreateEnum
CREATE TYPE "media_status" AS ENUM ('active', 'archived');

-- CreateEnum
CREATE TYPE "recipe_image_role" AS ENUM ('hero', 'step', 'gallery');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT,
    "email" CITEXT,
    "email_verified" TIMESTAMPTZ(6),
    "image" TEXT,
    "role" "app_role" NOT NULL DEFAULT 'user',
    "preferred_locale" TEXT NOT NULL DEFAULT 'vi',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "accounts" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "provider_account_id" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "session_token" TEXT NOT NULL,
    "user_id" UUID NOT NULL,
    "expires" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification_tokens" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "verification_tokens_pkey" PRIMARY KEY ("identifier","token")
);

-- CreateTable
CREATE TABLE "user_profiles" (
    "user_id" UUID NOT NULL,
    "display_name" TEXT,
    "bio" TEXT,
    "avatar_media_id" UUID,
    "locale" TEXT NOT NULL DEFAULT 'vi',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "user_profiles_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "user_preferences" (
    "user_id" UUID NOT NULL,
    "preferred_locale" TEXT NOT NULL DEFAULT 'vi',
    "measurement_system" "measurement_system" NOT NULL DEFAULT 'metric',
    "default_servings" INTEGER,
    "reduced_motion" BOOLEAN NOT NULL DEFAULT false,
    "settings" JSONB,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "user_preferences_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "user_dietary_preferences" (
    "user_id" UUID NOT NULL,
    "taxonomy_term_id" UUID NOT NULL,

    CONSTRAINT "user_dietary_preferences_pkey" PRIMARY KEY ("user_id","taxonomy_term_id")
);

-- CreateTable
CREATE TABLE "user_allergens" (
    "user_id" UUID NOT NULL,
    "allergen_term_id" UUID NOT NULL,

    CONSTRAINT "user_allergens_pkey" PRIMARY KEY ("user_id","allergen_term_id")
);

-- CreateTable
CREATE TABLE "taxonomy_types" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "code" TEXT NOT NULL,
    "is_hierarchical" BOOLEAN NOT NULL DEFAULT false,
    "is_multi_select" BOOLEAN NOT NULL DEFAULT false,
    "is_required" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "taxonomy_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "taxonomy_terms" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "taxonomy_type_id" UUID NOT NULL,
    "parent_id" UUID,
    "slug" TEXT NOT NULL,
    "icon" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "taxonomy_terms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "taxonomy_term_translations" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "term_id" UUID NOT NULL,
    "locale" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "taxonomy_term_translations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "taxonomy_term_aliases" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "term_id" UUID NOT NULL,
    "alias" TEXT NOT NULL,
    "locale" TEXT,

    CONSTRAINT "taxonomy_term_aliases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "units" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "code" TEXT NOT NULL,
    "dimension" "unit_dimension" NOT NULL,
    "is_base" BOOLEAN NOT NULL DEFAULT false,
    "sort_order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "units_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "unit_translations" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "unit_id" UUID NOT NULL,
    "locale" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "symbol" TEXT,

    CONSTRAINT "unit_translations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "unit_conversions" (
    "from_unit_id" UUID NOT NULL,
    "to_unit_id" UUID NOT NULL,
    "factor" DECIMAL(18,10) NOT NULL,

    CONSTRAINT "unit_conversions_pkey" PRIMARY KEY ("from_unit_id","to_unit_id")
);

-- CreateTable
CREATE TABLE "ingredients" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "slug" TEXT NOT NULL,
    "original_name" TEXT,
    "category_term_id" UUID,
    "default_unit_id" UUID,
    "is_common" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "ingredients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ingredient_translations" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "ingredient_id" UUID NOT NULL,
    "locale" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "notes" TEXT,

    CONSTRAINT "ingredient_translations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ingredient_aliases" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "ingredient_id" UUID NOT NULL,
    "alias" TEXT NOT NULL,
    "locale" TEXT,
    "kind" "ingredient_alias_kind" NOT NULL,

    CONSTRAINT "ingredient_aliases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ingredient_substitutions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "ingredient_id" UUID NOT NULL,
    "substitute_id" UUID NOT NULL,
    "quality" "substitution_quality" NOT NULL,
    "ratio_numeric" DECIMAL(8,4),
    "ratio_note" TEXT,
    "note" TEXT,

    CONSTRAINT "ingredient_substitutions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ingredient_allergens" (
    "ingredient_id" UUID NOT NULL,
    "allergen_term_id" UUID NOT NULL,
    "presence" "allergen_presence" NOT NULL,

    CONSTRAINT "ingredient_allergens_pkey" PRIMARY KEY ("ingredient_id","allergen_term_id")
);

-- CreateTable
CREATE TABLE "ingredient_densities" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "ingredient_id" UUID NOT NULL,
    "volume_unit_id" UUID NOT NULL,
    "grams_per_unit" DECIMAL(10,4) NOT NULL,
    "source" TEXT,
    "confidence" "density_confidence" NOT NULL,

    CONSTRAINT "ingredient_densities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ingredient_units" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "ingredient_id" UUID NOT NULL,
    "unit_id" UUID NOT NULL,
    "grams_per_unit" DECIMAL(10,4),
    "is_default" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "ingredient_units_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "media_assets" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "storage_key" TEXT NOT NULL,
    "public_url" TEXT,
    "mime_type" TEXT NOT NULL,
    "size_bytes" INTEGER NOT NULL,
    "width" INTEGER,
    "height" INTEGER,
    "checksum" TEXT,
    "alt_text_default" TEXT,
    "status" "media_status" NOT NULL DEFAULT 'active',
    "created_by" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "media_assets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recipes" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "slug" TEXT NOT NULL,
    "status" "recipe_status" NOT NULL DEFAULT 'draft',
    "author_id" UUID NOT NULL,
    "editor_id" UUID,
    "food_type_term_id" UUID,
    "cuisine_term_id" UUID,
    "difficulty" "difficulty" NOT NULL DEFAULT 'easy',
    "prep_minutes" INTEGER,
    "cook_minutes" INTEGER,
    "total_minutes" INTEGER,
    "base_servings" DECIMAL(6,2) NOT NULL,
    "verification_status" "verification" NOT NULL DEFAULT 'untested',
    "default_locale" TEXT NOT NULL DEFAULT 'vi',
    "primary_image_id" UUID,
    "published_at" TIMESTAMPTZ(6),
    "archived_at" TIMESTAMPTZ(6),
    "deleted_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "recipes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recipe_translations" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "recipe_id" UUID NOT NULL,
    "locale" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT,
    "description" TEXT,
    "seo_title" TEXT,
    "seo_description" TEXT,

    CONSTRAINT "recipe_translations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recipe_steps" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "recipe_id" UUID NOT NULL,
    "step_no" INTEGER NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "recipe_steps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recipe_step_translations" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "step_id" UUID NOT NULL,
    "locale" TEXT NOT NULL,
    "instruction" TEXT NOT NULL,
    "tip" TEXT,

    CONSTRAINT "recipe_step_translations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recipe_step_timers" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "step_id" UUID NOT NULL,
    "label" TEXT NOT NULL,
    "duration_seconds" INTEGER NOT NULL,
    "temperature_c" DECIMAL(5,1),
    "temperature_note" TEXT,

    CONSTRAINT "recipe_step_timers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recipe_images" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "recipe_id" UUID NOT NULL,
    "media_asset_id" UUID NOT NULL,
    "step_id" UUID,
    "role" "recipe_image_role" NOT NULL DEFAULT 'gallery',
    "alt_text" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "recipe_images_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recipe_equipment" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "recipe_id" UUID NOT NULL,
    "equipment_id" UUID NOT NULL,
    "is_optional" BOOLEAN NOT NULL DEFAULT false,
    "note" TEXT,

    CONSTRAINT "recipe_equipment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "equipment" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "icon" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "equipment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "equipment_translations" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "equipment_id" UUID NOT NULL,
    "locale" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "equipment_translations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recipe_taxonomy_terms" (
    "recipe_id" UUID NOT NULL,
    "taxonomy_term_id" UUID NOT NULL,

    CONSTRAINT "recipe_taxonomy_terms_pkey" PRIMARY KEY ("recipe_id","taxonomy_term_id")
);

-- CreateTable
CREATE TABLE "recipe_sources" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "recipe_id" UUID NOT NULL,
    "source_id" UUID NOT NULL,
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "note" TEXT,

    CONSTRAINT "recipe_sources_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recipe_versions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "recipe_id" UUID NOT NULL,
    "version_no" INTEGER NOT NULL,
    "snapshot" JSONB NOT NULL,
    "editor_id" UUID,
    "change_summary" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "recipe_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recipe_slug_redirects" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "recipe_id" UUID NOT NULL,
    "old_slug" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "recipe_slug_redirects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recipe_ingredients" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "recipe_id" UUID NOT NULL,
    "ingredient_id" UUID,
    "display_name" TEXT NOT NULL,
    "quantity_type" "quantity_type" NOT NULL DEFAULT 'decimal',
    "quantity_numeric" DECIMAL(10,3),
    "quantity_numeric_max" DECIMAL(10,3),
    "quantity_text" TEXT,
    "unit_id" UUID,
    "is_required" BOOLEAN NOT NULL DEFAULT true,
    "is_scalable" BOOLEAN NOT NULL DEFAULT true,
    "preparation_note" TEXT,
    "group_label" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "recipe_ingredients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recipe_ingredient_substitutes" (
    "recipe_ingredient_id" UUID NOT NULL,
    "substitute_ingredient_id" UUID NOT NULL,
    "note" TEXT,
    "ratio_numeric" DECIMAL(8,4),

    CONSTRAINT "recipe_ingredient_substitutes_pkey" PRIMARY KEY ("recipe_ingredient_id","substitute_ingredient_id")
);

-- CreateTable
CREATE TABLE "recipe_nutrition" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "recipe_id" UUID NOT NULL,
    "basis" "nutrition_basis" NOT NULL,
    "calories" DECIMAL(8,2),
    "protein_g" DECIMAL(8,2),
    "carbs_g" DECIMAL(8,2),
    "fat_g" DECIMAL(8,2),
    "fiber_g" DECIMAL(8,2),
    "sugar_g" DECIMAL(8,2),
    "sodium_mg" DECIMAL(8,2),
    "data_source_type" "nutrition_data_source_type" NOT NULL DEFAULT 'unknown',
    "source_note" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "recipe_nutrition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recipe_allergens" (
    "recipe_id" UUID NOT NULL,
    "allergen_term_id" UUID NOT NULL,
    "source" "allergen_source" NOT NULL,
    "computed_at" TIMESTAMPTZ(6),

    CONSTRAINT "recipe_allergens_pkey" PRIMARY KEY ("recipe_id","allergen_term_id")
);

-- CreateTable
CREATE TABLE "favorites" (
    "user_id" UUID NOT NULL,
    "recipe_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "favorites_pkey" PRIMARY KEY ("user_id","recipe_id")
);

-- CreateTable
CREATE TABLE "collections" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "is_public" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "collections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "collection_recipes" (
    "collection_id" UUID NOT NULL,
    "recipe_id" UUID NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "added_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "added_by_id" UUID,

    CONSTRAINT "collection_recipes_pkey" PRIMARY KEY ("collection_id","recipe_id")
);

-- CreateTable
CREATE TABLE "recipe_notes" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "recipe_id" UUID NOT NULL,
    "content" TEXT NOT NULL,
    "rating" SMALLINT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "recipe_notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cooked_history" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "recipe_id" UUID NOT NULL,
    "servings_made" DECIMAL(6,2),
    "note" TEXT,
    "cooked_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cooked_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cooking_sessions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "recipe_id" UUID NOT NULL,
    "status" "cooking_session_status" NOT NULL DEFAULT 'active',
    "servings" DECIMAL(6,2),
    "started_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finished_at" TIMESTAMPTZ(6),

    CONSTRAINT "cooking_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cooking_progress" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "session_id" UUID NOT NULL,
    "step_id" UUID NOT NULL,
    "is_completed" BOOLEAN NOT NULL DEFAULT false,
    "completed_at" TIMESTAMPTZ(6),

    CONSTRAINT "cooking_progress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "meal_plans" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "start_date" DATE NOT NULL,
    "end_date" DATE,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "meal_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "meal_plan_days" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "meal_plan_id" UUID NOT NULL,
    "date" DATE NOT NULL,

    CONSTRAINT "meal_plan_days_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "meal_plan_items" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "day_id" UUID NOT NULL,
    "meal_type" "meal_type" NOT NULL,
    "recipe_id" UUID NOT NULL,
    "servings" DECIMAL(6,2) NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "note" TEXT,

    CONSTRAINT "meal_plan_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shopping_lists" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "source_meal_plan_id" UUID,
    "status" "shopping_list_status" NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "shopping_lists_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shopping_list_items" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "list_id" UUID NOT NULL,
    "ingredient_id" UUID,
    "display_name" TEXT NOT NULL,
    "quantity_numeric" DECIMAL(10,3),
    "unit_id" UUID,
    "group_label" TEXT,
    "is_checked" BOOLEAN NOT NULL DEFAULT false,
    "is_manual" BOOLEAN NOT NULL DEFAULT false,
    "note" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "shopping_list_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "content_sources" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "author_or_org" TEXT,
    "url" TEXT,
    "accessed_at" DATE,
    "usage_conditions" TEXT,
    "license" TEXT,
    "verified_status" "source_verified_status" NOT NULL DEFAULT 'unverified',
    "verified_by" UUID,
    "verified_at" TIMESTAMPTZ(6),
    "copyright_note" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "content_sources_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "source_attributions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "source_id" UUID NOT NULL,
    "recipe_id" UUID,
    "attribution_text" TEXT NOT NULL,
    "license_snapshot" TEXT,

    CONSTRAINT "source_attributions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "content_review_records" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "entity_type" TEXT NOT NULL,
    "entity_id" UUID NOT NULL,
    "reviewer_id" UUID,
    "decision" "review_decision" NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "content_review_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "content_reviews" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "recipe_id" UUID NOT NULL,
    "reviewer_id" UUID,
    "action" "content_review_action" NOT NULL,
    "comment" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "content_reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "actor_id" UUID,
    "action" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" UUID,
    "before" JSONB,
    "after" JSONB,
    "ip" TEXT,
    "user_agent" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "accounts_user_id_idx" ON "accounts"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "accounts_provider_provider_account_id_key" ON "accounts"("provider", "provider_account_id");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_session_token_key" ON "sessions"("session_token");

-- CreateIndex
CREATE INDEX "sessions_user_id_idx" ON "sessions"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "verification_tokens_token_key" ON "verification_tokens"("token");

-- CreateIndex
CREATE INDEX "user_dietary_preferences_taxonomy_term_id_idx" ON "user_dietary_preferences"("taxonomy_term_id");

-- CreateIndex
CREATE INDEX "user_allergens_allergen_term_id_idx" ON "user_allergens"("allergen_term_id");

-- CreateIndex
CREATE UNIQUE INDEX "taxonomy_types_code_key" ON "taxonomy_types"("code");

-- CreateIndex
CREATE INDEX "taxonomy_terms_taxonomy_type_id_idx" ON "taxonomy_terms"("taxonomy_type_id");

-- CreateIndex
CREATE INDEX "taxonomy_terms_parent_id_idx" ON "taxonomy_terms"("parent_id");

-- CreateIndex
CREATE UNIQUE INDEX "taxonomy_terms_taxonomy_type_id_slug_key" ON "taxonomy_terms"("taxonomy_type_id", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "taxonomy_term_translations_term_id_locale_key" ON "taxonomy_term_translations"("term_id", "locale");

-- CreateIndex
CREATE UNIQUE INDEX "taxonomy_term_aliases_term_id_alias_locale_key" ON "taxonomy_term_aliases"("term_id", "alias", "locale");

-- CreateIndex
CREATE UNIQUE INDEX "units_code_key" ON "units"("code");

-- CreateIndex
CREATE UNIQUE INDEX "unit_translations_unit_id_locale_key" ON "unit_translations"("unit_id", "locale");

-- CreateIndex
CREATE INDEX "unit_conversions_to_unit_id_idx" ON "unit_conversions"("to_unit_id");

-- CreateIndex
CREATE UNIQUE INDEX "ingredients_slug_key" ON "ingredients"("slug");

-- CreateIndex
CREATE INDEX "ingredients_category_term_id_idx" ON "ingredients"("category_term_id");

-- CreateIndex
CREATE INDEX "ingredients_default_unit_id_idx" ON "ingredients"("default_unit_id");

-- CreateIndex
CREATE UNIQUE INDEX "ingredient_translations_ingredient_id_locale_key" ON "ingredient_translations"("ingredient_id", "locale");

-- CreateIndex
CREATE UNIQUE INDEX "ingredient_aliases_ingredient_id_alias_locale_key" ON "ingredient_aliases"("ingredient_id", "alias", "locale");

-- CreateIndex
CREATE INDEX "ingredient_substitutions_substitute_id_idx" ON "ingredient_substitutions"("substitute_id");

-- CreateIndex
CREATE UNIQUE INDEX "ingredient_substitutions_ingredient_id_substitute_id_key" ON "ingredient_substitutions"("ingredient_id", "substitute_id");

-- CreateIndex
CREATE INDEX "ingredient_allergens_allergen_term_id_idx" ON "ingredient_allergens"("allergen_term_id");

-- CreateIndex
CREATE INDEX "ingredient_densities_volume_unit_id_idx" ON "ingredient_densities"("volume_unit_id");

-- CreateIndex
CREATE UNIQUE INDEX "ingredient_densities_ingredient_id_volume_unit_id_key" ON "ingredient_densities"("ingredient_id", "volume_unit_id");

-- CreateIndex
CREATE INDEX "ingredient_units_unit_id_idx" ON "ingredient_units"("unit_id");

-- CreateIndex
CREATE UNIQUE INDEX "ingredient_units_ingredient_id_unit_id_key" ON "ingredient_units"("ingredient_id", "unit_id");

-- CreateIndex
CREATE UNIQUE INDEX "media_assets_storage_key_key" ON "media_assets"("storage_key");

-- CreateIndex
CREATE INDEX "media_assets_created_by_idx" ON "media_assets"("created_by");

-- CreateIndex
CREATE UNIQUE INDEX "recipes_slug_key" ON "recipes"("slug");

-- CreateIndex
CREATE INDEX "recipes_status_idx" ON "recipes"("status");

-- CreateIndex
CREATE INDEX "recipes_cuisine_term_id_idx" ON "recipes"("cuisine_term_id");

-- CreateIndex
CREATE INDEX "recipes_food_type_term_id_idx" ON "recipes"("food_type_term_id");

-- CreateIndex
CREATE INDEX "recipes_status_published_at_idx" ON "recipes"("status", "published_at" DESC);

-- CreateIndex
CREATE INDEX "recipes_total_minutes_idx" ON "recipes"("total_minutes");

-- CreateIndex
CREATE INDEX "recipes_difficulty_idx" ON "recipes"("difficulty");

-- CreateIndex
CREATE INDEX "recipes_author_id_idx" ON "recipes"("author_id");

-- CreateIndex
CREATE INDEX "recipes_editor_id_idx" ON "recipes"("editor_id");

-- CreateIndex
CREATE INDEX "recipes_primary_image_id_idx" ON "recipes"("primary_image_id");

-- CreateIndex
CREATE UNIQUE INDEX "recipe_translations_recipe_id_locale_key" ON "recipe_translations"("recipe_id", "locale");

-- CreateIndex
CREATE INDEX "recipe_steps_recipe_id_sort_order_idx" ON "recipe_steps"("recipe_id", "sort_order");

-- CreateIndex
CREATE UNIQUE INDEX "recipe_steps_recipe_id_step_no_key" ON "recipe_steps"("recipe_id", "step_no");

-- CreateIndex
CREATE UNIQUE INDEX "recipe_step_translations_step_id_locale_key" ON "recipe_step_translations"("step_id", "locale");

-- CreateIndex
CREATE INDEX "recipe_step_timers_step_id_idx" ON "recipe_step_timers"("step_id");

-- CreateIndex
CREATE INDEX "recipe_images_recipe_id_idx" ON "recipe_images"("recipe_id");

-- CreateIndex
CREATE INDEX "recipe_images_media_asset_id_idx" ON "recipe_images"("media_asset_id");

-- CreateIndex
CREATE INDEX "recipe_images_step_id_idx" ON "recipe_images"("step_id");

-- CreateIndex
CREATE INDEX "recipe_equipment_equipment_id_idx" ON "recipe_equipment"("equipment_id");

-- CreateIndex
CREATE UNIQUE INDEX "recipe_equipment_recipe_id_equipment_id_key" ON "recipe_equipment"("recipe_id", "equipment_id");

-- CreateIndex
CREATE UNIQUE INDEX "equipment_slug_key" ON "equipment"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "equipment_translations_equipment_id_locale_key" ON "equipment_translations"("equipment_id", "locale");

-- CreateIndex
CREATE INDEX "recipe_taxonomy_terms_taxonomy_term_id_idx" ON "recipe_taxonomy_terms"("taxonomy_term_id");

-- CreateIndex
CREATE INDEX "recipe_sources_source_id_idx" ON "recipe_sources"("source_id");

-- CreateIndex
CREATE UNIQUE INDEX "recipe_sources_recipe_id_source_id_key" ON "recipe_sources"("recipe_id", "source_id");

-- CreateIndex
CREATE INDEX "recipe_versions_editor_id_idx" ON "recipe_versions"("editor_id");

-- CreateIndex
CREATE UNIQUE INDEX "recipe_versions_recipe_id_version_no_key" ON "recipe_versions"("recipe_id", "version_no");

-- CreateIndex
CREATE UNIQUE INDEX "recipe_slug_redirects_old_slug_key" ON "recipe_slug_redirects"("old_slug");

-- CreateIndex
CREATE INDEX "recipe_slug_redirects_recipe_id_idx" ON "recipe_slug_redirects"("recipe_id");

-- CreateIndex
CREATE INDEX "recipe_ingredients_recipe_id_sort_order_idx" ON "recipe_ingredients"("recipe_id", "sort_order");

-- CreateIndex
CREATE INDEX "recipe_ingredients_ingredient_id_idx" ON "recipe_ingredients"("ingredient_id");

-- CreateIndex
CREATE INDEX "recipe_ingredients_unit_id_idx" ON "recipe_ingredients"("unit_id");

-- CreateIndex
CREATE INDEX "recipe_ingredient_substitutes_substitute_ingredient_id_idx" ON "recipe_ingredient_substitutes"("substitute_ingredient_id");

-- CreateIndex
CREATE UNIQUE INDEX "recipe_nutrition_recipe_id_basis_key" ON "recipe_nutrition"("recipe_id", "basis");

-- CreateIndex
CREATE INDEX "recipe_allergens_allergen_term_id_idx" ON "recipe_allergens"("allergen_term_id");

-- CreateIndex
CREATE INDEX "favorites_recipe_id_idx" ON "favorites"("recipe_id");

-- CreateIndex
CREATE INDEX "collections_user_id_idx" ON "collections"("user_id");

-- CreateIndex
CREATE INDEX "collection_recipes_recipe_id_idx" ON "collection_recipes"("recipe_id");

-- CreateIndex
CREATE INDEX "collection_recipes_added_by_id_idx" ON "collection_recipes"("added_by_id");

-- CreateIndex
CREATE INDEX "recipe_notes_recipe_id_idx" ON "recipe_notes"("recipe_id");

-- CreateIndex
CREATE UNIQUE INDEX "recipe_notes_user_id_recipe_id_key" ON "recipe_notes"("user_id", "recipe_id");

-- CreateIndex
CREATE INDEX "cooked_history_user_id_idx" ON "cooked_history"("user_id");

-- CreateIndex
CREATE INDEX "cooked_history_recipe_id_idx" ON "cooked_history"("recipe_id");

-- CreateIndex
CREATE INDEX "cooking_sessions_user_id_idx" ON "cooking_sessions"("user_id");

-- CreateIndex
CREATE INDEX "cooking_sessions_recipe_id_idx" ON "cooking_sessions"("recipe_id");

-- CreateIndex
CREATE INDEX "cooking_progress_step_id_idx" ON "cooking_progress"("step_id");

-- CreateIndex
CREATE UNIQUE INDEX "cooking_progress_session_id_step_id_key" ON "cooking_progress"("session_id", "step_id");

-- CreateIndex
CREATE INDEX "meal_plans_user_id_idx" ON "meal_plans"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "meal_plan_days_meal_plan_id_date_key" ON "meal_plan_days"("meal_plan_id", "date");

-- CreateIndex
CREATE INDEX "meal_plan_items_day_id_idx" ON "meal_plan_items"("day_id");

-- CreateIndex
CREATE INDEX "meal_plan_items_recipe_id_idx" ON "meal_plan_items"("recipe_id");

-- CreateIndex
CREATE INDEX "shopping_lists_user_id_idx" ON "shopping_lists"("user_id");

-- CreateIndex
CREATE INDEX "shopping_lists_source_meal_plan_id_idx" ON "shopping_lists"("source_meal_plan_id");

-- CreateIndex
CREATE INDEX "shopping_list_items_list_id_idx" ON "shopping_list_items"("list_id");

-- CreateIndex
CREATE INDEX "shopping_list_items_ingredient_id_idx" ON "shopping_list_items"("ingredient_id");

-- CreateIndex
CREATE INDEX "shopping_list_items_unit_id_idx" ON "shopping_list_items"("unit_id");

-- CreateIndex
CREATE INDEX "content_sources_verified_by_idx" ON "content_sources"("verified_by");

-- CreateIndex
CREATE INDEX "source_attributions_recipe_id_idx" ON "source_attributions"("recipe_id");

-- CreateIndex
CREATE UNIQUE INDEX "source_attributions_source_id_recipe_id_key" ON "source_attributions"("source_id", "recipe_id");

-- CreateIndex
CREATE INDEX "content_review_records_entity_type_entity_id_idx" ON "content_review_records"("entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "content_review_records_reviewer_id_idx" ON "content_review_records"("reviewer_id");

-- CreateIndex
CREATE INDEX "content_reviews_recipe_id_idx" ON "content_reviews"("recipe_id");

-- CreateIndex
CREATE INDEX "content_reviews_reviewer_id_idx" ON "content_reviews"("reviewer_id");

-- CreateIndex
CREATE INDEX "audit_logs_entity_type_entity_id_idx" ON "audit_logs"("entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "audit_logs_actor_id_created_at_idx" ON "audit_logs"("actor_id", "created_at" DESC);

-- AddForeignKey
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_profiles" ADD CONSTRAINT "user_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_profiles" ADD CONSTRAINT "user_profiles_avatar_media_id_fkey" FOREIGN KEY ("avatar_media_id") REFERENCES "media_assets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_preferences" ADD CONSTRAINT "user_preferences_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_dietary_preferences" ADD CONSTRAINT "user_dietary_preferences_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_dietary_preferences" ADD CONSTRAINT "user_dietary_preferences_taxonomy_term_id_fkey" FOREIGN KEY ("taxonomy_term_id") REFERENCES "taxonomy_terms"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_allergens" ADD CONSTRAINT "user_allergens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_allergens" ADD CONSTRAINT "user_allergens_allergen_term_id_fkey" FOREIGN KEY ("allergen_term_id") REFERENCES "taxonomy_terms"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "taxonomy_terms" ADD CONSTRAINT "taxonomy_terms_taxonomy_type_id_fkey" FOREIGN KEY ("taxonomy_type_id") REFERENCES "taxonomy_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "taxonomy_terms" ADD CONSTRAINT "taxonomy_terms_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "taxonomy_terms"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "taxonomy_term_translations" ADD CONSTRAINT "taxonomy_term_translations_term_id_fkey" FOREIGN KEY ("term_id") REFERENCES "taxonomy_terms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "taxonomy_term_aliases" ADD CONSTRAINT "taxonomy_term_aliases_term_id_fkey" FOREIGN KEY ("term_id") REFERENCES "taxonomy_terms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "unit_translations" ADD CONSTRAINT "unit_translations_unit_id_fkey" FOREIGN KEY ("unit_id") REFERENCES "units"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "unit_conversions" ADD CONSTRAINT "unit_conversions_from_unit_id_fkey" FOREIGN KEY ("from_unit_id") REFERENCES "units"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "unit_conversions" ADD CONSTRAINT "unit_conversions_to_unit_id_fkey" FOREIGN KEY ("to_unit_id") REFERENCES "units"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ingredients" ADD CONSTRAINT "ingredients_category_term_id_fkey" FOREIGN KEY ("category_term_id") REFERENCES "taxonomy_terms"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ingredients" ADD CONSTRAINT "ingredients_default_unit_id_fkey" FOREIGN KEY ("default_unit_id") REFERENCES "units"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ingredient_translations" ADD CONSTRAINT "ingredient_translations_ingredient_id_fkey" FOREIGN KEY ("ingredient_id") REFERENCES "ingredients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ingredient_aliases" ADD CONSTRAINT "ingredient_aliases_ingredient_id_fkey" FOREIGN KEY ("ingredient_id") REFERENCES "ingredients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ingredient_substitutions" ADD CONSTRAINT "ingredient_substitutions_ingredient_id_fkey" FOREIGN KEY ("ingredient_id") REFERENCES "ingredients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ingredient_substitutions" ADD CONSTRAINT "ingredient_substitutions_substitute_id_fkey" FOREIGN KEY ("substitute_id") REFERENCES "ingredients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ingredient_allergens" ADD CONSTRAINT "ingredient_allergens_ingredient_id_fkey" FOREIGN KEY ("ingredient_id") REFERENCES "ingredients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ingredient_allergens" ADD CONSTRAINT "ingredient_allergens_allergen_term_id_fkey" FOREIGN KEY ("allergen_term_id") REFERENCES "taxonomy_terms"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ingredient_densities" ADD CONSTRAINT "ingredient_densities_ingredient_id_fkey" FOREIGN KEY ("ingredient_id") REFERENCES "ingredients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ingredient_densities" ADD CONSTRAINT "ingredient_densities_volume_unit_id_fkey" FOREIGN KEY ("volume_unit_id") REFERENCES "units"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ingredient_units" ADD CONSTRAINT "ingredient_units_ingredient_id_fkey" FOREIGN KEY ("ingredient_id") REFERENCES "ingredients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ingredient_units" ADD CONSTRAINT "ingredient_units_unit_id_fkey" FOREIGN KEY ("unit_id") REFERENCES "units"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "media_assets" ADD CONSTRAINT "media_assets_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recipes" ADD CONSTRAINT "recipes_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recipes" ADD CONSTRAINT "recipes_editor_id_fkey" FOREIGN KEY ("editor_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recipes" ADD CONSTRAINT "recipes_food_type_term_id_fkey" FOREIGN KEY ("food_type_term_id") REFERENCES "taxonomy_terms"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recipes" ADD CONSTRAINT "recipes_cuisine_term_id_fkey" FOREIGN KEY ("cuisine_term_id") REFERENCES "taxonomy_terms"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recipes" ADD CONSTRAINT "recipes_primary_image_id_fkey" FOREIGN KEY ("primary_image_id") REFERENCES "media_assets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recipe_translations" ADD CONSTRAINT "recipe_translations_recipe_id_fkey" FOREIGN KEY ("recipe_id") REFERENCES "recipes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recipe_steps" ADD CONSTRAINT "recipe_steps_recipe_id_fkey" FOREIGN KEY ("recipe_id") REFERENCES "recipes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recipe_step_translations" ADD CONSTRAINT "recipe_step_translations_step_id_fkey" FOREIGN KEY ("step_id") REFERENCES "recipe_steps"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recipe_step_timers" ADD CONSTRAINT "recipe_step_timers_step_id_fkey" FOREIGN KEY ("step_id") REFERENCES "recipe_steps"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recipe_images" ADD CONSTRAINT "recipe_images_recipe_id_fkey" FOREIGN KEY ("recipe_id") REFERENCES "recipes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recipe_images" ADD CONSTRAINT "recipe_images_media_asset_id_fkey" FOREIGN KEY ("media_asset_id") REFERENCES "media_assets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recipe_images" ADD CONSTRAINT "recipe_images_step_id_fkey" FOREIGN KEY ("step_id") REFERENCES "recipe_steps"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recipe_equipment" ADD CONSTRAINT "recipe_equipment_recipe_id_fkey" FOREIGN KEY ("recipe_id") REFERENCES "recipes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recipe_equipment" ADD CONSTRAINT "recipe_equipment_equipment_id_fkey" FOREIGN KEY ("equipment_id") REFERENCES "equipment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "equipment_translations" ADD CONSTRAINT "equipment_translations_equipment_id_fkey" FOREIGN KEY ("equipment_id") REFERENCES "equipment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recipe_taxonomy_terms" ADD CONSTRAINT "recipe_taxonomy_terms_recipe_id_fkey" FOREIGN KEY ("recipe_id") REFERENCES "recipes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recipe_taxonomy_terms" ADD CONSTRAINT "recipe_taxonomy_terms_taxonomy_term_id_fkey" FOREIGN KEY ("taxonomy_term_id") REFERENCES "taxonomy_terms"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recipe_sources" ADD CONSTRAINT "recipe_sources_recipe_id_fkey" FOREIGN KEY ("recipe_id") REFERENCES "recipes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recipe_sources" ADD CONSTRAINT "recipe_sources_source_id_fkey" FOREIGN KEY ("source_id") REFERENCES "content_sources"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recipe_versions" ADD CONSTRAINT "recipe_versions_recipe_id_fkey" FOREIGN KEY ("recipe_id") REFERENCES "recipes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recipe_versions" ADD CONSTRAINT "recipe_versions_editor_id_fkey" FOREIGN KEY ("editor_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recipe_slug_redirects" ADD CONSTRAINT "recipe_slug_redirects_recipe_id_fkey" FOREIGN KEY ("recipe_id") REFERENCES "recipes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recipe_ingredients" ADD CONSTRAINT "recipe_ingredients_recipe_id_fkey" FOREIGN KEY ("recipe_id") REFERENCES "recipes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recipe_ingredients" ADD CONSTRAINT "recipe_ingredients_ingredient_id_fkey" FOREIGN KEY ("ingredient_id") REFERENCES "ingredients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recipe_ingredients" ADD CONSTRAINT "recipe_ingredients_unit_id_fkey" FOREIGN KEY ("unit_id") REFERENCES "units"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recipe_ingredient_substitutes" ADD CONSTRAINT "recipe_ingredient_substitutes_recipe_ingredient_id_fkey" FOREIGN KEY ("recipe_ingredient_id") REFERENCES "recipe_ingredients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recipe_ingredient_substitutes" ADD CONSTRAINT "recipe_ingredient_substitutes_substitute_ingredient_id_fkey" FOREIGN KEY ("substitute_ingredient_id") REFERENCES "ingredients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recipe_nutrition" ADD CONSTRAINT "recipe_nutrition_recipe_id_fkey" FOREIGN KEY ("recipe_id") REFERENCES "recipes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recipe_allergens" ADD CONSTRAINT "recipe_allergens_recipe_id_fkey" FOREIGN KEY ("recipe_id") REFERENCES "recipes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recipe_allergens" ADD CONSTRAINT "recipe_allergens_allergen_term_id_fkey" FOREIGN KEY ("allergen_term_id") REFERENCES "taxonomy_terms"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "favorites" ADD CONSTRAINT "favorites_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "favorites" ADD CONSTRAINT "favorites_recipe_id_fkey" FOREIGN KEY ("recipe_id") REFERENCES "recipes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "collections" ADD CONSTRAINT "collections_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "collection_recipes" ADD CONSTRAINT "collection_recipes_collection_id_fkey" FOREIGN KEY ("collection_id") REFERENCES "collections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "collection_recipes" ADD CONSTRAINT "collection_recipes_recipe_id_fkey" FOREIGN KEY ("recipe_id") REFERENCES "recipes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "collection_recipes" ADD CONSTRAINT "collection_recipes_added_by_id_fkey" FOREIGN KEY ("added_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recipe_notes" ADD CONSTRAINT "recipe_notes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recipe_notes" ADD CONSTRAINT "recipe_notes_recipe_id_fkey" FOREIGN KEY ("recipe_id") REFERENCES "recipes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cooked_history" ADD CONSTRAINT "cooked_history_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cooked_history" ADD CONSTRAINT "cooked_history_recipe_id_fkey" FOREIGN KEY ("recipe_id") REFERENCES "recipes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cooking_sessions" ADD CONSTRAINT "cooking_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cooking_sessions" ADD CONSTRAINT "cooking_sessions_recipe_id_fkey" FOREIGN KEY ("recipe_id") REFERENCES "recipes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cooking_progress" ADD CONSTRAINT "cooking_progress_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "cooking_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cooking_progress" ADD CONSTRAINT "cooking_progress_step_id_fkey" FOREIGN KEY ("step_id") REFERENCES "recipe_steps"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meal_plans" ADD CONSTRAINT "meal_plans_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meal_plan_days" ADD CONSTRAINT "meal_plan_days_meal_plan_id_fkey" FOREIGN KEY ("meal_plan_id") REFERENCES "meal_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meal_plan_items" ADD CONSTRAINT "meal_plan_items_day_id_fkey" FOREIGN KEY ("day_id") REFERENCES "meal_plan_days"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meal_plan_items" ADD CONSTRAINT "meal_plan_items_recipe_id_fkey" FOREIGN KEY ("recipe_id") REFERENCES "recipes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shopping_lists" ADD CONSTRAINT "shopping_lists_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shopping_lists" ADD CONSTRAINT "shopping_lists_source_meal_plan_id_fkey" FOREIGN KEY ("source_meal_plan_id") REFERENCES "meal_plans"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shopping_list_items" ADD CONSTRAINT "shopping_list_items_list_id_fkey" FOREIGN KEY ("list_id") REFERENCES "shopping_lists"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shopping_list_items" ADD CONSTRAINT "shopping_list_items_ingredient_id_fkey" FOREIGN KEY ("ingredient_id") REFERENCES "ingredients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shopping_list_items" ADD CONSTRAINT "shopping_list_items_unit_id_fkey" FOREIGN KEY ("unit_id") REFERENCES "units"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_sources" ADD CONSTRAINT "content_sources_verified_by_fkey" FOREIGN KEY ("verified_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "source_attributions" ADD CONSTRAINT "source_attributions_source_id_fkey" FOREIGN KEY ("source_id") REFERENCES "content_sources"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "source_attributions" ADD CONSTRAINT "source_attributions_recipe_id_fkey" FOREIGN KEY ("recipe_id") REFERENCES "recipes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_review_records" ADD CONSTRAINT "content_review_records_reviewer_id_fkey" FOREIGN KEY ("reviewer_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_reviews" ADD CONSTRAINT "content_reviews_recipe_id_fkey" FOREIGN KEY ("recipe_id") REFERENCES "recipes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_reviews" ADD CONSTRAINT "content_reviews_reviewer_id_fkey" FOREIGN KEY ("reviewer_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
