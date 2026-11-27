# P06 — DATABASE SECURITY

> Chính sách bảo mật cho tầng dữ liệu & authorization interface của WALE COOKING.
> Cập nhật: 2026-11-28 (P06).

---

## 1. Kiểm tra biến môi trường

`lib/config/env.ts` xác thực biến môi trường phía server bằng Zod:

- Lazy + memoized: chỉ đọc khi cần; `resetServerEnvCache()` cho test.
- Khi thiếu/sai: **ném lỗi chỉ nêu TÊN biến**, **không in giá trị** (tránh lộ secret ra log).
- `DATABASE_URL` bắt buộc, phải khớp `postgres(ql)://`. `DIRECT_URL`, `TEST_DATABASE_URL` tùy chọn.
- `hasR2Config(env)` xác định khi nào dùng provider R2 vs local.
- Không hardcode connection string; `.env` đã `.gitignore`; chỉ commit `.env.example` (mẫu, giá trị giả).

---

## 2. RBAC tập trung (không hardcode rải rác)

`lib/auth/authorization.ts` là **điểm quyết định quyền duy nhất**:

- `APP_ROLES = ["user","editor","admin"]` (+ khách `null`), thứ bậc `user < editor < admin`.
- `type Permission` liệt kê quyền nghiệp vụ (`recipe:create`, `recipe:publish`, `media:upload`,
  `taxonomy:manage`, `user:manage`, …) → `PERMISSIONS_BY_ROLE` ánh xạ role→permission.
- Hàm: `hasRole`, `can`, `canAll`, `isGuest`, `requireActor`, `requirePermission`.
- `requirePermission(actor, permission)` → ném `UnauthorizedError` nếu khách, `ForbiddenError` nếu
  thiếu quyền.

> **Không** kiểm tra tên role rải rác trong code. Mọi thao tác ghi gọi `requirePermission`.

---

## 3. Session / danh tính (Auth.js CHƯA nối)

`lib/auth/session.ts`:

```ts
export async function getCurrentActor(): Promise<Actor | null> {
  // TODO(P08+): thay bằng `const session = await auth();` rồi map sang Actor.
  return null;
}
```

- Hiện tại **trả `null`** (khách) — **KHÔNG** giả lập người dùng đã đăng nhập (P06 §8).
- Hệ quả: mọi endpoint ghi (qua `requirePermission`) nhận **401** cho tới khi Auth.js hoàn thiện.
- Interface đã sẵn để thay bằng session Auth.js thật mà không đổi chữ ký service.

---

## 4. Validation & chống mass assignment

- **Validate phía server** mọi input bằng Zod (`parseInput`) — không tin dữ liệu client.
- **Allow-list trường:** schema chỉ nhận đúng trường cần; repository `create/update` chỉ truyền
  trường đã kiểm → **ngăn mass assignment**.
- **Kiểm quan hệ:** trước khi ghi, xác minh FK tồn tại (ví dụ taxonomy term / category term); sai →
  `ValidationError`.
- **Kiểm quyền trước thao tác ghi** (`requirePermission`).

---

## 5. Xử lý lỗi an toàn

- `toErrorResponse()`: lỗi không xác định trả thông báo chung (**không** stack trace, **không** SQL).
- `mapPrismaError`: chuyển mã lỗi Prisma thành `AppError` có ngữ nghĩa; P2002 kèm **tên trường**
  nhưng không lộ chi tiết nội bộ.
- Prisma client **không** log query; chỉ `warn`/`error`.
- Không trả stack trace cho người dùng.

---

## 6. Transaction

- Thao tác nhiều bảng → `$transaction` để tránh trạng thái nửa vời hoặc rò rỉ dữ liệu không nhất quán.
- Xóa dữ liệu cha có con RESTRICT sẽ bị DB chặn → ném `ConflictError` (không xóa cưỡng bức).

---

## 7. Nguyên tắc dữ liệu

- FK mặc định **RESTRICT**; **CASCADE** chỉ cho dữ liệu con thuộc sở hữu (D18).
- Không xóa code/dữ liệu đã có chỉ để test xanh.
- Không tạo dữ liệu giả hiển thị như dữ liệu thật; dữ liệu dev dùng TLD `.invalid`.
- Không commit `.env`, credentials, file DB, API keys.

---

## 8. Secrets & cấu hình

| Secret/Var | Xử lý |
| --- | --- |
| `DATABASE_URL` / `DIRECT_URL` / `TEST_DATABASE_URL` | chỉ trong `.env` (gitignored); `.env.example` để trống/giá trị giả |
| `AUTH_SECRET` / `AUTH_URL` | `.env.example` để trống; sinh bằng `openssl rand -base64 32` |
| `R2_*` (Cloudflare) | để trống tới khi có tài khoản; adapter tự chuyển local khi thiếu |
| `MEDIA_LOCAL_DIR` | thư mục local cho provider dev/test |

---

## 9. Phần CHƯA xác minh

- Chưa kiểm bảo mật trên Neon thật (SSL/PgBouncer), chưa có Auth.js → chưa kiểm luồng đăng nhập/401
  end-to-end qua HTTP.
- OWASP ASVS L1/L2 là **mục tiêu**, chưa kiểm thử chính thức (D9).
