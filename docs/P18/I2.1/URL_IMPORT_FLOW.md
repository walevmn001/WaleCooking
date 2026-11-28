# I2.1 — URL IMPORT FLOW (Thiết kế luồng URL Import)

> Phase **I2.1** (thiết kế, **KHÔNG triển khai**) · 1 AI Agent · không sub-agent.
> Mục tiêu: đặc tả **luồng URL Import** theo kiến trúc P16 (roadmap I2 = Core URL Import MVP) — **chưa** triển khai bước nào.
> Nguồn: `docs/P16/IMPLEMENTATION_ROADMAP.md` (I2), `docs/P16/ADMIN_REVIEW_WORKFLOW.md`, `docs/P16/EXTRACTION_ENGINE.md`, `docs/P16/SECURITY_LEGAL_RESOURCE_LIMITS.md`, `docs/P16/BATCH_PROCESSING_ARCHITECTURE.md`, `docs/P16/DATABASE_DESIGN.md`, `docs/P16/API_DESIGN.md`.
> Nguyên tắc gốc: **admin chủ động** nhập URL; hệ thống **chỉ tạo bản nháp**; **chỉ publish qua `RecipeService`**; **không** auto-publish; **không** tin dữ liệu từ website nguồn.

---

## 1. Tổng quan 9 bước (theo yêu cầu thiết kế A)

```
[1] Admin nhập URL
      │
[2] Validate URL (cú pháp + scheme http/https + độ dài + chuẩn hoá)
      │
[3] Kiểm nguồn & Source Registry (biết domain chưa đánh giá?)
      │
[4] Fetch an toàn (SSRF guard — xem SSRF_SECURITY_DESIGN.md)
      │
[5] Trích xuất dữ liệu công thức (E1 JSON-LD trước; xem EXTRACTION_DESIGN.md)
      │
[6] Chuẩn hoá dữ liệu (normalize giới hạn; không bịa / không quy đổi)
      │
[7] Lưu bản nháp Import (ImportJobItem + RecipeExtraction; KHÔNG tạo recipe)
      │
[8] Admin xem trước & duyệt (Inbox → Item Detail → APPROVE/REJECT)
      │
[9] Xuất bản CHỈ qua RecipeService (create → publish; assertPublishable BR-01/BR-03)
```

---

## 2. Chi tiết từng bước

### Bước 1 — Admin nhập URL
- Đầu vào: một hoặc nhiều URL (MVP: 1 URL; thiết kế sẵn cho N ≤ trần).
- Người thao tác: **admin** (permission `import:manage`). `createdById`/actor lấy từ **phiên đăng nhập server** (`getCurrentActor()`), **không** nhận từ client.
- Mọi lần nhập → ghi `AuditLog` (`entityType="import_job_item"`).

### Bước 2 — Validate URL
- **Cú pháp:** URL hợp lệ (dùng `URL` parser); hostname không rỗng; **chỉ** `http:`/`https:`; **không** chứa credentials (`user:pass@`); giới hạn độ dài (đề xuất ≤ 2048 ký tự).
- **Chuẩn hoá sớm:** lowercase host, bỏ `www.`, bỏ fragment, bỏ query tracking (`utm_*`, `fbclid`, `gclid`), chuẩn hoá trailing slash, theo `rel=canonical` nếu có (đầy đủ ở bước 6; ở bước 2 chỉ chuẩn hoá host để tra registry).
- **Sinh `normalizedUrl` + `idempotencyKey`** = hash(`jobId` + `normalizedUrl`) → chặn trùng ở bước 7 (unique `(jobId, idempotencyKey)`).
- URL sai/bị chặn → **422** `VALIDATION_ERROR` (không lộ chi tiết nội bộ).

### Bước 3 — Kiểm nguồn & Source Registry
- Trích `domain` từ URL → tra **Source Registry** (`ImportSource.domain @unique`).
- **Ba trường hợp:**
  1. **Domain có trong registry** → áp `supportStatus`, `contentPolicy`, `imagePolicy`, `extractorConfig`, `rateLimit`.
     - `disallowed` → **chặn** (422).
     - `paused_blocked` → **chặn** tự động (422/409), gợi ý xử lý thủ công.
     - `manual_only` → cho phép tạo nháp nhưng **cảnh báo** "chỉ tham khảo thủ công, không sao chép".
     - `url_import_only` → cho phép (đúng luồng URL Import).
     - `auto_enabled` → cho phép (URL Import luôn hợp lệ).
     - `disabled` → **chặn** (422).
  2. **Domain chưa có trong registry** → chế độ **"unregistered"**: **vẫn** cho phép URL Import (admin chủ động) **nhưng** đánh dấu `warnings[]` "nguồn chưa đánh giá (robots/ToS/bản quyền)" và mặc định `contentPolicy=manual_only`, `imagePolicy=do_not_copy`. **Không** tự tạo `ImportSource` tự động ở I2 (xem §5).
  3. **Domain trong deny-list** → **chặn** (422).
