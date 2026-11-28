# P17 / I1 — CHECKPOINT: HẠ TẦNG & TIỀN ĐỀ RECIPE IMPORTER

> Phase triển khai: **I1** (theo `docs/P16/IMPLEMENTATION_ROADMAP.md`) · Ngày: 2026-11-28 · Trạng thái: **HOÀN THÀNH** (trong giới hạn môi trường).
> Branch: `trae/agent-da4PT9` · 1 AI Agent · **không** sub-agent.
> Phạm vi: **hạ tầng & tiền đề** cho Recipe Importer — schema 6 entity + 11 enum, permission importer, khung repository/service. **KHÔNG** triển khai URL Import (I2).

---

## 1. Phạm vi I1 thực tế

Theo roadmap I1 ("Hạ tầng & tiền đề — có nền DB + quyền + khung route để bắt đầu import"):

| Hạng mục roadmap | Thực hiện | Ghi chú |
|---|---|---|
| Migration cho **6 entity mới** + 11 enum | ✅ | `prisma/schema.prisma` + migration `20261128104202_add_recipe_importer_schema` |
| Thêm **permission importer** | ✅ | `lib/auth/authorization.ts` — `import:read/manage/approve/publish`, `source:manage` |
| Nối **Auth.js** *hoặc* cơ chế actor admin tối thiểu | ⏸️ **Hoãn Auth.js** (quyết định chủ dự án) | Xem §7. Giữ `getCurrentActor() → null`; **không** tạo tài khoản admin mặc định |
| Port repository mới | ✅ (port-only) | `lib/db/repositories/import.repository.ts` (adapter Prisma thuộc I2) |
| Service khung | ✅ | `lib/services/import.service.ts` (khung + cưỡng chế quyền; **không** API) |
| API changes | — | Theo roadmap: **chưa** (chỉ skeleton rỗng) |

**Ngoài phạm vi (không thực hiện):** URL Import (I2), fetch/SSRF guard, extraction, localization, dedupe, batch/worker, Auto Discovery, ảnh, AI. **Không** chuyển sang I2.

---

## 2. Các milestone

| # | Milestone | Kết quả |
|---|---|---|
| I1.1 | Preflight & audit | Git sạch; đọc đủ tài liệu P16 (roadmap, DB design, API design, admin workflow, security); chốt phạm vi I1 |
| I1.2 | Schema extension | Thêm 11 enum + 6 model + back-relations (`User`/`Recipe`); `prisma validate`/`format` PASS |
| I1.3 | Migration | `migrate dev --name add_recipe_importer_schema` áp trên DB dev/test local (`wale_test`, `wale_e2e`) |
| I1.4 | Permission importer | 5 permission mới (admin-only) + unit test enforce |
| I1.5 | Repository port + service khung | Port `ImportRepository` + DTO; `ImportService` (guard `import:*`) + unit test |
| I1.6 | Kiểm thử & bàn giao | typecheck/lint/unit/integration/build/E2E; checkpoint + cập nhật status |

---

## 3. Files thay đổi

**Database / schema:**
- `prisma/schema.prisma` *(modified)* — 11 enum mới + 6 model + back-relations.
- `prisma/migrations/20261128104202_add_recipe_importer_schema/migration.sql` *(new)*.

**Authorization:**
- `lib/auth/authorization.ts` *(modified)* — thêm 5 permission importer, gán cho `admin`.

**Repository / service (khung):**
- `lib/db/repositories/import.repository.ts` *(new)* — port + DTO (ImportSource/ImportJob/ImportJobItem).
- `lib/db/repositories/index.ts` *(modified)* — re-export type port mới.
- `lib/services/import.service.ts` *(new)* — `ImportService` khung + cưỡng chế quyền.
- `lib/services/index.ts` *(modified)* — export `ImportService`.

**Kiểm thử:**
- `tests/lib/authorization.test.ts` *(modified)* — +2 test importer permission/guard.
- `tests/lib/import.service.test.ts` *(new)* — 5 test (port + cưỡng chế quyền).

**Tài liệu:**
- `docs/checkpoints/P17_I1_CHECKPOINT.md` *(new)* — tài liệu này.
- `PHASE_PROGRESS.md`, `CURRENT_STATUS.md`, `BLOCKERS.md` *(modified)*.

**Xác nhận:** **Không** sửa page/route public; **không** sửa API hiện có; **không** sửa các repository/adapter hiện hữu.

---

## 4. Database / dependency / environment changes

**Database (schema):**
- **11 enum mới:** `import_source_status`, `content_reuse_policy`, `image_reuse_policy`, `import_source_last_status`, `import_job_mode`, `import_job_status`, `import_job_item_status`, `translation_status`, `human_review_status`, `duplicate_classification`, `duplicate_status`.
- **6 bảng mới:** `import_sources`, `import_jobs`, `import_job_items`, `recipe_extractions`, `recipe_translation_drafts`, `duplicate_candidates`.
- Chi tiết trường/index/FK theo `docs/P16/DATABASE_DESIGN.md`; bổ sung một số quan hệ phụ để Prisma hợp lệ (self-relation `ImportItemDuplicate`, `ItemPrimaryExtraction`/`ExtractionJobItem`, back-relation `ImportSource.items`).
- **Migration áp dụng trên môi trường test/dev local** (PostgreSQL): `wale_test`, `wale_e2e`. **KHÔNG** chạy migration trên production.
- **Ràng buộc:** FK RESTRICT mặc định; Cascade chỉ cho con thuộc sở hữu (`ImportJobItem`→job, `RecipeTranslationDraft`→extraction, `DuplicateCandidate`→extraction).

