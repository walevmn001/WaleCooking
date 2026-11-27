# DECISIONS — WALE COOKING

> Nhật ký các quyết định đã chốt. Không tự thay đổi quyết định đã xác lập nếu chưa có căn cứ.
> Cập nhật: 2026-11-28 (P05).

| # | Quyết định | Nội dung | Căn cứ | Trạng thái |
| --- | --- | --- | --- | --- |
| D1 | Mục đích dự án | **Cá nhân / phi thương mại** | Người dùng xác nhận tại P00 | Đã chốt |
| D2 | Kiến trúc backend/DB | **Stack lớp rời**: Next.js + Prisma + **Neon PostgreSQL** + Auth.js + **Cloudflare R2** | Ưu tiên chuẩn mở, tránh lock-in, gói miễn phí | Đã chốt |
| D3 | Checkpoint | **Commit local**, không push remote khi chưa xác nhận | Quy tắc an toàn Git | Đã chốt |
| D4 | Tên thương hiệu | **WALE COOKING** là tên sản phẩm chính thức; tên repo `WaleCooking` **giữ nguyên** | P00-FIX (đồng bộ thương hiệu) | Đã chốt |
| D5 | Phạm vi chức năng | **20 nhóm chức năng** đầy đủ | P00-FIX (bổ sung phạm vi) | Đã chốt |
| D6 | Hệ thống phân loại | **7 trục độc lập**: Food type, Cuisine/Origin, Ingredient, Cooking method, Meal type, Dietary preference, Allergen — **không gộp**; dữ liệu hóa, không hardcode frontend | P00-FIX (chuẩn hóa phân loại) | Đã chốt |
| D7 | Phong cách giao diện | **WALE COOKING — Pastel Mint** (bảng màu/typography đã chốt) | P00 (không thay đổi) | Đã chốt |
| D8 | Phân kỳ MVP | Phân loại 20 FR thành **MVP bắt buộc / Giai đoạn nâng cấp / Tính năng nâng cao**; MVP phải đủ 6 năng lực (khám phá, tìm & lọc, xem đầy đủ, điều chỉnh khẩu phần, chế độ nấu cơ bản, responsive + SEO cơ bản) | P01 (yêu cầu prompt) | Đã chốt — xem [MVP_SCOPE.md](./docs/P01/MVP_SCOPE.md) |
| D9 | Tiêu chuẩn chất lượng tham chiếu | **Core Web Vitals** (hiệu năng), **WCAG 2.2 AA** (trợ năng), **OWASP ASVS** L1 (toàn hệ thống) / L2 (xác thực) | P01 (định hướng prompt) | Đã chốt — mục tiêu, **chưa kiểm thử** |
| D10 | Product Constitution | **14 nguyên tắc bất biến** (PC-01..PC-14) ràng buộc mọi phase sau; ngoại lệ phải ghi lý do + được phê duyệt | P01 | Đã chốt — xem [PRODUCT_CONSTITUTION.md](./docs/P01/PRODUCT_CONSTITUTION.md) |
| D11 | Phân lớp kiến trúc | **4 layer** (Presentation/Application/Domain/Infrastructure) + **Ports & Adapters** chỉ ở điểm cần thay thế (DB, Storage, Search, Mail); không DDD đầy đủ | P02 | Đã chốt — D-P02-01 |
| D12 | Chiến lược session Auth.js | **Database session** (bảng `sessions`), không JWT-only | P02 | Đã chốt — D-P02-02 |
| D13 | RBAC | Cột `users.role` enum(`user`/`editor`/`admin`); **không** bảng `user_roles` ở MVP | P02 | Đã chốt — D-P02-03 |
| D14 | Mô hình taxonomy | **Tổng quát** `taxonomy_types` + `taxonomy_terms` (+ translations/aliases) cho **9 trục độc lập**; không gộp | P02 | Đã chốt — D-P02-04 |
| D15 | Kiến trúc tìm kiếm | MVP = **Postgres FTS + pg_trgm + unaccent**; chưa dùng dịch vụ ngoài | P02 | Đã chốt — D-P02-05 |
| D16 | Upload media | MVP = **server-proxy** qua Route Handler; presigned URL là tùy chọn | P02 | Đã chốt — D-P02-06 |
| D17 | Biểu diễn định lượng | Lưu `quantity_numeric` (`numeric(10,3)`) + `unit_id` + `quantity_type`; **phân số là lớp hiển thị** | P02 | Đã chốt — D-P02-07 |
| D18 | Delete behavior | FK **RESTRICT** mặc định; CASCADE chỉ cho dữ liệu con thuộc sở hữu | P02 | Đã chốt — D-P02-08 |
| D19 | Giới hạn JSONB | JSONB **chỉ** cho audit/snapshot/settings; không thay quan hệ cốt lõi | P02 | Đã chốt — D-P02-09 |
| D20 | Môi trường DB | **Neon branches** cho local/test/preview; production tách nhánh riêng | P02 | Đã chốt — D-P02-10 |
| D21 | CMS MVP | **Admin tự viết** trong Next.js; Payload CMS 3 là tùy chọn nâng cấp | P02 | Đã chốt (một phần mở) — D-P02-11 |
| D22 | Nguồn tham chiếu UI duy nhất | **Design tokens** (DTCG) tại `docs/P03/tokens/design-tokens.json` là **nguồn duy nhất** cho màu/typography/spacing/radius/shadow/breakpoint/z-index/motion; **không** dùng giá trị ngoài token | P03 | Đã chốt |
| D23 | Palette mở rộng | Giữ **6 màu brand gốc KHÓA**; thêm semantic + **shade phụ trợ** để đủ tương phản: `primary.default #52705C`, `border.strong #8F7E66`, `border.focus #52705C`, `text.muted #6B5C4F`, `text.subtle #7A6A5B` | P03 (đo contrast) | Đã chốt |
| D24 | Quy tắc màu không đạt AA | **Cấm chữ thường trắng trên `mintDark` (@789B83)** và trên pastel; `border.subtle`/`text.subtle` không dùng cho control/chữ thường trên nền pastel. Màu brand gốc **vẫn giữ** trong palette nhưng gắn hạn chế dùng | P03 ([COLOR_ACCESSIBILITY_AUDIT.md](./docs/P03/COLOR_ACCESSIBILITY_AUDIT.md)) | Đã chốt |
| D25 | Typography | Chỉ **Baloo 2** (heading) + **Nunito** (body) + fallback chuỗi cụ thể; scale cố định Display/H1–H4/bodyLg/body/bodySm/caption/label/button/nav (có size mobile & desktop) | P03 (định hướng P00) | Đã chốt |
| D26 | Card radius | **18–24px** (`radius.lg=18px`, `radius.xl=24px`); dùng thống nhất cho card/recipe card | P00 + P03 | Đã chốt |
| D27 | Breakpoint & grid | `sm 640` / `md 768` / `lg 1024` / `xl 1280` / `2xl 1536` (px); grid **4 / 8 / 12** cột; mobile-first | P03 (khớp NFR-RESP) | Đã chốt |
| D28 | Motion | Có token duration (80–420ms) + easing; **bắt buộc hỗ trợ `prefers-reduced-motion`**; animation nhẹ, GPU-friendly; **không** glassmorphism/shadow quá đậm | P03 | Đã chốt |
| D29 | Nhận diện mascot | **Một nhân vật duy nhất** (đầu bếp 2D "Wale"): mũ kem `#FFF9F0`, tạp dề mint `#C9E8D5`, da beige `#E8DCC6`, má pink `#F8DDE3`, nét `#594B40`. Khung cố định `220×260`; tỷ lệ cơ thể/trang phục/palette **bất biến** giữa 8 biến thể (chỉ đổi biểu cảm + tư thế tay) | P04 | Đã chốt |
| D30 | Logo & brand mark | 5 biến thể SVG nguyên bản: `logo-primary` (340×96, mark + wordmark), `logo-compact` (176×156), `logo-mark` (120×120, mascot-only), `favicon` (32×32), `app-icon` (512×512). Giữ nguyên tên **WALE COOKING**; không dùng logo thương hiệu khác | P04 | Đã chốt |
| D31 | Hệ icon | **38 icon SVG** khung `0 0 24 24`, `stroke-width=2`, `fill=none`, màu qua `currentColor`, chia 4 nhóm (nav 7 / cooking 9 / interaction 13 / content 9). Ưu tiên Lucide cho chức năng thông thường; icon đặc trưng thương hiệu tự thiết kế; **không dùng emoji** thay icon trong UI chính | P04 | Đã chốt |
| D32 | Illustration trạng thái | **9 minh họa SVG** khung `320×220`, phong cách blob pastel đồng nhất (Cream/Mint/Pink/Beige + nét Brown), kích thước vừa phải để không lấn át nội dung | P04 | Đã chốt |
| D33 | Định dạng & an toàn asset | SVG cho logo/mascot/icon/illustration; SVG **không** chứa script/`foreignObject`/`image`/DOCTYPE/`on*`/href ngoài; tên file kebab-case; sinh & kiểm bằng `scripts/p04_generate_assets.py` + `scripts/p04_validate_assets.py` | P04 | Đã chốt |
| D34 | Tổ chức mã nguồn P05 | `components/{ui,forms,navigation,feedback,recipe,layout,dev}` + `lib/{utils,hooks,constants,mock}` + `styles/` + `tests/` + `app/` (route groups). Mỗi nhóm có `index.ts` barrel export | P05 (§8) | Đã chốt |
| D35 | Hiện thực design tokens | Dùng **Tailwind CSS v4** `@theme` map 1:1 từ `design-tokens.json` P03 → CSS variables → utility → component. **Không** tạo hệ thống token thứ hai; không dùng giá trị ngoài token | P05 (§3.1) | Đã chốt |
| D36 | Icon & minh họa trong component | **Lucide** (`lucide-react`) cho icon chức năng thông thường; **asset P04** cho logo (`SiteLogo`), mascot (`RecipeImage` khi thiếu ảnh), illustration trạng thái (`EmptyState`/`ErrorState`/`not-found`). **Không** thêm thư viện icon khác | P05 (§3.6), P04/D31 | Đã chốt |
| D37 | Application Shell | Route groups `(public)`/`(auth)`/`(admin)` (không xuất hiện trong URL). Header/Footer **chỉ** đặt trong `(public)/layout.tsx`; `(auth)` khung tối giản, `(admin)` chỉ nền tảng aside+main. Root layout bọc `ToastProvider` + skip-link `#main-content` | P05 (§4) | Đã chốt |
| D38 | Route chức năng là placeholder | Các route Công thức/Danh mục/Kiến thức/Yêu thích/Tài khoản/Giới thiệu/Tìm kiếm/Điều khoản/Bảo mật/Bản quyền dùng `PlaceholderPage` và `NavItem.placeholder: true` — **không** tuyên bố module đã hoạt động | P05 (§4.3) | Đã chốt |
| D39 | Trang kiểm tra component | `/dev/components` — **dev-only**: `notFound()` khi `NODE_ENV === "production"`; dùng mock data có nhãn `[MOCK]`, không dùng production | P05 (§5) | Đã chốt |
| D40 | Stack kiểm thử P05 | **Vitest 5** + `@testing-library/react` + `jsdom`; `tests/**/*.test.{ts,tsx}`; **không** thêm framework UI/E2E mới trong P05 (E2E để phase sau) | P05 (§9) | Đã chốt |
| D41 | Phạm vi kết nối dữ liệu P05 | **Không** kết nối Prisma/Neon, Auth.js, Cloudflare R2 trong P05. Component **không** tự gọi API; tầng dữ liệu thuộc P06+ | P05 (§7) | Đã chốt |

