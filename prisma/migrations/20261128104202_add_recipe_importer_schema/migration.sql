-- CreateEnum
CREATE TYPE "import_source_status" AS ENUM ('disabled', 'url_import_only', 'auto_enabled', 'paused_blocked', 'manual_only', 'disallowed');

-- CreateEnum
CREATE TYPE "content_reuse_policy" AS ENUM ('facts_only', 'rewrite_required', 'licensed_reuse', 'manual_only');

-- CreateEnum
CREATE TYPE "image_reuse_policy" AS ENUM ('do_not_copy', 'allowed_with_license', 'manual_review');

-- CreateEnum
CREATE TYPE "import_source_last_status" AS ENUM ('ok', 'blocked', 'rate_limited', 'parse_failed', 'unknown');

-- CreateEnum
CREATE TYPE "import_job_mode" AS ENUM ('url_import', 'auto_discovery');

-- CreateEnum
CREATE TYPE "import_job_status" AS ENUM ('created', 'running', 'paused', 'cancelled', 'partial', 'done');

-- CreateEnum
CREATE TYPE "import_job_item_status" AS ENUM ('discovered', 'queued', 'processing', 'needs_review', 'duplicate', 'failed', 'approved', 'rejected', 'published');

-- CreateEnum
CREATE TYPE "translation_status" AS ENUM ('pending', 'in_progress', 'done', 'failed', 'needs_human');

-- CreateEnum
CREATE TYPE "human_review_status" AS ENUM ('not_reviewed', 'in_review', 'approved', 'rejected');

-- CreateEnum
CREATE TYPE "duplicate_classification" AS ENUM ('exact', 'likely', 'similar', 'different');

-- CreateEnum
CREATE TYPE "duplicate_status" AS ENUM ('open', 'merged', 'dismissed');

-- CreateTable
CREATE TABLE "import_sources" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "homepage_url" TEXT,
    "source_urls" JSONB,
    "discovery_methods" JSONB,
    "support_status" "import_source_status" NOT NULL DEFAULT 'disabled',
    "robots_policy" JSONB,
    "tos_policy" JSONB,
    "content_policy" "content_reuse_policy" NOT NULL DEFAULT 'manual_only',
    "image_policy" "image_reuse_policy" NOT NULL DEFAULT 'do_not_copy',
    "extractor_config" JSONB,
    "rate_limit" JSONB,
    "last_crawled_at" TIMESTAMPTZ(6),
    "last_status" "import_source_last_status" NOT NULL DEFAULT 'unknown',
    "last_error" TEXT,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "import_sources_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "import_jobs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "mode" "import_job_mode" NOT NULL,
    "status" "import_job_status" NOT NULL DEFAULT 'created',
    "created_by_id" UUID NOT NULL,
    "source_id" UUID,
    "max_items" INTEGER NOT NULL DEFAULT 500,
    "notes" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "import_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "import_job_items" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "job_id" UUID NOT NULL,
    "source_id" UUID,
    "source_url" TEXT NOT NULL,
    "normalized_url" TEXT NOT NULL,
    "idempotency_key" TEXT NOT NULL,
    "status" "import_job_item_status" NOT NULL DEFAULT 'queued',
    "processing_stage" TEXT,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "max_attempts" INTEGER NOT NULL DEFAULT 3,
    "lease_expires_at" TIMESTAMPTZ(6),
    "worker_id" TEXT,
    "last_error" TEXT,
    "extraction_id" UUID,
    "duplicate_of_item_id" UUID,
    "recipe_id" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "import_job_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recipe_extractions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "job_item_id" UUID,
    "source_url" TEXT NOT NULL,
    "canonical_url" TEXT,
    "content_hash" TEXT NOT NULL,
    "tiers_used" JSONB,
    "extractor_version" TEXT NOT NULL,
    "raw_extraction" JSONB NOT NULL,
    "raw_content_ref" TEXT,
    "http_status" INTEGER,
    "warnings" JSONB,
    "extracted_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "recipe_extractions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recipe_translation_drafts" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "extraction_id" UUID NOT NULL,
    "locale" TEXT NOT NULL DEFAULT 'vi',
    "original_content" JSONB NOT NULL,
    "localized_content" JSONB NOT NULL,
    "translation_status" "translation_status" NOT NULL DEFAULT 'pending',
    "translation_version" INTEGER NOT NULL DEFAULT 1,
    "ai_metadata" JSONB,
    "validation_result" JSONB,
    "human_review_status" "human_review_status" NOT NULL DEFAULT 'not_reviewed',
    "reviewed_by_id" UUID,
    "reviewed_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "recipe_translation_drafts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "duplicate_candidates" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "extraction_id" UUID NOT NULL,
    "compared_recipe_id" UUID,
    "compared_extraction_id" UUID,
    "classification" "duplicate_classification" NOT NULL,
    "scores" JSONB NOT NULL,
    "status" "duplicate_status" NOT NULL DEFAULT 'open',
    "resolved_by_id" UUID,
    "resolved_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "duplicate_candidates_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "import_sources_support_status_enabled_idx" ON "import_sources"("support_status", "enabled");

