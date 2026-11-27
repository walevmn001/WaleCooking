# P06 — TEST REPORT

> Báo cáo kiểm thử P06. Chỉ ghi kết quả **thực tế đã chạy**; phần chưa chạy ghi rõ.
> Môi trường: remote sandbox Linux, non-interactive, **không có trình duyệt headless**.
> PostgreSQL **16.15 local** (`127.0.0.1:5432`, DB `wale_dev` + `wale_test`).
> Cập nhật: 2026-11-28 (P06).

---

## 1. Kết quả tổng hợp (đã chạy)

| Kiểm tra | Lệnh | Kết quả |
| --- | --- | --- |
| Prisma validate | `pnpm exec prisma validate` | ✅ hợp lệ |
| Prisma generate | `pnpm exec prisma generate` | ✅ thành công |
| Migration từ DB sạch | `pnpm db:deploy` (wale_dev + wale_test) | ✅ 58 bảng; `migrate status` up-to-date |
| Seed idempotent | `pnpm db:seed` ×2 | ✅ số bản ghi không đổi |
| Unit test | `pnpm test` | ✅ **78/78 pass** (14 file) |
| Integration test | `pnpm test:integration` | ✅ **28/28 pass** (5 file) |
| TypeScript | `pnpm typecheck` | ✅ **0 lỗi** |
| ESLint | `pnpm lint` | ✅ **0 lỗi / 0 cảnh báo** |
| Production build | `pnpm build` | ✅ thành công, **15 route** |

> Không xóa/làm suy yếu test cũ để có kết quả xanh. 60 unit test của P05 vẫn chạy nguyên.

---

## 2. Unit test P06 (18 test mới)

| File | Số test | Nội dung kiểm |
| --- | --- | --- |
| [tests/lib/validation.test.ts](../../tests/lib/validation.test.ts) | 7 | `slugSchema`, `uuidSchema`, `paginationSchema` (coerce/max), `parseInput` ném `ValidationError`, `paginate`/`toOffset` |
| [tests/lib/authorization.test.ts](../../tests/lib/authorization.test.ts) | 7 | `hasRole`, `can`, `canAll`, `isGuest`, `requireActor` (401), `requirePermission` (401/403), thứ bậc role |
| [tests/lib/errors.test.ts](../../tests/lib/errors.test.ts) | 4 | `AppError` status/code; `toErrorResponse` che lỗi không xác định (không lộ stack) |
| **Tổng** | **18** | hợp nhất với 60 test P05 → **78/78** |

---

## 3. Integration test P06 (28 test / 5 file)

Chạy trên PostgreSQL **thử nghiệm** `wale_test` (cấu hình
[vitest.integration.config.ts](../../vitest.integration.config.ts), setup
[tests/integration/setup.ts](../../tests/integration/setup.ts), helper
[tests/integration/helpers/db.ts](../../tests/integration/helpers/db.ts)).

| File | Số test | Nội dung kiểm |
| --- | --- | --- |
| [schema.test.ts](../../tests/integration/schema.test.ts) | 5 | ≥57 bảng; extension `citext`/`pg_trgm`/`unaccent`; PK dùng `gen_random_uuid()`; bảng `_prisma_migrations`; cột `timestamptz` |
| [seed.test.ts](../../tests/integration/seed.test.ts) | 3 | đủ dữ liệu seed; **idempotent** (chạy lại không tăng); bản dịch vi+en |
| [repository.test.ts](../../tests/integration/repository.test.ts) | 11 | `UnitRepository`, `TaxonomyRepository`, `IngredientRepository`: phân trang, tìm kiếm, lọc theo category, `createWithTranslation` nguyên tử |
| [constraints.test.ts](../../tests/integration/constraints.test.ts) | 6 | unique (slug/code/email); **FK RESTRICT** — không xóa được taxonomy term đang dùng; FK sai bị chặn |
| [transaction.test.ts](../../tests/integration/transaction.test.ts) | 3 | rollback khi lỗi, commit thành công, tính nguyên tử của thao tác nhiều bảng |
| **Tổng** | **28** | tất cả pass |

---

## 4. Chi tiết build

```
✓ Compiled successfully in 552ms
✓ Generating static pages (16/16)
Route (app)
○ /   ○ /_not-found   ○ /admin   ○ /ban-quyen   ○ /bao-mat
○ /cong-thuc   ○ /dang-nhap   ○ /danh-muc   ○ /dev/components
○ /dieu-khoan   ○ /gioi-thieu   ○ /kien-thuc   ○ /tai-khoan
ƒ /tim-kiem   ○ /yeu-thich
```

- 14 route static + 1 route dynamic (`/tim-kiem`) = **15 route**. Không lỗi/cảnh báo biên dịch.
- P06 **không** thêm/sửa route nào của P05 → không phá vỡ route hiện có (regression).

---

## 5. Kiểm chứng dữ liệu DB (đã chạy)

Truy vấn `wale_dev` sau seed:

```
taxonomy_types=9    taxonomy_terms=83    taxonomy_term_translations=166
taxonomy_term_aliases=25    units=22    unit_translations=44
unit_conversions=5    equipment=10    equipment_translations=20
ingredients=40    content_sources=1    recipes=0    tables=58
```

---

## 6. Phần CHƯA kiểm / chưa xác minh

- ⛔ **Chưa chạy trên Neon PostgreSQL thật** (chưa có credentials) → pooled/direct thật, SSL,
  PgBouncer **chưa xác minh**. Mọi test DB chạy trên **PostgreSQL local**.
- ⛔ **Chưa có test HTTP end-to-end**: Auth.js chưa nối; chưa kiểm 401/403 qua route (thuộc P07+).
- ⛔ Không có trình duyệt headless → không chạy axe/Lighthouse/E2E (kế thừa B-P05-01).
- OWASP ASVS L1/L2 là **mục tiêu**, **chưa kiểm thử** chính thức (D9).

---

## 7. Ghi chú kỹ thuật

- Test hai tầng: unit (jsdom, [vitest.config.ts](../../vitest.config.ts), loại trừ
  `tests/integration/**`) và integration (node + PostgreSQL thử nghiệm).
- `server-only` được alias về stub trong test ([tests/stubs/server-only.ts](../../tests/stubs/server-only.ts)).
- Integration test cần `TEST_DATABASE_URL` (mặc định local `wale_test`); dùng tiền tố slug duy nhất
  (`uniqueSlug`) để cô lập dữ liệu.
