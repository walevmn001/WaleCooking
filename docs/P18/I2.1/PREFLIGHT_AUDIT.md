# I2.1 — PREFLIGHT AUDIT

> Phase **I2.1** (audit + thiết kế, **KHÔNG triển khai**) · Ngày: 2026-11-28 · 1 AI Agent · **không** sub-agent.
> Tiếp nối checkpoint **P18** tại commit `6e211c7`; tuân theo kiến trúc P16 và tiền đề hạ tầng I1 (P17).
> Mục tiêu tài liệu: ghi lại **kết quả audit code thực tế** trước khi thiết kế URL Import (I2), đối chiếu với tài liệu P16 và checkpoint I1/P18.
> Nguyên tắc: **không suy đoán cấu trúc code khi chưa kiểm tra thực tế**. Mọi phát biểu dưới đây đã được xác minh trực tiếp trên repo (đường dẫn + số dòng).

---

## 1. Git preflight

| Mục | Kết quả (xác minh bằng `git`) |
|---|---|
| Branch hiện tại | `trae/agent-GnjYMp` |
| `HEAD` | `6e211c717c55867e4948ac8775b7a50466b5b195` |
| `origin/main` | `6e211c717c55867e4948ac8775b7a50466b5b195` (bằng `HEAD`) |
| `git status --short` | **Sạch** (không có thay đổi chưa commit) |
| Commit gần nhất | `6e211c7 feat(P18): tích hợp Auth.js — xác thực quản trị & phân quyền nền tảng (giải quyết B-P06-02)` |
| Commit trước | `9ca6537 feat(P17/I1): hạ tầng & tiền đề Recipe Importer (schema, permission, khung service)` |

**Xác nhận checkpoint:** commit `6e211c7` **tồn tại** trong lịch sử và là `HEAD` = `origin/main`. Điều kiện tiên quyết của I2 (**B-P06-02** — Auth.js) **đã được gỡ** ở P18.

> Ràng buộc Git của I2.1: chỉ commit tài liệu thuộc I2.1; **không** force-push/rewrite history; push **fast-forward** lên `origin/main`.

---

## 2. Tài liệu P16 liên quan I2 (đã đọc — đối chiếu thiết kế)

Đã đọc **toàn bộ** tài liệu P16 liên quan tới I2:

| Tài liệu | Nội dung dùng cho I2 |
|---|---|
| `docs/P16/IMPLEMENTATION_ROADMAP.md` | Định nghĩa **I2 = Core URL Import (MVP)** (ưu tiên số 1): phạm vi `POST jobs`, `POST jobs/:id/items`, `GET items/:id`, fetch an toàn + E1 JSON-LD + tạo draft; AC "dán 1 URL JSON-LD → item `needs_review`; URL private bị chặn; không tạo recipe chính thức". |
| `docs/P16/SECURITY_LEGAL_RESOURCE_LIMITS.md` | SSRF (8 bước kiểm URL), fetch an toàn (size/MIME/timeout/chống zip bomb), HTML/JS, prompt injection, lạm abuse, checklist 10 mục, rủi ro còn lại. |
| `docs/P16/SOURCE_DISCOVERY_STRATEGY.md` | Discovery D1–D9, 5 tầng L1–L5, **Source Registry** (trường + vòng đời trạng thái), robots/ToS/copyright/attribution/rate/ảnh/opt-out. |
| `docs/P16/EXTRACTION_ENGINE.md` | Pipeline 5 bậc E1–E5, ánh xạ 21 trường, `FieldState` (MISSING/UNREADABLE/CONFIRMED/DERIVED/CONFLICT), interface `RecipeExtractor`/`ExtractionEngine`, lưu raw, cấm bịa/quy đổi đơn vị. |
| `docs/P16/DUPLICATE_DETECTION.md` | 6 lớp L1–L6, 4 nhãn EXACT/LIKELY/SIMILAR/DIFFERENT, bất biến không xoá/ghi đè, Data Quality Score. |
| `docs/P16/BATCH_PROCESSING_ARCHITECTURE.md` | DB-backed queue, checkpoint trong DB, worker stateless, claim `FOR UPDATE SKIP LOCKED`, đánh giá Vercel Hobby, 4 phương án worker A/B/C/D, trần 500. |
| `docs/P16/ADMIN_REVIEW_WORKFLOW.md` | Tinh gọn 12→9 trạng thái, 11 thao tác admin, chỉ admin, một đường ghi `RecipeService`. |
| `docs/P16/DATABASE_DESIGN.md` | 6 entity mới + 11 enum, phân tầng A–F, retention, ma trận idempotency. |
| `docs/P16/API_DESIGN.md` | 10 endpoint admin + hỗ trợ, hợp đồng lỗi, phác thảo route. |
| `docs/checkpoints/P16.*` / `P16_CHECKPOINT.md` | Bối cảnh quyết định & ràng buộc xuyên phase. |

