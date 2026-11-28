# I2.1 — API & AUTH DESIGN (Thiết kế API Import & xác thực)

> Phase **I2.1** (thiết kế, **KHÔNG triển khai — KHÔNG tạo route**) · 1 AI Agent · không sub-agent.
> Mục tiêu: đặc tả API Import + mô hình xác thực/quyền + CSRF + rate limit + request/response/error (yêu cầu F).
> Nguồn: `docs/P16/API_DESIGN.md`; code thực tế `lib/api/http.ts`, `lib/errors/app-error.ts`, `lib/auth/authorization.ts`, `lib/auth/session.ts`, `auth.ts`, `app/(admin)/layout.tsx`.
> Nguyên tắc: **mọi API Import yêu cầu admin session hợp lệ**; actor & quyền kiểm **ở server**; **không tin** role/actor từ client; **không lộ** thông tin nội bộ/IP/DNS.

---

## 1. Quy ước API hiện có (đã audit — tái sử dụng, không tạo mới)

- Vị trí route: `app/api/v1/admin/import/**/route.ts` (App Router Route Handlers).
- Handler bọc `handle(async () => { … return jsonOk(data) })`; thành công trả **data trực tiếp** (`jsonOk<T>(data, status=200)`).
- Lỗi: `{ error: { code, message, details? } }` qua `toErrorResponse()` (xem §5).
- Validate input bằng **Zod**; **không** nhận field tự do (chống mass assignment).
- Actor lấy từ `getCurrentActor()` (`lib/auth/session.ts` → `await auth()`); quyền qua `requirePermission(actor, …)` (`lib/auth/authorization.ts`).

---

## 2. Xác thực & ủy quyền

### 2.1 Session
- Auth.js v5 (`auth.ts`): Credentials + **JWT** session (`strategy: "jwt"`), `trustHost: true`, `pages.signIn="/dang-nhap"`.
- Role nằm trong JWT (ký từ `users.role`), **không** nhận từ client.

### 2.2 Actor ở server
- Mọi route Import gọi `const actor = await getCurrentActor();` → `Actor | null`.
- **Tuyệt đối không** đọc `role`/`userId` từ body/query/header client.

### 2.3 Permission theo endpoint
| Endpoint | Permission |
|---|---|
| `POST /api/v1/admin/import/jobs` | `import:manage` |
| `POST /api/v1/admin/import/jobs/:jobId/items` | `import:manage` |
| `GET /api/v1/admin/import/jobs/:jobId` | `import:read` |
| `GET /api/v1/admin/import/items/:itemId` | `import:read` |
| `POST /api/v1/admin/import/items/:itemId/review` | `import:approve` |
| `POST /api/v1/admin/import/items/:itemId/retry` | `import:manage` |
| `POST /api/v1/admin/import/items/:itemId/publish` | `import:publish` |
| `GET/POST/PATCH /api/v1/admin/import/sources…` | `import:read` / `source:manage` |

- Cả 5 permission importer **chỉ** gán cho `admin` (I1). **Editor không** có quyền importer → 403.
- Guest (chưa đăng nhập) → **401**; thiếu quyền → **403** (do `requirePermission`).

### 2.4 Guard route (defense-in-depth)
- `app/(admin)/layout.tsx` redirect guest khỏi UI admin.
- Nhưng **API vẫn tự kiểm** quyền trong từng route/service (UI guard **không** thay thế kiểm server). Đúng như E2E P18 đã xác nhận (guest→401, editor→403, admin→200).

---

## 3. CSRF protection (phù hợp Auth.js + kiến trúc hiện tại)

- Auth.js v5 dùng **double-submit cookie CSRF token** cho các POST của chính nó; route `/api/auth/*` đã được xử lý.
- Với các route Import (POST/PATCH) — hiện codebase **chưa** có CSRF middleware dùng chung (cần xác nhận khi triển khai). Đề xuất (I2, chưa làm ở I2.1) **một trong hai**:
  - **(A — khuyến nghị)** Bật **kiểm `Origin`/`Sec-Fetch-Site`** (same-origin) cho mọi POST/PATCH admin + yêu cầu session cookie `SameSite=Lax` (mặc định Auth.js) → chặn cross-site form POST.
  - **(B)** Thêm **CSRF token double-submit** đọc từ cookie phiên (không lộ secret), kiểm ở `handle()` cho method không an toàn.
