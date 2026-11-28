# P16.7 — API DESIGN (Admin Importer)

> Phase **P16** (thiết kế) · Milestone **P16.7** · 1 AI Agent · **KHÔNG triển khai API ở P16**.
> Mục tiêu: đặc tả **API quản trị** cho Recipe Importer, bám **quy ước API hiện có** của repo.
> Nguyên tắc gốc: **chỉ admin** (RBAC); mọi thao tác ghi `AuditLog`; **không** endpoint công khai; **không** auto-publish.
> Liên quan: [DATABASE_DESIGN.md](./DATABASE_DESIGN.md) · [ADMIN_REVIEW_WORKFLOW.md](./ADMIN_REVIEW_WORKFLOW.md) · [BATCH_PROCESSING_ARCHITECTURE.md](./BATCH_PROCESSING_ARCHITECTURE.md).

---

## 1. Quy ước (bám repo — đã kiểm chứng)

- **Vị trí**: `app/api/v1/admin/<resource>/route.ts` (Route Handlers App Router).
- **Handler**: bọc `handle(async () => { const actor = await getCurrentActor(); ... return jsonOk(data); })`.
- **Thành công**: trả **data trực tiếp** (`jsonOk`).
- **Lỗi**: `{ error: { code, message, details? } }` qua `toErrorResponse()` (mã 400/401/403/404/409/422/500 — `lib/errors/app-error.ts`).
- **Xác thực**: `getCurrentActor()`; ⚠️ **hiện trả `null`** (Auth.js chưa nối — blocker B-P06-02) → **API importer phụ thuộc việc nối Auth.js**.
- **Phân quyền**: `requirePermission(...)` — **đề xuất** bổ sung permission importer (union hiện chưa có): `import:read`, `import:manage`, `import:approve`, `import:publish`, `source:manage`.
- **Validate input**: Zod (như `lib/validation/recipe.ts`); **không** nhận field tự do (chống mass assignment).
- **Idempotency**: header tuỳ chọn `Idempotency-Key` cho POST tạo job/thêm URL (kết hợp unique key DB — P16.7 DB §6).

---

## 2. Danh sách endpoint (đề xuất)

| # | Nghiệp vụ (yêu cầu) | Method & Path | Permission |
|---|---|---|---|
| 1 | **Tạo import job** | `POST /api/v1/admin/import/jobs` | `import:manage` |
| 2 | **Thêm URL** (1 hoặc nhiều) | `POST /api/v1/admin/import/jobs/:jobId/items` | `import:manage` |
| 3 | **Khởi chạy discovery** | `POST /api/v1/admin/import/discovery` | `import:manage` + `source:manage` |
| 4 | **Xem tiến độ job** | `GET /api/v1/admin/import/jobs/:jobId` | `import:read` |
| 5 | **Xem chi tiết item** | `GET /api/v1/admin/import/items/:itemId` | `import:read` |
| 6 | **Retry item** | `POST /api/v1/admin/import/items/:itemId/retry` | `import:manage` |
| 7 | **Cancel job** | `POST /api/v1/admin/import/jobs/:jobId/cancel` | `import:manage` |
| 8 | **Approve / Reject** | `POST /api/v1/admin/import/items/:itemId/review` | `import:approve` |
| 9 | **Publish** | `POST /api/v1/admin/import/items/:itemId/publish` | `import:publish` |
| 10 | **Xem lịch sử** | `GET /api/v1/admin/import/jobs` (+ `GET .../history`) | `import:read` |

**Hỗ trợ (đề xuất thêm):**
- `GET /api/v1/admin/import/sources` · `PATCH /api/v1/admin/import/sources/:id` — quản lý Source Registry (bật/tắt, robots/ToS).
- `POST /api/v1/admin/import/worker/tick` — **nội bộ** kích worker chạy 1 lô nhỏ (phương án A, P16.5 §6.3); bảo vệ bằng quyền admin hoặc secret máy-với-máy (**không** lộ ra công khai).

---

## 3. Đặc tả chi tiết từng endpoint

