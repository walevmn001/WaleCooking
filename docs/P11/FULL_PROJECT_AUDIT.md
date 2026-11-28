# P11.1 — FULL PROJECT AUDIT (WALE COOKING)

> Phase: **P11 — Real-World Verification & UX Polish** · Ngày: 2026-11-28
> Phạm vi: audit trạng thái thực tế sau **P10** (P00–P10). **Chưa sửa code** ở bước này
> (đúng yêu cầu: *"Không sửa code trước khi hoàn thành audit và xác định phạm vi"*).

## 0. Phương pháp & giới hạn môi trường

- **01 agent**, không sub-agent. Không làm lại P00–P10, không đổi stack/kiến trúc.
- Audit dựa trên: đọc mã nguồn + chạy bộ kiểm thử hiện có. **Không** có trong sandbox:
  PostgreSQL/Neon, Cloudflare R2, credentials Auth.js, trình duyệt headless (Playwright), thiết bị thật.
- Do đó mọi nhận định về **hành vi trình duyệt / thiết bị / DB thật** được đánh dấu
  `External Verification Pending`, không suy diễn.
- Phân loại mức độ: **Critical / High / Medium / Low** (định nghĩa theo prompt §II).

### Xác minh Git (baseline trước khi audit)

| Mục | Giá trị (thực tế) |
| --- | --- |
| Branch | `trae/agent-8KQLUd` |
| HEAD | `be41af13675f517b3145a3beb573905eeb6a4512` |
| `origin/main` | `be41af13675f517b3145a3beb573905eeb6a4512` (khớp HEAD) |
| Working tree | Sạch |
| Log | `be41af1` (P10) → `c8f9b91` (P09) → `ca1b4e9` (P08) → `4c88ed6` (P07.1) → `82fd189` (P07) |

→ Mốc tham chiếu P10 `be41af1` **được xác nhận** trên local và remote.

### Baseline kiểm thử (chạy lại ở P11.7)

| Kiểm tra | Kết quả |
| --- | --- |
| `pnpm typecheck` | ✅ 0 lỗi |
| `pnpm lint` | ✅ 0 lỗi / 0 cảnh báo |
| `pnpm test` | ✅ 337/337 pass (31 file) |
| `pnpm test:integration` | ⛔ Không chạy — không có PostgreSQL |
| E2E/browser | ⛔ Không chạy — không có browser |

## 1. Bảng audit 17 khu vực

Ký hiệu cột **Xác minh sandbox**: 🟢 = xác minh được (đọc code/test), 🟡 = một phần,
🔴 = không xác minh được trong sandbox (cần môi trường ngoài).