---

## 3. Checkpoint P17/I1 và P18 (đã đọc)

- **`docs/checkpoints/P17_I1_CHECKPOINT.md`** — xác nhận I1 hoàn thành: schema 6 model + 11 enum + migration `20261128104202_add_recipe_importer_schema`, permission importer `import:read/manage/approve/publish` + `source:manage` (admin-only), port `ImportRepository` + khung `ImportService`. Ghi **B-P06-02** là tiền đề bắt buộc của I2.
- **`docs/checkpoints/P18_AUTHJS_CHECKPOINT.md`** — xác nhận Auth.js đã nối (Credentials + JWT), `getCurrentActor()` trả actor thật, guard `/admin` + `/api/v1/admin`, 401/403 kiểm qua **HTTP thật** (E2E), `pnpm admin:create` provisioning. 10/10 AC PASS. **Giải quyết B-P06-02**.

---

## 4. Auth.js · `getCurrentActor()` · admin authorization · importer permission (audit thực tế)

### 4.1 Auth.js (đã nối — P18)
- `auth.ts` (root): `NextAuth({ session: { strategy: "jwt" }, pages: { signIn: "/dang-nhap" }, trustHost: true, providers: [Credentials(...)], callbacks: { jwt, session } })`. Role lấy từ `users.role` ký trong JWT; `token.id` thu hẹp kiểu về `string`.
- `app/api/auth/[...nextauth]/route.ts`: re-export `handlers` (`GET`/`POST`).
- `lib/auth/password.ts`: băm/kiểm mật khẩu **scrypt** (`node:crypto`), không thêm dependency.

### 4.2 `getCurrentActor()` (điểm nối actor duy nhất)
`lib/auth/session.ts` nối `await auth()` và trả `Actor | null`:
```
getCurrentActor(): Promise<Actor | null>  // { id, role } hoặc null (guest)
```
Đây là **nguồn danh tính duy nhất** ở server; **không** tin role/actor từ client.

### 4.3 Authorization (RBAC tập trung) — [lib/auth/authorization.ts](file:///workspace/lib/auth/authorization.ts)
- `APP_ROLES = ["user","editor","admin"]`; `ROLE_RANK` user=1 < editor=2 < admin=3.
- `Actor { id, role }`; `null` = guest.
- Hàm: `hasRole`, `can`, `canAll`, `isGuest`, `requireActor` (**401** nếu guest), `requirePermission` (**401** nếu guest, **403** nếu thiếu quyền).
- **Permission importer đã tồn tại** (union `Permission`, dòng 35–40): `import:read`, `import:manage`, `import:approve`, `import:publish`, `source:manage` — **chỉ gán cho `admin`** (`PERMISSIONS_BY_ROLE.admin`, dòng 66–70). `editor` **không** có permission importer.

> Hệ quả thiết kế I2: mọi API Import kế thừa trực tiếp mô hình này — gọi `getCurrentActor()` rồi `requirePermission(actor, "import:*" | "source:manage")`. Không tạo cơ chế quyền song song.

### 4.4 Bảo vệ route hiện có
- `app/(admin)/layout.tsx`: guard server — `!actor || !hasRole(actor, "editor")` → redirect `/dang-nhap`.
- `/api/v1/admin/**`: kiểm quyền **trong từng route/service** qua `getCurrentActor()` + `requirePermission` (E2E xác nhận guest→401, editor→403, admin→200).

---

## 5. RecipeService · RecipeRepository · media storage · API conventions (audit thực tế)

### 5.1 RecipeService — "một đường ghi chính thức" — [lib/services/recipe.service.ts](file:///workspace/lib/services/recipe.service.ts)
- `create(actor, raw)` → `requirePermission(actor, "recipe:create")`.
- `publish(actor, id)` → `requirePermission(actor, "recipe:publish")` + `assertPublishable(detail)`.
- `assertPublishable()` (cổng BR-01/BR-03) yêu cầu: title, summary, foodType, cuisine, `baseServings > 0`, totalMinutes, ≥1 nguyên liệu, ≥1 bước, primaryImage, **≥1 nguồn (source)**.
- Có `softDelete()` (đặt `deletedAt`) — **chỉ** admin gọi.

> Hệ quả I2: bước publish của importer **phải** đi qua `RecipeService.create()` + `publish()`; importer **không** tạo đường ghi thứ hai và **không** tạo bảng recipe song song.

