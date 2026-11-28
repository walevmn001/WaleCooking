# P11.6 — SEO, PERFORMANCE & SECURITY AUDIT (WALE COOKING)

> Phase: **P11 — Real-World Verification & UX Polish**
> Nhãn: **Verified** / **Automated Test Passed** / **External Verification Pending** / **Known Limitation** / **Backlog**.
> Phần Security tách riêng: [SECURITY_AUDIT.md](./SECURITY_AUDIT.md).

---

## 1. SEO

### 1.1. Metadata

| Hạng mục | Kiểm tra | Kết quả |
|---|---|---|
| Title | Mỗi trang có `title` (layout + `generateMetadata` theo slug) | PASS (read) |
| Description | `siteConfig.description` + mô tả công thức | PASS (read) |
| Canonical | `metadataBase` (P08) + canonical theo route | PASS (read) |
| Open Graph | `openGraph` ở root layout; ảnh → `RecipeImage` | PASS (read) |
| `metadataBase` | Cấu hình ở `app/layout.tsx` (P08) | PASS |

### 1.2. Sitemap & Robots (đã sửa trong P11 — BUG-02)

- **`/sitemap.xml`** — tạo mới [app/sitemap.ts](file:///workspace/app/sitemap.ts): `dynamic = "force-dynamic"`, liệt kê
  trang tĩnh công khai + trang danh mục (6 trục) + công thức **`published`** (phân trang tối đa 50×100 = 5000).
  Mọi truy vấn DB bọc try/catch ⇒ DB lỗi không làm hỏng sitemap.
- **`/robots.txt`** — tạo mới [app/robots.ts](file:///workspace/app/robots.ts): `allow: "/"`, `disallow: ["/admin", "/admin/", "/api/", "/dev/"]`, trỏ `sitemap`.
- **Verified (HTTP, prod)**: `/sitemap.xml` → **200**, `/robots.txt` → **200**; robots **không** rò `/admin`, `/api/`, `/dev/`.
- **Không đưa draft vào sitemap**: sitemap chỉ lấy `listPublic` (published) — thỏa yêu cầu P11.
- **Backlog**: `SITE_URL` fallback `http://localhost:3000` khi thiếu `NEXT_PUBLIC_SITE_URL` → cần đặt biến khi deploy.

### 1.3. Structured data

| Loại | Vị trí | Kiểm tra | Kết quả |
|---|---|---|---|
| Recipe (schema.org/Recipe) | `app/(public)/cong-thuc/[slug]/page.tsx` (JSON-LD) | Chỉ chứa dữ liệu **có thật** trong recipe | PASS (read) |
| BreadcrumbList | Trang chi tiết + danh mục (P08) | Khớp breadcrumb hiển thị | PASS (read) |

**Nguyên tắc đã tuân thủ**:
- **Không** tạo structured data chứa thông tin không có trong recipe.
- **Không** hiển thị đánh giá (rating) giả.
- **Không** khai báo thời gian nấu khi không có dữ liệu.
- **Không** tạo canonical trỏ sai.
- **Không** để trang draft xuất hiện ở sitemap công khai.

### 1.4. URL

- Công thức: `/cong-thuc/[slug]` (slug tiếng Việt không dấu, kebab-case).
- Danh mục: `/danh-muc`, `/danh-muc/[segment]`, `/danh-muc/[segment]/[slug]`.
- **Verified**: các URL trả 200; URL không tồn tại trả **404** (soft-404 đã sửa — BUG-01).

---

## 2. Performance

| Hạng mục | Kiểm tra | Kết quả |
|---|---|---|
| Production build | `pnpm build` | **PASS** (42 route) |
| Server/Static split | Nội dung tĩnh prerender (`○`), SSG cho danh mục (`●`), động khi cần (`ƒ`) | PASS (read output) |
| Giữ SSR/SSG phù hợp | Trang chi tiết công thức dùng server render + JSON-LD | PASS |
| Image optimization | `next/image` (`RecipeImage`) + `sizes`; `dangerouslyAllowSVG` chỉ cho SVG brand P04 | PASS (read) |
| Font loading | `next/font` (Baloo 2 + Nunito) | PASS (read) |
| Client components | Chỉ dùng `"use client"` cho phần tương tác (filters, favorites, cooking, kitchen) | PASS (read) |
| Repeated fetching | Server component gọi service 1 lần/trang; không fetch lặp ở client | PASS (read) |
| Dependencies | Không thêm dependency trong P11 | PASS |

### 2.1. Kết quả build (thực tế)

- 42 route; có `/sitemap.xml` (`ƒ`) + `/robots.txt` (`○`); 6 trục danh mục SSG; các trang công cụ prerender.
- Cảnh báo build (không chặn): **Turbopack dynamic filesystem access** ở media route → FIND-05, **Backlog** (Low).

### 2.2. Chưa đo được (External Verification Pending)

- **Bundle size thực tế**, Core Web Vitals, Lighthouse — cần browser thật/CI đo.
- **Database query performance** — chưa có profiling (môi trường sandbox đơn giả).
- Không tối ưu bằng cách làm mất tính năng.

---

## 3. Kết luận

- **Verified**: sitemap/robots 200 + nội dung đúng; structured data không chứa dữ liệu bịa; URL + 404 đúng; build thành công.
- **Automated Test Passed**: build.
- **External Verification Pending**: bundle size/CWV/Lighthouse/DB profiling; kiểm rich results bằng công cụ Google.
- **Known Limitation / Backlog**: `NEXT_PUBLIC_SITE_URL` khi deploy; Turbopack warning; CSP (xem [SECURITY_AUDIT.md](./SECURITY_AUDIT.md)).
