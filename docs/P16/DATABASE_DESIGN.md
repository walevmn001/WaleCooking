# P16.7 — DATABASE DESIGN (Importer Extension)

> Phase **P16** (thiết kế) · Milestone **P16.7** · 1 AI Agent · **KHÔNG thay đổi schema hiện tại, KHÔNG chạy migration**.
> Mục tiêu: đặc tả **phần mở rộng database** cần cho Recipe Importer, dựa trên **schema thực tế** (57 model / 22 enum / 58 bảng — P16.0 §3) và các quy ước của repo.
> Nguyên tắc gốc: **ưu tiên tái sử dụng** entity đã có; chỉ đề xuất **thêm mới** khi thật cần. Mọi DDL dưới đây là **ĐỀ XUẤT**, không áp dụng ở P16.
> Liên quan: [API_DESIGN.md](./API_DESIGN.md) · [BATCH_PROCESSING_ARCHITECTURE.md](./BATCH_PROCESSING_ARCHITECTURE.md) · [SOURCE_DISCOVERY_STRATEGY.md](./SOURCE_DISCOVERY_STRATEGY.md).

---

## 1. Quy ước bám theo (từ schema thực)

- **PK**: `String @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid`.
- **Thời gian**: `@db.Timestamptz(6)` (UTC); `@db.Date` cho ngày.
- **Đặt tên**: snake_case qua `@map`/`@@map`.
- **FK**: `onDelete: Restrict` mặc định; `Cascade` **chỉ** cho dữ liệu con thuộc sở hữu (job → item; draft → extraction).
- **Số liệu**: `Decimal` (không float); **JSONB** chỉ cho audit/snapshot/settings/raw.
- **Extensions sẵn có**: `citext`, `pg_trgm`, `unaccent` → dùng cho so khớp trùng lặp (P16.4); **không** thêm extension.
- **Enum** mới phải có `@@map` (db type name).

---

## 2. Phân tầng dữ liệu (bắt buộc phân biệt)

| Tầng | Bản chất | Entity | Vòng đời |
|---|---|---|---|
| **A. Cấu hình/chính sách** | Lâu dài | `ImportSource` | Bền vững |
| **B. Điều phối (tạm thời)** | Trạng thái job/item | `ImportJob`, `ImportJobItem` | Có TTL dọn dẹp |
| **C. Raw (thô)** | Nguồn gốc, để kiểm tra lại | `RecipeExtraction` (raw HTML ref + raw JSONB) | TTL ~90 ngày sau publish |
| **D. Nháp bản dịch** | Trung gian trước duyệt | `RecipeTranslationDraft` | Xoá sau publish/ reject |
| **E. Hỗ trợ chất lượng** | Phụ trợ | `DuplicateCandidate` | TTL |
| **F. Chính thức (recipe)** | Nội dung đã duyệt | **ĐÃ CÓ**: `Recipe`, `RecipeTranslation`, `RecipeStep`, `RecipeStepTranslation`, `RecipeIngredient`, `RecipeSource`↔`ContentSource`, `RecipeVersion`, `MediaAsset` | Bền vững |

> **Quan trọng:** tầng F **đã tồn tại**; importer **không** tạo bảng song song cho nội dung recipe. Mọi ghi chính thức đi qua `RecipeService` (P16.0 §9).

---

## 3. Đánh giá từng entity đề xuất

| Entity đề xuất | Trạng thái | Kết luận |
|---|---|---|
| `ImportSource` | **CHƯA có** | **Tạo mới** — Source Registry (P16.1) |
| `ImportJob` | **CHƯA có** | **Tạo mới** — điều phối đợt (P16.5) |
| `ImportJobItem` | **CHƯA có** | **Tạo mới** — đơn vị công việc + checkpoint (P16.5) |
| `RecipeSource` | **ĐÃ có** | **Tái sử dụng** — n-n Recipe↔ContentSource (`isPrimary`) |
| `RecipeExtraction` | **CHƯA có** | **Tạo mới** — raw extraction |
| `RecipeTranslation` | **ĐÃ có** | **Tái sử dụng** (bản dịch chính thức); **thêm** `RecipeTranslationDraft` cho nháp |
| `RecipeReview` | **ĐÃ có một phần** | **Tái sử dụng** `ContentReview` + `ContentReviewRecord` + `ReviewDecision`; **không** tạo bảng review mới |
| `DuplicateCandidate` | **CHƯA có** | **Tạo mới** — cặp nghi trùng (P16.4) |

