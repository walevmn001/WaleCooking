# P07.1 — Integration Audit

> Cập nhật: 2026-11-28 (P07.1).

## 1. Phạm vi audit

P06/P07 đã hoàn thành implementation và kiểm thử local trên PostgreSQL thật. P07.1 kiểm tra
tính tích hợp của các thành phần phụ thuộc bên ngoài và luồng end-to-end.

| Hạng mục | Implementation | Xác minh local | Xác minh dịch vụ thật |
| --- | --- | --- | --- |
| Prisma schema + migration | ✅ P06 | ✅ `wale_dev` + `wale_test` | ⏳ Neon (B-P06-01) |
| Environment validation | ✅ `lib/config/env.ts` | ✅ Zod, không lộ secret | N/A |
| Repository/Service layer | ✅ P06/P07 | ✅ unit + integration | N/A |
| Transaction | ✅ P07 (recipe) | ✅ integration test | N/A |
| Recipe CRUD + workflow | ✅ P07 | ✅ 58 integration tests | ⏳ HTTP E2E (Auth.js) |
| Soft delete | ✅ P07 | ✅ integration test | N/A |
| Authorization (RBAC) | ✅ `lib/auth/authorization.ts` | ✅ service-level | ⏳ HTTP 401/403 (B-P07-02) |
| Auth.js | ✅ v5 setup (P07.1) | ⏳ cấu hình sẵn | ⏳ provider/credentials |
| Media adapter (R2) | ✅ P07 | ✅ local adapter + contract | ⏳ R2 thật (B-P07-01) |
| Upload ảnh API | ✅ P07 (`POST /api/v1/media`) | ✅ local adapter | ⏳ R2 thật |
| API error contract | ✅ P07 | ✅ 7 unit tests (P07.1) | N/A |
| Recipe workflow E2E | ✅ P07.1 | ✅ 8 integration tests | ⏳ HTTP E2E (Auth.js) |

## 2. Kết quả kiểm thử (local)

```
typecheck    → 0 lỗi
lint         → 0 lỗi
unit         → 140/140 (20 file)
integration  → 58/58  (8 file)
build        → 30 route (13 static + 17 dynamic)
```

## 3. Các thay đổi P07.1

### 3.1. Auth.js v5
- Thêm dependency: `next-auth@5.0.0-beta.32`, `@auth/prisma-adapter@2.11.3`.
- `lib/auth/auth.ts` — cấu hình NextAuth với PrismaAdapter, session strategy `database`,
  callback `session` gắn `id` + `role` vào `session.user`.
- `app/api/auth/[...nextauth]/route.ts` — route handler Auth.js.
- `lib/auth/session.ts` — `getCurrentActor()` dùng `auth()`.
- **Chưa có provider** → `auth()` trả `null` → mọi endpoint ghi nhận 401 (fail-closed).

### 3.2. Tests mới
- `tests/lib/http-error-contract.test.ts` (7 tests) — contract lỗi HTTP (401/403/422/404/409/500).
- `tests/lib/storage-contract.test.ts` (9 tests) — local adapter + R2 config.
- `tests/integration/recipe-workflow.test.ts` (8 tests) — luồng create → submit → publish → archive.

## 4. Kết luận

Implementation tích hợp hoàn chỉnh theo kiến trúc P02. Các thành phần phụ thuộc bên ngoài
(Neon, R2, Auth.js providers) chưa có credentials → đánh dấu **External Verification Pending**.
Không tuyên bố tích hợp production đã xác minh.
