# P11.2 — RECIPE & ADMIN FLOW VERIFICATION (WALE COOKING)

> Phase: **P11 — Real-World Verification & UX Polish**
> Nguyên tắc: kiểm chứng **thực tế** bằng HTTP + kiểm quyền ở **tầng server/API**, không chỉ giao diện.
> Nhãn: **Verified** / **Automated Test Passed** / **External Verification Pending** / **Known Limitation** / **Backlog**.

---

## 0. Phương pháp

- Dựng production server (`pnpm build` + `pnpm start`) trên cổng 3000; gọi `curl` không gửi body cho GET.
- Kiểm **mã HTTP** của từng route (+ dev server 3001 đối chiếu), kiểm API ghi của khách (kỳ vọng 401).
- Đọc mã nguồn route/page để xác nhận: breadcrumb, empty state, error state, 404, nội dung tiếng Việt, loading.
- Kiểm quyền **ở tầng API/service** (RBAC tập trung) — không chỉ ẩn nút trên UI.

## 1. Luồng khách truy cập (guest) — kết quả

| # | Luồng | Route | HTTP (prod) | Trạng thái | Ghi chú |
|---|---|---|---|---|---|
| 1 | Trang chủ | `/` | **200** | Verified | ○ static prerender |
| 2 | Danh sách công thức | `/cong-thuc` | **200** | Verified | `force-dynamic` (đọc filter/favorites) |
| 3 | Chi tiết công thức | `/cong-thuc/[slug]` | **200** (slug tồn tại) / **404** (slug lạ) | Verified | Xem §1.1 — soft-404 đã sửa |
| 4 | Danh mục (chỉ mục) | `/danh-muc` | **200** | Verified | |
| 4b | Danh mục theo trục | `/danh-muc/[segment]` | **200** | Verified (SSG) | 6 trục prerender |
| 4c | Danh mục chi tiết term | `/danh-muc/[segment]/[slug]` | **200** / **404** | Verified | Xem §1.1 |
| 5 | Tìm kiếm | `/tim-kiem` | **200** | Verified | |
| 6 | Bộ lọc (query) | `/cong-thuc?...` | **200** | Verified | Lọc theo mealType/method/dietary/ingredient/maxMinutes |
| 7 | Phân trang | `?page=2` | **200** | Verified | `paginationSchema` (1..100) |
| 8 | Thêm yêu thích | Server Action | — | Automated Test Passed + Verified (cookie) | `wale_favorites` HttpOnly |
| 9 | Xóa yêu thích | Server Action | — | Automated Test Passed | có version + dedupe + giới hạn 50 |
| 10 | Danh sách yêu thích | `/yeu-thich` | **200** | Verified | Chỉ công thức `published` |
| 11 | Chia sẻ | `ShareRecipeButton` | — | Verified (read) | Web Share/navigator.share + fallback copy |

### 1.1. Soft-404 (BUG-01) — đã sửa & kiểm chứng lại

- Trước P11: `/cong-thuc/khong-ton-tai-xyz` và `/danh-muc/nhom-mon/khong-ton-tai-xyz` trả **HTTP 200** (soft-404).
- Sau FIX-A (xóa 3 `loading.tsx` tạo Suspense boundary): cả hai trả **HTTP 404** đúng.
- Xác minh lại sau khi build production: `404  /cong-thuc/khong-ton-tai-xyz`, `404  /danh-muc/nhom-mon/khong-ton-tai-xyz`, `404  /danh-muc/khong-ton-tai-xyz/xyz`.

### 1.2. Thành phần kiểm tra chéo (read + HTTP)

- **URL**: dùng slug tiếng Việt không dấu, kebab-case; ổn định (`/cong-thuc/[slug]`, `/danh-muc/[segment]/[slug]`).
- **Navigation**: Header (desktop/tablet/mobile) + PrimaryNav + MobileMenu + Footer; skip-link.
- **Breadcrumb**: trang chi tiết công thức + trang danh mục (JSON-LD BreadcrumbList đi kèm — xem [SEO_PERFORMANCE_AUDIT.md](./SEO_PERFORMANCE_AUDIT.md)).
- **Empty state / Error state**: `EmptyState`, `ErrorState` (P05) + `error.tsx`, `not-found.tsx`.
- **404**: `not-found.tsx` gốc + `notFound()` trong các route động; giờ trả đúng mã 404.
- **Nội dung tiếng Việt**: toàn bộ nhãn/mô tả tiếng Việt (siteConfig, navigation, taxonomy labels).
- **Hình ảnh**: `RecipeImage` (fallback mascot khi thiếu ảnh), `next/image` (remotePatterns cấu hình).
- **Responsive**: xem [MOBILE_UX_AUDIT.md](./MOBILE_UX_AUDIT.md) — hiển thị thực tế **External Verification Pending**.

