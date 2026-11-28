# P11.9 — BUG FIX REPORT (WALE COOKING)

> Phase: **P11 — Real-World Verification & UX Polish**
> Mỗi lỗi gồm: mô tả · bằng chứng · file/module · nguyên nhân · cách sửa · test xác nhận.
> Không refactor diện rộng; không thêm chức năng ngoài phạm vi.

---

## A. Lỗi đã sửa

### BUG-01 — Soft-404: route động trả HTTP 200 cho nội dung không tồn tại · **Medium**

- **Mô tả**: `/cong-thuc/[slug]` và `/danh-muc/[segment]/[slug]` render đúng giao diện "Không tìm thấy trang" nhưng trả **HTTP 200**.
- **Bằng chứng**: `curl` dev (3001) + prod (3000) đều `200` trước khi sửa; có `<meta name="robots" content="noindex">` (giảm rủi ro index nhưng sai mã trạng thái).
- **File/module**:
  - [app/loading.tsx](file:///workspace/app/loading.tsx) (đã xóa)
  - [app/(public)/cong-thuc/loading.tsx](file:///workspace/app/(public)/cong-thuc/loading.tsx) (đã xóa)
  - [app/(public)/cong-thuc/[slug]/loading.tsx](file:///workspace/app/(public)/cong-thuc/[slug]/loading.tsx) (đã xóa)
  - [app/(public)/cong-thuc/[slug]/page.tsx](file:///workspace/app/(public)/cong-thuc/[slug]/page.tsx) (`loadRecipe` → `notFound()`)
- **Nguyên nhân gốc**: `loading.tsx` tạo **Suspense boundary** ở cấp segment → Next.js stream "shell" (loading UI) với status 200 ngay; `notFound()` gọi sau không thể đổi mã trạng thái. Gọi `notFound()` trong `generateMetadata` cũng **không** sửa được (Next stream metadata) — đã thực nghiệm và revert.
- **Cách sửa (FIX-A)**: xóa 3 `loading.tsx`. Đánh đổi: mất skeleton tải lạnh ở vài route công khai (chấp nhận; điều hướng client vẫn có trạng thái chờ; không mất chức năng). Backlog: tái giới thiệu loading UI **có phạm vi** (inline `<Suspense>`).
- **Test xác nhận**: prod HTTP → `404  /cong-thuc/khong-ton-tai-xyz`, `404  /danh-muc/nhom-mon/khong-ton-tai-xyz`, `404  /danh-muc/khong-ton-tai-xyz/xyz`.

### BUG-02 — Thiếu `sitemap.xml` và `robots.txt` · **Medium**

- **Mô tả**: `/sitemap.xml` và `/robots.txt` trả **404**.
- **Bằng chứng**: `curl` → `404  /sitemap.xml`, `404  /robots.txt`.
- **Cách sửa (FIX-B)**: tạo [app/sitemap.ts](file:///workspace/app/sitemap.ts) (`force-dynamic`, chỉ nội dung công khai; try/catch quanh truy vấn DB) + [app/robots.ts](file:///workspace/app/robots.ts) (chặn `/admin`, `/api/`, `/dev/`; trỏ sitemap).
- **Test xác nhận**: `200  /sitemap.xml`, `200  /robots.txt`; robots không chứa `/admin`/`/api/`/`/dev/`; build output có `○ /robots.txt` + `ƒ /sitemap.xml`.

### BUG-03 — Thiếu security headers & lộ `X-Powered-By` · **Medium**

- **Mô tả**: response chỉ có `X-Powered-By: Next.js`; thiếu `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`.
- **Bằng chứng**: `curl -D -` trên `/`.
- **File/module**: [next.config.ts](file:///workspace/next.config.ts).
- **Cách sửa (FIX-C)**: thêm `securityHeaders` + `async headers()`; đặt `poweredByHeader: false`. **Không** đặt CSP (Backlog để tránh hỏng UI).
- **Test xác nhận**: header HTTP thực hiện diện trên mọi route; `X-Powered-By` **không** còn.

---

## B. Hạng mục ghi nhận (Backlog — chưa sửa trong P11)

| ID | Mô tả | Mức độ | Lý do không sửa trong P11 |
|---|---|---|---|
| FIND-04 | `pnpm build` cần `DATABASE_URL` (Prisma eager init ở [lib/db/prisma.ts](file:///workspace/lib/db/prisma.ts#L33)) | Medium | Sửa cần refactor hạ tầng lõi (lazy-init qua Proxy) — rủi ro > lợi ích trong phase ổn định. Workaround: đặt `DATABASE_URL` khi build. |
| FIND-05 | Cảnh báo Turbopack "dynamic filesystem access" (media route) | Low | Cảnh báo deploy-size, không lỗi chức năng. |
| FIND-06 | Seed dev tạo 0 công thức | Low | Giới hạn xác minh; dùng fixture/integration test thay thế. |

---

## C. Tổng hợp sửa

| ID | Mức độ | Trạng thái | Ghi chú |
|---|---|---|---|
| BUG-01 | Medium | **Đã sửa + Verified** | Xóa 3 `loading.tsx` → 404 đúng |
| BUG-02 | Medium | **Đã sửa + Verified** | Thêm sitemap.ts + robots.ts |
| BUG-03 | Medium | **Đã sửa + Verified** | Security headers + ẩn X-Powered-By |
| FIND-04 | Medium | **Backlog** | Build cần DATABASE_URL |
| FIND-05 | Low | **Backlog** | Turbopack warning |
| FIND-06 | Low | **Ghi nhận** | Seed dev không recipe |

- **Không** có lỗi Critical. **Không** còn lỗi High đã xác nhận mà chưa có báo cáo/hướng xử lý.
- **Không refactor diện rộng**; **không** thay đổi design system; **không** thêm dependency.