- **Không** tự động tin tưởng domain chỉ vì admin nhập URL (chi tiết: SOURCE_REGISTRY_DESIGN.md).

### Bước 4 — Fetch an toàn
- Thực hiện theo **SSRF guard** (SSRF_SECURITY_DESIGN.md): kiểm scheme → resolve DNS một lần → kiểm **mọi** IP ∉ private/loopback/link-local/reserved/metadata → pin IP → kết nối tới **đúng IP đó** → theo redirect ≤5, kiểm lại **mỗi hop**.
- Giới hạn: timeout fetch ≤15s, response HTML ≤ 5MB (đọc stream, ngắt khi vượt), **MIME allow-list** (`text/html`, `application/xhtml+xml`), chống compression bomb, **không** truyền cookie/Authorization/header nhạy cảm của hệ thống sang site ngoài.
- Kết quả `FetchResult { finalUrl, status, contentType, html, fetchedAt }` (hợp đồng P16.2 §6).
- Fetch lỗi (DNS/timeout/403/429/MIME sai) → item `failed` + `lastError` **an toàn** (không lộ IP nội bộ/lỗi DNS chi tiết).
- Cập nhật `ImportSource.lastStatus` (`ok`/`blocked`/`rate_limited`/`parse_failed`) + `lastCrawledAt` nếu domain thuộc registry.

### Bước 5 — Trích xuất dữ liệu công thức
- MVP I2: chạy **E1 JSON-LD Schema.org `Recipe`** (xem EXTRACTION_DESIGN.md); kiến trúc sẵn sàng cho E2–E5 ở I3.
- **Không** thực thi JavaScript; chỉ parse HTML tĩnh/JSON-LD; sanitize nội dung trước khi lưu/đưa cho AI.
- Mỗi trường mang **trạng thái** `MISSING/UNREADABLE/CONFIRMED/DERIVED/CONFLICT` + bậc + bằng chứng.
- **Không** bịa dữ liệu thiếu; **không** quy đổi đơn vị.

### Bước 6 — Chuẩn hoá dữ liệu
- Chỉ các chuẩn hoá **an toàn/có cơ sở** (P16.2 §7): ISO-8601 duration → phút; trim/gộp khoảng trắng/Unicode; chuẩn hoá URL; tách số/đơn vị khi dấu hiệu rõ; map `unitRaw`→`Unit.code` **chỉ khi khớp**; map cuisine/category→`TaxonomyTerm` **chỉ khi khớp term có sẵn**.
- **Cấm:** ước lượng thời gian; đổi đơn vị; làm tròn định lượng; bịa `quantityNumeric`; tạo `Unit`/`Ingredient`/`TaxonomyTerm` tự động.
- Sinh `warnings[]` cho trường thiếu/xung đột/tầng AI/nguồn chưa đánh giá.

### Bước 7 — Lưu bản nháp Import (**KHÔNG** tạo recipe)
- Tạo/giữ `ImportJob` (nếu chưa có) + `ImportJobItem` (`status` = `needs_review` khi có kết quả; `failed` khi lỗi; `duplicate` nếu I5 phát hiện — I5 chưa thuộc I2).
- Lưu kết quả trích xuất vào **`RecipeExtraction`** (raw staging): `sourceUrl`, `canonicalUrl`, `contentHash` (unique), `tiersUsed`, `extractorVersion`, `rawExtraction` (**JSON required**), `rawContentRef` (ref tới raw HTML ở object storage — **không** nhồi HTML vào Postgres), `httpStatus`, `warnings`, `extractedAt`.
- **Tuyệt đối KHÔNG** ghi vào `recipes`/`recipe_*` ở bước này. Đây là **staging**, không phải nội dung chính thức.
- Idempotency: `contentHash` unique → cùng nội dung chỉ một bản ghi (upsert).

### Bước 8 — Admin xem trước & duyệt
- Inbox (`ImportJobItem` theo trạng thái) → Item Detail (split view gốc↔Việt ở I4; ở I2 hiển thị bản gốc + cảnh báo + panel nguồn).
- Thao tác: **APPROVE** / **REJECT** / **Retry** (item `failed`).
- Quyết định ghi `ContentReviewRecord` (`entityType="import_job_item"`, `decision: ReviewDecision`) + `AuditLog`. Quyền `import:approve`.
- **Không** sửa trực tiếp `recipes`; chỉnh sửa nội dung ghi vào **bản nháp**.

### Bước 9 — Xuất bản **chỉ** qua `RecipeService`
- **Điều kiện:** item `approved` **và** đạt `assertPublishable()` (BR-01/BR-03).
- **Xử lý:** `RecipeService.create()` (tạo recipe) → gắn nguồn (`ContentSource` + `RecipeSource`, BR-03) → `RecipeService.publish()`; cập nhật `ImportJobItem.recipeId`, `status=published`; `AuditLog`. Quyền `import:publish`.
- **Cửa publish duy nhất** — không có đường publish nào khác; **không** auto-publish; thiếu điều kiện → **422** kèm danh sách lý do từ `assertPublishable`.

