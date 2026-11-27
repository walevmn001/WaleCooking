# P03 — COLOR ACCESSIBILITY AUDIT (WCAG 2.2 AA)

> **Phương pháp:** contrast ratio tính theo **WCAG 2.x** (`(L1+0.05)/(L2+0.05)`, luminance theo sRGB). Số liệu dưới đây được **đo bằng script** (làm tròn 2 chữ số), không suy đoán.
> **Ngưỡng:** chữ thường **≥ 4.5:1** (1.4.3); chữ lớn (≥ 24px hoặc ≥ 18.66px bold) **≥ 3:1**; thành phần UI & focus **≥ 3:1** (1.4.11).
> ⚠️ Đây là **đo tĩnh trên giá trị màu**. Chưa kiểm thử trên trình duyệt/thiết bị thật và chưa tính anti-aliasing/alpha — sẽ xác minh lại ở phase triển khai.

## 1. Bảng màu thương hiệu gốc (KHÓA — không đổi)

| Token | HEX | Vai trò |
| --- | --- | --- |
| `color.brand.cream` | `#FFF9F0` | Nền chính |
| `color.brand.mint` | `#C9E8D5` | Accent pastel |
| `color.brand.mintDark` | `#789B83` | Accent thương hiệu |
| `color.brand.pink` | `#F8DDE3` | Nền phụ |
| `color.brand.beige` | `#E8DCC6` | Đường kẻ/nền phụ |
| `color.brand.brown` | `#594B40` | Chữ chính |

## 2. Semantic + shade phụ trợ (tạo để bảo đảm tương phản)

| Nhóm | Token | HEX | Ghi chú |
| --- | --- | --- | --- |
| Nền | `background.default` | `#FFF9F0` | = brand.cream |
| Nền phụ | `background.subtle` | `#FFFBF3` | |
| Bề mặt | `surface.default` | `#FFFFFF` | Card/panel |
| Bề mặt phụ | `surface.muted` | `#FBF3E8` | |
| Chữ | `text.primary` | `#594B40` | = brand.brown |
| Chữ | `text.muted` | `#6B5C4F` | Shade phụ trợ |
| Chữ | `text.subtle` | `#7A6A5B` | Shade phụ trợ (có hạn chế nền) |
| Chữ | `text.inverse` | `#FFFFFF` | Trên nền đậm |
| Viền | `border.subtle` | `#E8DCC6` | Trang trí (không đạt 3:1) |
| Viền | `border.strong` | `#8F7E66` | Control (đạt 3:1) |
| Focus | `border.focus` | `#52705C` | Focus ring |
| Primary | `primary.default` | `#52705C` | Nút primary |
| Primary | `primary.hover` | `#46624F` | |
| Primary | `primary.active` | `#3C5344` | |
| Secondary | `secondary.default` | `#F8DDE3` | Nút secondary (chữ nâu) |
| Status | `status.success` | `#3F7D5B` | |
| Status | `status.warning` | `#A15C00` | |
| Status | `status.danger` | `#B3261E` | |
| Status | `status.info` | `#2A6B9E` | |

## 3. Chữ trên nền — kết quả đo

### 3.1. Chữ nâu chính (`text.primary` `#594B40`)
| Cặp (fg / bg) | Ratio | AA chữ thường (4.5) | AA chữ lớn (3) |
| --- | --- | --- | --- |
| brown / Cream `#FFF9F0` | **8.01** | ✅ | ✅ |
| brown / White `#FFFFFF` | **8.38** | ✅ | ✅ |
| brown / Mint `#C9E8D5` | **6.38** | ✅ | ✅ |
| brown / Pink `#F8DDE3` | **6.56** | ✅ | ✅ |
| brown / Beige `#E8DCC6` | **6.18** | ✅ | ✅ |

**Kết luận:** chữ nâu chính đạt AA trên **mọi** nền pastel → đây là màu chữ mặc định, kể cả trên fill màu brand.

### 3.2. Chữ phụ (`text.muted` `#6B5C4F`)
| Cặp | Ratio | AA (4.5) |
| --- | --- | --- |
| muted / Cream | **6.14** | ✅ |
| muted / White | **6.42** | ✅ |
| muted / Mint | **4.89** | ✅ |
| muted / Pink | **5.03** | ✅ |
| muted / Beige | **4.74** | ✅ |

**Kết luận:** `text.muted` đạt AA trên mọi nền cho phép.

### 3.3. Chữ mờ (`text.subtle` `#7A6A5B`) — ⚠️ CÓ HẠN CHẾ
| Cặp | Ratio | AA chữ thường (4.5) | AA chữ lớn (3) |
| --- | --- | --- | --- |
| subtle / Cream | **4.97** | ✅ | ✅ |
| subtle / White | **5.20** | ✅ | ✅ |
| subtle / Mint `#C9E8D5` | **3.96** | ❌ | ✅ |
| subtle / Pink `#F8DDE3` | **4.07** | ❌ | ✅ |
| subtle / Beige `#E8DCC6` | **3.83** | ❌ | ✅ |

**Kết luận (bắt buộc):** `text.subtle` **chỉ dùng trên nền Cream/White**. Trên nền pastel (mint/pink/beige) **không** dùng cho chữ thường; nếu buộc dùng chỉ cho chữ lớn ≥ 24px, hoặc chuyển sang `text.muted`.

