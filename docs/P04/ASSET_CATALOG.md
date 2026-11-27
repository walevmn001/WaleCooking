# ASSET_CATALOG — WALE COOKING (P04)

> Danh mục đầy đủ tài nguyên nhận diện minh họa: logo/brand mark, mascot, icon và illustration.
> Mọi tài nguyên là **SVG nguyên bản**, được sinh bởi `scripts/p04_generate_assets.py` và kiểm định bởi `scripts/p04_validate_assets.py`.
> Cập nhật: 2026-11-28 (P04).

## 1. Tổng quan

| Nhóm | Số lượng | Định dạng | Dung lượng | Thư mục |
| --- | --- | --- | --- | --- |
| Brand / Logo | 5 | SVG | 4.91 KB | `public/assets/brand/` |
| Mascot | 8 | SVG | 17.66 KB | `public/assets/mascot/` |
| Icons | 38 | SVG | 12.66 KB | `public/assets/icons/` |
| Illustrations | 9 | SVG | 21.41 KB | `public/assets/illustrations/` |
| **Tổng** | **60** | **SVG** | **~56.6 KB** | `public/assets/` |

- Nguồn sinh: [p04_generate_assets.py](file:///workspace/scripts/p04_generate_assets.py)
- Bộ kiểm định: [p04_validate_assets.py](file:///workspace/scripts/p04_validate_assets.py)
- Kết quả kiểm định hiện tại: **0 lỗi, 0 cảnh báo** (60/60 file hợp lệ).
- Giới hạn đã biết: môi trường **không có SVG rasterizer**, nên chưa xác minh *render* thực tế — xem [ASSET_QA_CHECKLIST.md](./ASSET_QA_CHECKLIST.md).

Quy ước cột:
- **Size / viewBox**: khung tọa độ nội bộ; thuộc tính `width`/`height` mặc định trùng viewBox.
- **Bytes**: dung lượng file thực tế tại thời điểm kiểm định.

---

## 2. Brand / Logo — `public/assets/brand/`

| Tên file | Định dạng | Mục đích | Size / viewBox | Bytes | Vị trí |
| --- | --- | --- | --- | --- | --- |
| `logo-primary.svg` | SVG | Logo chính (mascot mark + wordmark "WALE COOKING") | 340×96 | 1099 | `public/assets/brand/logo-primary.svg` |
| `logo-compact.svg` | SVG | Logo thu gọn (mark trên, chữ dưới) cho không gian hẹp | 176×156 | 1112 | `public/assets/brand/logo-compact.svg` |
| `logo-mark.svg` | SVG | Mascot-only mark, không chữ — dùng làm brand mark độc lập | 120×120 | 936 | `public/assets/brand/logo-mark.svg` |
| `favicon.svg` | SVG | Favicon trình duyệt (mark tối giản) | 32×32 | 923 | `public/assets/brand/favicon.svg` |
| `app-icon.svg` | SVG | App/site icon (PWA, apple-touch, maskable) | 512×512 | 958 | `public/assets/brand/app-icon.svg` |

Quy chuẩn sử dụng: xem [LOGO_USAGE_GUIDELINES.md](./LOGO_USAGE_GUIDELINES.md).

---

## 3. Mascot — `public/assets/mascot/`

Tất cả biến thể dùng **cùng viewBox `0 0 220 260`**, cùng tỷ lệ cơ thể, trang phục (mũ kem + tạp dề mint) và bảng màu — chỉ khác biểu cảm và tư thế tay.

| Tên file | Định dạng | Mục đích / trạng thái | Size / viewBox | Bytes | Vị trí |
| --- | --- | --- | --- | --- | --- |
| `mascot-default.svg` | SVG | Đứng mặc định, biểu cảm trung tính | 220×260 | 2146 | `public/assets/mascot/mascot-default.svg` |
| `mascot-happy.svg` | SVG | Vui vẻ, tay mở | 220×260 | 2161 | `public/assets/mascot/mascot-happy.svg` |
| `mascot-cooking.svg` | SVG | Đang nấu, cầm chảo | 220×260 | 2349 | `public/assets/mascot/mascot-cooking.svg` |
| `mascot-holding-recipe.svg` | SVG | Cầm thẻ công thức | 220×260 | 2561 | `public/assets/mascot/mascot-holding-recipe.svg` |
| `mascot-thinking.svg` | SVG | Suy nghĩ (chống cằm + dấu hỏi) | 220×260 | 2244 | `public/assets/mascot/mascot-thinking.svg` |
| `mascot-success.svg` | SVG | Thành công (mắt sao + tia sáng) | 220×260 | 2353 | `public/assets/mascot/mascot-success.svg` |
| `mascot-error.svg` | SVG | Lỗi/buồn | 220×260 | 2112 | `public/assets/mascot/mascot-error.svg` |
| `mascot-waving.svg` | SVG | Vẫy tay chào mừng | 220×260 | 2161 | `public/assets/mascot/mascot-waving.svg` |

Quy chuẩn thiết kế & sử dụng: xem [MASCOT_SPECIFICATION.md](./MASCOT_SPECIFICATION.md).

---

## 4. Icons — `public/assets/icons/`

Quy cách chung: **viewBox `0 0 24 24`**, `stroke="currentColor"`, `stroke-width="2"`, viền bo tròn (`stroke-linecap/linejoin="round"`), `fill="none"`. Kế thừa màu qua CSS. Chi tiết: [ICON_SYSTEM.md](./ICON_SYSTEM.md).

### 4.1 Điều hướng — `public/assets/icons/nav/`

| Tên file | Định dạng | Mục đích | Size / viewBox | Bytes | Vị trí |
| --- | --- | --- | --- | --- | --- |
| `home.svg` | SVG | Trang chủ | 24×24 | 336 | `public/assets/icons/nav/home.svg` |
| `recipes.svg` | SVG | Danh sách công thức | 24×24 | 352 | `public/assets/icons/nav/recipes.svg` |
| `categories.svg` | SVG | Danh mục | 24×24 | 445 | `public/assets/icons/nav/categories.svg` |
| `search.svg` | SVG | Tìm kiếm | 24×24 | 302 | `public/assets/icons/nav/search.svg` |
| `favorites.svg` | SVG | Yêu thích | 24×24 | 347 | `public/assets/icons/nav/favorites.svg` |
| `profile.svg` | SVG | Hồ sơ người dùng | 24×24 | 318 | `public/assets/icons/nav/profile.svg` |
| `settings.svg` | SVG | Cài đặt | 24×24 | 398 | `public/assets/icons/nav/settings.svg` |

### 4.2 Nấu ăn — `public/assets/icons/cooking/`

| Tên file | Định dạng | Mục đích | Size / viewBox | Bytes | Vị trí |
| --- | --- | --- | --- | --- | --- |
| `ingredient.svg` | SVG | Nguyên liệu | 24×24 | 411 | `public/assets/icons/cooking/ingredient.svg` |
| `cooking-time.svg` | SVG | Thời gian nấu | 24×24 | 336 | `public/assets/icons/cooking/cooking-time.svg` |
| `prep-time.svg` | SVG | Thời gian sơ chế | 24×24 | 346 | `public/assets/icons/cooking/prep-time.svg` |
| `servings.svg` | SVG | Khẩu phần | 24×24 | 341 | `public/assets/icons/cooking/servings.svg` |
| `difficulty.svg` | SVG | Độ khó | 24×24 | 281 | `public/assets/icons/cooking/difficulty.svg` |
| `cooking-method.svg` | SVG | Phương pháp nấu | 24×24 | 322 | `public/assets/icons/cooking/cooking-method.svg` |
| `temperature.svg` | SVG | Nhiệt độ | 24×24 | 367 | `public/assets/icons/cooking/temperature.svg` |
| `nutrition.svg` | SVG | Dinh dưỡng | 24×24 | 392 | `public/assets/icons/cooking/nutrition.svg` |
| `allergen.svg` | SVG | Chất gây dị ứng | 24×24 | 391 | `public/assets/icons/cooking/allergen.svg` |

### 4.3 Tương tác — `public/assets/icons/interaction/`

| Tên file | Định dạng | Mục đích | Size / viewBox | Bytes | Vị trí |
| --- | --- | --- | --- | --- | --- |
| `add.svg` | SVG | Thêm | 24×24 | 273 | `public/assets/icons/interaction/add.svg` |
| `edit.svg` | SVG | Sửa | 24×24 | 307 | `public/assets/icons/interaction/edit.svg` |
| `delete.svg` | SVG | Xóa | 24×24 | 291 | `public/assets/icons/interaction/delete.svg` |
| `save.svg` | SVG | Lưu | 24×24 | 277 | `public/assets/icons/interaction/save.svg` |
| `share.svg` | SVG | Chia sẻ | 24×24 | 389 | `public/assets/icons/interaction/share.svg` |
| `print.svg` | SVG | In | 24×24 | 321 | `public/assets/icons/interaction/print.svg` |
| `filter.svg` | SVG | Lọc | 24×24 | 280 | `public/assets/icons/interaction/filter.svg` |
| `sort.svg` | SVG | Sắp xếp | 24×24 | 317 | `public/assets/icons/interaction/sort.svg` |
| `back.svg` | SVG | Quay lại | 24×24 | 290 | `public/assets/icons/interaction/back.svg` |
| `close.svg` | SVG | Đóng | 24×24 | 277 | `public/assets/icons/interaction/close.svg` |
| `check.svg` | SVG | Xác nhận | 24×24 | 272 | `public/assets/icons/interaction/check.svg` |
| `warning.svg` | SVG | Cảnh báo | 24×24 | 360 | `public/assets/icons/interaction/warning.svg` |
| `error.svg` | SVG | Lỗi | 24×24 | 306 | `public/assets/icons/interaction/error.svg` |

### 4.4 Nội dung — `public/assets/icons/content/`

| Tên file | Định dạng | Mục đích | Size / viewBox | Bytes | Vị trí |
| --- | --- | --- | --- | --- | --- |
| `breakfast.svg` | SVG | Bữa sáng | 24×24 | 445 | `public/assets/icons/content/breakfast.svg` |
| `lunch.svg` | SVG | Bữa trưa | 24×24 | 363 | `public/assets/icons/content/lunch.svg` |
| `dinner.svg` | SVG | Bữa tối | 24×24 | 375 | `public/assets/icons/content/dinner.svg` |
| `dessert.svg` | SVG | Tráng miệng | 24×24 | 328 | `public/assets/icons/content/dessert.svg` |
| `drink.svg` | SVG | Đồ uống | 24×24 | 325 | `public/assets/icons/content/drink.svg` |
| `vegetarian.svg` | SVG | Món chay | 24×24 | 348 | `public/assets/icons/content/vegetarian.svg` |
| `meat.svg` | SVG | Món thịt | 24×24 | 339 | `public/assets/icons/content/meat.svg` |
| `seafood.svg` | SVG | Hải sản | 24×24 | 390 | `public/assets/icons/content/seafood.svg` |
| `baking.svg` | SVG | Nướng/Bánh | 24×24 | 406 | `public/assets/icons/content/baking.svg` |

---

## 5. Illustrations — `public/assets/illustrations/`

Tất cả dùng **cùng viewBox `0 0 320 220`**, phong cách blob pastel đồng nhất (Cream / Mint / Pink / Beige + nét Brown), kích thước vừa phải để không lấn át nội dung.

| Tên file | Định dạng | Mục đích / trạng thái UI | Size / viewBox | Bytes | Vị trí |
| --- | --- | --- | --- | --- | --- |
| `empty-recipes.svg` | SVG | Danh sách công thức trống | 320×220 | 2444 | `public/assets/illustrations/empty-recipes.svg` |
| `no-results.svg` | SVG | Không có kết quả tìm kiếm | 320×220 | 2364 | `public/assets/illustrations/no-results.svg` |
| `empty-favorites.svg` | SVG | Danh sách yêu thích trống | 320×220 | 2432 | `public/assets/illustrations/empty-favorites.svg` |
| `empty-shopping-list.svg` | SVG | Danh sách đi chợ trống | 320×220 | 2471 | `public/assets/illustrations/empty-shopping-list.svg` |
| `loading.svg` | SVG | Đang tải | 320×220 | 2431 | `public/assets/illustrations/loading.svg` |
| `error.svg` | SVG | Lỗi hệ thống | 320×220 | 2420 | `public/assets/illustrations/error.svg` |
| `404.svg` | SVG | Trang không tồn tại | 320×220 | 2327 | `public/assets/illustrations/404.svg` |
| `success.svg` | SVG | Thành công | 320×220 | 2484 | `public/assets/illustrations/success.svg` |
| `welcome.svg` | SVG | Chào mừng / người dùng mới | 320×220 | 2552 | `public/assets/illustrations/welcome.svg` |

Quy chuẩn sử dụng: xem [ILLUSTRATION_GUIDELINES.md](./ILLUSTRATION_GUIDELINES.md). Quy tắc chung & thêm asset: xem [BRAND_ASSET_GUIDELINES.md](./BRAND_ASSET_GUIDELINES.md).

---

## 6. Quy ước đặt tên

- Toàn bộ **kebab-case**, chỉ `[a-z0-9]` và dấu `-`, bắt buộc đuôi `.svg`.
- Mascot: tiền tố `mascot-` + trạng thái (`mascot-happy.svg`).
- Logo/brand: hậu tố mô tả (`logo-primary`, `logo-compact`, `logo-mark`, `favicon`, `app-icon`).
- Icon: tên chức năng, đặt trong thư mục nhóm (`icons/<group>/<name>.svg`).
- Illustration: tên trạng thái (`empty-recipes`, `no-results`, …).
- Kiểm tra tự động bởi regex `^[a-z0-9]+(-[a-z0-9]+)*\.svg$` trong validator.
