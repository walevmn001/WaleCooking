# CURRENT STATUS — WALE COOKING

> Cập nhật: 2026-11-28 (P04).

## Tóm tắt
- **Sản phẩm:** WALE COOKING — website hướng dẫn nấu ăn (tiếng Việt, sẵn sàng i18n EN).
- **Phase hiện tại:** hoàn thành **P00**, **P00-FIX**, **P01**, **P02**, **P03** và **P04**; **chưa bắt đầu P05.**
- **Đã hoàn thiện P00:** khảo sát thực tế + tài liệu định hướng + đề xuất công nghệ.
- **Đã hoàn thiện P00-FIX:** đồng bộ thương hiệu sang WALE COOKING, bổ sung đầy đủ 20 nhóm chức năng, chuẩn hóa 7 trục phân loại, cập nhật tài liệu trạng thái.
- **Đã hoàn thiện P01:** bộ đặc tả sản phẩm có thể triển khai — PRD, Product Constitution, personas, user journeys, đặc tả 20 nhóm chức năng, quy tắc nghiệp vụ, NFR đo lường được, phạm vi MVP và tiêu chí nghiệm thu.
- **Đã hoàn thiện P02:** kiến trúc hệ thống, thiết kế module, thiết kế database, ERD, hợp đồng API, bảo mật/phân quyền, kiến trúc tìm kiếm, lưu trữ media, kiến trúc triển khai và nhật ký quyết định kiến trúc.
- **Đã hoàn thiện P03:** **Design System WALE COOKING — Pastel Mint** — bộ quy chuẩn giao diện + design tokens máy đọc được, audit WCAG 2.2 AA (contrast đo thực tế), đặc tả component, layout/spacing, responsive, motion, accessibility. **Chưa viết code ứng dụng / chưa dựng UI thật** (thuộc P05).
- **Đã hoàn thiện P04:** **Bộ nhận diện minh họa** — 60 asset SVG nguyên bản (5 logo/brand mark, 8 biến thể mascot, 38 icon, 9 illustration trạng thái) + 7 tài liệu quy chuẩn trong `docs/P04/`. Sinh/kiểm tự động bằng script; validator **0 lỗi, 0 cảnh báo**; tổng ~56.6 KB. **Chưa tích hợp vào UI** (thuộc P05); phần render pixel chưa xác minh do môi trường không có rasterizer.

## Git
| Mục | Giá trị |
| --- | --- |
| Branch hiện tại | `main` |
| Remote | `origin` → `https://github.com/walevmn001/WaleCooking` |
| Commit P00 | `a7c3ee5` — docs(P00): khảo sát dự án, xác lập yêu cầu và checkpoint nền tảng |
| Commit P00-FIX | `59ca67a` — docs(P00-FIX): đồng bộ thương hiệu WALE COOKING và hoàn thiện phạm vi sản phẩm |
| Commit P01 | `59f3059` — docs(P01): PRD và Product Constitution cho WALE COOKING |
| Commit P02 | `ebb9acb` (nhánh agent) → merge `49213e2` vào `main` |
| Commit P03 | `84b3618` — docs(P03): Design System WALE COOKING — Pastel Mint |
| Commit P04 | *(commit chứa tài liệu này — xem `git log -1`)* |
| Working tree | Sạch sau khi commit P04 |
| `origin/main` | Cập nhật checkpoint P04 (xem báo cáo push) |

## Kiến trúc đã chốt (không thay đổi)
- Stack lớp rời: **Next.js + Prisma + Neon PostgreSQL + Auth.js + Cloudflare R2**.
- Ưu tiên gói miễn phí. Dự án **phi thương mại**. Giao diện **WALE COOKING — Pastel Mint**.
- P02: kiến trúc phân lớp (Presentation / Application / Domain / Infrastructure + Database, Auth, Media, Search, CMS, External Services) với adapter cho các điểm cần thay thế (DB, Storage, Search, Mail). Xem [ARCHITECTURE_DECISIONS.md](./docs/P02/ARCHITECTURE_DECISIONS.md).
- P03: **Design tokens là nguồn tham chiếu duy nhất** cho UI (màu/typography/spacing/radius/shadow/breakpoint/z-index/motion). Không dùng giá trị nằm ngoài token.

## Sản phẩm bàn giao P01 (`docs/P01/`)
`PRD.md` · `PRODUCT_CONSTITUTION.md` · `USER_PERSONAS.md` · `USER_JOURNEYS.md` · `FUNCTIONAL_REQUIREMENTS.md` · `BUSINESS_RULES.md` · `NON_FUNCTIONAL_REQUIREMENTS.md` · `MVP_SCOPE.md` · `ACCEPTANCE_CRITERIA.md`