### 3.1 `POST /api/v1/admin/import/jobs` — Tạo job
- **Body**: `{ mode: "url_import" | "auto_discovery", sourceId?: uuid, notes?: string, maxItems?: number (≤500) }`.
- **Validate**: `mode` hợp lệ; `maxItems ≤ 500`; nếu `auto_discovery` → `sourceId` phải trỏ nguồn `auto_enabled`.
- **Xử lý**: tạo `ImportJob(status=created)` + `AuditLog`.
- **Response 201**: `{ id, mode, status, totalItems: 0, createdAt }`.
- **Lỗi**: 400 (validate), 403 (thiếu quyền), 422 (maxItems>500).

### 3.2 `POST /api/v1/admin/import/jobs/:jobId/items` — Thêm URL
- **Body**: `{ urls: string[] }` (1..N; tổng item của job ≤ 500).
- **Validate**: mỗi URL qua **kiểm tra SSRF/scheme** (chỉ http/https — P16.8); chuẩn hoá URL; tính `idempotencyKey`.
- **Xử lý**: tạo `ImportJobItem(status=queued)`; bỏ qua URL trùng (unique `(jobId, idempotencyKey)`) → trả `skipped`.
- **Response 200**: `{ added: n, skipped: m, items: [{id, sourceUrl, status}] }`.
- **Lỗi**: 400/422 (URL không hợp lệ/bị chặn), 404 (job không tồn tại), 409 (vượt trần item).

### 3.3 `POST /api/v1/admin/import/discovery` — Khởi chạy discovery
- **Body**: `{ sourceId: uuid, method?: "sitemap"|"rss"|"index_page"|"search_engine", limit?: number }`.
- **Điều kiện**: nguồn phải ở `auto_enabled` (P16.1); nếu không → 422.
- **Xử lý**: tạo job `auto_discovery` + item `discovered` (URL tìm được); **không** crawl ngoài registry.
- **Response 202**: `{ jobId, discovered: n }`.
- **Lỗi**: 403, 404 (nguồn), 422 (nguồn chưa bật).

### 3.4 `GET /api/v1/admin/import/jobs/:jobId` — Tiến độ
- **Response 200**: `{ id, mode, status, progress: { total, byStatus: {...} }, counts: { pending, processing, needs_review, duplicate, failed, approved, published, rejected } }` (đếm theo item — P16.5 §3.2).

### 3.5 `GET /api/v1/admin/import/items/:itemId` — Chi tiết item
- **Response 200** gồm: `status`, `processingStage`, `sourceUrl`/`canonicalUrl`, **nguồn** (registry status, robots/ToS), **originalContent ↔ localizedContent** (P16.3), nguyên liệu + định lượng + trạng thái trường, `warnings[]`, `duplicate` (nhãn + điểm từng lớp), `lastError`, lịch sử trạng thái.
- **Lỗi**: 404.

### 3.6 `POST /api/v1/admin/import/items/:itemId/retry` — Retry item lỗi
- **Điều kiện**: item `failed` (hoặc `duplicate` muốn xử lý lại).
- **Xử lý**: đặt `status=queued`, giữ `attempts` (hoặc reset theo chính sách), xoá `lastError`; `AuditLog`.
- **Response 200**: `{ id, status: "queued" }`.
- **Lỗi**: 409 (item không ở trạng thái cho phép retry).

### 3.7 `POST /api/v1/admin/import/jobs/:jobId/cancel` — Cancel job
- **Xử lý**: `status=cancelled`; worker ngừng claim (P16.5 §4.7); `AuditLog`.
- **Response 200**: `{ id, status: "cancelled" }`.

### 3.8 `POST /api/v1/admin/import/items/:itemId/review` — Approve/Reject
- **Body**: `{ decision: "approved" | "rejected", comment?: string }`.
- **Điều kiện**: item ở `needs_review` (hoặc `duplicate` sau khi admin xác nhận).
- **Xử lý**: `status=approved|rejected`; ghi `ContentReviewRecord(entityType="import_job_item", entityId=itemId, decision, notes)` (tái sử dụng — P16.7 DB §4.7) + `AuditLog`.
- **Response 200**: `{ id, status, decision }`.
- **Lỗi**: 409 (sai trạng thái), 403.

