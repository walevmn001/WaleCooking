# P07.1 — Auth.js Integration

> Cập nhật: 2026-11-28 (P07.1).

## 1. Trạng thái

| Mục | Kết quả |
| --- | --- |
| Auth.js v5 cài đặt | ✅ `next-auth@5.0.0-beta.32` + `@auth/prisma-adapter@2.11.3` |
| Cấu hình NextAuth | ✅ `lib/auth/auth.ts` |
| PrismaAdapter | ✅ dùng bảng `users`/`accounts`/`sessions`/`verification_tokens` (P06 schema) |
| Session strategy | ✅ `database` (theo P02) |
| Route handler | ✅ `app/api/auth/[...nextauth]/route.ts` |
| Actor mapping | ✅ callback `session` gắn `id` + `role` |
| `getCurrentActor()` | ✅ dùng `auth()`; trả `null` khi chưa đăng nhập |
| Provider OAuth | ⏳ Chưa có credentials |
| Xác minh login thật | ⏳ Chưa có provider |

## 2. Kiến trúc

```
client → /api/auth/* (Auth.js) → PrismaAdapter → PostgreSQL
                                       ↓
                          session (database) → session callback
                                       ↓
                         session.user.id + session.user.role
                                       ↓
                         getCurrentActor() → Actor { id, role }
                                       ↓
                         requirePermission(actor, permission) → 401/403
```

## 3. RBAC

- Vai trò: `user` < `editor` < `admin` (lưu ở `users.role`).
- Permissions: `PERMISSIONS_BY_ROLE` trong `lib/auth/authorization.ts`.
- Mọi endpoint ghi gọi `requirePermission()` → không hardcode role.
- `actor = null` (guest) → 401.

## 4. Cấu hình env

```env
AUTH_SECRET=       # sinh bằng: npx auth secret
AUTH_URL=http://localhost:3000
# Provider (khi có):
# AUTH_GITHUB_ID=...
# AUTH_GITHUB_SECRET=...
```

## 5. Hành vi khi chưa có provider

- `auth()` trả `null` → `getCurrentActor()` trả `null`.
- Mọi `POST/PATCH/DELETE` nhận 401.
- Đọc công khai (GET) vẫn hoạt động.

## 6. External verification pending

Cần provider credentials để xác minh:
- Login/logout thật.
- Session expiration.
- Account linking.
- HTTP 401/403 end-to-end.