-- CreateIndex
CREATE INDEX "import_sources_last_status_idx" ON "import_sources"("last_status");

-- CreateIndex
CREATE UNIQUE INDEX "import_sources_domain_key" ON "import_sources"("domain");

-- CreateIndex
CREATE INDEX "import_jobs_status_created_at_idx" ON "import_jobs"("status", "created_at" DESC);

-- CreateIndex
CREATE INDEX "import_jobs_created_by_id_idx" ON "import_jobs"("created_by_id");

-- CreateIndex
CREATE INDEX "import_jobs_source_id_idx" ON "import_jobs"("source_id");

-- CreateIndex
CREATE INDEX "import_job_items_job_id_status_idx" ON "import_job_items"("job_id", "status");

-- CreateIndex
CREATE INDEX "import_job_items_status_lease_expires_at_idx" ON "import_job_items"("status", "lease_expires_at");

-- CreateIndex
CREATE INDEX "import_job_items_source_id_idx" ON "import_job_items"("source_id");

-- CreateIndex
CREATE INDEX "import_job_items_recipe_id_idx" ON "import_job_items"("recipe_id");

-- CreateIndex
CREATE UNIQUE INDEX "import_job_items_job_id_idempotency_key_key" ON "import_job_items"("job_id", "idempotency_key");

-- CreateIndex
CREATE INDEX "recipe_extractions_job_item_id_idx" ON "recipe_extractions"("job_item_id");

-- CreateIndex
CREATE INDEX "recipe_extractions_source_url_idx" ON "recipe_extractions"("source_url");

-- CreateIndex
CREATE INDEX "recipe_extractions_extracted_at_idx" ON "recipe_extractions"("extracted_at");

-- CreateIndex
CREATE UNIQUE INDEX "recipe_extractions_content_hash_key" ON "recipe_extractions"("content_hash");

-- CreateIndex
CREATE INDEX "recipe_translation_drafts_translation_status_idx" ON "recipe_translation_drafts"("translation_status");

-- CreateIndex
CREATE INDEX "recipe_translation_drafts_human_review_status_idx" ON "recipe_translation_drafts"("human_review_status");

-- CreateIndex
CREATE UNIQUE INDEX "recipe_translation_drafts_extraction_id_locale_key" ON "recipe_translation_drafts"("extraction_id", "locale");

-- CreateIndex
CREATE INDEX "duplicate_candidates_classification_status_idx" ON "duplicate_candidates"("classification", "status");

-- CreateIndex
CREATE INDEX "duplicate_candidates_compared_recipe_id_idx" ON "duplicate_candidates"("compared_recipe_id");

-- CreateIndex
CREATE UNIQUE INDEX "duplicate_candidates_extraction_id_compared_recipe_id_compa_key" ON "duplicate_candidates"("extraction_id", "compared_recipe_id", "compared_extraction_id");

-- AddForeignKey
ALTER TABLE "import_jobs" ADD CONSTRAINT "import_jobs_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "import_jobs" ADD CONSTRAINT "import_jobs_source_id_fkey" FOREIGN KEY ("source_id") REFERENCES "import_sources"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "import_job_items" ADD CONSTRAINT "import_job_items_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "import_jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "import_job_items" ADD CONSTRAINT "import_job_items_source_id_fkey" FOREIGN KEY ("source_id") REFERENCES "import_sources"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "import_job_items" ADD CONSTRAINT "import_job_items_extraction_id_fkey" FOREIGN KEY ("extraction_id") REFERENCES "recipe_extractions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "import_job_items" ADD CONSTRAINT "import_job_items_duplicate_of_item_id_fkey" FOREIGN KEY ("duplicate_of_item_id") REFERENCES "import_job_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "import_job_items" ADD CONSTRAINT "import_job_items_recipe_id_fkey" FOREIGN KEY ("recipe_id") REFERENCES "recipes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recipe_extractions" ADD CONSTRAINT "recipe_extractions_job_item_id_fkey" FOREIGN KEY ("job_item_id") REFERENCES "import_job_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recipe_translation_drafts" ADD CONSTRAINT "recipe_translation_drafts_extraction_id_fkey" FOREIGN KEY ("extraction_id") REFERENCES "recipe_extractions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recipe_translation_drafts" ADD CONSTRAINT "recipe_translation_drafts_reviewed_by_id_fkey" FOREIGN KEY ("reviewed_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "duplicate_candidates" ADD CONSTRAINT "duplicate_candidates_extraction_id_fkey" FOREIGN KEY ("extraction_id") REFERENCES "recipe_extractions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "duplicate_candidates" ADD CONSTRAINT "duplicate_candidates_compared_recipe_id_fkey" FOREIGN KEY ("compared_recipe_id") REFERENCES "recipes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "duplicate_candidates" ADD CONSTRAINT "duplicate_candidates_compared_extraction_id_fkey" FOREIGN KEY ("compared_extraction_id") REFERENCES "recipe_extractions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "duplicate_candidates" ADD CONSTRAINT "duplicate_candidates_resolved_by_id_fkey" FOREIGN KEY ("resolved_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
