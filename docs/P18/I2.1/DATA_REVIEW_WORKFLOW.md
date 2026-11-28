# I2.1 — DATA & REVIEW WORKFLOW (Dữ liệu & luồng duyệt)

> Phase **I2.1** (thiết kế, **KHÔNG triển khai**) · 1 AI Agent · không sub-agent.
> Mục tiêu: đối chiếu dữ liệu extraction với **schema đã triển khai ở I1**, đặc tả mapping, vòng đời job/item, retry/idempotency, duplicate, review, audit (yêu cầu E).
> Nguồn: `docs/P16/DATABASE_DESIGN.md`, `docs/P16/ADMIN_REVIEW_WORKFLOW.md`, `docs/P16/DUPLICATE_DETECTION.md`, `docs/P16/BATCH_PROCESSING_ARCHITECTURE.md`; schema thực tế `prisma/schema.prisma` dòng 1364–1529.
> Nguyên tắc: **staging tách khỏi nội dung chính thức**; **không ghi đè recipe hiện có**; **không auto-publish**; thiếu schema ⇒ ghi **đề xuất**, **không** sửa schema trong I2.1.

---

## 1. Đối chiếu 6 bảng + 11 enum đã triển khai (I1)

**6 model** (`prisma/schema.prisma`): `ImportSource` (1368), `ImportJob` (1398), `ImportJobItem` (1419), `RecipeExtraction` (1455), `RecipeTranslationDraft` (1483), `DuplicateCandidate` (1508).

**11 enum** (dòng 209–320):
- `ImportSourceStatus` = `disabled | url_import_only | auto_enabled | paused_blocked | manual_only | disallowed`
- `ContentReusePolicy` = `facts_only | rewrite_required | licensed_reuse | manual_only`
- `ImageReusePolicy` = `do_not_copy | allowed_with_license | manual_review`
- `ImportSourceLastStatus` = `ok | blocked | rate_limited | parse_failed | unknown`
- `ImportJobMode` = `url_import | auto_discovery`
- `ImportJobStatus` = `created | running | paused | cancelled | partial | done`
- `ImportJobItemStatus` = `discovered | queued | processing | needs_review | duplicate | failed | approved | rejected | published`
- `TranslationStatus` = `pending | in_progress | done | failed | needs_human`
- `HumanReviewStatus` = `not_reviewed | in_review | approved | rejected`
- `DuplicateClassification` = `exact | likely | similar | different`
- `DuplicateStatus` = `open | …` (nhãn xử lý candidate)

> **Kết luận:** schema I1 **đủ** cho I2 (xem `PREFLIGHT_AUDIT.md` §7, D1–D11). Không cần migration cho I2.

---

## 2. Mapping dữ liệu extraction → schema

| Dữ liệu trích xuất | Nơi lưu (I2) | Ghi chú |
|---|---|---|
| URL nguồn / canonical | `RecipeExtraction.sourceUrl` / `canonicalUrl` | chuẩn hoá URL |
| Hash nội dung | `RecipeExtraction.contentHash` **@unique** | khoá idempotency theo nội dung (D5) |
| Bậc đã dùng | `RecipeExtraction.tiersUsed` (Json) | ví dụ `["E1"]` |
| Phiên bản extractor | `RecipeExtraction.extractorVersion` (**required**) | D3 |
| Kết quả thô + fields + state + evidence | `RecipeExtraction.rawExtraction` (**Json required**) | D2 — luôn ghi |
| Ref raw HTML | `RecipeExtraction.rawContentRef` | object storage |
| HTTP status | `RecipeExtraction.httpStatus` | số |
| Cảnh báo | `RecipeExtraction.warnings` (Json) | §8 EXTRACTION_DESIGN |
| Thời điểm trích xuất | `RecipeExtraction.extractedAt` (**required**, không default) | D4 — code tự set |
| Trạng thái item | `ImportJobItem.status` (default **`queued`** — D1) | 9 giá trị |
| Bước xử lý phụ | `ImportJobItem.processingStage` | hiển thị (fetch/extract), không phải trạng thái nghiệp vụ |
| Liên kết extraction | `ImportJobItem.extractionId` | quan hệ `ItemPrimaryExtraction`/`ExtractionJobItem` |
| Nguồn | `ImportJobItem.sourceId` | có ở I1 (D8) |
| Trùng lặp | `ImportJobItem.duplicateOfItemId` (self-relation `ImportItemDuplicate`) | D6 |
| Recipe đích (chỉ sau publish) | `ImportJobItem.recipeId` | set ở bước 9 |
| Lỗi | `ImportJobItem.lastError` | chuỗi **đã làm sạch** |

