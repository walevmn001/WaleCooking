# DECISIONS — WALE COOKING

> Nhật ký các quyết định đã chốt. Không tự thay đổi quyết định đã xác lập nếu chưa có căn cứ.
> Cập nhật: 2026-11-28 (P03).

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

> Chi tiết bối cảnh/lý do/đánh đổi/phương án thay thế của **D-P02-01..11** xem [ARCHITECTURE_DECISIONS.md](./docs/P02/ARCHITECTURE_DECISIONS.md).
> Chi tiết Design System của **D22–D28** xem [DESIGN_SYSTEM.md](./docs/P03/DESIGN_SYSTEM.md), [DESIGN_TOKENS.md](./docs/P03/DESIGN_TOKENS.md), [COLOR_ACCESSIBILITY_AUDIT.md](./docs/P03/COLOR_ACCESSIBILITY_AUDIT.md).

## Quyết định còn để mở (cần xác minh trước khi áp dụng)

| # | Nội dung | Cần xác minh | Ghi chú |
| --- | --- | --- | --- |
| O1 | Thời điểm tách backend riêng (NestJS/Fastify) | Kiến trúc | Chưa cần ở giai đoạn đầu |
| O2 | Chọn hosting triển khai (Vercel Hobby vs Cloudflare Pages) | Vận hành | Phi thương mại → cả hai khả thi |
| O3 | Dịch vụ logging/monitoring cụ thể & hạn mức free | Vận hành | Chưa có số liệu xác nhận |
| O4 | Nguồn tạo asset (mascot, bộ icon minh họa) | Thiết kế | P03 đã định **quy chuẩn** mascot/icon trong Design System nhưng **chưa có asset thật**; cần nguồn tạo (không dùng tài nguyên không rõ bản quyền) → B7 |
| O5 | Quy trình phê duyệt taxonomy giữa `editor` và `admin` | Nghiệp vụ | Tương ứng B-P01-01 |
| O6 | Cơ chế xuất/xóa dữ liệu cá nhân của người dùng | Quyền riêng tư | Tương ứng B-P01-03 |
| O7 | Có cần vai trò `moderator` (kiểm duyệt đánh giá) không? | Nghiệp vụ | Hiện **chưa** đưa vào |
| O8 | CMS MVP: admin tự viết vs Payload CMS 3 | Kiến trúc | P02 chọn admin tự viết (D21/D-P02-11); có thể chốt lại ở P03+ → B-P02-01 |
| O9 | Cơ chế backup bổ sung (PITR + export định kỳ) theo gói free | Vận hành | Chưa xác minh hạn mức Neon → B-P02-02 |
