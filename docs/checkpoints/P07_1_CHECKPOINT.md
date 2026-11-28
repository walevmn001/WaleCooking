# P07.1 — CHECKPOINT: INTEGRATION VERIFICATION & BLOCKER CLOSURE

> Phase: **P07.1** · Ngày: 2026-11-28 · Trạng thái: **HOÀN THÀNH (trong giới hạn môi trường)**
> Commit: commit chứa tài liệu này (xem `git log -1` trên `origin/main`).

## 1. Bối cảnh

Sản phẩm **WALE COOKING** điều chỉnh định hướng thành **Recipe-focused Cooking Assistant**:
website cá nhân chuyên công thức, **không** mạng xã hội, **không** cộng đồng, **không** tài
khoản khách truy cập. P07.1 audit lại tích hợp thực tế sau P06/P07 và điều chỉnh phạm vi.

## 2. Phạm vi đã hoàn thành

| Tiểu mục | Nội dung | Tài liệu / Artifact |
| --- | --- | --- |
| 7.1.1 | Audit hiện trạng tích hợp (bảng thành phần) | `docs/P07_1/INTEGRATION_AUDIT.md` |
| 7.1.2 | Điều chỉnh Auth/Authz — chỉ giữ quản trị | `docs/P07_1/AUTHENTICATION_SCOPE.md` |
| 7.1.3 | Phân loại bảng DB + ADR (không drop) | `docs/P07_1/DATABASE_CLASSIFICATION.md` (ADR-P07_1-01, ADR-P07_1-02) |
| 7.1.4 | Module yêu thích bằng cookie | `docs/P07_1/COOKIE_FAVORITES.md` + `lib/favorites/` + `app/actions/favorites.ts` |
| 7.1.5 | Neon & R2 — xác minh ngoài | `docs/P07_1/EXTERNAL_VERIFICATION.md` (**External Verification Pending**) |
| 7.1.6 | Xác minh End-to-End | `docs/P07_1/E2E_VERIFICATION.md` (**Partially Verified**) |
| 7.1.7 | Hoàn thành phase + kiểm thử | Checkpoint này |

## 3. Thay đổi mã nguồn chính

**Thêm mới:**
- `lib/favorites/cookie.ts` — module THUẦN: version (`v:1`), dedupe, giới hạn 50, xử lý cookie hỏng/quá lớn/version lạ; `parseFavoritesCookie`, `serializeFavoritesCookie`, `addFavorite`, `removeFavorite`, `clearFavorites`, `hasFavorite`, `isRecipeSlug`, `normalizeFavorites`, `isFavoritesPayloadChanged`.
- `lib/favorites/server.ts` — `readFavorites`, `isFavorite`, `getFavoriteRecipes`, `persistFavorites`, `clearFavoritesCookie` (cookie **HttpOnly**, `SameSite=Lax`, `Secure` ở production, `Path=/`, 180 ngày).
- `app/actions/favorites.ts` — Server Actions: `addFavoriteAction`, `removeFavoriteAction`, `toggleFavoriteAction`, `clearFavoritesAction`.
- `components/recipe/favorite-button.tsx` — nút yêu thích (optimistic + `useTransition`).
- `components/recipe/share-recipe-button.tsx` — chia sẻ liên kết (Web Share API + fallback clipboard).
- `components/recipe/clear-favorites-button.tsx` — xóa toàn bộ danh sách.
- `tests/lib/favorites.test.ts` — **29 unit test** cho module cookie.

**Sửa đổi:**
- `lib/db/repositories/recipe.repository.ts` + `prisma-recipe.repository.ts` — thêm `listPublicSummariesBySlugs` (chỉ trả `published`, giữ thứ tự đầu vào).
- `lib/services/recipe.service.ts` — thêm `getPublicSummariesBySlugs`.
- `components/recipe/recipe-card.tsx` — thêm prop `favoriteSlot` (giữ `onToggleFavorite` để tương thích).
- `components/recipe/index.ts` — export `FavoriteButton`, `ShareRecipeButton`.
- `app/(public)/cong-thuc/page.tsx` + `[slug]/page.tsx` — tích hợp nút yêu thích.
- `app/(public)/yeu-thich/page.tsx` — từ placeholder → danh sách yêu thích thật (chỉ công thức published).
- `components/layout/site-header.tsx` + `mobile-menu.tsx` + `lib/constants/navigation.ts` — bỏ mục **tài khoản khách**.
- `app/(auth)/dang-nhap/page.tsx` — thành **cổng đăng nhập quản trị** (không form giả).

**Đã xóa:**
- `app/(public)/tai-khoan/page.tsx` — khái niệm tài khoản khách không còn phù hợp.

## 4. Kiểm thử đã chạy (kết quả thực tế)

| Kiểm tra | Kết quả |
| --- | --- |
| `pnpm typecheck` | ✅ **0 lỗi** |
| `pnpm lint` | ✅ **0 lỗi** |
| `pnpm test` | ✅ **153/153 pass** (19 file) — +29 test module yêu thích |
| `pnpm build` | ✅ **28 route** (đặt `DATABASE_URL` placeholder; build không có biến này lỗi env — yêu cầu bình thường của dự án có DB) |
| `pnpm test:integration` | ⛔ Không chạy được — **không có PostgreSQL** trong sandbox |
| E2E trình duyệt | ⛔ Không chạy được — **không có browser** |

## 5. Chưa xác minh được (trung thực)

- **Neon PostgreSQL**: chưa có `DATABASE_URL` → chưa xác minh kết nối/migration/seed thật.
- **Cloudflare R2**: chưa có credentials → media chạy **local provider**.
- **Auth.js**: chưa nối → chưa xác minh đăng nhập/401/403 qua HTTP phiên thật.
- **E2E UI**: chưa có trình duyệt headless → chưa kiểm tương tác thật (yêu thích, responsive, a11y).

## 6. Blocker

Xem `BLOCKERS.md` mục **B-P07_1-01 … B-P07_1-04** (Neon, R2, Auth.js, E2E/a11y).

## 7. Quyết định (ADR)

- **ADR-P07_1-01**: Không drop bảng nào; yêu thích khách dùng **cookie** thay bảng `favorites`.
- **ADR-P07_1-02**: Không thêm cột SEO/ảnh cho taxonomy trong P07.1/P08 (schema chưa có; ghi backlog).

## 8. Điều kiện chuyển phase

P07.1 **hoàn thành** với giới hạn môi trường nêu trên → **đủ điều kiện chuyển sang P08**.
Các hạng mục "External Verification Pending" được theo dõi ở `BLOCKERS.md`, không chặn P08.
