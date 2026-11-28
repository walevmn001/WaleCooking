# I2.1 — IMPLEMENTATION PLAN (Kế hoạch triển khai I2)

> Phase **I2.1** (thiết kế, **KHÔNG triển khai**) · 1 AI Agent · không sub-agent.
> Mục tiêu: chia **I2 (Core URL Import MVP)** thành milestone nhỏ, xác định **dependency**, **acceptance criteria (AC)**, **test strategy** và **blocker** (yêu cầu 4).
> Nguồn: `docs/P16/IMPLEMENTATION_ROADMAP.md` (I2), các thiết kế anh em trong `docs/P18/I2.1/`.
> Ràng buộc: chỉ **1 AI agent**, **không sub-agent**; I2.1 không viết code. Plan này là kim chỉ nam cho phase triển khai I2 (phase riêng, được duyệt sau).

---

## 1. Phạm vi I2 (chốt theo roadmap)

**Trong phạm vi:** tạo job URL Import; thêm **1 URL**; validate + SSRF guard; fetch an toàn; trích xuất **E1 JSON-LD**; normalize giới hạn; lưu **bản nháp** (`ImportJobItem` + `RecipeExtraction`); xem chi tiết item. **Không** tạo recipe chính thức.

**Ngoài phạm vi I2:** localization (I4), dedupe (I5), review UI đầy đủ (I6), batch/worker (I7), discovery (I8), ảnh (I9), monitoring (I10), AI (I11). **Publish** chỉ ở mức: kết nối sẵn qua `RecipeService` (điều kiện đã có) — có thể hoãn sang I6 nếu chưa cần.

---

## 2. Milestone

### M0 — Hợp đồng & khung tầng code (không đổi schema)
- **Công việc:**
  - Mở rộng **DTO** `ImportJobItemDto` (+`processingStage`, `leaseExpiresAt`, `duplicateOfItemId`, `lastError`) — D10.
  - Bổ sung **method port** `ImportRepository`: `updateItemStatus`, `claimItem`, `upsertExtraction`, `findExtractionByHash`, `setItemRecipe` — D11.
  - Viết **adapter Prisma** cho `ImportRepository` (khuôn mẫu: `prisma-recipe.repository.ts`).
  - Zod schema cho input (jobs/items/review) — `API_AUTH_DESIGN.md §8`.
- **Dependency:** không (nền tảng).
- **AC:** typecheck pass; adapter có test đơn vị với DB test; **không** đổi `prisma/schema.prisma`, **không** migration mới.
- **Test:** unit (Vitest) cho adapter (create/find/update item; upsert extraction theo `contentHash`).

### M1 — SSRF guard (fetch an toàn) — *trái tim bảo mật*
- **Công việc:** hiện thực 11 lớp (`SSRF_SECURITY_DESIGN.md`) trong `lib/import/fetch.ts` (đề xuất): parse scheme/credentials, deny-list hostname, resolve-once, kiểm IPv4/IPv6/mapped, **pin IP** (`connect.lookup`/socket), redirect ≤5 kiểm lại mỗi hop, port {80,443}, timeout/size/MIME, chống compression bomb, header allow-list (không cookie/Authorization).
- **Dependency:** M0 (chỉ để chạy test trong ngữ cảnh app).
- **AC:** checklist 10 mục (`SSRF_SECURITY_DESIGN.md §4`) pass; URL private/metadata bị chặn; redirect nội bộ bị chặn; **không** header danh tính rời hệ thống; lỗi **không** lộ IP/DNS.
- **Test:** unit dày (bảng IP/bẫy: `127.0.0.1`, `::1`, `::ffff:127.0.0.1`, `169.254.169.254`, `10./172.16/192.168`, `file:`/`gopher:`, credentials, `2130706433`); integration với **fake DNS/resolver** tiêm được để test rebinding; server test cục bộ trả redirect nội bộ. **Không** fetch internet thật ở unit test.
- **Blocker tiềm ẩn:** chứng minh **pin IP** trên runtime (xem §5).

