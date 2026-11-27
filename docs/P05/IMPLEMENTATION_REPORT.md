# P05 — IMPLEMENTATION REPORT: WALE COOKING APPLICATION FOUNDATION & SHARED UI SYSTEM

> Phase **P05** hợp nhất hai phần: **Phần A — Shared UI Components** và **Phần B — Application Shell**.
> Nguồn tham chiếu bắt buộc: Design System **P03** ([DESIGN_SYSTEM.md](../P03/DESIGN_SYSTEM.md), [design-tokens.json](../P03/tokens/design-tokens.json)) và Brand Assets **P04** (`public/assets/`).
> Không thay đổi kiến trúc P02; không tự thiết kế lại giao diện; không tạo hệ thống token thứ hai.
> Cập nhật: 2026-11-28.

## 1. Phạm vi đã thực hiện

| Hạng mục P05 | Trạng thái | Ghi chú |
| --- | --- | --- |
| 3.1 Foundation (tokens, global styles, reset, typography, color, spacing, responsive utils, focus, theme vars) | ✅ | `styles/globals.css` map token P03 qua `@theme` Tailwind v4; không tạo token mới ngoài P03 |
| 3.2 Basic components | ✅ | 14 component trong `components/ui/` |
| 3.3 Form components | ✅ | `components/forms/` (FormField + 7 control) |
| 3.4 Navigation & feedback | ✅ | `components/navigation/` (4) + `components/feedback/` (3) |
| 3.5 Cooking-specific | ✅ | 13 component trong `components/recipe/` |
| 3.6 Quy chuẩn component | ✅ | TypeScript types, default props, không business logic, không tự gọi API |
| 4.1–4.5 Application Shell | ✅ | Root/Public/Auth/Admin layout, Header, Navigation, Footer |
| 5. Trang kiểm tra giao diện (dev-only) | ✅ | `/dev/components` — 404 ở production |
| 6. Responsive & Accessibility | ✅ (một phần — xem [ACCESSIBILITY_REPORT.md](./ACCESSIBILITY_REPORT.md)) | Đã kiểm type/tĩnh; **chưa** kiểm trình duyệt thật |
| 9. Testing | ✅ (một phần — xem [TEST_REPORT.md](./TEST_REPORT.md)) | unit + typecheck + lint + build; **chưa** kiểm browser/screen reader |

## 2. Công nghệ (tuân thủ P02, không đổi stack)

- **Next.js 16.4.6** (App Router, Turbopack) · **React/React-DOM 19.3.1** · **TypeScript 5.9.3**.
- **Tailwind CSS 4.3.5** qua `@tailwindcss/postcss` (không thêm framework UI khác).
- **lucide-react 1.82.0** cho icon chức năng (P04 §D31: ưu tiên Lucide).
- **Vitest 5.1.2** + `@testing-library/react` + `jsdom 26.1.0`.
- Quản lý gói: **pnpm 10.5.2**. Node **v24.1.0**.
- **Không** kết nối database/Auth/R2 trong P05 (chưa thuộc phạm vi). Không import Prisma/Auth.js.

## 3. Phần A — Shared UI Components

### 3.1 Foundation
- `styles/globals.css`:
  - `@import "tailwindcss"` + `@theme` **map 1:1 từ `design-tokens.json` P03**: color (brand/background/surface/text/border/primary/accent/secondary/status/chip), font family/weight, type scale (kèm `--text-*--line-height`), spacing base 4px, radius, shadow, easing, breakpoints, container, animation.
  - Type scale nâng cấp ở `@media (min-width:1024px)` đúng P03 (mobile → desktop).
  - `:root` chứa `--z-*` (dropdown 1000…skipLink 1080), `--duration-*`, control sizes (sm 36 / md 44 / lg 52), `--touch-target-min: 44px`, `--icon-*`, `--line-width-prose`, `--focus-ring`.
  - `@utility` cho `z-*`, `focus-ring`, `prose-width`. `.container-page` đặt trong `@layer components` (có media query — Tailwind v4 `@utility` không phù hợp cho class lồng media query).
  - `@layer base`: reset chuẩn (font body/heading, `text-wrap: balance/pretty`, `:focus-visible`, media max-width), `.skip-link`.
  - `@media (prefers-reduced-motion: reduce)`: tắt animation/transition (**bắt buộc theo P03 §D28**).
- `lib/utils/cn.ts` — ghép class có điều kiện (không tailwind-merge).
- `lib/utils/format.ts` — `formatMinutes`, `formatServings` (chuỗi tiếng Việt).
- `lib/constants/site.ts`, `lib/constants/navigation.ts` — cấu hình site + điều hướng (đánh dấu `placeholder` cho route chưa có).
- `lib/hooks/use-outside-click.ts`.

### 3.2–3.5 Components
Xem danh mục đầy đủ tại [COMPONENT_CATALOG.md](./COMPONENT_CATALOG.md).