**Quyết định kiến trúc:** chỉ **6 entity mới** (`ImportSource`, `ImportJob`, `ImportJobItem`, `RecipeExtraction`, `RecipeTranslationDraft`, `DuplicateCandidate`); **không** nhân bản `RecipeSource`/`RecipeTranslation`/review/audit/version đã có.

---

## 4. Đặc tả từng entity

### 4.1 `ImportSource` (CHƯA có → tạo mới) — Source Registry

**Mục đích:** danh mục nguồn + cổng chính sách (P16.1 §5). Chỉ nguồn `AUTO_ENABLED` mới auto-discovery.

| Field | Prisma type | Ghi chú |
|---|---|---|
| `id` | `String @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid` | PK |
| `name` | `String` | Tên website |
| `domain` | `String` | Domain chuẩn hoá |
| `homepageUrl` | `String? @map("homepage_url")` | Trang chủ |
| `sourceUrls` | `Json? @map("source_urls") @db.JsonB` | URL mồi (sitemap/feed/index) |
| `discoveryMethods` | `Json? @map("discovery_methods") @db.JsonB` | Tập phương thức (P16.1 D1–D9) |
| `supportStatus` | `ImportSourceStatus @default(disabled)` | Enum mới |
| `robotsPolicy` | `Json? @db.JsonB` | `{fetchedAt, allowed, crawlDelaySec, sitemaps}` |
| `tosPolicy` | `Json? @db.JsonB` | `{checkedAt, allowsReuse, allowsImages, evidenceUrl}` |
| `contentPolicy` | `ContentReusePolicy @default(manual_only)` | Enum mới |
| `imagePolicy` | `ImageReusePolicy @default(do_not_copy)` | Enum mới |
| `extractorConfig` | `Json? @db.JsonB` | Adapter + selector (P16.2) |
| `rateLimit` | `Json? @db.JsonB` | `{requestsPerMinute, concurrency, minDelayMs}` |
| `lastCrawledAt` | `DateTime? @map("last_crawled_at") @db.Timestamptz(6)` | |
| `lastStatus` | `ImportSourceLastStatus @default(unknown)` | Enum mới |
| `lastError` | `String? @map("last_error")` | An toàn (không secret) |
| `enabled` | `Boolean @default(false)` | Mặc định **tắt** (an toàn) |
| `createdAt`/`updatedAt` | `DateTime @db.Timestamptz(6)` | Audit |

- **Unique:** `@@unique([domain])`.
- **Index:** `@@index([supportStatus, enabled])`, `@@index([lastStatus])`.
- **Cascade:** không có FK con; xoá = `Restrict` ở nơi tham chiếu (jobs).
- **Retention:** bền vững (cấu hình).
- **Idempotency:** upsert theo `domain` (một dòng/domain).

