# P18 — CHECKPOINT: AUTH.JS INTEGRATION

> Phase triển khai: **P18** · Ngày: 2026-11-28 · Trạng thái: **HOÀN THÀNH** (trong giới hạn môi trường).
> Branch: `trae/agent-GnjYMp` · tiếp nối checkpoint I1 tại commit `9ca6537` · 1 AI Agent · **không** sub-agent.
> Phạm vi: **xác thực & phân quyền nền tảng** — giải quyết blocker **B-P06-02**. **KHÔNG** triển khai I2 (URL Import).

---

## 1. Mục tiêu & phạm vi thực tế

Giải quyết **B-P06-02** ("Auth.js chưa nối → chưa kiểm luồng 401/403 end-to-end"):
tích hợp Auth.js để có xác thực quản trị thật, thay thế trạng thái `getCurrentActor() → null`.

| Hạng mục P18 | Thực hiện | Ghi chú |
|---|---|---|
| P18.1 Auth.js Architecture | ✅ | Credentials + **session JWT (bắt buộc)**; tái dùng bảng `users` |
| P18.2 Authentication | ✅ | Chỉ admin/editor đăng nhập; không public registration; không tài khoản mặc định; scrypt; session kiểm ở server |
| P18.3 Authorization | ✅ | `getCurrentActor()` nối session thật; bảo vệ `/admin` + `/api/v1/admin`; giữ nguyên permission importer I1 |
| P18.4 Environment & Documentation | ✅ | Thêm `AUTH_SECRET`/`AUTH_URL`; script provisioning admin; **không** ghi secret thật |
| P18.5 Tests | ✅ | unit + E2E **HTTP thật** (đăng nhập/quyền/session) |

**Ngoài phạm vi (KHÔNG thực hiện):** I2 — URL Import, fetch URL, SSRF guard, extraction engine, hoặc bất kỳ chức năng Recipe Importer nào. **Không** sửa schema importer. **Không** đổi public API.

---

## 2. Quyết định kiến trúc (P18.1)

- **Provider:** **Credentials** (email + mật khẩu). Chỉ tài khoản nhân sự quản trị (`role` = `admin`/`editor`) đăng nhập được. **Không** đăng ký công khai, **không** social login, **không** magic-link.
- **Session strategy: JWT — BẮT BUỘC.** Auth.js **không hỗ trợ database session cho Credentials provider**; do đó không dùng `sessions`/`accounts` (bảng P02 vẫn giữ nguyên cho OAuth tương lai, **không** xóa/sửa).
- **Actor mapping:** `id` + `role` lấy từ `users` tại thời điểm đăng nhập, ký trong JWT; `getCurrentActor()` đọc lại từ session đã xác thực. **Role KHÔNG bao giờ** lấy từ request body/client.
- **Role mapping:** dùng `APP_ROLES = ["user","editor","admin"]` từ `lib/auth/authorization.ts` (không tạo danh sách role thứ hai).
- **Tương thích stack:** `next-auth@5.0.0-beta.32` với Next.js 16.4.6 / React 19.3.1 / Prisma 6.19.3.
- **BLOCKED?** **Không.** Không cần credentials bên thứ ba (dùng mật khẩu nội bộ + `AUTH_SECRET` sinh cục bộ).

---

## 3. Các milestone

| # | Milestone | Kết quả |
|---|---|---|
| P18.0 | Preflight & audit | Git sạch tại `9ca6537`; đọc kiến trúc/P16/P17 + tài liệu auth; kiểm schema `User`/`role`/password; kiểm route admin + guard; kiểm phiên bản deps |
| P18.1 | Chốt kiến trúc Auth.js | Credentials + JWT; tái dùng bảng `users`; không đổi bảng `sessions`/`accounts` |
| P18.2 | Authentication | `auth.ts`, route handler, trang đăng nhập thật, sign-out, scrypt password |
| P18.3 | Authorization | `getCurrentActor()` nối session; guard `/admin`; giữ nguyên `requirePermission`/importer permission |
| P18.4 | Env & Provisioning | `.env.example` + `scripts/create-admin.ts` (`pnpm admin:create`); không tài khoản mặc định |
| P18.5 | Tests | unit (password/session) + E2E HTTP thật (`auth.e2e.ts`) + cập nhật `admin.e2e.ts` |
| P18.6 | Kiểm chứng & bàn giao | typecheck/lint/unit/integration/E2E/build; checkpoint + cập nhật status |

