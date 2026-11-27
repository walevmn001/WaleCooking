# P04 — LOGO USAGE GUIDELINES: WALE COOKING

> Quy chuẩn **logo & brand mark** của WALE COOKING.
> Lưu tại `public/assets/brand/`. Nguồn sinh: [scripts/p04_generate_assets.py](../../scripts/p04_generate_assets.py).

## 1. Các biến thể logo

| File | viewBox | Mô tả | Dùng khi |
| --- | --- | --- | --- |
| `logo-primary.svg` | 340×96 | Mark (đầu Wale) + wordmark ngang "WALE / COOKING" | Header desktop, footer, tài liệu |
| `logo-compact.svg` | 176×156 | Mark trên, wordmark dưới (xếp dọc) | Khi bề ngang hẹp, splash, app |
| `logo-mark.svg` | 120×120 | Chỉ mark trong badge mint | Favicon lớn, avatar, khu vực nhỏ |
| `favicon.svg` | 32×32 | Mark rút gọn trên nền mint bo góc | `<link rel="icon">` |
| `app-icon.svg` | 512×512 | Mark trên nền mint bo góc lớn | PWA/app icon, social |

Wordmark: **"WALE"** (Baloo 2, `#594B40`) + **"COOKING"** (Baloo 2, `#52705C`, giãn chữ). **Không** đổi tên, không viết "WaleCooking"/"WALE cooking".

## 2. Không gian trống tối thiểu (clear space)

- Khoảng trống quanh logo ≥ **chiều cao chữ "W" của wordmark** (≈ 1× chiều cao chữ) mỗi phía.
- Không đặt chữ/hình/đường viền trong vùng clear space.

## 3. Kích thước tối thiểu

| Biến thể | Rộng tối thiểu (hiển thị) |
| --- | --- |
| `logo-primary` | 120px |
| `logo-compact` | 88px |
| `logo-mark` / `favicon` | 24px |
| `app-icon` | 48px |

Dưới ngưỡng này: chuyển sang `logo-mark`/`favicon` (bỏ wordmark) để chữ không bị vỡ.

## 4. Nền sử dụng

| Nền | Logo |
| --- | --- |
| Cream `#FFF9F0` / trắng | `logo-primary` gốc ✅ |
| Pastel (mint/pink/beige) | `logo-primary` gốc ✅ |
| Nền đậm (`primary` `#52705C`, `brown` `#594B40`) | Dùng **mark trong badge nền sáng** hoặc bản logo đảo màu sang trắng (tạo biến thể khi cần) |

> Ở P04 chưa tạo bản "logo on dark" riêng; khi triển khai nền tối, dùng mark trong badge sáng. Bổ sung biến thể đảo màu sẽ là asset P05+ nếu cần.

## 5. Quy tắc dùng / không dùng

**Được:** giữ đúng tỉ lệ; scale đồng nhất; dùng file SVG gốc.
**Không được:**
- Kéo giãn/co méo (đổi tỉ lệ khác viewBox gốc).
- Đổi màu các bộ phận logo hoặc thêm gradient/bóng đổ ngoài hệ shadow P03.
- Xoay, thêm hiệu ứng, viền, khung ngoài tùy ý.
- Đặt logo lên nền/nhiễu làm giảm tương phản nét nâu.
- Ghép logo với logo thương hiệu khác hoặc đổi tên hiển thị.

## 6. Accessibility

- Mỗi file logo có `role="img"` + `aria-label` (vd `"Logo WALE COOKING"`).
- Khi logo đi kèm tên dạng text ngay cạnh → có thể đặt `aria-hidden="true"` cho SVG để tránh đọc lặp.

## 7. Truy vết
PC-06; [02-dinh-huong-giao-dien.md](../P00/02-dinh-huong-giao-dien.md); palette P03.