### 3.9 `POST /api/v1/admin/import/items/:itemId/publish` — Publish
- **Điều kiện**: item `approved` **và** đạt `assertPublishable()` (BR-01/BR-03).
- **Xử lý**: gọi `RecipeService.create()` (tạo recipe) → gán nguồn (`ContentSource` + `RecipeSource`, BR-03) → `RecipeService.publish()`; cập nhật `ImportJobItem.recipeId`, `status=published`; `AuditLog`.
- **Response 200**: `{ itemId, recipeId, slug, status: "published" }`.
- **Lỗi**: 422 (thiếu điều kiện publish — kèm danh sách lý do từ `assertPublishable`), 409 (chưa approved).
- **Bất biến**: **không** có đường publish nào khác; đây là **cửa duy nhất**, chỉ admin.

### 3.10 `GET /api/v1/admin/import/jobs` + `/:jobId/history` — Lịch sử
- **Response 200**: danh sách job (phân trang) + item/ hành động; đọc `AuditLog` cho lịch sử thao tác.

---

## 4. Hợp đồng lỗi & bảo mật chung

| Tình huống | Mã | Ghi chú |
|---|---|---|
| Thiếu/ sai xác thực | 401 | `getCurrentActor()` null |
| Thiếu quyền | 403 | `requirePermission` |
| Input sai | 400 | Zod |
| Vi phạm nghiệp vụ (trạng thái, >500, publish thiếu điều kiện) | 409/422 | |
| URL bị chặn (SSRF/private IP/scheme) | 422 | P16.8 |
| Không tồn tại | 404 | |

- **Không** trả stack trace/chi tiết nội bộ (đúng `lib/api/http.ts`).
- **Không** trả raw HTML nguồn qua API công khai; chỉ admin (điểm 3.5 trả nội dung đã trích xuất, không trả HTML thô).
- Mọi thao tác ghi → `AuditLog` (actor, action, entity, before/after khi phù hợp).

---

## 5. Phác thảo route (đề xuất — KHÔNG tạo ở P16)

```
app/api/v1/admin/import/
├── jobs/route.ts                     # POST (tạo job) · GET (lịch sử)
├── jobs/[jobId]/route.ts             # GET (tiến độ)
├── jobs/[jobId]/items/route.ts       # POST (thêm URL)
├── jobs/[jobId]/cancel/route.ts      # POST
├── jobs/[jobId]/history/route.ts     # GET
├── items/[itemId]/route.ts           # GET (chi tiết)
├── items/[itemId]/retry/route.ts     # POST
├── items/[itemId]/review/route.ts    # POST (approve/reject)
├── items/[itemId]/publish/route.ts   # POST
├── discovery/route.ts                # POST
├── sources/route.ts                  # GET
├── sources/[id]/route.ts             # PATCH
└── worker/tick/route.ts              # POST (nội bộ)
```

> Mỗi route chỉ **mỏng**: parse/validate → gọi service (`ImportService`) → `jsonOk`. Logic nghiệp vụ ở service, không ở route (đúng pattern hiện có: route gọi `recipeService`).

---

## 6. Rủi ro & giảm thiểu (API)

| Rủi ro | Giảm thiểu |
|---|---|
| Lộ endpoint cho người không phải admin | RBAC + permission riêng cho importer |
| SSRF qua "thêm URL" | Validate URL/scheme + chặn private IP (P16.8) |
| Publish trùng/nhầm | Một cửa publish duy nhất + `assertPublishable` + AuditLog |
| Lạm dụng (spam job/item) | Trần 500 + rate limit + quyền admin |
| Phụ thuộc Auth.js chưa nối | Điều kiện tiên quyết triển khai (blocker B-P06-02) |

---

## 7. Kết luận P16.7 (API)

- **10 endpoint admin** đúng yêu cầu + hỗ trợ (sources, worker tick).
- Bám quy ước repo (`app/api/v1/admin/**`, `handle`/`jsonOk`, envelope lỗi, `getCurrentActor`+`requirePermission`).
- **Một cửa publish** duy nhất qua `RecipeService`; **không** endpoint công khai; mọi thao tác `AuditLog`.
- **Không** triển khai API ở P16; ghi rõ **phụ thuộc Auth.js** + permission importer cần bổ sung.