### 5.2 RecipeRepository — [lib/db/repositories/recipe.repository.ts](file:///workspace/lib/db/repositories/recipe.repository.ts)
- Port + DTO (interface) + adapter Prisma `prisma-recipe.repository.ts` (transaction, resolve term/unit, mapping). Đây là khuôn mẫu ports/adapters cho `ImportRepository`.

### 5.3 Media storage — [lib/services/media.service.ts](file:///workspace/lib/services/media.service.ts), [lib/storage/*](file:///workspace/lib/storage)
- `StoragePort { provider, put, delete, publicUrl, getSignedUrl? }`; `getStorage()` resolve **lazy** (guard production thiếu `R2_*` → ném lỗi rõ ràng, không ghi FS tạm — FIND-07/P12.3).
- `validateImageFile(bytes)` dùng **magic bytes** (JPEG/PNG/WebP/AVIF), `MAX_IMAGE_BYTES = 8MB`, `MAX_IMAGE_DIMENSION = 8192`; **không** tin `Content-Type` client.
- `buildStorageKey(ext, filename)` sinh key **server-side** (`recipes/YYYY/MM/<uuid>-<slug>.<ext>`).

> Hệ quả I2: tải ảnh nguồn (I9) **tái sử dụng** `MediaService`/`validateImageFile`; I2 **không** tải ảnh. Raw HTML lưu ở object storage (ref), **không** nhồi vào Postgres.

### 5.4 API conventions — [lib/api/http.ts](file:///workspace/lib/api/http.ts), [lib/errors/app-error.ts](file:///workspace/lib/errors/app-error.ts)
- Vị trí: `app/api/v1/admin/<resource>/route.ts` (App Router Route Handlers).
- Handler bọc `handle(async () => { ... return jsonOk(data) })`; thành công trả **data trực tiếp** (`jsonOk<T>(data, status=200)`).
- Lỗi: `{ error: { code, message, details? } }` qua `toErrorResponse()`; `ValidationError`→422, `UnauthorizedError`→401, `ForbiddenError`→403, `ConflictError`→409, `NotFoundError`→404, mặc định 500 (400 dùng cho lỗi parse request). **Không** lộ stack/chi tiết nội bộ (500 generic).
- Validate input bằng **Zod**; không nhận field tự do (chống mass assignment).