```prisma
// ĐỀ XUẤT — không áp dụng ở P16
enum ImportSourceStatus { disabled url_import_only auto_enabled paused_blocked manual_only disallowed }
enum ContentReusePolicy { facts_only rewrite_required licensed_reuse manual_only }
enum ImageReusePolicy { do_not_copy allowed_with_license manual_review }
enum ImportSourceLastStatus { ok blocked rate_limited parse_failed unknown }

model ImportSource {
  id               String              @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  name             String
  domain           String
  homepageUrl      String?             @map("homepage_url")
  sourceUrls       Json?               @map("source_urls") @db.JsonB
  discoveryMethods Json?               @map("discovery_methods") @db.JsonB
  supportStatus    ImportSourceStatus  @default(disabled) @map("support_status")
  robotsPolicy     Json?               @map("robots_policy") @db.JsonB
  tosPolicy        Json?               @map("tos_policy") @db.JsonB
  contentPolicy    ContentReusePolicy  @default(manual_only) @map("content_policy")
  imagePolicy      ImageReusePolicy    @default(do_not_copy) @map("image_policy")
  extractorConfig  Json?               @map("extractor_config") @db.JsonB
  rateLimit        Json?               @map("rate_limit") @db.JsonB
  lastCrawledAt    DateTime?           @map("last_crawled_at") @db.Timestamptz(6)
  lastStatus       ImportSourceLastStatus @default(unknown) @map("last_status")
  lastError        String?             @map("last_error")
  enabled          Boolean             @default(false)
  createdAt        DateTime            @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt        DateTime            @updatedAt @map("updated_at") @db.Timestamptz(6)

  jobs ImportJob[]

  @@unique([domain])
  @@index([supportStatus, enabled])
  @@index([lastStatus])
  @@map("import_sources")
}
```

---

### 4.2 `ImportJob` (CHƯA có → tạo mới) — điều phối đợt

**Mục đích:** một đợt nhập (≤500 item), tiến độ, trạng thái.

| Field | Prisma type | Ghi chú |
|---|---|---|
| `id` | uuid PK | |
| `mode` | `ImportJobMode` | `url_import` \| `auto_discovery` |
| `status` | `ImportJobStatus @default(created)` | Enum mới (P16.5 §3.2) |
| `createdById` | `String @db.Uuid` | Admin tạo |
| `sourceId` | `String? @db.Uuid` | FK → `ImportSource` (nếu có) |
| `maxItems` | `Int @default(500)` | Trần cứng 500 |
| `notes` | `String?` | |
| `createdAt`/`updatedAt` | timestamptz | |

- **Unique:** không (nhiều job).
- **Index:** `@@index([status, createdAt(sort: Desc)])`, `@@index([createdById])`, `@@index([sourceId])`.
- **Cascade:** `createdBy` → `Restrict`; `source` → `SetNull` (giữ job dù nguồn bị xoá — thực tế nguồn không nên xoá); `items` → **Cascade** (job xoá thì item xoá).
- **Retention:** item/job có TTL (xem §5).
- **Idempotency:** không cần; tạo job là hành động admin tường minh (ghi `AuditLog`).

---

### 4.3 `ImportJobItem` (CHƯA có → tạo mới) — đơn vị công việc + checkpoint

**Mục đích:** mỗi URL/kết quả discovery là một item, mang **trạng thái + checkpoint + idempotency** (P16.5).

| Field | Prisma type | Ghi chú |
|---|---|---|
| `id` | uuid PK | |
| `jobId` | `String @db.Uuid` | FK → `ImportJob` |
| `sourceId` | `String? @db.Uuid` | FK → `ImportSource` |
| `sourceUrl` | `String` | URL gốc |
| `normalizedUrl` | `String @map("normalized_url")` | URL chuẩn hoá (P16.4 L1) |
| `idempotencyKey` | `String @map("idempotency_key")` | `hash(jobId + normalizedUrl)` |
| `status` | `ImportJobItemStatus @default(pending)` | Enum mới (9 trạng thái, P16.6) |
| `processingStage` | `String? @map("processing_stage")` | Hiển thị chi tiết (fetch/extract/... không phải trạng thái) |
| `attempts` | `Int @default(0)` | Số lần thử |
| `maxAttempts` | `Int @default(3)` | |
| `leaseExpiresAt` | `DateTime? @db.Timestamptz(6)` | Resume khi worker chết |
| `workerId` | `String?` | Worker đang giữ |
| `lastError` | `String? @map("last_error")` | An toàn |
| `extractionId` | `String? @db.Uuid` | FK → `RecipeExtraction` |
| `duplicateOfItemId` | `String? @db.Uuid` | Self-FK khi DUPLICATE |
| `recipeId` | `String? @db.Uuid` | FK → `Recipe` (khi đã publish) |
| `createdAt`/`updatedAt` | timestamptz | `updatedAt` = mốc checkpoint |

