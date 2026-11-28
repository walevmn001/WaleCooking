# P07.1.4 — MODULE YÊU THÍCH BẰNG COOKIE

> Yêu thích của khách **KHÔNG** cần tài khoản, **KHÔNG** ghi database.
> Toàn bộ trạng thái lưu trong **cookie** do server quản lý.

## 1. Quyết định: HttpOnly cookie + Server Actions

Đã **đánh giá hai phương án** theo yêu cầu prompt:

| Phương án | Ưu điểm | Nhược điểm / rủi ro | Kết luận |
| --- | --- | --- | --- |
| **A. Cookie `HttpOnly` + Server Action** | Client JS **không đọc/sửa** được cookie ⇒ chống XSS đánh cắp/sửa danh sách; server là nguồn chân lý; không lộ dữ liệu qua `document.cookie` | Cần Server Action + revalidate; client phải nhận trạng thái qua prop (không tự đọc) | ✅ **CHỌN** |
| B. Cookie đọc được ở client (`document.cookie`) | Đơn giản, cập nhật tức thời không cần round-trip | Bất kỳ script lạ (XSS) đọc/sửa được danh sách; phải tự đặt `Secure`/`SameSite`/`Path`/hạn và tự chống giả mạo; **vẫn** phải validate ở server để lọc recipe không còn public | ✗ Không chọn |

**Lý do chọn A:**
- Không lưu thông tin nhạy cảm, nhưng danh sách vẫn là dữ liệu người dùng → ưu tiên không cho script đọc.
- Server vẫn là nơi kiểm tra cuối cùng (slug hợp lệ, recipe còn `published`) — điều kiện bắt buộc ở cả hai phương án.
- Phù hợp App Router hiện tại (Server Component đọc cookie; Client Component gọi Server Action).

## 2. Thuộc tính cookie

| Thuộc tính | Giá trị | Lý do |
| --- | --- | --- |
| `httpOnly` | `true` | Script không đọc/sửa được (chống XSS). |
| `secure` | `true` khi production | Chỉ gửi qua HTTPS. |
| `sameSite` | `lax` | Đủ cho điều hướng nội bộ; hạn chế CSRF cơ bản. |
| `path` | `/` | Dùng ở mọi trang. |
| `maxAge` | 180 ngày | Hạn dài, hợp lý cho danh sách món yêu thích. |
| Tên | `wale_favorites` | Tiền tố thương hiệu, tránh trùng. |

## 3. Định dạng dữ liệu (có version)

```jsonc
// Giá trị cookie (JSON, KHÔNG chứa nội dung công thức — chỉ slug)
{ "v": 1, "items": ["pho-bo-ha-noi", "banh-mi-thit"] }
```

- `v`: **version** định dạng. Khi đổi cấu trúc → tăng `v`, code đọc phiên bản cũ sẽ **bỏ qua an toàn** (coi như rỗng) thay vì lỗi.
- `items`: mảng **slug công thức** (`[a-z0-9-]`), đã dedupe.
- **KHÔNG** lưu toàn bộ nội dung công thức, **KHÔNG** lưu User ID, **KHÔNG** lưu thông tin nhạy cảm.

## 4. API module (thuần, `lib/favorites/cookie.ts`)

| Hàm | Mô tả |
| --- | --- |
| `parseFavoritesCookie(raw)` | Parse chuỗi cookie → `{ items, version, invalid, unsupportedVersion }` (KHÔNG ném lỗi). Chịu được: không tồn tại, rỗng, JSON hỏng, sai kiểu, sai version (`unsupportedVersion`), slug sai định dạng (bỏ qua từng slug), trùng lặp, vượt giới hạn (cắt bớt), cookie quá lớn (`invalid`). |
| `serializeFavoritesCookie(items)` | Ngược lại — sinh JSON gọn có version. |
| `normalizeFavorites(input)` | Chuẩn hoá mảng slug: lọc hợp lệ, dedupe, giữ thứ tự, cắt theo giới hạn. |
| `addFavorite(items, slug)` | Thêm (validate slug, dedupe, tôn trọng giới hạn). |
| `removeFavorite(items, slug)` | Xóa một slug. |
| `clearFavorites()` | Trả mảng rỗng (giữ version hiện tại). |
| `hasFavorite(items, slug)` | Kiểm tra tồn tại. |
| `isRecipeSlug(value)` | Validate định dạng slug công thức. |
| `isFavoritesPayloadChanged(a, b)` | So sánh để tránh ghi cookie khi không đổi (giữ hiệu năng). |