### 5.5 `ImportService` + `ImportRepository` (khung I1 — sẽ mở rộng ở I2)
- [lib/services/import.service.ts](file:///workspace/lib/services/import.service.ts): `ImportService` đã có `getJob`, `getItem`, `listJobItems` (`import:read`), `createJob`, `addItem` (`import:manage`); `createdById` **luôn lấy từ actor**.
- [lib/db/repositories/import.repository.ts](file:///workspace/lib/db/repositories/import.repository.ts): **port-only** (không truy vấn); DTO `ImportSourceDto/ImportJobDto/ImportJobItemDto`; method `findJobById`, `createJob`, `findItemById`, `listItemsByJob`, `createItem`, `findSourceByDomain`.
- **Chưa có adapter Prisma** cho importer (thuộc I2). UI **không** import port trực tiếp.

---

## 6. Next.js runtime & Vercel Hobby constraints (audit thực tế)

- `next@16.4.6`, App Router, `react@19.3.1`, `typescript@5.9.3`, `prisma@6.19.3`, `zod@4.6.7`, `next-auth@5.0.0-beta.32`.
- `next.config.ts`: security headers (`X-Content-Type-Options`, `X-Frame-Options: SAMEORIGIN`, `Referrer-Policy`, `X-DNS-Prefetch-Control`, `Permissions-Policy`), `poweredByHeader: false`; **KHÔNG** có CSP (ghi chú: Next.js cần inline style/script → tránh phá giao diện).
- `lib/db/prisma.ts`: **Proxy lazy** → `next build` **không** cần `DATABASE_URL` (FIND-04/P12.2).
- `lib/config/env.ts`: `serverEnv()` lazy/memoized; thông báo lỗi **chỉ nêu tên biến**, không nêu giá trị. Có `AUTH_SECRET`, `AUTH_URL`, `R2_*`, `TEST_DATABASE_URL`.
- Deploy target: **Vercel Hobby** (phi thương mại). Ràng buộc (theo `docs/P02/DEPLOYMENT_ARCHITECTURE.md` + `P16.5 §6`): serverless **ephemeral**, thời gian thực thi function **thấp**; Vercel Cron gói thấp ~1 lần/ngày; ~100GB transfer + 1M req/tháng. **Không** giả định có background worker thường trực.
- **Giới hạn chưa kiểm chứng live** (kế thừa P16.0 §7): số liệu hạn mức free cần kiểm lại trước deploy; sandbox không có quyền truy cập Vercel production.

---

## 7. Đối chiếu **I1 đã triển khai** vs **P16 đề xuất** (sai lệch cần ghi rõ)

Audit xác nhận schema importer I1 **khớp** thiết kế P16.7 với vài khác biệt cần lưu ý khi thiết kế I2:

| # | Hạng mục | P16 đề xuất | **Thực tế I1 (`prisma/schema.prisma`)** | Ảnh hưởng I2 |
|---|---|---|---|---|
| D1 | `ImportJobItem.status` default | `pending` | **`queued`** (dòng 1426) | I2 phải dùng đúng 9 giá trị enum: `discovered/queued/processing/needs_review/duplicate/failed/approved/rejected/published`. |
| D2 | `RecipeExtraction.rawExtraction` | `Json?` (tùy chọn) | **`Json` required** (dòng 1463) | Adapter extraction **bắt buộc** ghi `rawExtraction` khi tạo bản ghi. |
| D3 | `RecipeExtraction.extractorVersion` | `String` | `String` **required** (dòng 1462) | Phải có version extractor (dùng cho tái xử lý). |
| D4 | `RecipeExtraction.extractedAt` | `timestamptz` | `DateTime` **required**, **không** default (dòng 1467) | Code phải tự set `extractedAt`. |
| D5 | `RecipeExtraction.contentHash` | unique | `String @unique` (dòng 1460, 1476) | Idempotency theo nội dung — **bắt buộc** sinh hash. |
| D6 | `ImportJobItem` trường phụ | `processingStage`, `workerId`, `duplicateOfItemId` | **Đã có** (dòng 1427/1431/1434) + self-relation `ImportItemDuplicate`, `ItemPrimaryExtraction`/`ExtractionJobItem` | I2 dùng được ngay. |
| D7 | `ImportJob.sourceId` | `SetNull` | `onDelete: SetNull` (dòng 1410) | Giữ job khi nguồn bị xoá. |
| D8 | `ImportJobItem.sourceId` | — | Có (dòng 1422) — P16.7 đề xuất | Cho phép item gắn nguồn trực tiếp. |
| D9 | Enums | 11 enum | **11 enum** (đủ) | Không thiếu enum. |
| D10 | `ImportJobItemDto` (port I1) | — | **Chưa** expose `processingStage`, `leaseExpiresAt`, `duplicateOfItemId`, `lastError` | I2 cần **mở rộng DTO** (không đổi schema) khi làm worker/detail. |
| D11 | `ImportRepository` (port I1) | — | Chỉ 6 method; **chưa có** `updateItemStatus/claimItem/upsertExtraction`… | I2 cần **bổ sung method port** + adapter Prisma (không đổi schema). |

> **Kết luận §7:** schema I1 **không** thiếu thành phần so với P16.7 cho I2; chỉ cần **mở rộng DTO/port/adapter** (tầng code) khi triển khai I2 — **không** cần sửa schema/migration. Việc sửa schema (nếu về sau phát sinh) sẽ ghi đề xuất cho phase riêng, **không** làm trong I2.1.

---

## 8. Kết luận preflight

1. **Git:** sạch; `HEAD` = `origin/main` = `6e211c7`; đúng checkpoint P18.
2. **Tài liệu:** đã đọc đủ P16 (10 tài liệu liên quan) + checkpoint P17/I1 + P18.
3. **Auth & quyền:** Auth.js đã nối; `getCurrentActor()` thật; RBAC tập trung; **5 permission importer** đã tồn tại (admin-only). ⇒ Điều kiện tiên quyết của I2 **đã sẵn sàng**.
4. **Recipe/Media/API:** đã xác minh "một đường ghi" (`RecipeService` + `assertPublishable`), media magic-bytes/R2 lazy, quy ước API (`handle`/`jsonOk`/`toErrorResponse`).
5. **Runtime:** Next.js 16 App Router + Prisma lazy + Vercel Hobby ephemeral; **không** worker thường trực.
6. **Sai lệch I1 vs P16:** đã ghi rõ ở §7 (11 khác biệt); **không** thiếu schema cho I2.
7. **Phạm vi I2.1:** chỉ audit + thiết kế tài liệu. **Không** viết code, **không** thêm API, **không** sửa schema/migration, **không** fetch URL, **không** chuyển sang I2.2.

> Các tài liệu thiết kế tiếp theo (`URL_IMPORT_FLOW`, `SSRF_SECURITY_DESIGN`, `SOURCE_REGISTRY_DESIGN`, `EXTRACTION_DESIGN`, `DATA_REVIEW_WORKFLOW`, `API_AUTH_DESIGN`, `VERCEL_COMPATIBILITY`, `IMPLEMENTATION_PLAN`) đều dựa trên kết quả audit này.
