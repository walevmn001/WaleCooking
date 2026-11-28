# P16.9 — IMPLEMENTATION ROADMAP

> Phase **P16** (thiết kế) · Milestone **P16.9** · 1 AI Agent · Không triển khai code.
> Mục tiêu: chuyển các thiết kế P16.1–P16.8 thành **roadmap triển khai theo phase nhỏ**, mỗi phase có mục tiêu/phạm vi/files/DB/API/tests/AC/risks/checkpoint.
> Nguyên tắc gốc: **URL Import ổn định trước**, **rồi mới** Auto Discovery & batch 500. **Không** gộp tất cả vào một phase lớn.
> Liên quan: tất cả tài liệu P16.

---

## 1. Tổng quan thứ tự phase

| Phase | Tên | Phụ thuộc | Kết quả then chốt |
|---|---|---|---|
| **I1** | Hạ tầng & tiền đề (Auth/permission, schema extension) | Auth.js (B-P06-02) | Nền DB + quyền + route skeleton |
| **I2** | **Core URL Import (MVP)** | I1 | Admin dán URL → tạo recipe nháp |
| **I3** | Extraction engine (E1–E4) | I2 | Trích xuất JSON-LD/metadata/adapter/heuristic |
| **I4** | Localization + Validation dữ kiện | I3 | Việt hoá song song + kiểm I1–I9 |
| **I5** | Duplicate detection | I3 | Gắn nhãn trùng + `DuplicateCandidate` |
| **I6** | Admin review UI | I2–I5 | Inbox/chi tiết/duyệt/publish |
| **I7** | Batch processing (tick → ≤500) | I2–I6 | Job/item + queue + resume/retry/idempotency |
| **I8** | Auto Discovery | I7 | Sitemap/RSS/index + Source Registry vận hành |
| **I9** | Image processing | I3, I8 | Tải ảnh **có kiểm soát** + MediaAsset |
| **I10** | Monitoring & cost control | I7 | Dashboard chi phí/lỗi/hạn mức |
| **I11** | AI-assisted extraction (E5) | I3, I10 | Bậc E5 tùy chọn, có cổng chi phí |

> Phase sớm **không** phụ thuộc phase sau. I9/I11 **tùy chọn** (có thể hoãn).

---

## 2. Chi tiết từng phase

### I1 — Hạ tầng & tiền đề
- **Mục tiêu**: có nền DB + quyền + khung route để bắt đầu import.
- **Phạm vi**: thêm migration cho 6 entity mới (P16.7 DB) + enum; thêm permission importer; nối Auth.js hoặc cơ chế actor admin tối thiểu (điều kiện tiên quyết).
- **Files dự kiến**: `prisma/schema.prisma`, `prisma/migrations/**`, `lib/auth/authorization.ts` (permission), `lib/db/repositories/*` (port mới), `lib/services/import.service.ts` (khung).
- **Database changes**: `ImportSource`, `ImportJob`, `ImportJobItem`, `RecipeExtraction`, `RecipeTranslationDraft`, `DuplicateCandidate` + 11 enum.
- **API changes**: chưa (chỉ skeleton rỗng).
- **Dependencies**: **Auth.js** (blocker B-P06-02) — nếu chưa xong, dùng cơ chế admin tối thiểu được kiểm soát.
- **Tests**: migration chạy trên Neon test branch; test repository port.
- **AC**: migration áp dụng thành công **chỉ** trên môi trường test/dev; quyền importer enforce được; `pnpm typecheck` xanh.
- **Risks**: migration lệch schema; quyền chưa hoạt động do Auth.js.
- **Checkpoint**: `P17_I1_CHECKPOINT.md`; **Điều kiện hoàn thành**: schema mở rộng + quyền + CI xanh.