### 3.6 Quy chuẩn đã tuân thủ
- Mỗi component có **TypeScript types rõ ràng** + **default props** hợp lý.
- **Không chứa business logic module** và **không tự gọi API**.
- Có xử lý **trạng thái lỗi / rỗng** (`EmptyState`, `ErrorState`, `LoadingState`, `NutritionSummary` rỗng, `AllergenBadges` rỗng).
- Tuân thủ token P03 (màu/typography/radius/spacing/shadow/z-index/motion).
- Dùng **Lucide** hoặc **asset P04** phù hợp (logo, mascot, illustration trạng thái).
- Tránh abstraction thừa: chỉ tách `FormField` context và các wrapper cần thiết.

## 4. Phần B — Application Shell

Xem chi tiết tại [APPLICATION_SHELL.md](./APPLICATION_SHELL.md).

- **Root layout** `app/layout.tsx`: `lang="vi"`, font **Baloo 2** + **Nunito** (`next/font/google`, subsets `latin`+`vietnamese`), metadata (title template, favicon P04), viewport `themeColor #FFF9F0`, skip-link "Bỏ qua tới nội dung chính", bọc **`ToastProvider`**.
- **Public layout** `app/(public)/layout.tsx`: `SiteHeader` + `<main id="main-content">` + `SiteFooter`.
- **Auth layout** `app/(auth)/layout.tsx`: khung tối giản (không header/footer đầy đủ).
- **Admin layout** `app/(admin)/layout.tsx`: aside + main (chỉ nền tảng; dashboard placeholder).
- **Header**: logo P04, nav chính (desktop), search, favorites, account, nút mở menu (mobile) → `MobileMenu`.
- **Footer**: logo, mô tả thương hiệu, nhóm liên kết, policy links, copyright động. **Chỉ hiện "Liên hệ" nếu có cấu hình thật** (`siteConfig.contact` đang `null` → không hiển thị).
- **Navigation**: `primaryNav` (Trang chủ / Công thức / Danh mục / Kiến thức nấu ăn / Yêu thích) + `accountNav`. Route chưa triển khai đánh dấu `placeholder: true` và hiển thị "Chưa triển khai / Sắp có".

## 5. Bản đồ file quan trọng

```
app/
  layout.tsx                 Root layout (font, metadata, ToastProvider, skip-link)
  loading.tsx | error.tsx | not-found.tsx
  (public)/layout.tsx        SiteHeader + main + SiteFooter
  (public)/page.tsx          Trang chủ (foundation, không phải module thật)
  (public)/{cong-thuc,danh-muc,kien-thuc,yeu-thich,tai-khoan,gioi-thieu,
            tim-kiem,dieu-khoan,bao-mat,ban-quyen}/page.tsx  → PlaceholderPage
  (auth)/layout.tsx + (auth)/dang-nhap/page.tsx
  (admin)/layout.tsx + (admin)/admin/page.tsx
  dev/components/page.tsx    Trang kiểm tra (dev-only, 404 ở production)
components/
  ui/ forms/ navigation/ feedback/ recipe/ layout/ dev/
lib/
  constants/{site,navigation}.ts · hooks/use-outside-click.ts · utils/{cn,format}.ts · mock/recipes.ts
styles/globals.css
tests/  (11 file, 60 test)
```

## 6. Kết quả kiểm tra (xem [TEST_REPORT.md](./TEST_REPORT.md) để biết chi tiết)

| Hạng mục | Lệnh | Kết quả |
| --- | --- | --- |
| TypeScript | `pnpm typecheck` | ✅ 0 lỗi |
| ESLint | `pnpm lint` | ✅ 0 lỗi / 0 cảnh báo |
| Unit test | `pnpm test` | ✅ 60/60 pass (11 file) |
| Production build | `pnpm build` | ✅ thành công, 15 route |

## 7. Phần chưa hoàn thành / chưa xác minh

- **Chưa kiểm trên trình duyệt thật**: responsive thực tế (mobile/tablet/desktop), focus ring thực tế, `prefers-reduced-motion` trên thiết bị, tràn ngang, touch target.
- **Chưa chạy axe / Lighthouse**, chưa test **screen reader** (NVDA/VoiceOver), chưa kiểm **zoom 200%/320px**.
- **Chưa xác minh render pixel asset P04** trong UI (kế thừa B-P04-01).
- Trang chủ và các route chức năng chỉ là **khung/placeholder** — **không** có dữ liệu công thức thật (đúng phạm vi P05).
- Không tuyên bố đạt **WCAG 2.2 AA** (chưa có kết quả kiểm đo trên UI thật).

## 8. Hướng tiếp tục cho P06+

- P06: xây **module Recipe** thật (data layer + Prisma) và thay `PlaceholderPage` bằng trang có dữ liệu thật, dùng lại `components/recipe/*`.
- Kết nối `SiteHeader` search/favorites/account với module thật khi có.
- Bổ sung kiểm thử trình duyệt (Playwright) khi môi trường hỗ trợ.
- Đóng B-P03-01 / B-P04-01 bằng kiểm đo trên UI thật.