- **Unique:** `@@unique([jobId, idempotencyKey])` → chặn enqueue trùng trong cùng job.
- **Index:** `@@index([jobId, status])`, `@@index([status, leaseExpiresAt])` (claim), `@@index([sourceId])`, `@@index([recipeId])`.
- **Cascade:** `job` → **Cascade**; `source`/`extraction`/`recipe` → `SetNull`/`Restrict` (không xoá recipe khi job bị dọn).
- **Idempotency:** `idempotencyKey` unique + upsert kết quả phụ theo item.

---

### 4.4 `RecipeSource` (ĐÃ có — tái sử dụng)

- Đã có: `@@unique([recipeId, sourceId])`, `isPrimary`, `note`; FK `Restrict`.
- **Không đổi.** Importer dùng nó để gắn **≥1 nguồn** (BR-03) khi publish.
- Nhiều nguồn cho 1 công thức (P16.4 §5.1) → thêm dòng `RecipeSource` thứ hai + `ContentSource` tương ứng.

---

### 4.5 `RecipeExtraction` (CHƯA có → tạo mới) — raw

**Mục đích:** lưu **kết quả trích xuất thô** + HTML nguồn (đã giới hạn/sanitize) để kiểm tra lại (P16.2 §8).

| Field | Prisma type | Ghi chú |
|---|---|---|
| `id` | uuid PK | |
| `jobItemId` | `String? @db.Uuid` | FK → `ImportJobItem` (nếu từ job) |
| `sourceUrl` | `String` | URL gốc đã fetch (sau redirect) |
| `canonicalUrl` | `String? @map("canonical_url")` | |
| `contentHash` | `String @map("content_hash")` | Hash normalized URL/nội dung (idempotency) |
| `tiersUsed` | `Json? @map("tiers_used") @db.JsonB` | Bậc extractor đã chạy |
| `extractorVersion` | `String @map("extractor_version")` | Đổi thuật toán → tái xử lý |
| `rawExtraction` | `Json @map("raw_extraction") @db.JsonB` | `ExtractionResult` (P16.2 §5) |
| `rawContentRef` | `String? @map("raw_content_ref")` | Key lưu **raw HTML** (R2/local, **không** trong DB) |
| `httpStatus` | `Int? @map("http_status")` | |
| `warnings` | `Json? @db.JsonB` | Cảnh báo dữ liệu |
| `extractedAt` | `DateTime @map("extracted_at") @db.Timestamptz(6)` | |

- **Unique:** `@@unique([contentHash])` (idempotency: cùng nội dung ⇒ một bản ghi).
- **Index:** `@@index([jobItemId])`, `@@index([sourceUrl])` (L2), `@@index([extractedAt])`.
- **Cascade:** `jobItem` → `SetNull` (giữ raw khi dọn item); draft → `Cascade`.
- **Retention:** **TTL ~90 ngày** sau khi công thức đã publish (raw là tầng C).
- **Quan trọng:** **HTML thô không lưu trong Postgres** `rawExtraction` — chỉ **ref** tới object storage (R2/local), tránh phình DB; `rawExtraction` là JSON có kiểm soát kích thước.

---

### 4.6 `RecipeTranslation` (ĐÃ có) + `RecipeTranslationDraft` (CHƯA có → tạo mới)

- **`RecipeTranslation` (đã có):** `title/summary/description/seoTitle/seoDescription`, `@@unique([recipeId, locale])`. Đây là **bản dịch chính thức** (P16.3 §3.3).
- **`RecipeTranslationDraft` (mới):** nháp trước duyệt, giữ **song song gốc↔Việt** (P16.3 §3.2).