### I2 — Core URL Import (MVP) ← **ưu tiên số 1**
- **Mục tiêu**: admin dán 1..N URL → hệ thống tải + trích xuất tối thiểu + tạo **recipe nháp** để admin hoàn thiện.
- **Phạm vi**: `POST jobs`, `POST jobs/:id/items`, `GET items/:id`, fetch an toàn (P16.8 §3) + E1 JSON-LD + tạo draft.
- **Files dự kiến**: `app/api/v1/admin/import/**`, `lib/services/import.service.ts`, `lib/import/fetch.ts` (SSRF guard), `lib/import/extract/jsonld.ts`, `lib/validation/import.ts`.
- **Database changes**: dùng entity I1 (không thêm).
- **API changes**: 3 endpoint (tạo job, thêm URL, chi tiết item).
- **Dependencies**: I1.
- **Tests**: URL validator (SSRF/private IP/scheme/redirect), JSON-LD parse, e2e happy path 1 URL.
- **AC**: dán 1 URL JSON-LD → tạo item `needs_review` với nguyên liệu/bước; URL private bị chặn; không tạo recipe chính thức.
- **Risks**: SSRF guard chưa đủ mạnh; site không có JSON-LD.
- **Checkpoint**: `P17_I2_CHECKPOINT.md`; **Điều kiện hoàn thành**: import 1 URL chạy ổn định end-to-end.

### I3 — Extraction engine (E1–E4)
- **Mục tiêu**: pipeline 5 bậc (bỏ E5) + trạng thái trường + lưu raw.
- **Phạm vi**: `RecipeExtractor` interface + adapter `jsonld`/`metadata`/`heuristic` + hợp nhất có kiểm soát + `RecipeExtraction` (raw).
- **Files**: `lib/import/extract/**`, `lib/import/normalize.ts`, repository `extraction.repository.ts`.
- **Database changes**: dùng `RecipeExtraction`.
- **API changes**: mở rộng `GET items/:id` trả trạng thái trường + warnings.
- **Dependencies**: I2.
- **Tests**: fixture HTML; state `MISSING/CONFIRMED/…`; bất biến "không bịa định lượng".
- **AC**: ≥3 biến thể JSON-LD + 1 site adapter + heuristic đều pass; raw được lưu.
- **Risks**: selector theo site dễ vỡ.
- **Checkpoint**: `P17_I3_CHECKPOINT.md`; **Điều kiện hoàn thành**: 3 tầng extractor hoạt động.

### I4 — Localization + Validation
- **Mục tiêu**: Việt hoá lưu song song + kiểm dữ kiện I1–I9.
- **Phạm vi**: `RecipeTranslationDraft`, placeholdering số, glossary, validator cặp gốc↔dịch.
- **Files**: `lib/import/localize/**`, `lib/import/validate-translation.ts`, `data/glossary.*`.
- **Database changes**: dùng `RecipeTranslationDraft`.
- **API changes**: `GET items/:id` trả `originalContent`/`localizedContent` + `validationResult`.
- **Dependencies**: I3.
- **Tests**: pair invariant; số bất biến; fixture lỗi I1–I7.
- **AC**: validator phát hiện đủ lỗi cứng; **không** auto-publish.
- **Risks**: dịch sai số; glossary thiếu.
- **Checkpoint**: `P17_I4_CHECKPOINT.md`; **Điều kiện hoàn thành**: bản dịch song song + validation chạy.

### I5 — Duplicate detection
- **Mục tiêu**: 6 lớp kiểm + 4 nhãn + `DuplicateCandidate`.
- **Phạm vi**: L1/L2 (URL) + L3/L4/L5 (trigram/Jaccard/shingle) + L6 (tùy chọn, tắt mặc định).
- **Files**: `lib/import/dedupe/**`, repository `duplicate.repository.ts`.
- **Database changes**: dùng `DuplicateCandidate` + index `pg_trgm`.
- **API changes**: nhãn trùng trong `GET items/:id`.
- **Dependencies**: I3.
- **Tests**: cặp fixture; precision/recall; bất biến "không xoá/ghi đè".
- **AC**: nhãn đúng trên bộ fixture; không tự xoá recipe.
- **Risks**: dương/âm tính giả.
- **Checkpoint**: `P17_I5_CHECKPOINT.md`; **Điều kiện hoàn thành**: dedupe chạy + báo cáo.