## 4. Chữ trắng trên nền đậm — kết quả đo

| Cặp (fg / bg) | Ratio | AA (4.5) |
| --- | --- | --- |
| white / `primary.default` `#52705C` | **5.48** | ✅ |
| white / `primary.hover` `#46624F` | **6.73** | ✅ |
| white / `primary.active` `#3C5344` | **8.36** | ✅ |
| white / `status.success` `#3F7D5B` | **4.89** | ✅ |
| white / `status.warning` `#A15C00` | **5.19** | ✅ |
| white / `status.danger` `#B3261E` | **6.54** | ✅ |
| white / `status.info` `#2A6B9E` | **5.68** | ✅ |

### 4.1. ⚠️ Trường hợp **KHÔNG ĐẠT** cần tránh
| Cặp | Ratio | Kết luận |
| --- | --- | --- |
| white / `brand.mintDark` `#789B83` | **3.08** | ❌ AA chữ thường (chỉ đạt chữ lớn ≥ 3:1) |
| brown `#594B40` / `brand.mintDark` | **2.72** | ❌ kể cả chữ lớn |
| white / `brand.mint` `#C9E8D5` | **1.31** | ❌ tuyệt đối không |

**Quy tắc suy ra (bắt buộc):**
- **Không** đặt chữ trắng lên `brand.mintDark` cho nút/chữ thường. Nút primary dùng `primary.default` (`#52705C`, trắng 5.48).
- **Không** dùng `brand.mintDark` làm **chữ thường** trên nền cream (2.94 < 4.5) hoặc làm **viền 3:1** trên cream.
- `brand.mintDark` chỉ dùng cho: fill/icon **trang trí**, hoặc **chữ lớn** trên nền trắng (3.08 ≥ 3:1). Vẫn giữ trong palette (màu gốc) nhưng không làm màu chữ chính.

## 5. Thành phần UI & focus (non-text, ≥ 3:1)

| Cặp | Ratio | 3:1 |
| --- | --- | --- |
| `border.strong` `#8F7E66` / White | **3.93** | ✅ |
| `border.strong` `#8F7E66` / Cream | **3.75** | ✅ |
| `border.focus` `#52705C` / Cream | **5.24** | ✅ |
| `border.focus` `#52705C` / White | **5.48** | ✅ |
| `border.subtle` `#E8DCC6` (Beige) / White | **1.36** | ❌ (chỉ trang trí) |
| `brand.mintDark` `#789B83` / Cream | **2.94** | ❌ |

**Quy tắc:** viền control (input, outline button, checkbox/radio border) **phải dùng `border.strong`**. `border.subtle` chỉ cho đường kẻ trang trí. Focus ring dùng `border.focus` + offset nền (xem [COMPONENT_SPECIFICATIONS.md](./COMPONENT_SPECIFICATIONS.md#25-trạng-thái-tương-tác-states)).

## 6. Chip / badge (nền pastel + chữ đậm)

| Chip | Nền | Chữ | Ratio | AA |
| --- | --- | --- | --- | --- |
| success | `#C9E8D5` | `#2C5C42` | **5.88** | ✅ |
| danger | `#F8DDE3` | `#8A1C16` | **7.28** | ✅ |
| warning | `#E8DCC6` | `#7A4500` | **5.78** | ✅ |
| info | `#DCEAF5` | `#1E4E75` | **7.13** | ✅ |
| neutral | `#FBF3E8` | `#594B40` | **8.12** | ✅ |

## 7. Tổng hợp pass/fail

| Nhóm | Trạng thái AA | Ghi chú |
| --- | --- | --- |
| Chữ nâu chính (mọi nền pastel) | ✅ PASS | 6.18–8.38 |
| `text.muted` (mọi nền cho phép) | ✅ PASS | 4.74–6.42 |
| `text.subtle` | ⚠️ PASS có điều kiện | Chỉ cream/white; pastel chỉ chữ lớn |
| Chữ trắng trên primary/status | ✅ PASS | 4.89–8.36 |
| Chữ trắng trên `brand.mintDark` | ❌ FAIL | Dùng `primary.default` thay thế |
| Viền control `border.strong` | ✅ PASS (3:1) | |
| Viền trang trí `border.subtle` | ❌ FAIL 3:1 | Chỉ trang trí, không phải control |

## 8. Chưa xác minh (ghi rõ)

- Chưa kiểm thử **trên trình duyệt/thiết bị thật** (anti-aliasing, màn hình khác nhau).
- Chưa kiểm **focus indicator trên mọi nền** bằng công cụ tự động.
- Chưa kiểm **màu khi có alpha/overlay** (ví dụ modal backdrop, hero gradient) — cần đo lại khi dựng.
- Các ngưỡng màu trạng thái (success/warning/danger/info) chưa đối chiếu công cụ audit tự động (axe/Lighthouse) — sẽ làm ở phase triển khai.

## 9. Truy vết

- Nguyên tắc: PC-06 (design consistency), PC-07 (accessibility); NFR-A11Y; [BLOCKERS.md](../../BLOCKERS.md) B-P01-02 (tương phản Pastel Mint/Soft Pink — **đã đo và xử lý** bằng shade phụ trợ).
- Token: [tokens/design-tokens.json](./tokens/design-tokens.json) → `color.*`.