| # | Khu vực | Trạng thái | File/module liên quan | Kiểm thử hiện có | Xác minh sandbox |
| --- | --- | --- | --- | --- | --- |
| 1 | **Foundation** (design system, shared UI) | Tốt | `styles/globals.css`, `components/{ui,forms,navigation,feedback,layout,recipe}/*`, `docs/P03`, `docs/P05` | `tests/components/*` (10 file) | 🟢 |
| 2 | **Database** (Prisma, migration, repository) | Tốt (code); DB thật chưa nối | `prisma/schema.prisma` (22 enum/57 model), `prisma/migrations/20261127175936_init`, `lib/db/**`, `lib/services/**` | `tests/integration/*` (9 file, 28 chạy ở P06) | 🟡 |
| 3 | **Recipe** (CRUD/detail/listing) | Tốt | `lib/services/recipe.service.ts`, `lib/db/repositories/recipe.repository.ts`, `app/(public)/cong-thuc/**`, `app/api/v1/recipes/**` | `tests/lib/recipe-*.test.ts`, `tests/integration/recipe.*.test.ts` | 🟢 |
| 4 | **Admin** (auth, authz, CRUD) | **Thiếu guard ở `/admin` dashboard** | `app/(admin)/layout.tsx`, `app/(admin)/admin/page.tsx`, `app/(admin)/admin/**`, `lib/auth/**` | `tests/lib/authorization.test.ts` | 🟡 |
| 5 | **Media** (upload/validate/storage) | Tốt (local provider); R2 chưa nối | `lib/storage/*`, `lib/services/media.service.ts`, `app/api/v1/media/**` | `tests/integration/recipe.*` (media gián tiếp) | 🟡 |
| 6 | **Taxonomy** (danh mục, phân loại) | Tốt | `lib/constants/taxonomy.ts`, `lib/services/taxonomy.service.ts`, `app/(public)/danh-muc/**`, `app/(admin)/admin/danh-muc/**` | `tests/lib/taxonomy*.test.ts`, `tests/integration/taxonomy.service.test.ts` (chưa chạy) | 🟡 |
| 7 | **Discovery** (search/filter/pagination) | **Search header hỏng** (xem BUG-P11-01) | `components/recipe/recipe-filters.tsx`, `lib/presentation/recipe-links.ts`, `app/(public)/cong-thuc/page.tsx`, `app/(public)/tim-kiem/page.tsx` | `tests/components/recipe-filters.test.tsx`, `tests/lib/recipe-discovery.test.ts` | 🟢 |
| 8 | **Favorites** (cookie-based) | Tốt | `lib/favorites/{cookie,server}.ts`, `app/actions/favorites.ts`, `app/(public)/yeu-thich/page.tsx` | `tests/lib/favorites.test.ts` (29) | 🟢 |
| 9 | **Cooking Mode** | Tốt | `components/cooking/cooking-mode.tsx`, `cooking-experience.tsx`, `lib/cooking/state.ts` | `tests/components/cooking.test.tsx`, `tests/lib/cooking.state.test.ts` | 🟢 (logic) / 🔴 (thiết bị) |
| 10 | **Portion Scaling** | Tốt | `lib/cooking/portion.ts`, `components/cooking/portion-selector.tsx` | `tests/lib/cooking.portion.test.ts` (21) | 🟢 |
| 11 | **Checklist** | Tốt | `components/cooking/ingredient-checklist.tsx`, `lib/cooking/state.ts` | `tests/lib/cooking.state.test.ts` | 🟢 |
| 12 | **Multi Timer** | Tốt (logic); nền tảng thật chưa kiểm | `lib/kitchen/timers.ts`, `components/kitchen/{multi-timer,timer-card,timer-form}.tsx`, `lib/kitchen/alerts.ts` | `tests/lib/kitchen/timers.test.ts` (31), `tests/components/kitchen.test.tsx` | 🟢 (logic) / 🔴 (khoá màn hình) |
| 13 | **Unit Converter** | Tốt | `lib/kitchen/units.ts`, `components/kitchen/unit-converter.tsx` | `tests/lib/kitchen/units.test.ts` (23) | 🟢 |
| 14 | **Ingredient Discovery** | Tốt | `lib/kitchen/ingredient-match.ts`, `components/kitchen/ingredient-search.tsx`, `app/api/v1/kitchen/ingredient-match/route.ts` | `tests/lib/kitchen/ingredient-match.test.ts` (17), `tests/integration/kitchen.ingredient-match.test.ts` (chưa chạy) | 🟢 (logic) |
| 15 | **SEO** | **Thiếu sitemap/robots, canonical, JSON-LD URL tương đối** | `app/layout.tsx`, `app/**/page.tsx`, `lib/presentation/recipe-view.ts` | (không có test) | 🟢 (đọc code) |
| 16 | **Responsive** | Chưa kiểm thực tế | `styles/globals.css`, toàn bộ `app/**`, `components/**` | (không có test render viewport) | 🔴 |
| 17 | **Accessibility** | Theo đặc tả code; chưa kiểm công cụ | `components/**` (focus-ring, aria, focus trap, skip-link) | một phần trong `tests/components/*` | 🔴 |

## 2. Lỗi/Cải thiện phát hiện (đã xác định phạm vi)

> Chỉ liệt kê vấn đề **có căn cứ trong mã nguồn**. Các vấn đề cần môi trường ngoài
> (browser, thiết bị, DB thật) được ghi ở §4 và giữ ở `BLOCKERS.md`.

### BUG-P11-01 — Ô tìm kiếm điều hướng tới trang placeholder (High — UX)

- **Mô tả:** Ô tìm kiếm ở header (desktop) và menu di động đẩy người dùng tới `/tim-kiem`,
  nhưng `/tim-kiem` vẫn là `PlaceholderPage` ("…sẽ được triển khai ở phase sau").
  Hạ tầng tìm kiếm thật đã có ở `/cong-thuc?q=`.
- **Bằng chứng:**
  - `components/layout/site-header.tsx` (nhánh `onSearch`) → `router.push(value ? \`/tim-kiem?q=…\` : "/tim-kiem")`.
  - `components/layout/mobile-menu.tsx` (dòng ~101–104) → cùng đích `/tim-kiem`.
  - `app/(public)/tim-kiem/page.tsx` → `PlaceholderPage` (phase="P06").
  - `app/(public)/cong-thuc/page.tsx` + `components/recipe/recipe-filters.tsx` → tìm kiếm thật qua `recipeService.listPublic`.