- **Không** dùng GET cho hành động ghi. **Không** đặt token CSRF trong body nếu chưa có cơ chế đọc cookie tương ứng.
- Quyết định (A) hay (B) ghi ở `IMPLEMENTATION_PLAN.md` như một **open decision** cần chốt trước khi code route.

---

## 4. Rate limit (theo actor **và** theo domain)

- **Theo actor:** giới hạn số lần `POST items`/`review`/`retry`/`publish` trên mỗi admin trong cửa sổ thời gian (ví dụ N request/phút) → chống lạm dụng. Vượt → **429** (đề xuất mở rộng `AppErrorCode` thêm `TOO_MANY_REQUESTS=429` — xem §5 ghi chú).
- **Theo domain:** tôn trọng `ImportSource.rateLimit` (xem `SOURCE_REGISTRY_DESIGN.md §5.2`); nguồn chưa đánh giá dùng mặc định bảo thủ.
- Vượt rate limit domain ⇒ item `queued` + hoãn (không retry dồn dập).
- **Không** tiết lộ ngưỡng/chi tiết nội bộ trong thông điệp lỗi.

---

## 5. Hợp đồng lỗi

Kế thừa `AppErrorCode` hiện có: `BAD_REQUEST(400)`, `VALIDATION_ERROR(422)`, `UNAUTHORIZED(401)`, `FORBIDDEN(403)`, `NOT_FOUND(404)`, `CONFLICT(409)`, `INTERNAL(500)`.

| Tình huống Import | HTTP | code | Ghi chú |
|---|---|---|---|
| Body/JSON sai cú pháp | 400 | `BAD_REQUEST` | không lộ parse detail |
| URL sai / bị chặn / vượt giới hạn | 422 | `VALIDATION_ERROR` | `details` chỉ nêu lý do an toàn (ví dụ `{"url":["scheme không được phép"]}`) |
| Chưa đăng nhập | 401 | `UNAUTHORIZED` | |
| Không có permission importer | 403 | `FORBIDDEN` | |
| Không thấy job/item | 404 | `NOT_FOUND` | |
| Dán trùng URL trong job | 409 | `CONFLICT` | hoặc trả item hiện có (idempotent) |
| Fetch/Extract thất bại | 200/202 | — | **item** `failed`, không phải lỗi HTTP (trạng thái nằm ở item) |
| Rate limit actor/domain | 429 | (đề xuất `TOO_MANY_REQUESTS`) | thêm code mới = mở rộng enum, ghi ở plan |
| Lỗi hệ thống | 500 | `INTERNAL` | message chung |

**Ghi chú mở rộng:** nếu cần **429**, phải bổ sung `"TOO_MANY_REQUESTS"` vào `AppErrorCode` (`lib/errors/app-error.ts`) và `STATUS_BY_CODE` — đây là **thay đổi tầng code** hợp lệ ở I2 (không phải schema). ghi nhận ở plan.

---

## 6. Đặc tả request/response (đề xuất — P16 §3)

### 6.1 `POST /api/v1/admin/import/jobs` — tạo job (`import:manage`)
Request:
```json
{ "mode": "url_import", "sourceId": null, "notes": "…", "maxItems": 1 }
```
Response 201:
```json
{ "id": "uuid", "mode": "url_import", "status": "created", "createdById": "uuid", "sourceId": null, "maxItems": 1, "notes": "…", "createdAt": "…", "updatedAt": "…" }
```
- `createdById` **không** nhận từ client — luôn từ actor.

### 6.2 `POST /api/v1/admin/import/jobs/:jobId/items` — thêm URL (`import:manage`)
Request:
```json
{ "urls": ["https://example.com/recipe/x"] }
```
Response 202/200:
```json
{
  "jobId": "uuid",
  "items": [
    { "id": "uuid", "status": "needs_review", "normalizedUrl": "https://example.com/recipe/x",
      "warnings": ["SOURCES_UNREGISTERED"] }
  ]
}
```
- Luồng: validate (URL_IMPORT_FLOW bước 2) → registry (bước 3) → fetch (bước 4) → E1 extract (bước 5) → normalize (bước 6) → lưu nháp (bước 7).
- Nếu vượt ngân sách thời gian (xem `VERCEL_COMPATIBILITY.md`): trả `status="queued"` cho item, xử lý tick sau.