## Sản phẩm bàn giao P02 (`docs/P02/`)
`SYSTEM_ARCHITECTURE.md` · `MODULE_DESIGN.md` · `DATABASE_SCHEMA.md` · `ENTITY_RELATIONSHIP_DIAGRAM.md` · `API_CONTRACT.md` · `AUTHORIZATION_SECURITY.md` · `SEARCH_ARCHITECTURE.md` · `MEDIA_STORAGE.md` · `DEPLOYMENT_ARCHITECTURE.md` · `ARCHITECTURE_DECISIONS.md`

## Sản phẩm bàn giao P03 (`docs/P03/`)
`DESIGN_SYSTEM.md` · `DESIGN_TOKENS.md` · `COLOR_ACCESSIBILITY_AUDIT.md` · `TYPOGRAPHY_AND_LAYOUT.md` · `COMPONENT_SPECIFICATIONS.md` · `RESPONSIVE_GUIDELINES.md` · `MOTION_GUIDELINES.md` · `ACCESSIBILITY_GUIDELINES.md` · `DESIGN_QA_CHECKLIST.md` · `tokens/design-tokens.json`

## Sản phẩm bàn giao P04 (`docs/P04/` + `public/assets/`)
**Tài liệu (`docs/P04/`):** `BRAND_ASSET_GUIDELINES.md` · `MASCOT_SPECIFICATION.md` · `LOGO_USAGE_GUIDELINES.md` · `ICON_SYSTEM.md` · `ILLUSTRATION_GUIDELINES.md` · `ASSET_CATALOG.md` · `ASSET_QA_CHECKLIST.md`

**Tài nguyên (60 SVG, ~56.6 KB):**
- `public/assets/brand/` (5): `logo-primary` · `logo-compact` · `logo-mark` · `favicon` · `app-icon`
- `public/assets/mascot/` (8): `mascot-default` · `mascot-happy` · `mascot-cooking` · `mascot-holding-recipe` · `mascot-thinking` · `mascot-success` · `mascot-error` · `mascot-waving`
- `public/assets/icons/nav/` (7) · `icons/cooking/` (9) · `icons/interaction/` (13) · `icons/content/` (9) → **38 icon**
- `public/assets/illustrations/` (9): `empty-recipes` · `no-results` · `empty-favorites` · `empty-shopping-list` · `loading` · `error` · `404` · `success` · `welcome`

**Script sinh/kiểm:** `scripts/p04_generate_assets.py` · `scripts/p04_validate_assets.py`. Chi tiết danh mục: [ASSET_CATALOG.md](./docs/P04/ASSET_CATALOG.md).

## Việc còn chờ xác minh
- **B5:** repo là shallow clone (ảnh hưởng thấp).
- **B6:** chưa có tài khoản/môi trường triển khai (Neon, R2, Vercel/Cloudflare…).
- **B7:** chưa có asset thật (mascot, bộ icon minh họa riêng) → **ĐÃ GIẢI QUYẾT (P04)** — 60 SVG nguyên bản + quy chuẩn.
- **B-P01-01:** quy trình phê duyệt taxonomy giữa `editor` và `admin` chưa chốt.
- **B-P01-02:** tương phản màu Pastel Mint/Soft Pink trên nền Cream cần xác minh WCAG 2.2 AA → **đã ĐO thực tế ở P03** (xem [COLOR_ACCESSIBILITY_AUDIT.md](./docs/P03/COLOR_ACCESSIBILITY_AUDIT.md)); các cặp không đạt đã có quy tắc cấm dùng + shade phụ trợ.
- **B-P01-03:** cơ chế xuất/xóa dữ liệu cá nhân của người dùng chưa chốt.
- **B-P02-01:** CMS MVP dùng admin tự viết; Payload CMS chỉ là phương án nâng cấp — chưa chốt.
- **B-P02-02:** cơ chế backup điểm-trong-thời-gian (PITR) của Neon theo gói free chưa xác minh.
- **B-P03-01:** nghiệm thu a11y/responsive/motion **trên UI thật** (axe, screen reader, zoom 200%, 320px, header sticky) chưa thực hiện — chờ P05.
- **B-P04-01:** **render pixel & tương thích runtime** của asset P04 (mascot trên nền P03, logo ≥16–24px, `currentColor` trên Safari/Firefox) chưa xác minh — môi trường build không có SVG rasterizer; chờ tích hợp UI thật.
- Hạn mức gói miễn phí đã ghi theo thời điểm **11/2026** — cần kiểm tra lại trước khi deploy.

## Phase tiếp theo
- **P05** — *(chưa xác định phạm vi)*. Không tự triển khai; chờ yêu cầu tiếp theo.

## Tham chiếu
- [PHASE_PROGRESS.md](./PHASE_PROGRESS.md) · [DECISIONS.md](./DECISIONS.md) · [BLOCKERS.md](./BLOCKERS.md)
- Tài liệu P00: [docs/P00](./docs/P00/) · P01: [docs/P01](./docs/P01/) · P02: [docs/P02](./docs/P02/) · P03: [docs/P03](./docs/P03/) · P04: [docs/P04](./docs/P04/)
