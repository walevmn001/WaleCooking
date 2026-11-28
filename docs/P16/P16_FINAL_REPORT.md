# P16 — FINAL REPORT

> Phase **P16 — RECIPE DISCOVERY & IMPORTER ARCHITECTURE DESIGN** · 1 AI Agent · Ngày: 2026-11-28.
> Phạm vi: audit, nghiên cứu, đặc tả, kiến trúc, thuật toán, database design, roadmap. **KHÔNG** triển khai importer, **KHÔNG** sửa schema, **KHÔNG** chạy migration.
> Trạng thái: **HOÀN THÀNH** (trong giới hạn môi trường).

---

## 1. Kết quả từng milestone

| Milestone | Nội dung | Deliverable | Trạng thái |
|---|---|---|---|
| **P16.0** | Preflight & audit trạng thái thực tế (git, stack, schema, app layers, hạ tầng, giới hạn) | `docs/checkpoints/P16.0_AUDIT.md` | ✅ |
| **P16.1** | Source research & discovery strategy + Source Registry + robots/ToS/copyright/attribution/rate/ảnh/opt-out | `docs/P16/SOURCE_DISCOVERY_STRATEGY.md` | ✅ |
| **P16.2** | Extraction engine: pipeline 5 bậc (JSON-LD→metadata→adapter→heuristic→AI), trạng thái trường, adapter interface, lưu raw | `docs/P16/EXTRACTION_ENGINE.md` | ✅ |
| **P16.3** | Vietnamese localization: quy trình 7 bước, lưu song song gốc↔Việt, 9 loại lỗi dịch, không auto-publish | `docs/P16/VIETNAMESE_LOCALIZATION.md` | ✅ |
| **P16.4** | Duplicate detection: 6 lớp kiểm, 4 phân loại, không tự xoá/ghi đè, data quality score | `docs/P16/DUPLICATE_DETECTION.md` | ✅ |
| **P16.5** | Batch architecture: DB-backed queue, checkpoint/resume/retry/idempotency, failure isolation, đánh giá Vercel/Neon/R2 | `docs/P16/BATCH_PROCESSING_ARCHITECTURE.md` | ✅ |
| **P16.6** | Admin review workflow: tinh gọn 12→9 trạng thái, 11 thao tác admin, chỉ admin | `docs/P16/ADMIN_REVIEW_WORKFLOW.md` | ✅ |
| **P16.7** | Database & API design: 6 entity mới + 11 enum, 10 endpoint admin | `docs/P16/DATABASE_DESIGN.md`, `docs/P16/API_DESIGN.md` | ✅ |
| **P16.8** | Security/legal/resource: SSRF, DNS rebinding, prompt injection, bản quyền, hạn mức free | `docs/P16/SECURITY_LEGAL_RESOURCE_LIMITS.md` | ✅ |
| **P16.9** | Implementation roadmap: 11 phase nhỏ (I1–I11), URL Import trước | `docs/P16/IMPLEMENTATION_ROADMAP.md` | ✅ |

---

## 2. Tài liệu đã tạo

```
docs/
├── P16/
│   ├── SOURCE_DISCOVERY_STRATEGY.md
│   ├── EXTRACTION_ENGINE.md
│   ├── VIETNAMESE_LOCALIZATION.md
│   ├── DUPLICATE_DETECTION.md
│   ├── BATCH_PROCESSING_ARCHITECTURE.md
│   ├── ADMIN_REVIEW_WORKFLOW.md
│   ├── DATABASE_DESIGN.md
│   ├── API_DESIGN.md
│   ├── SECURITY_LEGAL_RESOURCE_LIMITS.md
│   ├── IMPLEMENTATION_ROADMAP.md
│   └── P16_FINAL_REPORT.md
└── checkpoints/
    ├── P16.0_AUDIT.md
    ├── P16.1_CHECKPOINT.md … P16.9_CHECKPOINT.md
    └── P16_CHECKPOINT.md
```
**11 tài liệu thiết kế + 11 checkpoint.** Ngoài ra cập nhật `PHASE_PROGRESS.md` và `CURRENT_STATUS.md`.

---

## 3. Quyết định kiến trúc quan trọng