| Field (Draft) | Prisma type | Ghi chú |
|---|---|---|
| `id` | uuid PK | |
| `extractionId` | `String @db.Uuid` | FK → `RecipeExtraction` |
| `locale` | `String @default("vi")` | |
| `originalContent` | `Json @map("original_content") @db.JsonB` | Bản gốc |
| `localizedContent` | `Json @map("localized_content") @db.JsonB` | Bản Việt hoá (ánh xạ 1-1) |
| `translationStatus` | `TranslationStatus @default(pending)` | Enum mới |
| `translationVersion` | `Int @default(1)` | |
| `aiMetadata` | `Json? @map("ai_metadata") @db.JsonB` | provider/model/version (**không** key) |
| `validationResult` | `Json? @map("validation_result") @db.JsonB` | I1–I9 (P16.3 §5) |
| `humanReviewStatus` | `HumanReviewStatus @default(not_reviewed)` | Enum mới |
| `reviewedById`/`reviewedAt` | uuid?/timestamptz? | |
| `createdAt`/`updatedAt` | timestamptz | |

- **Unique:** `@@unique([extractionId, locale])` (idempotency theo cặp).
- **Index:** `@@index([translationStatus])`, `@@index([humanReviewStatus])`.
- **Cascade:** `extraction` → **Cascade** (draft thuộc sở hữu extraction).
- **Retention:** **xoá sau khi publish** (hoặc reject) — nội dung đã chuyển vào `RecipeTranslation`.

```prisma
enum TranslationStatus { pending in_progress done failed needs_human }
enum HumanReviewStatus { not_reviewed in_review approved rejected }
```

---

### 4.7 `RecipeReview` (ĐÃ có một phần — tái sử dụng)

- Đã có: `ContentReview` (`recipeId`, `action: ContentReviewAction`, `comment`) + `ContentReviewRecord` (`entityType`, `entityId`, `decision: ReviewDecision`, `notes`) + `ReviewDecision (approved/rejected/changes_requested)` + `ContentReviewAction (submit/approve/request_changes/publish/archive)`.
- **Kết luận: KHÔNG tạo bảng review mới.** Quyết định duyệt importer ghi qua `ContentReviewRecord` (`entityType = "import_job_item"`, `entityId = itemId`) → tái sử dụng nguyên vẹn.
- Trạng thái importer (P16.6) sống ở `ImportJobItem.status`; hành động duyệt/publish của recipe chính thức dùng enum sẵn có.

---

### 4.8 `DuplicateCandidate` (CHƯA có → tạo mới)

**Mục đích:** lưu cặp nghi trùng + điểm từng lớp (P16.4), để admin xem/quyết.

| Field | Prisma type | Ghi chú |
|---|---|---|
| `id` | uuid PK | |
| `extractionId` | `String @db.Uuid` | FK → `RecipeExtraction` (ứng viên mới) |
| `comparedRecipeId` | `String? @db.Uuid` | FK → `Recipe` (đã có) |
| `comparedExtractionId` | `String? @db.Uuid` | FK → `RecipeExtraction` (ứng viên khác) |
| `classification` | `DuplicateClassification` | Enum mới (exact/likely/similar/different) |
| `scores` | `Json @db.JsonB` | Điểm **từng lớp** L1–L6 + lý do |
| `status` | `DuplicateStatus @default(open)` | open/merged/dismissed |
| `resolvedById`/`resolvedAt` | uuid?/timestamptz? | |
| `createdAt` | timestamptz | |

- **Unique:** `@@unique([extractionId, comparedRecipeId, comparedExtractionId])` (không tạo cặp trùng).
- **Index:** `@@index([classification, status])`, `@@index([comparedRecipeId])`.
- **Cascade:** `extraction` → **Cascade**; `comparedRecipe` → `SetNull` (không xoá recipe).
- **Retention:** TTL ~90 ngày (cặp đã xử lý có thể dọn).
- **Bất biến:** **không** tự xoá/ghi đè recipe (P16.4 §4).

```prisma
enum DuplicateClassification { exact likely similar different }
enum DuplicateStatus { open merged dismissed }
```

---

### 4.9 `ImportLog` — **KHÔNG tạo** (tái sử dụng `AuditLog`)

- `AuditLog` (đã có: `actorId`, `action`, `entityType`, `entityId`, `before/after`, `ip`, `userAgent`) đủ cho audit importer.
- Ghi `entityType = "import_job" | "import_job_item" | "import_source"`.

