# P07 — RECIPE AUTHORIZATION

> Phân quyền module công thức theo [docs/P02/AUTHORIZATION_SECURITY.md](../P02/AUTHORIZATION_SECURITY.md).
> Nguyên tắc: **RBAC tập trung**, KHÔNG hardcode role rải rác. Cập nhật: 2026-11-28 (P07).

---

## 1. Mô hình RBAC (P02 D-P02-03)

- Vai trò lưu ở `users.role` (enum `app_role`): **`user` < `editor` < `admin`**.
- **KHÔNG** có bảng `user_roles`; **KHÔNG** có vai trò `moderator` ở MVP.
- Nguồn duy nhất: [lib/auth/authorization.ts](../../lib/auth/authorization.ts).

```ts
type Role = "user" | "editor" | "admin";
interface Actor { id: string; role: Role }   // actor = null ⇒ guest
```

Hàm: `hasRole`, `can`, `canAll`, `isGuest`, `requireActor` (401), `requirePermission` (401/403).

## 2. Ma trận permission (đã hiện thực)

| Permission | user | editor | admin |
| --- | :---: | :---: | :---: |
| `favorite:manage` | ✅ | ✅ | ✅ |
| `recipe:read:draft` | — | ✅ | ✅ |
| `recipe:create` | — | ✅ | ✅ |
| `recipe:update` | — | ✅ | ✅ |
| `recipe:archive` | — | ✅ | ✅ |
| `recipe:submit_review` | — | ✅ | ✅ |
| `recipe:publish` | — | ✅ | ✅ |
| `recipe:delete` | — | — | ✅ |
| `media:upload` | — | ✅ | ✅ |
| `taxonomy:manage` | — | — | ✅ |
| `user:manage` | — | — | ✅ |

> Guest (`null`) không có permission nào → chỉ đọc nội dung công khai.

## 3. Ánh xạ hành động → permission

| Hành động | Permission | Nơi kiểm |
| --- | --- | --- |
| Đọc công khai (published) | (không cần) | `listPublic`, `getPublicBySlug` |
| Xem danh sách/chi tiết quản trị | `recipe:read:draft` | `listAdmin`, `getAdminDetail` |
| Tạo công thức | `recipe:create` | `create` |
| Cập nhật | `recipe:update` | `update` |
| Gửi duyệt | `recipe:submit_review` | `submitForReview` |
| Xuất bản | `recipe:publish` | `publish` |
| Lưu trữ | `recipe:archive` | `archive` |
| Xóa mềm | `recipe:delete` | `remove` |
| Lịch sử phiên bản | `recipe:read:draft` | `listVersions` |
| Upload/lưu trữ media | `media:upload` | `MediaService.upload`/`archive` |

## 4. Điểm quyết định (authorization enforcement)

- **Tầng service là nơi bắt buộc** (server-side): mọi method ghi của `RecipeService`/
  `MediaService` gọi `requirePermission(actor, ...)` **trước** khi chạm repository.
- **UI chỉ là lớp giao diện**: trang quản trị gọi `can(actor, ...)` để ẩn form/nút; nhưng
  **server vẫn kiểm lại** — không tin UI. (`RecipeStatusActions` ghi rõ điều này trong comment.)
- **Route handler** lấy actor qua `getCurrentActor()` rồi truyền vào service; route **không**
  tự quyết định quyền.

## 5. Hành vi khi Auth.js chưa nối (B-P06-02)

[lib/auth/session.ts](../../lib/auth/session.ts) — `getCurrentActor()` trả **`null`** (guest):

- Mọi thao tác ghi qua HTTP → **401** (Unauthorized).
- Trang quản trị → hiển thị `<AdminAccessNotice>` (không hiện form).
- **KHÔNG** giả lập người dùng đã đăng nhập; **KHÔNG** dùng user giả để bỏ qua kiểm quyền.

> Đây là **hành vi an toàn có chủ đích** (fail-closed): khi chưa xác thực được, từ chối thay
> vì cho qua.

## 6. Kiểm thử authorization

- Integration [recipe.service.test.ts](../../tests/integration/recipe.service.test.ts):
  - guest (`null`) gọi `create/update/publish/archive/remove` → ném `UnauthorizedError`.
  - role `user` gọi thao tác ghi → `ForbiddenError` (403).
  - role `editor`/`admin` → thành công (admin có `recipe:delete`).
- Unit [authorization.test.ts](../../tests/lib/authorization.test.ts): `can`, `hasRole`,
  `requireActor` (401), `requirePermission` (401/403), thứ bậc role.

> Các test dùng **actor giả trong bộ nhớ** (đối tượng `{id, role}`) — điều này **được phép**
> để kiểm logic; khác với việc *giả lập phiên đăng nhập thật* (điều bị cấm). Xem
> [TEST_REPORT.md](./TEST_REPORT.md) §6.

## 7. Phòng vệ liên quan

- **Mass assignment:** service chỉ đọc trường có trong Zod schema; `authorId`/`editorId` do
  server gán từ actor — client không đặt được.
- **Rò rỉ dữ liệu:** API không trả `deletedAt`/chi tiết nội bộ cho guest; lỗi 500 che chi tiết.
- **ID/quan hệ:** resolve slug → `termId`/`unitId` trong repository; thiếu → `ValidationError`
  (không tạo quan hệ rác).

## 8. Phần CHƯA xác minh

- ⛔ Chưa kiểm 401/403 **end-to-end qua HTTP** (Auth.js chưa nối) — chỉ kiểm ở tầng service.
- ⛔ Chưa triển khai rate limiting / audit log thao tác quản trị (ngoài phạm vi P07).
- ⛔ Chưa có quy trình phê duyệt nhiều bước giữa editor và admin thật (tương ứng B-P01-01/B-P02-03):
  hiện `submit-review` là chuyển trạng thái cơ bản, `publish` do actor có quyền thực hiện.