## 2. Luồng quản trị (admin) — kết quả

Kiểm quyền ở **tầng API/service**. Auth.js **chưa nối** → `getCurrentActor()` trả `null` ⇒ mọi thao tác ghi trả **401** (đây là **Known Limitation** đã ghi từ P06/P07, không phải lỗi P11).

| # | Bước | Endpoint/Route | Kỳ vọng | Kết quả |
|---|---|---|---|---|
| 1 | Truy cập admin khi chưa đăng nhập | `/admin`, `/admin/cong-thuc` | Trang render (guard) | **200** — UI hiển thị thông báo quyền (`AdminAccessNotice`) |
| 2 | Xác minh bị từ chối (API) | `POST /api/v1/admin/recipes` | **401** | Verified: `{"error":{"code":"UNAUTHORIZED"…}}` |
| 3 | Đăng nhập quản trị | `/dang-nhap` | Cổng đăng nhập admin | **200** — Auth.js **chưa nối** ⇒ External Verification Pending |
| 4 | Xem danh sách công thức (admin) | `/admin/cong-thuc` | Danh sách | **200** |
| 5–9 | Tạo/Sửa/Nháp/Xuất bản/Lưu trữ | `POST/PATCH /api/v1/admin/recipes`, `[id]/publish`… | 401 (chưa auth) | Verified 401 — logic service có `requirePermission` |
| 10 | Quản lý danh mục | `/admin/danh-muc*`, `POST/PATCH/DELETE /api/v1/admin/taxonomy*` | 401 (chưa auth) | Verified 401 |
| 11 | Upload hình ảnh | `POST /api/v1/media` | 401 (chưa auth) | Verified 401 |
| 12 | Đăng xuất | Auth.js | — | External Verification Pending (chưa nối) |

### 2.1. Kiểm tra bảo mật luồng quản trị (server-side)

- **Session / Cookie**: yêu thích dùng cookie **HttpOnly**, `SameSite=Lax`, `Secure` (production), `Path=/`, 180 ngày (`lib/favorites/server.ts`). Không lộ dữ liệu qua JS.
- **CSRF**: Server Actions của Next.js + SameSite=Lax giảm thiểu; **chưa** kiểm token CSRF tường minh → ghi chú nếu cần (Backlog).
- **Validation**: mọi payload qua Zod (`lib/validation/**`); sai → `AppError` 400 với thông báo tiếng Việt.
- **RBAC**: `lib/auth/authorization.ts` (`can`/`requirePermission`) — quyền kiểm ở **tầng service**, không hardcode role, không chỉ ẩn UI.
- **Lỗi API**: định dạng lỗi thống nhất `{"error":{"code","message"}}`; không lộ stack/chi tiết nội bộ.
- **Upload file không hợp lệ**: `lib/storage/image-validation.ts` kiểm **magic bytes**, kích thước, MIME; khóa file do **server sinh**.

## 3. Kết luận

- **Verified**: toàn bộ route công khai trả 200; route không tồn tại trả 404 (soft-404 đã sửa); API ghi của khách trả 401 ở tầng server.
- **Automated Test Passed**: yêu thích cookie, validation, authorization (unit + integration).
- **External Verification Pending**: đăng nhập admin thật (Auth.js chưa nối) ⇒ không thể kiểm 401/403 với **phiên đăng nhập thật**; hiển thị thực tế trên trình duyệt/thiết bị (xem [MANUAL_VERIFICATION_CHECKLIST.md](./MANUAL_VERIFICATION_CHECKLIST.md)).
- **Known Limitation**: Auth.js chưa nối; seed dev không có công thức đã xuất bản (dùng fixture/integration để kiểm luồng có dữ liệu).