**Bản dịch/localization (I4)** dùng `RecipeTranslationDraft` (`originalContent`/`localizedContent` Json, `translationStatus`, `humanReviewStatus`, `@@unique([extractionId, locale])`) — **không** thuộc I2.
**Trùng lặp (I5)** dùng `DuplicateCandidate` (`classification`, `scores`, `status`, `@@unique([extractionId, comparedRecipeId, comparedExtractionId])`) — **không** thuộc I2 (I2 chỉ đặt `status=duplicate` khi cần, nếu I5 có mặt).

---

## 3. Vòng đời `ImportJobItem` (9 trạng thái)

```
queued ─(fetch+extract ok)─▶ needs_review ─(approve)─▶ approved ─(publish)─▶ published
   │                              └─(reject)──────────▶ rejected
   ├─(fetch/extract lỗi)─▶ failed ─(retry, còn attempts)─▶ queued
   ├─(đang xử lý)────────▶ processing ──▶ needs_review | failed
   └─(I5: trùng)─────────▶ duplicate ─(admin)─▶ rejected | approved | needs_review
discovered: chỉ Auto Discovery (I8) — không dùng ở URL Import
```
- `processing` là trạng thái tạm trong lúc worker xử lý; `processingStage` mô tả bước.
- **Không** chuyển thẳng `queued → published` (bắt buộc qua `needs_review`/`approved`).

**Vòng đời `ImportJob`:** `created → running → (paused | cancelled) → partial | done`.
- URL Import 1 URL: `created` → `running` → `done` (hoặc `partial` nếu item `failed`).

---

## 4. Retry & Idempotency

**Idempotency (3 tầng):**
1. **Theo item:** `@@unique([jobId, idempotencyKey])` với `idempotencyKey = hash(jobId + normalizedUrl)` → dán cùng URL hai lần **không** tạo item trùng.
2. **Theo nội dung:** `RecipeExtraction.contentHash @unique` → cùng nội dung chỉ một bản ghi (upsert).
3. **Theo claim:** worker claim nguyên tử `FOR UPDATE SKIP LOCKED` (I7) → không xử lý trùng.

**Retry:**
- `attempts`/`maxAttempts` (default 3) trên `ImportJobItem`; `leaseExpiresAt`/`workerId` cho lease (D6).
- Retry khi: timeout, 429 (tôn trọng `Retry-After` giới hạn), 5xx tạm thời, parse tạm lỗi.
- **Không** retry: 4xx vĩnh viễn (403/404), URL bị chặn bởi chính sách, MIME sai.
- Hết `maxAttempts` ⇒ `failed` (dead-letter ở I7); admin có thể **retry thủ công** (reset attempts).
- Retry **không** tạo item/extraction trùng (nhờ idempotency).

---

## 5. Duplicate detection (phạm vi I2 vs I5)

- **I2 (MVP)** **không** triển khai dedupe tự động. I2 **chỉ** đảm bảo: (a) idempotency cùng URL trong job; (b) `contentHash` unique toàn cục.
- **I5** sẽ dùng 6 lớp L1–L6 (`DUPLICATE_DETECTION.md`): canonical URL → source URL → normalized title → ingredient similarity → instruction similarity → image similarity; 4 nhãn `exact|likely|similar|different`; ghi `DuplicateCandidate`.
- Khi I5 phát hiện trùng: item → `duplicate`; **không** xoá/ghi đè recipe hiện có; admin quyết định (`rejected`/link thủ công).
- **Thiết kế I2 phải chừa chỗ**: item đã có `duplicateOfItemId` + quan hệ `DuplicateCandidate` sẵn trong schema → không cần đổi schema khi I5 bật.

---

## 6. Review workflow