### 6.3 `GET /api/v1/admin/import/items/:itemId` — chi tiết item (`import:read`)
Response 200:
```json
{
  "id": "uuid", "jobId": "uuid", "status": "needs_review",
  "processingStage": "extract", "attempts": 1, "maxAttempts": 3,
  "sourceUrl": "https://example.com/recipe/x", "normalizedUrl": "…",
  "warnings": ["JSONLD_NOT_FOUND"],
  "extraction": { "tiersUsed": ["E1"], "extractorVersion": "e1-jsonld@1", "fields": { "title": { "state": "CONFIRMED", "value": "…" } } },
  "recipeId": null, "duplicateOfItemId": null, "lastError": null,
  "createdAt": "…", "updatedAt": "…"
}
```
> Cần **mở rộng `ImportJobItemDto`** để trả `processingStage`/`leaseExpiresAt`/`duplicateOfItemId`/`lastError` (D10 — tầng code, không schema).

### 6.4 `POST /api/v1/admin/import/items/:itemId/review` (`import:approve`)
Request: `{ "decision": "approved" | "rejected" | "changes_requested", "notes": "…" }` → ghi `ContentReviewRecord` + `AuditLog`.

### 6.5 `POST /api/v1/admin/import/items/:itemId/retry` (`import:manage`)
- Chỉ hợp lệ khi item `failed`; reset attempts (theo chính sách) → `queued`.

### 6.6 `POST /api/v1/admin/import/items/:itemId/publish` (`import:publish`)
- Chỉ khi `approved` + `assertPublishable()`; tạo recipe qua `RecipeService` (bước 9). Thiếu điều kiện → 422 + danh sách lý do.

---

## 7. Không lộ thông tin nội bộ

- **Không** trả: IP đã kết nối, IP nội bộ, tên resolver, lỗi DNS chi tiết, stack, câu lệnh SQL, tên bảng/cột.
- Trường `lastError` trả client **đã làm sạch** (mã + mô tả nghiệp vụ, ví dụ "Không tải được nội dung nguồn.").
- Chi tiết kỹ thuật chỉ ghi **server-side log**.
- `warnings[]` chỉ chứa mã nghiệp vụ chuẩn (JSONLD_NOT_FOUND, SOURCES_UNREGISTERED, …), không chứa dữ liệu nhạy cảm.

---

## 8. Validation (Zod — đề xuất schema hợp đồng)

- `CreateJobInput`: `mode ∈ {url_import}` (I2 chặn `auto_discovery`), `maxItems` số nguyên 1..500, `notes` ≤ N ký tự, `sourceId` uuid|null.
- `AddItemsInput`: `urls: string[]` length 1..K (MVP khuyến nghị 1), mỗi URL ≤2048 ký tự, scheme http/https.
- `ReviewInput`: `decision ∈ {approved,rejected,changes_requested}`, `notes` ≤ N.
- **Không** nhận `createdById`, `status`, `role`, `recipeId`, `attempts` từ client (server-set).

---

## 9. Bất biến

1. Mọi API Import: guest→401, thiếu quyền→403 (kiểm **server**).
2. Actor/role **không** nhận từ client.
3. CSRF: hành động ghi chỉ qua POST/PATCH + kiểm Origin/token.
4. Rate limit **theo actor** và **theo domain**.
5. Error body **không** chứa thông tin nội bộ/IP/DNS/stack.
6. `createdById`/`status`/`recipeId` luôn server-set.

---

## 10. Kết luận

- API Import kế thừa **đúng** quy ước hiện có (`handle`/`jsonOk`/`toErrorResponse`; actor từ `getCurrentActor()`; quyền qua `requirePermission`).
- 5 permission importer admin-only đã sẵn; editor bị chặn.
- CSRF/rate limit/429 là các điểm cần chốt & có thể cần **mở rộng tầng code** (không schema) — ghi ở `IMPLEMENTATION_PLAN.md`.
- I2.1 **không** tạo route nào.