---

## 3. Ánh xạ sang API (I2) — tóm tắt

| Bước | Endpoint (đề xuất — P16.7 §3) | Permission |
|---|---|---|
| 1–3 | `POST /api/v1/admin/import/jobs` (tạo job) | `import:manage` |
| 2–7 | `POST /api/v1/admin/import/jobs/:jobId/items` (thêm URL → validate → fetch → extract → lưu nháp) | `import:manage` |
| 8 | `GET /api/v1/admin/import/items/:itemId` (xem chi tiết) | `import:read` |
| 8 | `POST /api/v1/admin/import/items/:itemId/review` (approve/reject) | `import:approve` |
| 8 | `POST /api/v1/admin/import/items/:itemId/retry` | `import:manage` |
| 9 | `POST /api/v1/admin/import/items/:itemId/publish` | `import:publish` |

MVP I2 gồm 3 endpoint lõi (roadmap I2): tạo job, thêm URL, xem chi tiết item. Các endpoint còn lại thuộc I6. Chi tiết request/response: API_AUTH_DESIGN.md.

---

## 4. Trạng thái item trong luồng I2

Dùng đúng enum đã triển khai ở I1 (`ImportJobItemStatus`):
```
queued ──(fetch+extract ok)──▶ needs_review
   │                                │
   ├──(fetch/extract lỗi)──▶ failed │
   │                                ├──(approve)──▶ approved ──(publish)──▶ published
   │                                └──(reject)───▶ rejected
   └──(I5, chưa thuộc I2)──▶ duplicate
```
- `processing` là trạng thái tạm khi worker đang xử lý; `processingStage` (trường phụ) hiển thị bước chi tiết (fetch/extract) — **không** phải trạng thái nghiệp vụ.
- `discovered` chỉ dùng cho Auto Discovery (I8) — **không** dùng ở URL Import.
- `published` ánh xạ `RecipeStatus = published` ở vùng recipe chính thức.

---

## 5. Quyết định thiết kế cần chốt cho I2

| # | Quyết định | Đề xuất (I2.1) |
|---|---|---|
| Q1 | Có tự tạo `ImportSource` khi gặp domain mới? | **Không** tự tạo ở I2. Ghi nhận ở `ImportJobItem` (domain/`sourceId=null`) + warning "unregistered". Tạo nguồn là thao tác admin (I8/Source Registry). |
| Q2 | Xử lý đồng bộ hay bất đồng bộ trong 1 request? | MVP: **xử lý đồng bộ trong 1 request** (1 URL, tick ngắn) — trả kết quả ngay; nếu vượt ngân sách thời gian → trả item `queued`, worker tick xử lý sau (I7). |
| Q3 | Có cho nhiều URL/request ở MVP? | Cho phép `urls[]` nhưng khuyến nghị 1 URL ở MVP; trần tổng item/job ≤ 500 (rào ở I7). |
| Q4 | Lưu raw HTML ở đâu? | **Object storage** (`rawContentRef`), không nhồi vào Postgres; DB chỉ giữ `rawExtraction` (JSON giới hạn). |
| Q5 | Sinh `ContentSource`/`RecipeSource` khi nào? | Chỉ ở bước 9 (publish), không ở bước 7 — giữ staging tách biệt nội dung chính thức. |

---

## 6. Bất biến của luồng (dùng cho test ở phase triển khai)

1. Không bước nào (1–8) ghi vào `recipes`/`recipe_*`.
2. **Không** auto-publish; publish chỉ khi `approved` + `assertPublishable()`.
3. URL private/không hợp lệ **không bao giờ** được fetch (bước 2–4).
4. Retry/duplicate enqueue **không** tạo bản ghi trùng (`idempotencyKey`/`contentHash`).
5. Mọi thao tác ghi → `AuditLog`; **không** lộ thông tin nội bộ/IP/DNS cho client.
6. Actor **luôn** lấy từ server; **không** tin role/actor client.

---

## 7. Ngoài phạm vi I2.1

- **Không** triển khai bất kỳ bước nào ở I2.1 (chỉ thiết kế).
- Không thuộc I2: localization (I4), dedupe (I5), Auto Discovery (I8), batch/worker đầy đủ (I7), ảnh (I9), AI (I11).
- Không fetch website do người dùng cung cấp; không tạo crawler.

---

## 8. Kết luận

- Luồng URL Import 9 bước đã được đặc tả đầy đủ, **tách tuyệt đối** giữa vùng staging (job/item/extraction) và vùng chính thức (recipe).
- Điểm chốt an toàn: **admin-only**, **một cửa publish** (`RecipeService`), **không auto-publish**, **validate+SSRF trước fetch**, **không bịa dữ liệu**.
- Sẵn sàng cho Implementation Plan (IMPLEMENTATION_PLAN.md) chia milestone nhỏ.
