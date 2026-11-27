# P05 — APPLICATION SHELL

> Đặc tả Phần B — bộ khung giao diện chính: layout, header, navigation, footer, responsive.
> Tuân thủ Design System **P03** và Brand Assets **P04**. Cập nhật: 2026-11-28.

---

## 1. Cây layout (App Router)

| Layout | File | Vai trò |
| --- | --- | --- |
| **Root** | [app/layout.tsx](../../app/layout.tsx) | `<html lang="vi">`, font thương hiệu, metadata, viewport, skip-link, `ToastProvider` |
| **Public** | [app/(public)/layout.tsx](../../app/(public)/layout.tsx) | `SiteHeader` + `<main id="main-content">` + `SiteFooter` |
| **Auth** | [app/(auth)/layout.tsx](../../app/(auth)/layout.tsx) | Khung tối giản: logo + main (max-w-md) + link về trang chủ; **không** header/footer đầy đủ |
| **Admin** | [app/(admin)/layout.tsx](../../app/(admin)/layout.tsx) | Aside (logo mark + badge "Khu vực quản trị") + main; **chỉ nền tảng**, chưa có dashboard |

Các trạng thái toàn cục:
- [app/loading.tsx](../../app/loading.tsx) — `LoadingState` trong `Container`.
- [app/error.tsx](../../app/error.tsx) — error boundary (client): `ErrorState` + nút "Thử lại" (`reset`) + mã lỗi `digest`.
- [app/not-found.tsx](../../app/not-found.tsx) — 404 với illustration P04 (`404.svg`) + link về trang chủ.

> Các layout **không** trùng lặp header/footer. Header/Footer chỉ nằm trong `(public)/layout.tsx`; nhóm `(auth)` và `(admin)` dùng khung riêng.
> Route group `(public)`, `(auth)`, `(admin)` có prefix `( )` nên **không** xuất hiện trong URL.

---

## 2. Root layout — chi tiết

File: [app/layout.tsx](../../app/layout.tsx)

- **Font:** `Baloo_2` (heading → `--font-baloo`) + `Nunito` (body → `--font-nunito`), `subsets: ["latin","vietnamese"]`, `display: "swap"`, gắn class biến lên `<html>` (đúng font KHÓA của P03/D25).
- **Metadata:** title template `%s · WALE COOKING`, description từ `siteConfig`, favicon `/assets/brand/favicon.svg` (P04).
- **Viewport:** `themeColor #FFF9F0`, `width=device-width`, `initialScale 1`.
- **Skip link:** `<a href="#main-content" class="skip-link">Bỏ qua tới nội dung chính</a>` — hiện khi focus (`z-skip-link`).
- **ToastProvider** bọc toàn bộ cây → mọi trang dùng được `useToast()`.
- `<body>`: `min-h-dvh bg-background text-ink antialiased`.

---

## 3. Header

File: [components/layout/site-header.tsx](../../components/layout/site-header.tsx) — client component, `role="banner"`, sticky `top-0 z-sticky`, cao tuần tự `h-16` (4rem).

Thành phần (Desktop ≥ `lg`):
- **Logo** P04 (`SiteLogo variant="full"` → `logo-primary.svg`) liên kết về `/`.
- **PrimaryNav** (`hidden lg:block`): Trang chủ · Công thức · Danh mục · Kiến thức nấu ăn · Yêu thích.
- **SearchInput** (`hidden md:block`, `w-56 xl:w-64`) → điều hướng `/tim-kiem?q=…` (Enter).
- **Favorites entry** (`Link` icon trái tim → `/yeu-thich`, `hidden sm:inline-flex`).
- **Account entry** (`Link` icon người → `/tai-khoan`, `hidden sm:inline-flex`).
- **Nút mở menu** (`IconButton`, `lg:hidden`) → `MobileMenu` (drawer).

Tính chất:
- Không che nội dung: chiều cao cố định; nội dung bắt đầu sau header trong luồng layout.
- Icon có `aria-label`; nav có `aria-label`; nút menu có `aria-expanded`/`aria-controls`.

---

## 4. Navigation

Cấu hình tại [lib/constants/navigation.ts](../../lib/constants/navigation.ts):

