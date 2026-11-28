# P11.6 — SECURITY AUDIT (WALE COOKING)

> Phase: **P11 — Real-World Verification & UX Polish**
> Nhãn: **Verified** / **Automated Test Passed** / **External Verification Pending** / **Known Limitation** / **Backlog**.
> Không thử tấn công production; không đưa secret vào báo cáo/Git.

---

## 1. Admin authentication & authorization

| Hạng mục | Kết quả | Bằng chứng |
|---|---|---|
| Xác thực admin (Auth.js) | **Known Limitation** | Auth.js **chưa nối**; `getCurrentActor()` → `null` |
| Từ chối ghi khi chưa đăng nhập | **Verified** | `POST /api/v1/admin/recipes` → **401** `{"error":{"code":"UNAUTHORIZED"…}}` |
| RBAC tập trung ở server | **Verified (read+unit)** | `lib/auth/authorization.ts` (`can`/`requirePermission`) — kiểm ở **tầng service**, không hardcode role |
| Quyền taxonomy (chỉ Admin) | **Verified** | `POST/PATCH/DELETE /api/v1/admin/taxonomy*` → **401** (chưa auth) |
| Không che giấu ở UI | **Verified** | Quyền kiểm ở API/service, không chỉ ẩn nút |
| Phân quyền phiên thật (401/403 E2E) | **External Verification Pending** | Cần Auth.js + phiên thật |

**Nguyên tắc**: khách truy cập thường **không thể** sửa/xóa dữ liệu — mọi thao tác ghi yêu cầu quyền và hiện trả 401 khi chưa xác thực.

---

## 2. Public API & input validation

| Hạng mục | Kết quả | Bằng chứng |
|---|---|---|
| Public API đọc | **Verified** | `/api/v1/recipes` → **200**; `/api/v1/kitchen/ingredient-match` → **200** |
| Validation đầu vào | **Verified** | Zod (`lib/validation/**`): phân trang, list query, recipe, taxonomy, ingredient-match |
| Giới hạn tham số | **Verified** | `paginationSchema` page≥1, pageSize 1..100; match ≤30 nguyên liệu, ≤80 ký tự |
| Lỗi API có cấu trúc | **Verified** | `{"error":{"code","message"}}` — không lộ stack |
| Injection (SQL) | **Verified (read)** | Prisma tham số hóa; không nối chuỗi SQL thủ công |

---

## 3. File upload

| Hạng mục | Kết quả | Bằng chứng |
|---|---|---|
| Kiểm loại file | **Verified (read)** | `lib/storage/image-validation.ts` — **magic bytes** + MIME + kích thước |
| Khóa file do server sinh | **Verified (read)** | Không tin tên file người dùng → tránh path traversal |
| Yêu cầu quyền khi upload | **Verified** | `POST /api/v1/media` → **401** khi chưa auth |
| R2 thật / CORS / presigned | **External Verification Pending** | Chưa có credentials R2 (B-P07-01) |

---

## 4. Cookie, CSRF, XSS, redirect

| Hạng mục | Kết quả | Bằng chứng |
|---|---|---|
| Cookie yêu thích | **Verified (read)** | `wale_favorites` **HttpOnly**, `SameSite=Lax`, `Secure` (prod), `Path=/`, 180 ngày |
| Version + dedupe + giới hạn | **Verified** | `lib/favorites/cookie.ts` (v:1, ≤50, xử lý cookie hỏng/quá lớn) |
| CSRF | **Known Limitation** | Server Actions + `SameSite=Lax` giảm thiểu; **chưa** token CSRF tường minh → **Backlog** |
| XSS | **Verified (read)** | React escape mặc định; JSON-LD dùng `JSON.stringify`; không `dangerouslySetInnerHTML` với dữ liệu người dùng |
| SVG `dangerouslyAllowSVG` | **Verified (read)** | Chỉ phục vụ **SVG brand P04** (đã kiểm định, không script/href ngoài); `contentDispositionType: 'attachment'` |
| Open redirect | **Verified (read)** | Không có redirect theo tham số người dùng |

---

## 5. Headers & secret exposure (đã sửa trong P11 — BUG-03)

- **Security headers** (mọi route qua `next.config.ts` `headers()`): **Verified (HTTP thực)**
  - `X-Content-Type-Options: nosniff`
  - `X-Frame-Options: SAMEORIGIN`
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - `X-DNS-Prefetch-Control: on`
  - `Permissions-Policy: camera=(), microphone=(), geolocation=()`
- **Ẩn stack**: `poweredByHeader: false` → `X-Powered-By` **đã biến mất** (Verified).
- **Chưa đặt CSP**: Next.js cần inline style/script → cân nhắc **nonce-based CSP** ở phase sau (Backlog; tránh làm hỏng UI).
- **HSTS**: chỉ hiệu lực qua HTTPS production → **External Verification Pending** (chưa deploy).
- **Secret**: `lib/config/env.ts` kiểm tra biến môi trường, **không log secret**; `.env` không commit (`.env.example` là mẫu).

---

## 6. Error messages & logging

| Hạng mục | Kết quả |
|---|---|
| Lỗi HTTP chuẩn hóa | **Verified** — `AppError` (Validation/NotFound/Forbidden/Unauthorized/Conflict) + mã lỗi |
| Không lộ chi tiết nội bộ | **Verified (read)** — map lỗi Prisma an toàn (`lib/db/prisma-errors.ts`) |
| Logging | Không log dữ liệu nhạy cảm; chưa có logging tập trung (Backlog — O3) |

---

## 7. Tổng hợp & ưu tiên

- **Không phát hiện lỗ hổng Critical** (không leo quyền, không lộ secret, không mất dữ liệu).
- **Đã sửa trong P11**: thiếu security headers + lộ `X-Powered-By` (BUG-03, Medium).
- **Known Limitation**: Auth.js chưa nối (401/403 phiên thật chưa kiểm E2E).
- **Backlog**: CSP nonce-based; CSRF token tường minh; HSTS sau deploy; logging tập trung.