1. **Hai phương thức, URL Import trước:** URL Import (admin cấp URL) **ưu tiên**; Auto Discovery chỉ sau và **chỉ** trên nguồn đã bật trong Source Registry.
2. **Source Registry là cổng chính sách:** mặc định **an toàn** (`disabled`/`manual_only`); chỉ `auto_enabled` mới tự động; **không** mặc định website nào cho phép crawl/tái sử dụng.
3. **Extraction 5 bậc có kiểm soát** + **mỗi trường mang trạng thái** (`MISSING/UNREADABLE/CONFIRMED/DERIVED/CONFLICT`) + bậc + bằng chứng; **không bịa/suy diễn/quy đổi đơn vị**.
4. **Localization lưu song song** gốc↔Việt + **placeholder bảo vệ dữ kiện** + kiểm cặp cơ học (9 loại lỗi); **không** auto-publish.
5. **Dedupe 6 lớp, không tự xoá/ghi đè**; chỉ gắn nhãn + `DuplicateCandidate`; điểm chất lượng **có giải thích**.
6. **Batch = DB-backed queue + checkpoint trong DB + worker stateless** → resume/retry/idempotency **không phụ thuộc nơi chạy**; **KHÔNG** dùng Vercel Hobby làm worker dài hạn (đề xuất A tick ngắn → B GitHub Actions).
7. **Tinh gọn trạng thái review 12→9** (gộp `FETCHING/EXTRACTED/TRANSLATING/VALIDATING` vào `PROCESSING`).
8. **Tái sử dụng tối đa schema:** chỉ **6 entity mới** + 11 enum; **không** nhân bản `RecipeSource`/`RecipeTranslation`/review/audit.
9. **Một đường ghi chính thức duy nhất** — mọi publish qua `RecipeService.create()`/`publish()` (BR-01/BR-03); importer **không** ghi thẳng `recipes`.
10. **Bảo mật & pháp lý mặc định an toàn:** chặn SSRF/private IP/DNS rebinding; không thực thi JS; không coi nội dung web là instruction; không vượt paywall/CAPTCHA; attribution bắt buộc.

---

## 4. Giới hạn chưa giải quyết

- **Chưa triển khai code** (đúng phạm vi P16): không có importer, không có route/service/UI thật.
- **Chưa thay đổi schema / chưa chạy migration:** DDL trong `DATABASE_DESIGN.md` là **đề xuất**.
- **Chưa kiểm chứng live** hạn mức Vercel/Neon/R2 (số liệu lấy từ `docs/P02/DEPLOYMENT_ARCHITECTURE.md`, đánh dấu "cần kiểm chứng khi triển khai").
- **Chưa đo chi phí AI thực tế**; chỉ có thiết kế ngân sách/cache.
- **Chưa có test tự động** cho URL validator/SSRF guard (thuộc phase triển khai).
- **Phụ thuộc Auth.js chưa nối** (blocker **B-P06-02**) → mọi kiểm quyền chưa hoạt động thật ⇒ **điều kiện tiên quyết** của I1.
- **Nguồn dữ liệu thực** chưa có → danh sách nguồn ví dụ cần kiểm robots/ToS khi bật.

---

## 5. Rủi ro & cách giảm thiểu

| Rủi ro | Mức | Giảm thiểu |
|---|---|---|
| SSRF / truy cập private IP / DNS rebinding | Cao | Validate scheme + chặn private/reserved IP + resolve-once/pin IP + kiểm mỗi redirect (P16.8 §3) |
| Sao chép nội dung/ảnh trái phép | Cao | Default an toàn; attribution bắt buộc (BR-03); không tải ảnh mặc định |
| AI "sáng tác"/prompt injection | Cao | AI chỉ trích/dịch; cờ `ai_assisted`; kiểm bất biến số độc lập; không coi web là instruction |
| Dịch sai dữ kiện | Cao | Placeholder + kiểm cặp cơ học I1–I9 |
| Trùng lặp khi retry | Trung bình | Idempotency key + upsert |
| Mất tiến độ khi worker/sandbox dừng | Trung bình | Checkpoint trong DB + lease/resume |
| Vượt hạn mức free | Trung bình | Trần 500 item, lô nhỏ, ít truy vấn, monitoring (I10) |
| Site đổi cấu trúc / chặn | Trung bình | Adapter + fallback + rate limit theo domain + `PAUSED_BLOCKED` |
| Chi phí AI vượt kiểm soát | Trung bình | Ngân sách cứng + cache + chỉ dùng khi E1–E4 thiếu (I11) |

---

## 6. Đã kiểm chứng vs chỉ là đề xuất