1. **Inbox:** liệt kê `ImportJobItem` theo `status` (`needs_review`, `failed`, `duplicate`, …) — quyền `import:read`.
2. **Item Detail:** hiển thị bản gốc + `warnings[]` + panel nguồn (chính sách/attribution) + liên kết raw. (Split-view gốc↔Việt thuộc I4.)
3. **Hành động:** `APPROVE` / `REJECT` / `Retry` (nếu `failed`) — quyền `import:approve` (retry: `import:manage`).
4. **Ghi quyết định:** `ContentReviewRecord` (`entityType="import_job_item"`, `entityId=itemId`, `decision: ReviewDecision ∈ {approved, rejected, changes_requested}`, `notes`) + `AuditLog`.
5. **Chỉnh sửa:** mọi sửa nội dung ghi vào **bản nháp** (extraction), **không** chạm `recipes`.
6. **Publish:** chỉ khi `approved` + `assertPublishable()` — xem §7.

---

## 7. Publish (một cửa duy nhất — `RecipeService`)

- Điều kiện: item `approved` **và** `RecipeService.assertPublishable()` đạt (title, summary, foodType, cuisine, `baseServings>0`, totalMinutes, ≥1 ingredient, ≥1 step, primaryImage, **≥1 source** — BR-01/BR-03).
- Trình tự: `RecipeService.create()` → tạo `ContentSource` + `RecipeSource` (attribution, BR-03) → `RecipeService.publish()` → cập nhật `ImportJobItem.recipeId`, `status=published` → `AuditLog`. Quyền `import:publish`.
- **Không auto-publish.** Thiếu điều kiện ⇒ **422** kèm danh sách lý do (không lộ chi tiết nội bộ).
- **Không ghi đè** recipe hiện có: publish **luôn** tạo recipe **mới**; nếu muốn gộp với recipe cũ → quyết định thủ công ở I5/I6, không tự động.

---

## 8. Audit log

- Mọi thao tác ghi (tạo job/item, fetch kết quả, approve/reject/retry, publish, sửa source) → `AuditLog { actorId, action, entityType, entityId, before?, after?, ip?, userAgent? }`.
- `audit_logs` đã có `@@index([entityType, entityId])`, `@@index([actorId, createdAt desc])`.
- `ip`/`userAgent`: ghi **của admin** (server-side); **không** lưu IP site nguồn vào trường hiển thị cho client.

---

## 9. Retention (đề xuất — P16 §5, chưa bật ở I2.1)

- Job/item ~180 ngày; raw content ~90 ngày; draft xoá sau publish/reject; candidate ~90 ngày.
- **Không** triển khai job dọn dẹp ở I2; ghi nhận cho phase I10.

---

## 10. Đề xuất (KHÔNG sửa schema trong I2.1)

Đối chiếu cho thấy schema I1 **không thiếu** cho I2. Các mục sau **chỉ là đề xuất** cho phase riêng, **không** thực hiện ở I2.1:
- **P1 (tầng code, không schema):** mở rộng `ImportJobItemDto` thêm `processingStage`, `leaseExpiresAt`, `duplicateOfItemId`, `lastError` (D10).
- **P2 (tầng code, không schema):** bổ sung method port `ImportRepository`: `updateItemStatus`, `claimItem`, `upsertExtraction`, `findExtractionByHash`, `setItemRecipe` (D11).
- **P3 (nếu về sau cần — phase riêng, KHÔNG làm ở I2):** xem xét cột lưu port allow-list theo nguồn (liên quan SSRF) hoặc trường `nextAttemptAt` cho retry scheduling. Hiện **chưa** cần; nếu cần sẽ mở migration ở phase được duyệt.

---

## 11. Bất biến

1. Bước 1–8 **không** ghi `recipes`/`recipe_*`.
2. **Không** auto-publish; **không** ghi đè recipe hiện có.
3. Idempotency 3 tầng (job+URL, contentHash, claim).
4. `rawExtraction`/`extractorVersion`/`extractedAt`/`contentHash` luôn ghi.
5. Mọi quyết định review → `ContentReviewRecord` + `AuditLog`.
6. Thiếu thành phần schema ⇒ **đề xuất**, không tự sửa.

---

## 12. Kết luận

- Mapping extraction → schema rõ ràng; 6 bảng/11 enum I1 dùng đủ, **không** cần migration cho I2.
- Vòng đời job/item, retry, idempotency, duplicate (chừa chỗ cho I5), review, publish một cửa, audit — đã đặc tả.
- Các khác biệt tầng code (DTO/port/adapter) ghi tại `PREFLIGHT_AUDIT.md` §7 và §10 ở trên — **không** sửa schema.
