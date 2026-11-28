# P07.1.6 — XÁC MINH END-TO-END

> Trạng thái: **PARTIALLY VERIFIED** — kiểm được các luồng ở tầng build/unit/type,
> **KHÔNG** chạy được E2E trên trình duyệt thật (sandbox không có browser, không có DB).
> **KHÔNG** tuyên bố E2E đã đạt.

## 1. Giới hạn môi trường (đo ngày 2026-11-28)

| Yếu tố | Kết quả | Hệ quả |
| --- | --- | --- |
| Trình duyệt headless (Playwright/Chromium) | **Không có** | Không chạy E2E UI thật |
| PostgreSQL | **Không có** (cổng 5432 đóng) | Không chạy luồng cần dữ liệu thật |
| `DATABASE_URL` / Auth.js / R2 | **Không có** | Không có phiên đăng nhập, không có media thật |

⇒ Các luồng dưới đây được **xác minh gián tiếp**: qua `typecheck` + `lint` + `unit test` +
`build` (route render được, import hợp lệ), và qua đọc mã. **Chưa** xác minh tương tác thật.

## 2. Luồng KHÁCH TRUY CẬP

| # | Bước | Trạng thái | Cách kiểm / Ghi chú |
| --- | --- | --- | --- |
| 1 | Mở trang chủ `/` | ✅ Build | Route tĩnh render trong `next build` |
| 2 | Xem danh sách công thức `/cong-thuc` | ✅ Build | Route động (ƒ) tạo thành công; truy vấn chỉ chạy khi có DB |
| 3 | Xem chi tiết công thức `/cong-thuc/[slug]` | ✅ Build | Route động tạo thành công; JSON-LD sinh ở presentation (unit test) |
| 4 | Tìm kiếm công thức `/tim-kiem` | ⚠️ Có route | Trang tồn tại; chưa nối dữ liệu (chờ P08 discovery) |
| 5 | Thêm món yêu thích | ✅ Logic | `addFavorite` + `addFavoriteAction` (unit test `favorites.test.ts`) |
| 6 | Tải lại trang, yêu thích vẫn còn | ✅ Logic | Cookie `HttpOnly` 180 ngày (server đọc lại); trình duyệt chưa kiểm |
| 7 | Xóa món yêu thích | ✅ Logic | `removeFavorite` + `removeFavoriteAction` (unit test) |
| 8 | Mở danh sách yêu thích `/yeu-thich` | ✅ Build | Trang đọc `getFavoriteRecipes()`; chỉ hiện công thức `published` |

**Xác minh thêm:** `components/recipe/favorite-button.tsx`, `share-recipe-button.tsx`,
`clear-favorites-button.tsx` render không lỗi (typecheck); `RecipeCard` nhận `favoriteSlot`
(giữ tương thích test cũ 6 test pass).

## 3. Luồng QUẢN TRỊ

| # | Bước | Trạng thái | Cách kiểm / Ghi chú |
| --- | --- | --- | --- |
| 1 | Mở `/admin/*` khi chưa đăng nhập | ✅ Build | Guard `can(actor, …)` trong server component; `actor=null` ⇒ bị chặn/notice |
| 2 | Bị từ chối truy cập | ✅ Logic | `can(null, …) === false` (unit `authorization.test.ts`) |
| 3 | Đăng nhập quản trị | ⚠️ Chưa nối | Auth.js chưa cấu hình; `/dang-nhap` chỉ là cổng, không có form giả |
| 4 | Tạo công thức | ✅ Build + logic | `/admin/cong-thuc/moi`; service `createRecipe` (integration test ở P07, cần DB) |
| 5 | Chỉnh sửa công thức | ✅ Build + logic | `/admin/cong-thuc/[id]/sua`; service `updateRecipe` |
| 6 | Upload hình ảnh | ⚠️ Code hoàn thiện | Media API + validate magic bytes; chạy **local provider** (chưa có R2) |
| 7 | Lưu bản nháp | ✅ Logic | Workflow `draft` (service; integration test cần DB) |
| 8 | Xuất bản | ✅ Logic | `publishRecipe` đặt `status=published` + `publishedAt` |
| 9 | Công thức hiển thị công khai | ✅ Logic | Danh sách công khai chỉ trả `published` + `deletedAt=null` |
| 10 | Đăng xuất, mất quyền quản trị | ⚠️ Chưa nối | Phụ thuộc Auth.js; `getCurrentActor()` luôn `null` |

## 4. Những gì thực sự đã chạy trong sandbox

| Kiểm tra | Kết quả |
| --- | --- |
| `pnpm typecheck` | ✅ 0 lỗi |
| `pnpm lint` | ✅ 0 lỗi |
| `pnpm test` | ✅ **153/153** (19 file), gồm 29 test mới cho module yêu thích cookie |
| `pnpm build` (đặt `DATABASE_URL` placeholder) | ✅ 28 route tạo thành công |
| `pnpm test:integration` | ⛔ **Không chạy được** — không có PostgreSQL |
| E2E trình duyệt | ⛔ **Không chạy được** — không có browser |

## 5. Việc cần làm để hoàn tất xác minh (ngoài sandbox)

1. Cấu hình `DATABASE_URL` (Neon) → `prisma migrate deploy` + seed → chạy `pnpm test:integration`.
2. Cấu hình Auth.js (`AUTH_SECRET`) → tạo tài khoản admin → kiểm 401/403 qua HTTP thật (luồng quản trị 1–3, 10).
3. Cấu hình R2 (`R2_*`) → kiểm upload/xoá media thật (luồng quản trị 6).
4. Thêm Playwright + Chromium → viết E2E cho luồng khách (1–8) và quản trị (1–10).

Các bước này được ghi vào **blocker** (xem `BLOCKERS.md` — B-P07_1-01…03).