### I6 — Admin review UI
- **Mục tiêu**: Inbox + Item Detail (split view) + duyệt/publish.
- **Phạm vi**: UI admin + 4 endpoint (review, publish, retry, cancel) + tinh gọn 9 trạng thái.
- **Files**: `app/(admin)/import/**`, `app/api/v1/admin/import/**`, component split-view.
- **Database changes**: không (dùng `ContentReviewRecord`).
- **API changes**: review/publish/retry/cancel.
- **Dependencies**: I2–I5.
- **Tests**: UI flows (Playwright); publish chỉ khi `approved` + `assertPublishable`.
- **AC**: admin duyệt → publish tạo `Recipe` published; có nguồn (BR-03).
- **Risks**: UI phức tạp; phụ thuộc Auth.js.
- **Checkpoint**: `P17_I6_CHECKPOINT.md`; **Điều kiện hoàn thành**: workflow duyệt end-to-end.

### I7 — Batch processing (≤500)
- **Mục tiêu**: job/item + queue + resume/retry/idempotency + worker tick.
- **Phạm vi**: claim nguyên tử, lease/resume, backoff, rate limit theo domain, cancel, dead-letter; trần 500.
- **Files**: `lib/import/worker/**`, `lib/services/import.service.ts`, `app/api/v1/admin/import/worker/tick/route.ts`.
- **Database changes**: index `(status, leaseExpiresAt)` (đã thiết kế I1).
- **API changes**: `GET jobs/:id` (tiến độ); worker tick.
- **Dependencies**: I2–I6.
- **Tests**: claim đồng thời; kill/resume; retry 429; cancel.
- **AC**: batch 500 chạy, resume đúng, không tạo bản ghi trùng, 1 item lỗi không dừng job.
- **Risks**: thông lượng tick thấp; hạn mức free.
- **Checkpoint**: `P17_I7_CHECKPOINT.md`; **Điều kiện hoàn thành**: batch 500 với resume/retry.

### I8 — Auto Discovery
- **Mục tiêu**: discovery từ nguồn đã bật + Source Registry vận hành.
- **Phạm vi**: sitemap/RSS/index (+ search engine tùy chọn); registry UI/API; deny-list.
- **Files**: `lib/import/discovery/**`, `app/api/v1/admin/import/sources/**`.
- **Database changes**: dùng `ImportSource`.
- **API changes**: discovery + sources.
- **Dependencies**: I7.
- **Tests**: parse sitemap/feed; chỉ nguồn `auto_enabled`; tôn trọng robots.
- **AC**: discovery chỉ trên nguồn hợp lệ; không crawl ngoài registry.
- **Risks**: robots/ToS thay đổi; bị chặn.
- **Checkpoint**: `P17_I8_CHECKPOINT.md`; **Điều kiện hoàn thành**: discovery có kiểm soát.

### I9 — Image processing (tùy chọn)
- **Mục tiêu**: tải ảnh **có kiểm soát** (chỉ khi được phép) → `MediaAsset`.
- **Phạm vi**: fetch ảnh an toàn, magic bytes/`MAX_IMAGE_BYTES`, attribution license; mặc định **không** ảnh nguồn.
- **Files**: `lib/import/image/**` (tái dùng `MediaService`/`validateImageFile`).
- **Database changes**: dùng `MediaAsset` + `RecipeImage`.
- **API changes**: tùy chọn cờ "nhập ảnh" khi approve.
- **Dependencies**: I3, I8.
- **Tests**: chặn MIME/độ lớn sai; không thực thi ảnh; chỉ tải khi license OK.
- **AC**: ảnh nguồn chỉ tải khi được phép; lưu R2 + metadata.
- **Risks**: bản quyền ảnh; SSRF qua ảnh.
- **Checkpoint**: `P17_I9_CHECKPOINT.md`; **Điều kiện hoàn thành**: ảnh tải đúng quy trình.