- **Ảnh hưởng:** người dùng gõ từ khoá → không nhận được kết quả; luồng khách quan trọng bị hỏng.
- **Phương án xử lý:** trỏ ô tìm kiếm (header + mobile) tới `/cong-thuc?q=<từ khoá>`; chuyển `/tim-kiem`
  thành chuyển hướng tới `/cong-thuc` để không còn lối vào chết.
- **Mức độ:** **High** (chức năng quan trọng bị hỏng, có thể tái hiện bằng đọc code).

### BUG-P11-02 — `/admin` dashboard không kiểm tra quyền (Medium — defense-in-depth)

- **Mô tả:** Mọi trang con quản trị đều gọi `getCurrentActor()` + `can(...)`; riêng
  `/admin` (dashboard) và `(admin)/layout.tsx` **không** kiểm tra → khách chưa đăng nhập
  vẫn thấy khung + nội dung dashboard (chỉ liên kết, **không** lộ dữ liệu).
- **Bằng chứng:** `app/(admin)/admin/page.tsx` (không import `getCurrentActor`/`can`);
  đối chiếu `app/(admin)/admin/cong-thuc/page.tsx:59-61`, `…/danh-muc/page.tsx:24-27`.
- **Ảnh hưởng:** Không rò rỉ dữ liệu (con đều chặn), nhưng không nhất quán với chính sách
  "khách truy cập admin → bị từ chối"; vi phạm kỳ vọng kiểm thử §III.2.
- **Phương án xử lý:** thêm guard cho `app/(admin)/admin/page.tsx` giống trang con
  (dùng `AdminAccessNotice`); cập nhật comment lỗi thời trong `(admin)/layout.tsx`.
- **Mức độ:** **Medium**.

### BUG-P11-03 — Thiếu `app/sitemap.ts` và `app/robots.ts` (Medium — SEO)

- **Mô tả:** Không tồn tại `app/sitemap.ts`/`app/robots.ts`. Chỉ có meta `robots` rải rác
  ở từng page. Không có sitemap.xml/robots.txt công khai.
- **Bằng chứng:** `Glob app/{sitemap,robots,manifest}*` → không có file.
- **Ảnh hưởng:** SEO kém; không kiểm soát được việc lập chỉ mục.
- **Phương án xử lý:** thêm `app/robots.ts` (disallow `/admin`, `/dang-nhap`) và
  `app/sitemap.ts` động (trang tĩnh + công thức published + danh mục) — **không** đưa route draft/placeholder.
- **Mức độ:** **Medium**.

### BUG-P11-04 — Thiếu canonical cho trang công thức & danh sách (Medium — SEO)

- **Mô tả:** `generateMetadata` của `/cong-thuc/[slug]` không đặt `alternates.canonical`;
  `/cong-thuc` (danh sách, `force-dynamic`, nhiều biến thể query/filter) cũng không có canonical
  → nguy cơ trùng lặp nội dung. (Ngược lại, `/danh-muc/[segment]/[slug]` **đã** có canonical — dòng 47.)
- **Bằng chứng:** `app/(public)/cong-thuc/[slug]/page.tsx:44-70` (không `alternates`);
  `app/(public)/cong-thuc/page.tsx:17-20` (không `alternates`).
- **Phương án xử lý:** thêm `alternates.canonical` cho chi tiết công thức và cho danh sách.
- **Mức độ:** **Medium**.

### BUG-P11-05 — JSON-LD Recipe dùng URL tương đối (Medium — SEO)

- **Mô tả:** `toRecipeJsonLd(recipe, \`/cong-thuc/${slug}\`)` truyền **đường dẫn tương đối**
  → `data.url` không tuyệt đối; `data.image` lấy `primaryImage.url` (local provider trả
  `/api/v1/media/file/...`, cũng tương đối). Google yêu cầu URL tuyệt đối trong structured data.
- **Bằng chứng:** `app/(public)/cong-thuc/[slug]/page.tsx:80`; `lib/presentation/recipe-view.ts:319-361`.
- **Phương án xử lý:** dựng URL tuyệt đối bằng `metadataBase`/`NEXT_PUBLIC_SITE_URL` khi tạo JSON-LD
  (giữ nguyên logic "chỉ đưa dữ liệu thật").
- **Mức độ:** **Medium**.

### BUG-P11-06 — Trang chủ còn nội dung placeholder P05 + link chết (Medium — UX/Polish)