---

## 4. Files thay đổi

**Database / schema:**
- `prisma/schema.prisma` *(modified)* — `User`: thêm `passwordHash String? @map("password_hash")` (NULL = không có mật khẩu). **Không** sửa model/relation nào khác.
- `prisma/migrations/20261128123000_add_user_password_hash/migration.sql` *(new)* — `ALTER TABLE "users" ADD COLUMN "password_hash" TEXT;`.

**Authentication (Auth.js):**
- `auth.ts` *(new)* — cấu hình NextAuth: Credentials provider, `session.strategy="jwt"`, `pages.signIn="/dang-nhap"`, `trustHost`, callbacks `jwt`/`session`; module augmentation `next-auth` (Session/User).
- `app/api/auth/[...nextauth]/route.ts` *(new)* — re-export `handlers` (`GET`/`POST`).
- `lib/auth/password.ts` *(new)* — băm/kiểm mật khẩu **scrypt** (`node:crypto`, N=16384/r=8/p=1/keylen=64/salt 16B), format `scrypt$N$r$p$salt$hash`, so sánh `timingSafeEqual`. Không thêm dependency.
- `components/auth/admin-sign-in-form.tsx` *(new)* — Client Component: `signIn("credentials", { redirect:false })`; lỗi chung khi thất bại; thành công → `/admin`.
- `app/(auth)/dang-nhap/page.tsx` *(modified)* — cổng đăng nhập quản trị thật; đã đăng nhập (≥ editor) → chuyển `/admin`.

**Authorization:**
- `lib/auth/session.ts` *(modified)* — `getCurrentActor()` gọi `await auth()`, kiểm `user.id` + role hợp lệ → trả `{ id, role }` hoặc `null`; `getCurrentRole()` suy từ actor.
- `app/(admin)/layout.tsx` *(modified)* — guard phía server: khách/non-admin → `redirect("/dang-nhap")`; nút **Đăng xuất** (server action `signOut`).
- **Giữ nguyên** `lib/auth/authorization.ts` (`can`/`requirePermission`/5 permission importer từ I1) — không đổi.

**Provisioning & env:**
- `scripts/create-admin.ts` *(new)* — tạo/cập nhật tài khoản quản trị qua `ADMIN_EMAIL`/`ADMIN_PASSWORD`(≥12)/`ADMIN_ROLE`/`ADMIN_NAME`; băm scrypt trước khi lưu; **không** tài khoản/mật khẩu mặc định.
- `package.json` *(modified)* — dependency `next-auth@5.0.0-beta.32`; script `admin:create`.
- `pnpm-lock.yaml` *(modified)*.
- `.env.example` *(modified)* — section Auth.js (`AUTH_SECRET`, `AUTH_URL`) + hướng dẫn provisioning. Không có giá trị bí mật thật.

**Kiểm thử:**
- `tests/lib/password.test.ts` *(new)* — 4 test (format scrypt, salt ngẫu nhiên, verify đúng/sai, hash hỏng → false).
- `tests/lib/session.test.ts` *(new)* — 6 test (guest/thiếu id/role lạ → null; admin/editor → actor; `getCurrentRole`).
- `tests/e2e/accounts.ts` *(new)* — tài khoản E2E (`E2E_ADMIN`/`E2E_EDITOR`, domain `.invalid`) cho DB E2E local.
- `tests/e2e/auth.e2e.ts` *(new)* — 8 test HTTP thật.
- `tests/e2e/seed-e2e.ts` *(modified)* — seed admin/editor có `passwordHash` (scrypt).
- `tests/e2e/admin.e2e.ts` *(modified)* — guest bị chuyển `/dang-nhap`; trang đăng nhập hiển thị form thật (Email/Mật khẩu).
- `tests/e2e/api.e2e.ts` *(modified)* — cập nhật chú thích (Auth.js đã nối).