> Chi tiết bối cảnh/lý do/đánh đổi/phương án thay thế của **D-P02-01..11** xem [ARCHITECTURE_DECISIONS.md](./docs/P02/ARCHITECTURE_DECISIONS.md).
> Chi tiết Design System của **D22–D28** xem [DESIGN_SYSTEM.md](./docs/P03/DESIGN_SYSTEM.md), [DESIGN_TOKENS.md](./docs/P03/DESIGN_TOKENS.md), [COLOR_ACCESSIBILITY_AUDIT.md](./docs/P03/COLOR_ACCESSIBILITY_AUDIT.md).
> Chi tiết bộ nhận diện minh họa của **D29–D33** xem [BRAND_ASSET_GUIDELINES.md](./docs/P04/BRAND_ASSET_GUIDELINES.md), [MASCOT_SPECIFICATION.md](./docs/P04/MASCOT_SPECIFICATION.md), [LOGO_USAGE_GUIDELINES.md](./docs/P04/LOGO_USAGE_GUIDELINES.md), [ICON_SYSTEM.md](./docs/P04/ICON_SYSTEM.md), [ILLUSTRATION_GUIDELINES.md](./docs/P04/ILLUSTRATION_GUIDELINES.md), [ASSET_CATALOG.md](./docs/P04/ASSET_CATALOG.md).
> Chi tiết hiện thực UI của **D34–D41** xem [docs/P05/](./docs/P05/): [IMPLEMENTATION_REPORT.md](./docs/P05/IMPLEMENTATION_REPORT.md), [COMPONENT_CATALOG.md](./docs/P05/COMPONENT_CATALOG.md), [APPLICATION_SHELL.md](./docs/P05/APPLICATION_SHELL.md), [RESPONSIVE_IMPLEMENTATION.md](./docs/P05/RESPONSIVE_IMPLEMENTATION.md), [ACCESSIBILITY_REPORT.md](./docs/P05/ACCESSIBILITY_REPORT.md), [TEST_REPORT.md](./docs/P05/TEST_REPORT.md).