- **Mô tả:** `app/(public)/page.tsx` vẫn hiển thị badge "Nền tảng giao diện P05", mục
  "Trạng thái các module" nói "các liên kết hiện dẫn tới trang đánh dấu 'Chưa triển khai'",
  và quicklink "Tìm kiếm" → `/tim-kiem` (placeholder). Nội dung phản ánh sai trạng thái sản phẩm
  sau P07–P10 và chứa liên kết chết.
- **Bằng chứng:** `app/(public)/page.tsx:7-12, 19, 59-68`.
- **Phương án xử lý (tối thiểu, không redesign):** bỏ badge/nội dung P05 lỗi thời; đổi quicklink
  "Tìm kiếm" → `/cong-cu/tim-theo-nguyen-lieu` (đã tồn tại) và/hoặc bổ sung liên kết Công cụ nhà bếp.
- **Mức độ:** **Medium**.

### Ghi nhận thấp ưu tiên (Low / không sửa)

- **L-P11-01:** `(admin)/layout.tsx` comment "phân quyền thực hiện ở phase sau" đã lỗi thời
  (các trang con đã phân quyền) → cập nhật comment (gộp vào BUG-P11-02).
- **L-P11-02:** `/kien-thuc`, `/gioi-thieu`, `/tim-kiem`, footer policy là placeholder — **đúng thiết kế**
  (P05 §4.3/D38); chỉ `/tim-kiem` có lối vào chết (đã xử lý ở BUG-P11-01).
- **L-P11-03:** `RecipeJsonLd` không có `author`/`datePublished`; **không** thêm vì không phải bug
  (thiếu dữ liệu thật → không bịa — đúng D57/§VII.1).

## 3. Kiểm thử hiện có theo khu vực (đối chiếu)

- Unit (jsdom): 31 file. Bao phủ tốt domain P09/P10 (`portion`, `state`, `timers`, `units`,
  `ingredient-match`) + presentation + validation + component.
- Integration (node + PostgreSQL): 9 file — **chưa chạy** trong sandbox (không có `TEST_DATABASE_URL`).
- **Không** có test E2E/browser, test viewport responsive, test axe/a11y tự động.

## 4. Hạng mục không xác minh được trong sandbox (External Verification Pending)

| # | Hạng mục | Lý do | Theo dõi |
| --- | --- | --- | --- |
| EV-01 | Neon PostgreSQL thật + integration/seed/migrate | Không có credentials | B-P06-01/B-P07_1-01 |
| EV-02 | Cloudflare R2 thật | Không có credentials | B-P07-01/B-P07_1-02 |
| EV-03 | Đăng nhập quản trị (Auth.js) 401/403 qua HTTP | Auth.js chưa nối | B-P07_1-03 |
| EV-04 | E2E trình duyệt + responsive 6 viewport + a11y (axe/Lighthouse) | Không có browser | B-P07-04/B-P08-02/B-P09-02 |
| EV-05 | Đồng hồ khi khoá màn hình/ẩn tab trên thiết bị thật | Không có thiết bị | B-P10-01 |
| EV-06 | Đối chiếu hệ số quy đổi với dụng cụ đo | Không có dụng cụ | B-P10-03 |

## 5. Kết luận & phạm vi sửa P11.9 (đã xác định)

**Không có lỗi Critical** (không lộ dữ liệu, không mất dữ liệu, chức năng cốt lõi còn nguyên).

Phạm vi sửa P11.9 (chỉ Critical→High trước, Medium nếu ít rủi ro, Low nếu có giá trị):

1. **BUG-P11-01** (High) — trỏ tìm kiếm về `/cong-thuc?q=`; chuyển hướng `/tim-kiem`.
2. **BUG-P11-02** (Medium) — thêm guard cho `/admin` dashboard + sửa comment layout.
3. **BUG-P11-03** (Medium) — thêm `app/robots.ts` + `app/sitemap.ts`.
4. **BUG-P11-04** (Medium) — thêm canonical cho chi tiết công thức + danh sách.
5. **BUG-P11-05** (Medium) — JSON-LD Recipe dùng URL tuyệt đối.
6. **BUG-P11-06** (Medium) — làm sạch nội dung placeholder ở trang chủ + sửa link chết.

**Không refactor diện rộng. Không thêm tính năng mới. Không triển khai P12.**
Các hạng mục cần thay đổi lớn/kiến trúc → ghi backlog (xem `BUG_FIX_REPORT.md`).