### I10 — Monitoring & cost control
- **Mục tiêu**: quan sát lỗi/hạn mức/chi phí AI.
- **Phạm vi**: dashboard tiến độ job, tỉ lệ lỗi, số gọi AI, ngân sách; cảnh báo chạm hạn mức free.
- **Files**: `app/(admin)/import/monitor/**`, `lib/import/metrics.ts`.
- **Database changes**: không (đọc `AuditLog`/job/item).
- **API changes**: `GET jobs` (lịch sử) + endpoint metrics.
- **Dependencies**: I7.
- **Tests**: tính metrics; ngưỡng cảnh báo.
- **AC**: hiển thị chi phí & hạn mức; cảnh báo khi chạm ngưỡng.
- **Risks**: đo chi phí AI chính xác.
- **Checkpoint**: `P17_I10_CHECKPOINT.md`; **Điều kiện hoàn thành**: dashboard + cảnh báo.

### I11 — AI-assisted extraction (E5, tùy chọn)
- **Mục tiêu**: bậc E5 khi E1–E4 không đủ, có cổng chi phí + cờ review.
- **Phạm vi**: gọi AI trên HTML sanitize; chỉ trích nguyên văn; ngân sách cứng; cache.
- **Files**: `lib/import/extract/ai.ts`.
- **Database changes**: không.
- **API changes**: không.
- **Dependencies**: I3, I10.
- **Tests**: prompt-injection (nội dung web không đổi hành vi); bất biến "không bịa".
- **AC**: E5 chỉ chạy khi cần; mọi output gắn cờ + bắt buộc review.
- **Risks**: chi phí; AI sáng tác.
- **Checkpoint**: `P17_I11_CHECKPOINT.md`; **Điều kiện hoàn thành**: E5 có cổng chi phí, an toàn.

---

## 3. Milestone gộp & nguyên tắc phát hành

- **MVP khả dụng**: **I1 → I2 → I6** (URL Import + duyệt cơ bản) — *ship sớm nhất*.
- **Chất lượng**: **I3 → I4 → I5** (extraction/localization/dedupe).
- **Quy mô**: **I7 → I8** (batch 500 → auto discovery).
- **Tối ưu/tùy chọn**: **I9, I10, I11**.
- Mỗi phase: **checkpoint riêng**, commit/push riêng; **không** gộp nhiều phase vào một PR lớn.
- Mọi phase **không** đổi kiến trúc nền (Next.js/Neon/R2/Vercel) trừ khi có ADR riêng.

---

## 4. Rủi ro xuyên phase

| Rủi ro | Giảm thiểu |
|---|---|
| Auth.js chưa nối | I1 là điều kiện tiên quyết (blocker B-P06-02) |
| Vượt hạn mức free khi batch 500 | I10 monitoring + trần 500 + lô nhỏ |
| Chi phí AI | I11 có ngân sách cứng + cache; hoãn tới cuối |
| Bản quyền nội dung/ảnh | Default an toàn (P16.1/P16.8); attribution bắt buộc |
| Site đổi cấu trúc | Adapter + fallback + review (I3) |

---

## 5. Kết luận P16.9

- **11 phase nhỏ** (I1–I11), thứ tự rõ: **URL Import ổn định trước** (I2), rồi mới Auto Discovery (I8) & batch 500 (I7).
- **Không** gộp một phase lớn; mỗi phase có **mục tiêu/phạm vi/files/DB/API/dependencies/tests/AC/risks/checkpoint/điều kiện hoàn thành**.
- **MVP sớm thứ nhất**: I1→I2→I6. Phần AI và ảnh là **tùy chọn**, đẩy về cuối.
- Đây là **bàn giao cuối cùng của P16**: đủ chi tiết để bắt đầu triển khai ở phase tiếp theo; **không** tự ý bắt đầu.
