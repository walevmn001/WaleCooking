# P03 — DESIGN TOKENS: WALE COOKING

> Tra cứu token. **Nguồn máy đọc được:** [tokens/design-tokens.json](./tokens/design-tokens.json). Tài liệu này giải thích cách dùng.
> Quy tắc: **không** dùng giá trị ngoài token; **không** hardcode HEX/spacing trong component.

## 1. Cách các phase sau dùng token

1. **Nguồn duy nhất:** `tokens/design-tokens.json` (version trong `meta.version`).
2. **Sinh CSS variables** (đề xuất, chưa triển khai ở P03):
   - `--color-brand-cream: #FFF9F0;` … `--space-4: 16px;` … `--radius-lg: 18px;` …
3. **Ánh xạ vào Tailwind theme** (`theme.extend`) để dùng class (`bg-cream`, `text-brand`, `rounded-lg`, `p-4`).
4. **Font:** tải Baloo 2 + Nunito qua `next/font`, gán `--font-heading` / `--font-body`.
5. **Không phase nào** tự định nghĩa màu/font/spacing mới. Muốn thêm → theo [governance](./DESIGN_SYSTEM.md#6-governance-thay-đổi-design-system).

> P03 **không** tạo file `tailwind.config`/`globals.css`. Việc sinh CSS variables & cấu hình Tailwind thuộc phase triển khai (P04/P05).

## 2. Colors

Xem chi tiết + số liệu tại [COLOR_ACCESSIBILITY_AUDIT.md](./COLOR_ACCESSIBILITY_AUDIT.md).

| Token | HEX | Dùng cho |
| --- | --- | --- |
| `color.brand.cream` | `#FFF9F0` | Nền chính |
| `color.brand.mint` | `#C9E8D5` | Fill pastel, chip nền |
| `color.brand.mintDark` | `#789B83` | Accent trang trí/icon/chữ lớn trên trắng |
| `color.brand.pink` | `#F8DDE3` | Nền phụ |
| `color.brand.beige` | `#E8DCC6` | Đường kẻ trang trí |
| `color.brand.brown` | `#594B40` | Chữ chính |
| `color.background.default` | `#FFF9F0` | Nền trang |
| `color.background.subtle` | `#FFFBF3` | Nền khối phụ |
| `color.background.inverse` | `#594B40` | Nền đậm (footer/hero) |
| `color.surface.default` | `#FFFFFF` | Card/panel |
| `color.surface.muted` | `#FBF3E8` | Hàng zebra, khối phụ |
| `color.text.primary` | `#594B40` | Chữ mặc định |
| `color.text.muted` | `#6B5C4F` | Chữ phụ |
| `color.text.subtle` | `#7A6A5B` | Chữ mờ (cream/white only) |
| `color.text.inverse` | `#FFFFFF` | Chữ trên nền đậm |
| `color.text.onBrand` | `#594B40` | Chữ trên fill pastel |
| `color.border.subtle` | `#E8DCC6` | Kẻ trang trí |
| `color.border.strong` | `#8F7E66` | Viền control (3:1) |
| `color.border.focus` | `#52705C` | Focus ring |
| `color.primary.default` | `#52705C` | Nút primary |
| `color.primary.hover` | `#46624F` | |
| `color.primary.active` | `#3C5344` | |
| `color.primary.subtle` | `#C9E8D5` | Nền nhạt primary |
| `color.secondary.default` | `#F8DDE3` | Nút secondary |
| `color.status.success` | `#3F7D5B` | |
| `color.status.warning` | `#A15C00` | |
| `color.status.danger` | `#B3261E` | |
| `color.status.info` | `#2A6B9E` | |
| `color.chip.*` | xem JSON | Cặp nền/chữ chip |

## 3. Typography

Chi tiết scale + ví dụ tại [TYPOGRAPHY_AND_LAYOUT.md](./TYPOGRAPHY_AND_LAYOUT.md).

| Token | Mobile | Desktop | Weight | Line-height | Letter-spacing | Font |
| --- | --- | --- | --- | --- | --- | --- |
| `display` | 34px | 48px | 700 | 1.1 | −0.02em | Baloo 2 |
| `h1` | 28px | 36px | 700 | 1.15 | −0.01em | Baloo 2 |
| `h2` | 24px | 30px | 700 | 1.2 | −0.01em | Baloo 2 |
| `h3` | 20px | 24px | 600 | 1.25 | 0 | Baloo 2 |
| `h4` | 18px | 20px | 600 | 1.3 | 0 | Baloo 2 |
| `bodyLg` | 18px | 18px | 400 | 1.6 | 0 | Nunito |
| `body` | 16px | 16px | 400 | 1.65 | 0 | Nunito |
| `bodySm` | 14px | 14px | 400 | 1.6 | 0 | Nunito |
| `caption` | 13px | 13px | 500 | 1.5 | 0.01em | Nunito |
| `label` | 14px | 14px | 600 | 1.4 | 0.01em | Nunito |
| `button` | 16px | 16px | 600 | 1.2 | 0.01em | Nunito |
| `nav` | 15px | 15px | 600 | 1.4 | 0.01em | Nunito |

## 4. Spacing

Base **4px**. Thang: `space.0`=0, `1`=4, `2`=8, `3`=12, `4`=16, `5`=20, `6`=24, `8`=32, `10`=40, `12`=48, `16`=64, `20`=80, `24`=96.

Quy ước áp dụng: xem §5 [TYPOGRAPHY_AND_LAYOUT.md](./TYPOGRAPHY_AND_LAYOUT.md#5-quy-ước-spacing).

## 5. Sizing

| Token | Giá trị |
| --- | --- |
| `size.icon.sm/md/lg/xl` | 16 / 20 / 24 / 32px |
| `size.avatar.sm/md/lg/xl` | 32 / 40 / 48 / 64px |
| `size.control.sm/md/lg` | 36 / 44 / 52px |
| `size.touchTarget.min` | **44px** |
| `size.lineWidth.prose` | 68ch |

## 6. Radius

| Token | Giá trị | Dùng cho |
| --- | --- | --- |
| `radius.none` | 0 | Bảng, ô ghép |
| `radius.sm` | 8px | Chip nhỏ, tag, input nhỏ |
| `radius.md` | 12px | Input, button, banner |
| `radius.lg` | 18px | **Card** (định hướng P00) |
| `radius.xl` | 24px | Card lớn/hero, modal |
| `radius.pill` | 9999px | Chip, pill button |
| `radius.circle` | 50% | Avatar, icon tròn |

## 7. Shadow & elevation

Shadow ấm, tông nâu `rgba(89,75,64, α)` — **không** đen thuần, **không** glassmorphism.

| Token | Giá trị | Dùng cho |
| --- | --- | --- |
| `shadow.xs` | `0 1px 2px rgba(89,75,64,.06)` | Nút, control |
| `shadow.sm` | `0 2px 4px rgba(89,75,64,.08)` | Chip, banner nhỏ |
| `shadow.md` | `0 4px 12px rgba(89,75,64,.10)` | **Card mặc định** |
| `shadow.lg` | `0 8px 24px rgba(89,75,64,.12)` | Card hover, modal nhỏ |
| `shadow.xl` | `0 16px 40px rgba(89,75,64,.14)` | Modal/dialog lớn |
| `shadow.focusRing` | `0 0 0 3px #FFF9F0, 0 0 0 5px #52705C` | Focus ring |

**Elevation:** dùng shadow để phân tầng (card nổi nhẹ — đúng định hướng P00 "card nổi nhẹ"). Không lạm dụng; tối đa 2 tầng shadow cùng lúc.

## 8. Border

`border.width`: none 0, hairline 1px, thick 2px, heavy 4px · `border.style.default`: solid.

## 9. Breakpoints

`base` 0 · `sm` 640 · `md` 768 · `lg` 1024 · `xl` 1280 · `2xl` 1536.
Quy ước thiết bị: mobile 0–639 · tablet 640–1023 · desktop ≥1024. Chi tiết: [RESPONSIVE_GUIDELINES.md](./RESPONSIVE_GUIDELINES.md).

## 10. Grid & container

| Token | Mobile | Tablet | Desktop |
| --- | --- | --- | --- |
| `grid.columns` | 4 | 8 | 12 |
| `grid.gutter` | 16px | 24px | 24px |
| `grid.margin` | 16px | 24px | 32px |
| `container.narrow` | 720px (nội dung đọc) | | |
| `container.default` | 1024px | | |
| `container.wide` | 1200px | | |

## 11. Z-index

`base` 0 · `dropdown` 1000 · `sticky` 1020 · `overlay` 1040 · `modal` 1050 · `toast` 1060 · `tooltip` 1070 · `skipLink` 1080.

## 12. Motion

`duration`: instant 80 · fast 120 · base 180 · slow 280 · slower 420 ms.
`easing`: standard `cubic-bezier(0.2,0,0,1)` · emphasized `cubic-bezier(0.2,0,0,1.2)` · exit `cubic-bezier(0.4,0,1,1)`.
`reducedMotion`: mọi transition → 0.01ms khi `prefers-reduced-motion: reduce`. Chi tiết: [MOTION_GUIDELINES.md](./MOTION_GUIDELINES.md).

## 13. Ánh xạ gợi ý sang Tailwind (tham khảo — chưa triển khai)

```js
// theme.extend (MINH HỌA — sẽ tạo ở phase triển khai)
colors: {
  cream: '#FFF9F0', mint: '#C9E8D5', mintDark: '#789B83',
  pink: '#F8DDE3', beige: '#E8DCC6', brown: '#594B40',
  primary: { DEFAULT: '#52705C', hover: '#46624F', active: '#3C5344' },
},
borderRadius: { md: '12px', lg: '18px', xl: '24px', pill: '9999px' },
fontFamily: { heading: ['var(--font-heading)'], body: ['var(--font-body)'] },
```

> Toàn bộ giá trị phải khớp `design-tokens.json`; nếu lệch → sửa token, không sửa rời.