### M2 — Extraction E1 (JSON-LD)
- **Công việc:** `JsonLdRecipeExtractor` (`EXTRACTION_DESIGN.md §7`): quét `<script type="application/ld+json">`, hỗ trợ `@graph`, map 21 trường Schema.org `Recipe`, sinh `ProvenancedField` (state+tier+evidence), `ExtractionResult` + `warnings[]`.
- **Dependency:** M0.
- **AC:** từ fixture JSON-LD → trường lõi `CONFIRMED`; thiếu trường ⇒ `MISSING` (không bịa); `rawExtraction`/`tiersUsed`/`extractorVersion` sinh đúng.
- **Test:** unit với fixture HTML (JSON-LD hợp lệ, `@graph`, `HowToSection`, JSON lỗi, nhiều node Recipe, thiếu trường).

### M3 — Normalize + lưu nháp
- **Công việc:** normalize nghiêm ngặt (ISO-8601 duration → phút; trim/Unicode; map `unitRaw`→`Unit.code` khi khớp; map cuisine/category→`TaxonomyTerm` khi khớp); sinh `contentHash`; lưu `RecipeExtraction` (raw ở object storage ref); đặt `ImportJobItem.status=needs_review|failed`.
- **Dependency:** M0, M2.
- **AC:** không đổi đơn vị/không làm tròn/không tạo term mới; `contentHash` unique; `extractedAt`/`extractorVersion`/`rawExtraction` luôn ghi.
- **Test:** unit normalize (bảng được phép/bị cấm); integration lưu extraction (idempotent theo hash).

### M4 — API routes (khung I2)
- **Công việc:** `POST /api/v1/admin/import/jobs`, `POST .../jobs/:jobId/items`, `GET .../items/:itemId` — nối M1+M2+M3; actor từ `getCurrentActor()`; quyền `import:manage`/`import:read`; Zod; `handle`/`jsonOk`/`toErrorResponse`.
- **Dependency:** M0–M3.
- **AC:** guest→401, editor→403, admin→200 (E2E); URL private → 422 (không lộ chi tiết); URL JSON-LD → item `needs_review`; **không** tạo recipe.
- **Test:** integration/route test + E2E (Playwright/HTTP thật) như P18.
- **Quyết định mở cần chốt trước:** cơ chế CSRF (A: Origin check, hay B: double-submit token) — `API_AUTH_DESIGN.md §3`; có thêm `TOO_MANY_REQUESTS=429` cho rate limit actor không — `§5`.

### M5 — Rate limit (actor + domain)
- **Công việc:** giới hạn theo actor (route items/review/retry/publish) + tôn trọng `ImportSource.rateLimit`.
- **Dependency:** M4.
- **AC:** vượt ngưỡng → 429 (nếu chấp nhận thêm code) hoặc thông điệp an toàn; không lộ ngưỡng.
- **Test:** unit rate limiter; integration 429.

### M6 — Publish hook (tuỳ chọn trong I2, có thể dời I6)
- **Công việc:** `POST .../items/:itemId/publish` → `RecipeService.create()` + gắn nguồn (`ContentSource`/`RecipeSource`) + `publish()`; set `recipeId`, `status=published`.
- **Dependency:** M4; điều kiện `assertPublishable` đã có.
- **AC:** chỉ khi `approved` + đạt điều kiện; thiếu → 422 + lý do; **không** auto-publish; **không** ghi đè recipe cũ.
- **Test:** integration (publish thành công tạo recipe mới + nguồn; thiếu điều kiện → 422).

---

## 3. Dependency graph

```
M0 ─▶ M1 (SSRF) ─┐
     └▶ M2 (E1) ─┼─▶ M3 (normalize+lưu) ─▶ M4 (API) ─▶ M5 (rate limit)
                 │                                   └─▶ M6 (publish hook, tuỳ chọn)
                 └───────────────────────────────────┘
```
- **Đường găng:** M0 → M1 → M3 → M4 (M2 song song được với M1 vì độc lập).
- M5/M6 sau M4.

---

## 4. Test strategy tổng thể

| Loại | Phạm vi | Công cụ |
|---|---|---|
| Unit | SSRF (bảng IP/bẫy, redirect, bomb), normalize, extractor, rate limiter | Vitest |
| Integration | adapter Prisma (DB test), lưu extraction idempotent, route handler | Vitest + Postgres test |
| E2E/HTTP | 401/403/200; URL private→422; URL JSON-LD→`needs_review`; publish | Playwright / HTTP thật (như P18) |
| Security | checklist 10 mục SSRF; không rò header danh tính; không lộ IP/DNS | bộ test chuyên biệt, **fake resolver** |
| Fixtures | HTML JSON-LD (hợp lệ/`@graph`/lỗi/thiếu trường) | tệp tĩnh, **không** fetch internet ở unit |