**Tài liệu:**
- `docs/checkpoints/P18_AUTHJS_CHECKPOINT.md` *(new)* — tài liệu này.
- `PHASE_PROGRESS.md`, `CURRENT_STATUS.md`, `BLOCKERS.md` *(modified)*.

**Xác nhận:** **Không** sửa page/route công khai không liên quan; **không** sửa schema/model importer; **không** sửa API public.

---

## 5. Database / dependency / environment changes

**Database (schema):** thêm **1 cột** `users.password_hash TEXT NULL`. Migration `20261128123000_add_user_password_hash` — **chỉ** áp trên DB **dev/test local** (`wale_test`, `wale_e2e`); **KHÔNG** chạy migration/seed trên production.

**Dependency:** thêm **1** dependency `next-auth@5.0.0-beta.32` (Auth.js v5). Không thêm dependency băm mật khẩu (dùng `node:crypto`).

**Environment variables:**
- `AUTH_SECRET` — **BẮT BUỘC** ở runtime (sinh bằng `npx auth secret` hoặc `openssl rand -base64 32`). **Không** commit giá trị thật.
- `AUTH_URL` — URL công khai của ứng dụng (tùy chọn nếu suy ra được từ host).
- Biến **chỉ dùng khi provisioning** (đặt trong lệnh chạy, **không** ghi vào Git): `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_ROLE`, `ADMIN_NAME`.

---

## 6. Quy trình provisioning admin (không tài khoản mặc định)

1. Đặt `AUTH_SECRET` trong môi trường (local `.env` / Vercel Environment Variables — **không** commit).
2. Áp migration lên CSDL đích: `pnpm prisma migrate deploy`.
3. Tạo tài khoản quản trị đầu tiên (mật khẩu băm scrypt; **không** hardcode):
   ```
   DATABASE_URL="…" ADMIN_EMAIL="admin@example.com" \
   ADMIN_PASSWORD="$(openssl rand -base64 18)" ADMIN_ROLE=admin pnpm admin:create
   ```
4. Đăng nhập tại `/dang-nhap` bằng email/mật khẩu vừa tạo.

> Hệ thống **không** tạo tài khoản admin mặc định, **không** cấp quyền admin cho tài khoản mới, **không** có public registration. Người dùng **không** thể tự nâng quyền (role lấy từ DB, ký trong JWT, kiểm ở server).

---

## 7. Test results

| Loại | Lệnh | Kết quả |
|---|---|---|
| Typecheck | `pnpm typecheck` | ✅ **PASS** (0 lỗi) |
| Lint | `pnpm lint` | ✅ **PASS** (0 lỗi) |
| Unit | `pnpm test` | ✅ **PASS** — **381/381** (37 file) |
| Integration | `pnpm test:integration` | ✅ **PASS** — **59/59** (9 file, PostgreSQL 16.15 local `wale_test`) |
| E2E (HTTP thật) | `pnpm e2e` | ✅ **PASS** — **60/60** (Chrome CDP + DB `wale_e2e`) |
| Build | `pnpm build` | ✅ **PASS** (bao gồm route `/api/auth/[...nextauth]`) |

**Ánh xạ test P18.5 → kết quả (HTTP thật, không mock actor):**

