# P16 — CHECKPOINT: RECIPE DISCOVERY & IMPORTER ARCHITECTURE DESIGN

> Phase: **P16** · Ngày: 2026-11-28 · Trạng thái: **HOÀN THÀNH** (trong giới hạn môi trường)
> Branch: `trae/agent-da4PT9` · 1 AI Agent · **không** sub-agent.
> Phạm vi: audit, nghiên cứu, đặc tả, kiến trúc, thuật toán, database design, roadmap.
> **KHÔNG** triển khai importer, **KHÔNG** sửa `prisma/schema.prisma`, **KHÔNG** sửa mã nguồn ứng dụng, **KHÔNG** chạy migration/seed/destructive.

---

## 1. Git preflight (III)

| Mục | Giá trị thực tế |
|---|---|
| Branch làm việc | `trae/agent-da4PT9` |
| Điểm xuất phát (`HEAD`) | `eef5d39` (`docs(P15.5): …`) — `HEAD == origin/main` |
| Remote | `origin` → `https://github.com/walevmn001/WaleCooking` |
| Lịch sử | **shallow clone, 1 commit** (`git rev-parse --is-shallow-repository` = `true`) |
| Working tree | **Sạch** trước khi bắt đầu (sau P15) |

> **Không** fetch toàn bộ / thay đổi lịch sử khi chưa cần (**III.3**). Mọi milestone push **fast-forward** (không force-push/reset/rewrite).

---

## 2. Mốc công việc & commit

| Milestone | Nội dung | Deliverable | Commit | Checkpoint |
|---|---|---|---|---|
| P16.0 | Preflight & audit trạng thái thực tế | `docs/checkpoints/P16.0_AUDIT.md` | `cc20ce3` | P16.0_AUDIT.md |
| P16.1 | Source discovery strategy & Source Registry | `docs/P16/SOURCE_DISCOVERY_STRATEGY.md` | `dcbf3ec` | [P16.1_CHECKPOINT.md](./P16.1_CHECKPOINT.md) |
| P16.2 | Recipe extraction engine | `docs/P16/EXTRACTION_ENGINE.md` | `4822771` | [P16.2_CHECKPOINT.md](./P16.2_CHECKPOINT.md) |
| P16.3 | Vietnamese localization pipeline | `docs/P16/VIETNAMESE_LOCALIZATION.md` | `572b83a` | [P16.3_CHECKPOINT.md](./P16.3_CHECKPOINT.md) |
| P16.4 | Duplicate detection & data quality | `docs/P16/DUPLICATE_DETECTION.md` | `f53b1c4` | [P16.4_CHECKPOINT.md](./P16.4_CHECKPOINT.md) |
| P16.5 | Batch processing architecture | `docs/P16/BATCH_PROCESSING_ARCHITECTURE.md` | `db810e5` | [P16.5_CHECKPOINT.md](./P16.5_CHECKPOINT.md) |
| P16.6 | Admin review workflow | `docs/P16/ADMIN_REVIEW_WORKFLOW.md` | `a9678f3` | [P16.6_CHECKPOINT.md](./P16.6_CHECKPOINT.md) |
| P16.7 | Database & API design | `docs/P16/DATABASE_DESIGN.md`, `docs/P16/API_DESIGN.md` | `b34d754` | [P16.7_CHECKPOINT.md](./P16.7_CHECKPOINT.md) |
| P16.8 | Security, legal & resource limits | `docs/P16/SECURITY_LEGAL_RESOURCE_LIMITS.md` | `19dcc31` | [P16.8_CHECKPOINT.md](./P16.8_CHECKPOINT.md) |
| P16.9 | Implementation roadmap | `docs/P16/IMPLEMENTATION_ROADMAP.md` | `e3e28a3` | [P16.9_CHECKPOINT.md](./P16.9_CHECKPOINT.md) |
| P16 final | Báo cáo cuối + checkpoint + cập nhật status | `docs/P16/P16_FINAL_REPORT.md`, tài liệu này, `PHASE_PROGRESS.md`, `CURRENT_STATUS.md` | *(commit chứa tài liệu này — xem `git log -1`)* | tài liệu này |

**Chuỗi commit:** `cc20ce3 → dcbf3ec → 4822771 → 572b83a → f53b1c4 → db810e5 → a9678f3 → b34d754 → 19dcc31 → e3e28a3` (+ final).

---

## 3. Sản phẩm bàn giao