- **Không** gọi internet thật trong unit/integration; dùng server cục bộ + resolver tiêm.
- Mọi thao tác ghi phải có test AuditLog.

---

## 5. Blocker & rủi ro

| # | Blocker/Rủi ro | Mức | Xử lý |
|---|---|---|---|
| B1 | **Pin IP** trên Node runtime (undici `connect.lookup`/socket thủ công) chưa chứng minh | **Cao** | Spike nhỏ ở đầu M1; nếu bất khả thi → **fail-closed** + cân nhắc worker/VPS (`SSRF_SECURITY_DESIGN.md §3.4`) |
| B2 | Không có egress firewall trên Hobby | Cao | Dựa kiểm IP ứng dụng + pin IP; tài liệu hóa rủi ro còn lại |
| B3 | Trần thời gian function Hobby chưa đo | Trung | Ngân sách nhỏ + nhánh `queued` (`VERCEL_COMPATIBILITY.md`) |
| B4 | CSRF mechanism chưa chốt (A/B) | Trung | Chốt trước M4 (`API_AUTH_DESIGN.md §3`) |
| B5 | Có thêm `TOO_MANY_REQUESTS=429` không | Thấp | Cần nếu bật rate limit actor (M5) |
| B6 | `nextAttemptAt` (lịch retry) **chưa có** trong schema | Trung | Nếu cần schedule chính xác ⇒ **đề xuất** thêm cột ở phase riêng (không sửa schema ở I2.1); trước mắt dùng `leaseExpiresAt`/`nextAttemptAt` tạm bằng truy vấn `queued` |
| B7 | Hạn mức Hobby cần kiểm chứng lại trước deploy | Thấp | Kiểm ở phase deploy |

> B6 là **đề xuất schema cho phase riêng** — I2.1 **không** sửa schema.

---

## 6. Acceptance criteria tổng (I2)

1. Dán 1 URL có JSON-LD ⇒ tạo `ImportJobItem` `needs_review` + `RecipeExtraction` (E1), **không** tạo recipe chính thức.
2. URL private/loopback/metadata/`file:`/credentials ⇒ bị chặn (**422**), không fetch.
3. Redirect sang IP nội bộ bị chặn; >5 redirect dừng.
4. Không header Cookie/Authorization nào gửi ra ngoài; client **không** thấy IP/DNS.
5. Guest→401, editor→403, admin→200; actor/quyền kiểm **server**.
6. Idempotency: dán lại cùng URL/cùng nội dung **không** tạo bản ghi trùng.
7. **Không** auto-publish; publish (nếu làm) chỉ khi `approved` + `assertPublishable()`, tạo recipe **mới** + nguồn.
8. Không đổi `prisma/schema.prisma`; **không** migration/seed mới.
9. Toàn bộ SSRF checklist 10 mục pass; test suite xanh.

---

## 7. Deliverable của phase I2 (dự kiến)

- **Code:** `lib/import/fetch.ts` (SSRF guard), `lib/import/extract/jsonld.ts` (E1), `lib/import/normalize.ts`, adapter Prisma `ImportRepository`, mở rộng `ImportService`, `lib/validation/import.ts`, `app/api/v1/admin/import/**/route.ts` (3 route lõi).
- **Không** có trong I2: schema/migration mới, dependency mới (trừ khi được duyệt), route ngoài 3 lõi (+ M5/M6 nếu bật).
- **Checkpoint:** `docs/checkpoints/P17_I2_CHECKPOINT.md`.

---

## 8. Kết luận

- I2 chia **7 milestone** (M0–M6) với đường găng rõ; M1 (SSRF) là rủi ro cao nhất cần spike sớm.
- Dependency, AC, test strategy và blocker đã xác định; các **quyết định mở** (CSRF, 429, pin IP, `nextAttemptAt`) ghi rõ để chốt trước khi code.
- Kế hoạch **không** thực hiện ở I2.1; đây là đầu vào cho phase triển khai I2 sau khi chủ dự án duyệt.