Hằng số: `FAVORITES_COOKIE_NAME = "wale_favorites"`, `FAVORITES_VERSION = 1`, `MAX_FAVORITES = 50`, `FAVORITES_COOKIE_MAX_AGE` (180 ngày), `MAX_COOKIE_VALUE_LENGTH`.

## 5. Tầng server (`lib/favorites/server.ts`)

- `readFavorites()` — đọc cookie qua `next/headers`, parse thuần.
- `getFavoriteRecipes()` — đọc slug → **tra `recipeService.getPublicSummariesBySlugs()`** để **chỉ trả công thức còn `published`** (BR-13). Slug ứng với công thức đã xóa/lưu trữ bị **bỏ qua** (không lỗi).
- `isFavorite(slug)` — đọc trạng thái cho một slug.
- `persistFavorites(items)` — ghi cookie (`HttpOnly`, `SameSite=Lax`, `Secure` khi production, `Path=/`, `maxAge` 180 ngày); danh sách rỗng → xoá cookie.
- `clearFavoritesCookie()` — xoá cookie.

## 6. Server Actions (`app/actions/favorites.ts`)

| Action | Việc làm |
| --- | --- |
| `addFavoriteAction(slug)` | Validate slug; chỉ thêm nếu recipe tồn tại & `published`; lưu cookie; `revalidatePath`. |
| `removeFavoriteAction(slug)` | Xóa slug khỏi cookie; `revalidatePath`. |
| `clearFavoritesAction()` | Xóa toàn bộ danh sách. |

Kiểm tra ở **server**, không tin client. Không yêu cầu đăng nhập.

## 7. Kiểm thử (unit — không cần DB/browser)

`tests/lib/favorites.test.ts` bao phủ:
- Cookie chưa tồn tại / rỗng.
- Cookie hợp lệ.
- Cookie sai định dạng (JSON hỏng, sai kiểu, version lạ).
- Cookie quá lớn (vượt `MAX_FAVORITES`).
- ID/slug trùng lặp (dedupe).
- Slug sai định dạng (bị loại).
- Thêm/xóa liên tục (idempotent).
- Xóa toàn bộ.
- `isFavoritesPayloadChanged` — tránh ghi thừa.

> Việc lọc "recipe đã bị xóa / chưa xuất bản" nằm ở tầng server (`getFavoriteRecipes` gọi
> `recipeService`); trong môi trường không có DB, hành vi này kiểm được ở **tầng logic** qua
> mock repository, không kiểm được qua HTTP (xem `E2E_VERIFICATION.md`).

## 8. Hiệu năng

- Đọc cookie là thao tác rẻ, không truy vấn DB ở bước parse.
- Danh sách giới hạn `MAX_FAVORITES = 50` ⇒ truy vấn tra cứu công thức bị chặn trần.
- Trang `/yeu-thich` chỉ truy vấn khi người dùng mở trang (không ảnh hưởng tải trang công khai).
- Tránh ghi cookie khi giá trị không đổi (`isFavoritesPayloadChanged`).

## 9. Không lưu gì trong database

- Bảng `favorites` (gắn `user_id`) **không** dùng cho khách (xem `DATABASE_CLASSIFICATION.md`).
- Module này **không** import Prisma để ghi; chỉ dùng `recipeService` (đọc) để lọc công thức còn public.