```
docs/
├── P16/                                  (11 tài liệu thiết kế)
│   ├── SOURCE_DISCOVERY_STRATEGY.md      (P16.1 — 9 phương thức, 5 tầng, Source Registry)
│   ├── EXTRACTION_ENGINE.md              (P16.2 — pipeline 5 bậc E1–E5, trạng thái trường, adapter)
│   ├── VIETNAMESE_LOCALIZATION.md        (P16.3 — 7 bước, lưu song song, 9 loại lỗi I1–I9)
│   ├── DUPLICATE_DETECTION.md            (P16.4 — 6 lớp, 4 nhãn, quality score)
│   ├── BATCH_PROCESSING_ARCHITECTURE.md  (P16.5 — DB-backed queue, checkpoint/resume/idempotency)
│   ├── ADMIN_REVIEW_WORKFLOW.md          (P16.6 — tinh gọn 12→9 trạng thái, 11 thao tác)
│   ├── DATABASE_DESIGN.md                (P16.7 — 6 entity mới + 11 enum)
│   ├── API_DESIGN.md                     (P16.7 — 10 endpoint admin)
│   ├── SECURITY_LEGAL_RESOURCE_LIMITS.md (P16.8 — SSRF/DNS rebinding/prompt injection/bản quyền/hạn mức)
│   ├── IMPLEMENTATION_ROADMAP.md         (P16.9 — 11 phase I1–I11)
│   └── P16_FINAL_REPORT.md               (báo cáo 12 mục)
└── checkpoints/
    ├── P16.0_AUDIT.md
    ├── P16.1_CHECKPOINT.md … P16.9_CHECKPOINT.md
    └── P16_CHECKPOINT.md                 (tài liệu này)
```

**11 tài liệu thiết kế + 11 checkpoint.** Cập nhật `PHASE_PROGRESS.md` + `CURRENT_STATUS.md`.

---

## 4. Quyết định kiến trúc quan trọng

1. **URL Import trước, Auto Discovery sau** — Auto Discovery chỉ trên nguồn đã bật trong Source Registry.
2. **Source Registry là cổng chính sách** — mặc định **an toàn** (`disabled`/`manual_only`); **không** mặc định website nào cho phép crawl/tái sử dụng.
3. **Extraction 5 bậc** (JSON-LD → metadata → adapter → heuristic → AI) + **mỗi trường mang trạng thái** (`MISSING/UNREADABLE/CONFIRMED/DERIVED/CONFLICT`) + bậc + bằng chứng; **không bịa/suy diễn/quy đổi đơn vị**.
4. **Localization lưu song song** gốc↔Việt + **placeholder bảo vệ dữ kiện** + kiểm cặp cơ học (9 loại lỗi); **không** auto-publish.
5. **Dedupe 6 lớp, không tự xoá/ghi đè** — chỉ gắn nhãn + `DuplicateCandidate`; chất lượng **có giải thích**.
6. **Batch = DB-backed queue + checkpoint trong DB + worker stateless**; **KHÔNG** dùng Vercel Hobby làm worker dài hạn (đề xuất A tick ngắn → B GitHub Actions).
7. **Tinh gọn trạng thái review 12→9** (gộp `FETCHING/EXTRACTED/TRANSLATING/VALIDATING` vào `PROCESSING`).
8. **Tái sử dụng tối đa schema** — chỉ **6 entity mới** + 11 enum; **không** nhân bản `RecipeSource`/`RecipeTranslation`/review/audit.
9. **Một đường ghi chính thức duy nhất** — mọi publish qua `RecipeService` (BR-01/BR-03); importer **không** ghi thẳng `recipes`.
10. **Mặc định an toàn về bảo mật & pháp lý** — chặn SSRF/private IP/DNS rebinding; không thực thi JS; không coi nội dung web là instruction; không vượt paywall/CAPTCHA; attribution bắt buộc.

---

## 5. Kiểm chứng