**Đã kiểm chứng (đọc mã nguồn/tài liệu thực):**
- Git/stack/schema thực tế (P16.0): 22 enum/57 model/58 bảng; extension `citext`/`pg_trgm`/`unaccent`; quy ước UUID/timestamptz/Decimal/JSONB.
- DTO/schema thực để ánh xạ trường extraction: `CreateRecipeInput`/`RecipeIngredientInput`/`RecipeStepInput`, `RecipeTranslation`/`RecipeStepTranslation`, `RecipeSource`/`ContentSource`/`SourceAttribution`, `RecipeVersion`, `RecipeNutrition`.
- Vòng đời recipe + `assertPublishable()` (BR-01/BR-03); `RecipeStatus`/`ContentReview`/`ContentReviewAction`/`ReviewDecision`.
- API conventions: `app/api/v1/admin/recipes/route.ts`, `lib/api/http.ts` (`jsonOk`/`handle`), `lib/errors/app-error.ts`.
- RBAC `requirePermission`; `getCurrentActor()→null` (Auth.js chưa nối).
- Media: `validateImageFile()`/`MAX_IMAGE_BYTES=8MB`; `StoragePort` provider `r2|local`.
- Hạn mức Vercel/Neon/R2 theo `docs/P02/DEPLOYMENT_ARCHITECTURE.md`.

**Chỉ là đề xuất (chưa kiểm chứng/ chưa áp dụng):**
- Toàn bộ DDL 6 entity mới + 11 enum; routes API importer; interface `RecipeExtractor`/`ExtractionEngine`; glossary; ngưỡng dedupe; con số timeout/backoff/concurrency; phase I1–I11.
- Số liệu hạn mức/bảng giá nền tảng (thay đổi theo thời điểm).

---

## 7. Roadmap phase triển khai tiếp theo

**11 phase nhỏ** (chi tiết ở `IMPLEMENTATION_ROADMAP.md`):
- **MVP sớm nhất:** I1 (hạ tầng/Auth/schema) → **I2 (Core URL Import)** → I6 (duyệt).
- Chất lượng: I3 (extraction) → I4 (localization/validation) → I5 (dedupe).
- Quy mô: I7 (batch ≤500) → I8 (Auto Discovery).
- Tùy chọn cuối: I9 (image), I10 (monitoring/cost), I11 (AI E5).
- **Ưu tiên:** URL Import hoạt động ổn định **trước**, rồi mới Auto Discovery & batch 500.

---

## 8. Commit hash từng milestone

| Milestone | Commit |
|---|---|
| P16.0 | `cc20ce3` |
| P16.1 | `dcbf3ec` |
| P16.2 | `4822771` |
| P16.3 | `572b83a` |
| P16.4 | `f53b1c4` |
| P16.5 | `db810e5` |
| P16.6 | `a9678f3` |
| P16.7 | `b34d754` |
| P16.8 | `19dcc31` |
| P16.9 | `e3e28a3` |
| P16 final (report + checkpoint + status) | *(commit chứa tài liệu này — xem `git log -1`)* |

---

## 9. Push result

- Mỗi milestone push **fast-forward** lên `origin/main` (`https://github.com/walevmn001/WaleCooking`). Chuỗi: `cc20ce3 → dcbf3ec → 4822771 → 572b83a → f53b1c4 → db810e5 → a9678f3 → b34d754 → 19dcc31 → e3e28a3` (+ final).
- **Không** force-push, **không** reset, **không** rewrite history.

---

## 10. HEAD & origin/main

- Trước commit final: `HEAD = origin/main = e3e28a3`.
- Sau commit final: `HEAD = origin/main = <hash final>` (kiểm tra bằng `git rev-parse HEAD` và `git rev-parse origin/main`).
- Branch làm việc: `trae/agent-da4PT9` (đồng bộ `main`).

---

## 11. Working tree

- **Sạch** sau khi commit + push mốc cuối P16 (`git status` không còn thay đổi chưa commit).

---

## 12. Xác nhận an toàn

- **Không có secrets** trong bất kỳ tài liệu/commit nào (không credentials/API key/cookie/connection string). `.env.example` vẫn là file duy nhất liên quan và **không** chứa secret thật.
- **Không** truy cập/sửa/ghi **dữ liệu production**; **không** chạy migration/seed/destructive.
- **Không** sửa `prisma/schema.prisma`, **không** sửa mã nguồn ứng dụng, **không** thêm dependency trong toàn bộ P16 (chỉ thêm tài liệu).
- **1 AI agent duy nhất**, **không** sub-agent.

---

## Kết luận

P16 bàn giao **một bản thiết kế đầy đủ** cho Recipe Importer: chiến lược nguồn, kiến trúc extraction, pipeline Việt hoá, phát hiện trùng lặp, kiến trúc batch 500 (resume/retry/idempotency), workflow admin, database & API design, phân tích bảo mật/pháp lý/tài nguyên, và roadmap 11 phase. **Không** bắt đầu P17.
