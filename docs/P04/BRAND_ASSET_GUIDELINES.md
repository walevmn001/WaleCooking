# P04 — BRAND ASSET GUIDELINES: WALE COOKING

> Bộ quy chuẩn **tài nguyên thương hiệu** (mascot, logo, icon, illustration) cho WALE COOKING.
> Tuân thủ **tuyệt đối** Design System đã khóa ở P03 ([DESIGN_SYSTEM.md](../P03/DESIGN_SYSTEM.md), [tokens/design-tokens.json](../P03/tokens/design-tokens.json)).
> Tất cả tài nguyên trong P04 là **nguyên bản** (hand-authored SVG), không dùng hình/logo/icon có bản quyền không rõ nguồn.

## 1. Nguyên tắc cốt lõi

1. **Nguyên bản 100%** — vector tự vẽ; không nhúng ảnh ngoài, không `<script>`, không font nhúng ngoài hệ thống Google Fonts đã chốt.
2. **Đúng palette** — chỉ dùng màu brand + trắng + `primary` (P03). Không pha màu tùy hứng.
3. **Đồng bộ nhận diện** — một nhân vật duy nhất, một hệ nét vẽ, một hệ icon.
4. **Vector-first** — SVG cho logo/mascot/icon/illustration; raster (PNG/WebP) chỉ khi bắt buộc.
5. **Nhẹ & sạch** — file nhỏ, không asset khổng lồ; SVG an toàn.
6. **Không tự đổi thương hiệu** — tên **WALE COOKING**, phong cách **Pastel Mint** cố định.

## 2. Palette được phép dùng trong tài nguyên

| Vai trò | Token | HEX |
| --- | --- | --- |
| Nền/khối sáng | `color.brand.cream` | `#FFF9F0` |
| Accent pastel (tạp dề, badge) | `color.brand.mint` | `#C9E8D5` |
| Accent đậm (túi tạp dề, phụ kiện) | `color.brand.mintDark` | `#789B83` |
| Hồng nhạt (má, nền phụ, sparkle) | `color.brand.pink` | `#F8DDE3` |
| Da nhân vật / nền phụ | `color.brand.beige` | `#E8DCC6` |
| Nét vẽ / chữ | `color.brand.brown` | `#594B40` |
| Trắng (mặt giấy, bát, card) | `#FFFFFF` | — |
| Nhấn (chữ phụ logo, dấu "?") | `color.primary.default` | `#52705C` |

> Trong **icon**, màu được để là `currentColor` để kế thừa màu chữ theo ngữ cảnh (tuân thủ quy tắc màu P03).

## 3. Cấu trúc thư mục (đã tạo)

```
public/assets/
├── brand/            # logo, favicon, app icon
│   ├── logo-primary.svg   logo-compact.svg   logo-mark.svg
│   ├── favicon.svg        app-icon.svg
├── mascot/           # 8 biến cảm/tư thế của nhân vật đầu bếp
│   └── mascot-{default,happy,cooking,holding-recipe,thinking,success,error,waving}.svg
├── icons/            # 38 icon 24×24 (currentColor)
│   ├── nav/  cooking/  interaction/  content/
└── illustrations/    # 9 minh họa trạng thái (320×220)
```

Không tạo cấu trúc trùng lặp; mọi asset mới đặt vào đúng thư mục trên.

## 4. Quy tắc đặt tên file

- **kebab-case**, chữ thường, chỉ `[a-z0-9-]`, phần mở rộng `.svg`.
- Mascot: `mascot-<biểu-cảm>.svg`.
- Icon: `<tên-icon>.svg` (không tiền tố nhóm vì đã nằm trong thư mục nhóm).
- Illustration: `<trạng-thái>.svg`.
- Logo: `logo-<biến thể>.svg`, `favicon.svg`, `app-icon.svg`.
- Không dùng chữ hoa, khoảng trắng, dấu tiếng Việt trong tên file.
- Validator `scripts/p04_validate_assets.py` **chặn** tên sai quy tắc.

## 5. Quy tắc kỹ thuật SVG (bắt buộc)

- Có `viewBox`; kích thước nội tại theo template (mascot 220×260, icon 24×24, illustration 320×220).
- Icon: `fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"`.
- Không chứa: `<script>`, `<foreignObject>`, `<image>`, thuộc tính `on*`, `href`/`xlink:href` trỏ ra ngoài, `DOCTYPE`/`ENTITY`.
- Nét vẽ dùng `#594B40`; bo tròn (`stroke-linejoin/linecap: round`).
- File nhỏ: icon ≤ ~0.5 KB, mascot/illustration ≤ ~3 KB.

## 6. Cách thêm asset mới

1. Nếu là **icon chức năng thông thường**: ưu tiên hình học theo tinh thần Lucide (lưới 24×24, nét 2px) — nhưng **vẽ lại nguyên bản**, không copy file.
2. Nếu là **icon/biểu tượng đặc trưng thương hiệu** (món ăn, nguyên liệu, danh mục): vẽ mới theo phong cách minh họa WALE COOKING.
3. Thêm vào `ICONS` (icon) hoặc `MASCOT_VARIANTS`/`build_brand`/`build_illustrations` trong [scripts/p04_generate_assets.py](../../scripts/p04_generate_assets.py).
4. Chạy `python3 scripts/p04_generate_assets.py` (sinh/ghi đè, idempotent).
5. Chạy `python3 scripts/p04_validate_assets.py` — phải **0 lỗi**.
6. Cập nhật [ASSET_CATALOG.md](./ASSET_CATALOG.md) và [ASSET_QA_CHECKLIST.md](./ASSET_QA_CHECKLIST.md).

## 7. Tối ưu & kiểm tra tài nguyên

- **Tối ưu:** giữ số điểm neo tối thiểu, tránh `<filter>`/gradient nặng, tránh path trùng lặp; chạy lại generator để bảo đảm nhất quán.
- **Kiểm tra:** `p04_validate_assets.py` kiểm XML hợp lệ, an toàn, viewBox, tên file, palette, tính nhất quán mascot.
- **Kiểm tra thủ công (bổ sung):** mở asset bằng trình duyệt/design tool; soi logo ở kích thước nhỏ; thử mascot trên nền cream/white/mint/pink.
- ⚠️ Môi trường P04 **không có rasterizer SVG** (rsvg/inkscape/chromium) → không render kiểm bằng ảnh; xem [ASSET_QA_CHECKLIST.md](./ASSET_QA_CHECKLIST.md) §4 "chưa xác minh".

## 8. Liên kết
[MASCOT_SPECIFICATION.md](./MASCOT_SPECIFICATION.md) · [LOGO_USAGE_GUIDELINES.md](./LOGO_USAGE_GUIDELINES.md) · [ICON_SYSTEM.md](./ICON_SYSTEM.md) · [ILLUSTRATION_GUIDELINES.md](./ILLUSTRATION_GUIDELINES.md) · [ASSET_CATALOG.md](./ASSET_CATALOG.md) · [ASSET_QA_CHECKLIST.md](./ASSET_QA_CHECKLIST.md)