---

## 5. Retention & dọn dẹp (đề xuất)

| Entity | Tầng | Retention |
|---|---|---|
| `ImportSource` | A | Bền vững |
| `ImportJob` / `ImportJobItem` | B | **~180 ngày** sau khi kết thúc (hoặc theo cấu hình) |
| `RecipeExtraction` (+ raw content trên R2) | C | **~90 ngày** sau khi recipe `published`/`rejected` |
| `RecipeTranslationDraft` | D | **Xoá ngay** sau publish/reject |
| `DuplicateCandidate` | E | `~90 ngày` sau khi `merged`/`dismissed` |
| `AuditLog` | audit | Dài hạn (theo chính sách hiện có) |
| Recipe chính thức (F) | F | Bền vững (`Recipe.deletedAt` soft delete) |

> Dọn dẹp chạy như **job bảo trì định kỳ** (không thuộc P16); phải **không** xoá tầng F.

---

## 6. Ma trận Idempotency

| Thao tác | Khoá idempotency | Cơ chế |
|---|---|---|
| Enqueue URL vào job | `unique(jobId, idempotencyKey)` | Chặn trùng trong cùng job |
| Lưu kết quả extraction | `unique(contentHash)` trên `RecipeExtraction` | Upsert theo nội dung |
| Lưu nháp dịch | `unique(extractionId, locale)` | Upsert theo cặp |
| Cặp nghi trùng | `unique(extractionId, comparedRecipeId, comparedExtractionId)` | Chặn trùng |
| Publish recipe | `Recipe.slug @unique` + `assertPublishable()` | Chỉ admin, một đường ghi |
| Retry item | `ImportJobItem.status` + `attempts` | Không tạo item mới |

---

## 7. Tổng hợp DDL mới (đề xuất — KHÔNG áp dụng ở P16)

**Enum mới (9):** `ImportSourceStatus`, `ContentReusePolicy`, `ImageReusePolicy`, `ImportSourceLastStatus`, `ImportJobMode`, `ImportJobStatus`, `ImportJobItemStatus`, `TranslationStatus`, `HumanReviewStatus`, `DuplicateClassification`, `DuplicateStatus`.

**Model mới (6):** `ImportSource`, `ImportJob`, `ImportJobItem`, `RecipeExtraction`, `RecipeTranslationDraft`, `DuplicateCandidate`.

**Tái sử dụng (không đổi):** `RecipeSource`, `ContentSource`, `SourceAttribution`, `RecipeTranslation`, `RecipeStepTranslation`, `RecipeVersion`, `MediaAsset`, `ContentReview`, `ContentReviewRecord`, `AuditLog`, `Recipe`, `TaxonomyTerm`, `Ingredient`.

---

## 8. Rủi ro & giảm thiểu (DB)

| Rủi ro | Giảm thiểu |
|---|---|
| Raw HTML phình DB | Lưu HTML ở object store, DB chỉ giữ ref + JSONB giới hạn |
| Bảng tạm tăng vô hạn | TTL dọn dẹp (job/item/raw/candidate) |
| Xoá nhầm recipe chính thức | Cascade **chỉ** job→item, extraction→draft; recipe dùng Restrict/SetNull |
| Trùng bản ghi khi retry | Unique keys + upsert (§6) |
| Migration rủi ro | P16 **không** chạy migration; DDL chỉ là đề xuất, chờ phase triển khai |

---

## 9. Kết luận P16.7 (DB)

- **6 entity mới** + **11 enum mới**; **tái sử dụng tối đa** entity sẵn có (không nhân bản recipe/source/review/audit).
- **Phân tầng rõ** tạm thời (B) / raw (C) / nháp (D) / chính thức (F) + retention.
- **Idempotency** bằng unique key + upsert; **cascade** có kiểm soát.
- **Không** thay đổi schema/migration trong P16. Đầu ra liên kết `API_DESIGN.md` (endpoints cùng đọc các entity này).