- **Đã kiểm chứng (đọc mã nguồn/tài liệu thực):** git/stack/schema thực tế (22 enum/57 model/58 bảng; extension `citext`/`pg_trgm`/`unaccent`; UUID/timestamptz/Decimal/JSONB); DTO/schema để ánh xạ trường extraction (`CreateRecipeInput`/`RecipeIngredientInput`/`RecipeStepInput`, `RecipeTranslation`/`RecipeStepTranslation`, `RecipeSource`/`ContentSource`/`SourceAttribution`, `RecipeVersion`, `RecipeNutrition`); vòng đời recipe + `assertPublishable()` (BR-01/BR-03); API conventions (`handle`/`jsonOk`, `getCurrentActor()`+`requirePermission()`); media (`validateImageFile()`/`MAX_IMAGE_BYTES=8MB`, `StoragePort` `r2|local`); hạn mức Vercel/Neon/R2 theo `docs/P02/DEPLOYMENT_ARCHITECTURE.md`.
- **Chỉ là đề xuất (chưa kiểm chứng/chưa áp dụng):** toàn bộ DDL 6 entity mới + 11 enum; routes API importer; interface `RecipeExtractor`/`ExtractionEngine`; glossary; ngưỡng dedupe; con số timeout/backoff/concurrency; phase I1–I11; số liệu hạn mức/bảng giá nền tảng.
- **Tài liệu-only:** **không** sửa `prisma/schema.prisma`, **không** sửa mã nguồn, **không** thêm dependency, **không** chạy migration/seed/destructive.

---

## 6. Acceptance Criteria (VII)

| AC | Nội dung | Kết quả |
|---|---|---|
| AC-01 | Audit đầy đủ kiến trúc thực tế | ✅ `docs/checkpoints/P16.0_AUDIT.md` |
| AC-02 | Chiến lược tìm nguồn công thức | ✅ `SOURCE_DISCOVERY_STRATEGY.md` |
| AC-03 | Kiến trúc extraction | ✅ `EXTRACTION_ENGINE.md` |
| AC-04 | Pipeline Việt hóa & kiểm dữ kiện | ✅ `VIETNAMESE_LOCALIZATION.md` |
| AC-05 | Thuật toán phát hiện trùng lặp | ✅ `DUPLICATE_DETECTION.md` |
| AC-06 | Kiến trúc batch 500 item | ✅ `BATCH_PROCESSING_ARCHITECTURE.md` |
| AC-07 | Khả năng resume/retry/idempotency | ✅ `BATCH_PROCESSING_ARCHITECTURE.md` |
| AC-08 | Workflow admin review | ✅ `ADMIN_REVIEW_WORKFLOW.md` |
| AC-09 | Database design | ✅ `DATABASE_DESIGN.md` |
| AC-10 | API design | ✅ `API_DESIGN.md` |
| AC-11 | Phân tích SSRF & bảo mật URL | ✅ `SECURITY_LEGAL_RESOURCE_LIMITS.md` |
| AC-12 | Phân tích bản quyền & attribution | ✅ `SECURITY_LEGAL_RESOURCE_LIMITS.md` |
| AC-13 | Phân tích chi phí & giới hạn Vercel/Neon/R2 | ✅ `SECURITY_LEGAL_RESOURCE_LIMITS.md` + `BATCH_PROCESSING_ARCHITECTURE.md` |
| AC-14 | Roadmap triển khai từng phase | ✅ `IMPLEMENTATION_ROADMAP.md` |
| AC-15 | Không sửa source code/schema ngoài phạm vi | ✅ (tài liệu-only) |
| AC-16 | Không chạy migration/seed/production operation | ✅ |
| AC-17 | Tài liệu được commit & push lên main | ✅ |
| AC-18 | Working tree sạch | ✅ |

**Tổng: 18/18 AC PASS.**

---

## 7. Blocker

**Không phát sinh blocker mới.** Blocker hạ tầng kế thừa (không thay đổi, ngoài phạm vi P16):
- **B-P06-02** — Auth.js chưa nối (`getCurrentActor()` → `null`) ⇒ **điều kiện tiên quyết** của phase triển khai I1.
- **B-P12-01/02/03/04** — Neon/R2/Vercel/Auth.js chưa xác minh (External Verification Pending).
- Chưa có **nguồn dữ liệu thực** ⇒ danh sách nguồn ví dụ cần kiểm robots/ToS khi bật.
- Chưa có **test tự động** cho URL validator/SSRF guard (thuộc phase triển khai).

---

## 8. Git & push

- Push **fast-forward** `origin/main` sau **mỗi** milestone (không force-push/reset/rewrite).
- Kiểm tra sau cùng: `git rev-parse HEAD`, `git rev-parse origin/main`, `git status`.
- **Không secrets** trong bất kỳ tài liệu/commit nào; **không** truy cập/sửa/ghi dữ liệu production.

---

## 9. Kết luận

P16 **hoàn thành** (trong giới hạn môi trường): bàn giao **11 tài liệu thiết kế + 11 checkpoint**, đủ chi tiết để bắt đầu xây dựng Recipe Importer ở phase tiếp theo; **18/18 Acceptance Criteria PASS**. **Không** bắt đầu P17.