| Nhóm | Mục |
| --- | --- |
| `primaryNav` (Header + MobileMenu) | Trang chủ `/` · Công thức `/cong-thuc` · Danh mục `/danh-muc` · Kiến thức nấu ăn `/kien-thuc` · Yêu thích `/yeu-thich` |
| `accountNav` | Tài khoản `/tai-khoan` |
| `footerNavGroups` | Khám phá / Tài khoản / Về WALE COOKING |
| `footerPolicyLinks` | Điều khoản sử dụng · Chính sách bảo mật · Chính sách bản quyền nội dung |

Đánh dấu route: mỗi `NavItem` có `placeholder: true|false`. Chỉ `Trang chủ` là `false` (đã có trang chủ); các route còn lại là placeholder và hiển thị dấu hiệu rõ (chấm + title ở desktop nav, "Sắp có" ở mobile) → **không** tuyên bố module đã hoạt động.

`PrimaryNav` dùng `usePathname`, gán `aria-current="page"` cho mục đang mở.

---

## 5. Mobile menu

File: [components/layout/mobile-menu.tsx](../../components/layout/mobile-menu.tsx) — `lg:hidden`.

- Portal ra `document.body`; `role="dialog" aria-modal="true"`, `aria-label="Menu điều hướng"`.
- **Focus trap** (Tab/Shift+Tab vòng trong panel), **Esc** đóng, **khoá cuộn nền**, focus vào phần tử đầu khi mở, **trả focus** về nút mở khi đóng.
- Nội dung: logo, `SearchInput`, nav chính (mục placeholder hiển thị "Sắp có"), Divider, Yêu thích + Tài khoản (kèm icon).

---

## 6. Footer

File: [components/layout/site-footer.tsx](../../components/layout/site-footer.tsx) — `role="contentinfo"`.

- Nhóm 1: `SiteLogo` + mô tả ngắn (`siteConfig.description`).
- Nhóm 2–4: `footerNavGroups` (mỗi nhóm là `<nav aria-label>` + `<ul>`).
- **Liên hệ:** chỉ hiển thị khi `siteConfig.contact` có dữ liệu thật. Hiện `email/phone/address = null` → **không** render. (Không bịa địa chỉ/email/số điện thoại.)
- Dòng cuối: copyright động (`© {năm hiện tại} WALE COOKING. Bảo lưu mọi quyền.`) + `footerPolicyLinks`.

---

## 7. Routes đã dựng

| Route | File | Loại |
| --- | --- | --- |
| `/` | [app/(public)/page.tsx](../../app/(public)/page.tsx) | Trang chủ (foundation — không phải module thật) |
| `/cong-thuc` | app/(public)/cong-thuc/page.tsx | Placeholder (`PlaceholderPage`) |
| `/danh-muc` | app/(public)/danh-muc/page.tsx | Placeholder |
| `/kien-thuc` | app/(public)/kien-thuc/page.tsx | Placeholder |
| `/yeu-thich` | app/(public)/yeu-thich/page.tsx | Placeholder |
| `/tai-khoan` | app/(public)/tai-khoan/page.tsx | Placeholder |
| `/gioi-thieu` | app/(public)/gioi-thieu/page.tsx | Placeholder |
| `/tim-kiem` | app/(public)/tim-kiem/page.tsx | Placeholder (đọc `?q=`) |
| `/dieu-khoan` | app/(public)/dieu-khoan/page.tsx | Placeholder (pháp lý) |
| `/bao-mat` | app/(public)/bao-mat/page.tsx | Placeholder (pháp lý) |
| `/ban-quyen` | app/(public)/ban-quyen/page.tsx | Placeholder (pháp lý) |
| `/dang-nhap` | app/(auth)/dang-nhap/page.tsx | Khung xác thực (chưa có Auth.js) |
| `/admin` | app/(admin)/admin/page.tsx | Khung quản trị (chưa có chức năng) |
| `/dev/components` | app/dev/components/page.tsx | Trang kiểm tra (**dev-only**) |

Tổng cộng **14 route công khai/khung + 1 route dev-only**; build liệt kê 15 route (14 static + `/tim-kiem` dynamic).

---

## 8. Những gì KHÔNG thuộc phạm vi P05 (chưa triển khai)

- Không có dữ liệu công thức thật; trang chủ/route là khung hoặc placeholder.
- Chưa kết nối Prisma/Neon, Auth.js, Cloudflare R2 (thuộc phase sau).
- Chưa có dashboard admin, chưa có phân quyền thật.
- Chưa có i18n runtime (mới sẵn sàng cấu trúc; nhãn hiện là tiếng Việt).