| Trường hợp | Kết quả mong đợi | Bằng chứng |
|---|---|---|
| Guest truy cập admin page | Từ chối/chuyển login | `admin.e2e.ts`: guest → `307` chuyển `/dang-nhap` ✅ |
| Guest gọi admin API | 401 | `auth.e2e.ts`: `/api/v1/admin/recipes` → 401 `UNAUTHORIZED` ✅ |
| User non-admin (editor) | 403 | `auth.e2e.ts`: editor tạo taxonomy → 403 ✅ |
| Admin đăng nhập hợp lệ | Thành công | `auth.e2e.ts`: form → `/admin` ✅ |
| Admin truy cập admin API | Được phép | `auth.e2e.ts`: admin GET admin API → 200 ✅ |
| Session hết hạn/không hợp lệ | Từ chối | `auth.e2e.ts`: cookie giả mạo `authjs.session-token` → API 401 + page chuyển hướng ✅ |
| Client tự sửa role | Không nâng quyền | `auth.e2e.ts`: thêm `role=admin` vào request → vẫn 403 ✅ |
| Public API hiện hữu | Không bị ảnh hưởng | `auth.e2e.ts`: guest gọi API công khai → 200 ✅ |
| Importer permission | Vẫn enforce | unit `authorization.test.ts` + `import.service.test.ts` (giữ nguyên từ I1) ✅ |

**Phân loại:** **PASS** — toàn bộ mục trên. **Không** tuyên bố production authentication đã chạy trên Neon/Vercel thật (xem §9).

---

## 8. Acceptance Criteria (P18)

| AC | Nội dung | Kết quả |
|---|---|---|
| AC-P18-1 | Auth.js hoạt động với cấu hình thực tế local/test | ✅ PASS (Credentials + JWT, E2E thật) |
| AC-P18-2 | Admin đăng nhập bằng provider đã chốt | ✅ PASS (`auth.e2e.ts`) |
| AC-P18-3 | `getCurrentActor()` trả actor hợp lệ sau xác thực | ✅ PASS (unit + E2E HTTP) |
| AC-P18-4 | Admin authorization kiểm chứng qua HTTP thực tế | ✅ PASS (200/401/403 qua route handler thật) |
| AC-P18-5 | Guest & non-admin không truy cập được tài nguyên admin | ✅ PASS |
| AC-P18-6 | Importer permission từ I1 vẫn hoạt động | ✅ PASS (không đổi `authorization.ts`) |
| AC-P18-7 | Public/API regression không phát sinh | ✅ PASS (E2E public/api + 60/60) |
| AC-P18-8 | typecheck/lint/unit/integration/E2E/build PASS | ✅ PASS |
| AC-P18-9 | Tài liệu cấu hình & checkpoint đầy đủ | ✅ PASS (tài liệu này + `admin:create` + `.env.example`) |
| AC-P18-10 | Commit đã push `origin/main`, working tree sạch | ✅ PASS (xem §10) |

**Tổng: 10/10 PASS.**

---

## 9. Blockers

- **B-P06-02 — ĐÃ GIẢI QUYẾT (P18).** `getCurrentActor()` nối session thật; 401/403 kiểm chứng qua HTTP thật (E2E). Kéo theo **B-P07-02**, **B-P07_1-03**, **B-P08-03**, **B-P12-04** (nhóm "chưa kiểm 401/403 qua HTTP phiên thật") → **ĐÃ GIẢI QUYẾT**.
- **Còn mở (không thuộc phạm vi P18):** xác minh Auth.js trên **Neon/Vercel production thật** (cần `AUTH_SECRET` + tài khoản admin provisioning trên môi trường thật) — kế thừa nhóm **B-P13-01..04** / **B-P12-03**. Sandbox chạy trên PostgreSQL 16.15 local.
- **Không** phát sinh blocker mới.

---

## 10. Git

- Chỉ stage file thuộc phạm vi P18; commit + push **fast-forward** `origin/main` (không force-push/reset/rewrite).
- **Không** commit `.env`/credentials/secrets.
- Kiểm tra sau cùng: `git rev-parse HEAD`, `git rev-parse origin/main`, `git status`.

---

## 11. Tiếp theo

- **P18 hoàn thành — DỪNG.** **KHÔNG** tự chuyển sang I2 (URL Import).
- **Chờ chủ dự án đánh giá** và xác nhận bước tiếp theo.
- Việc còn lại khi lên production (thao tác thủ công của chủ dự án): đặt `AUTH_SECRET` trên Vercel, `prisma migrate deploy` + `pnpm admin:create` trên Neon, xác minh đăng nhập admin thật.