**Dependency:** **Không** thêm dependency (không cài `next-auth`).

**Environment variables:** **Không** thêm/sửa biến env; **không** commit secrets.

---

## 5. Test results

| Loại | Lệnh | Kết quả |
|---|---|---|
| Typecheck | `pnpm typecheck` | ✅ **PASS** (0 lỗi) |
| Lint | `pnpm lint` | ✅ **PASS** (0 lỗi) |
| Unit | `pnpm test` | ✅ **PASS** — **371/371** (35 file) |
| Integration | `pnpm test:integration` | ✅ **PASS** — **59/59** (9 file, PostgreSQL local `wale_test`) |
| Build | `pnpm build` | ✅ **PASS** |
| E2E (regression public/API/admin) | `pnpm e2e` | ✅ **PASS** — **52/52** (Chrome CDP, DB `wale_e2e`) |
| Auth/session tests | `tests/lib/authorization.test.ts`, `tests/lib/import.service.test.ts` | ✅ PASS (tầng guard: 401 guest / 403 thiếu quyền / admin OK) |
| Admin authorization tests | unit + E2E `api.e2e.ts` | ✅ PASS (guest → 401; E2E xác minh endpoint admin chặn khi chưa đăng nhập) |
| Regression public pages & API | `pnpm e2e` | ✅ PASS (trang chủ, công thức, tìm kiếm, công cụ, API công khai) |

**Phân loại:**
- **PASS:** tất cả mục trên.
- **BLOCKED:** xác minh **401/403 qua HTTP với phiên đăng nhập thật** — Auth.js **chưa nối** (`getCurrentActor() → null`), xem §7.
- **PENDING:** migration/CRUD trên **Neon thật** (sandbox không có credentials — kế thừa B-P13-01..04).
- **Không** tuyên bố production authentication hoạt động.

---

## 6. Acceptance Criteria (roadmap I1)

| AC | Nội dung | Kết quả |
|---|---|---|
| AC-I1-1 | Migration áp dụng thành công **chỉ** trên môi trường test/dev | ✅ **PASS** — `wale_test` + `wale_e2e` (không chạm production) |
| AC-I1-2 | Quyền importer **enforce** được | ✅ **PASS** — unit test (permission + service guard) |
| AC-I1-3 | `pnpm typecheck` xanh | ✅ **PASS** |
| AC-I1-4 (điều kiện hoàn thành) | schema mở rộng + quyền + CI xanh | ✅ **PASS** |

**Tổng: 4/4 PASS** (AC-I1-1/2/3 + điều kiện hoàn thành).

---

## 7. Quyết định: hoãn Auth.js (phạm vi I1)

- Roadmap I1 cho phép "nối Auth.js **hoặc** cơ chế actor admin tối thiểu".
- Ràng buộc chủ dự án: **không** tạo public registration/user accounts; **không** tạo tài khoản admin mặc định với mật khẩu cố định; **không** commit secrets.
- Sandbox **không** có `next-auth`/credentials.
- ⇒ **Quyết định (chủ dự án):** I1 chỉ triển khai **nền DB + permission importer + khung repository/service**; **giữ** `getCurrentActor() → null`; ghi **B-P06-02** là **tiền đề bắt buộc** cho I2 (URL Import) và I6 (Admin review UI).
- **Không** tạo tài khoản/mật khẩu mặc định; **không** thêm social login.

---

## 8. Blockers

- **B-P06-02 (Auth.js chưa nối)** — **vẫn mở** (đúng phạm vi I1: hoãn theo quyết định). Hệ quả: chưa xác minh 401/403 qua HTTP phiên thật; importer permission mới kiểm ở **tầng guard/service**. Là **tiền đề** của I2/I6.
- **B-P13-01..04 (Neon)** — kế thừa: migration/CRUD trên Neon chưa chạy (không có credentials). I1 chỉ áp migration trên PostgreSQL local.
- **Không** phát sinh blocker mới.

---

## 9. Git

- Chỉ stage file thuộc phạm vi I1; commit + push **fast-forward** `origin/main` (không force-push/reset/rewrite).
- Kiểm tra sau cùng: `git rev-parse HEAD`, `git rev-parse origin/main`, `git status`.
- **Không secrets** trong bất kỳ file/commit nào.

---

## 10. Tiếp theo

- **Chờ đánh giá của chủ dự án trước khi triển khai I2 (URL Import).**
- **Không** chuyển sang I2/I3... trong lần thực hiện này.
- Trước I2 cần: nối **Auth.js** (B-P06-02) để bảo vệ endpoint admin importer bằng phiên thật.