## Quyết định còn để mở (cần xác minh trước khi áp dụng)

| # | Nội dung | Cần xác minh | Ghi chú |
| --- | --- | --- | --- |
| O1 | Thời điểm tách backend riêng (NestJS/Fastify) | Kiến trúc | Chưa cần ở giai đoạn đầu |
| O2 | Chọn hosting triển khai (Vercel Hobby vs Cloudflare Pages) | Vận hành | Phi thương mại → cả hai khả thi |
| O3 | Dịch vụ logging/monitoring cụ thể & hạn mức free | Vận hành | Chưa có số liệu xác nhận |
| O4 | Nguồn tạo asset (mascot, bộ icon minh họa) | Thiết kế | **ĐÃ GIẢI QUYẾT Ở P04** — 60 SVG **nguyên bản** do dự án tự sinh (`scripts/p04_generate_assets.py`), không dùng tài nguyên không rõ bản quyền (D29–D33); xem [ASSET_CATALOG.md](./docs/P04/ASSET_CATALOG.md). Phần **render/runtime** chuyển sang B-P04-01 |
| O5 | Quy trình phê duyệt taxonomy giữa `editor` và `admin` | Nghiệp vụ | Tương ứng B-P01-01 |
| O6 | Cơ chế xuất/xóa dữ liệu cá nhân của người dùng | Quyền riêng tư | Tương ứng B-P01-03 |
| O7 | Có cần vai trò `moderator` (kiểm duyệt đánh giá) không? | Nghiệp vụ | Hiện **chưa** đưa vào |
| O8 | CMS MVP: admin tự viết vs Payload CMS 3 | Kiến trúc | P02 chọn admin tự viết (D21/D-P02-11); có thể chốt lại ở P03+ → B-P02-01 |
| O9 | Cơ chế backup bổ sung (PITR + export định kỳ) theo gói free | Vận hành | Chưa xác minh hạn mức Neon → B-P02-02 |
