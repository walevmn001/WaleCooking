# UNIT CONVERTER — Quy đổi đơn vị đo (P10.2)

> WALE COOKING · Phase P10 · Ngày: 2026-11-28.
> Logic thuần: [`lib/kitchen/units.ts`](../../lib/kitchen/units.ts) · UI: [`components/kitchen/unit-converter.tsx`](../../components/kitchen/unit-converter.tsx) · Trang: [`app/(public)/cong-cu/quy-doi-don-vi/page.tsx`](../../app/(public)/cong-cu/quy-doi-don-vi/page.tsx).

## 1. Mục tiêu

Công cụ quy đổi đơn vị đo phục vụ nấu ăn. **Logic tách hoàn toàn khỏi UI** để có thể kiểm thử và
tái sử dụng (ví dụ sau này trong Portion Scaling).

## 2. Nhóm đại lượng & đơn vị

| Nhóm | Đơn vị | Cơ sở | Hệ số (nguồn) |
| --- | --- | --- | --- |
| Khối lượng | `g` `kg` `mg` `oz` `lb` | gam | kg=1000 (SI); mg=0.001 (SI); oz=28.349523125 (avoirdupois); lb=453.59237 (avoirdupois) |
| Thể tích | `ml` `l` `tsp` `tbsp` `fl_oz` `cup` `metric_cup` | mililít | l=1000 (SI); tsp=4.92892159375 · tbsp=3 tsp · fl oz=2 tbsp · cup(US)=8 fl oz (US customary); metric cup=250 ml |
| Nhiệt độ | `°C` `°F` | công thức | `°F = °C×9/5+32`; `°C = (°F−32)×5/9` |
| Đếm | `piece cái` `clove tép` `slice lát` `bunch bó` `stalk cây` `sprig nhánh` `can lon` `pack gói` | — | **Không** quy đổi lẫn nhau |
| Tùy biến | `pinch` `to_taste` `as_needed` | — | **Không** quy đổi |

Hệ số được khai báo cùng `source` (truy xuất) trong `UNIT_DEFINITIONS`, **cùng chuẩn** với seed P06
(`prisma/seed/data.ts`) — không tự suy diễn tỷ trọng nguyên liệu.

## 3. Quy tắc (bắt buộc)

- **CHỈ** quy đổi khi có hệ số xác định; **không** quy đổi khối lượng ↔ thể tích (thiếu tỷ trọng).
- **Không** quy đổi giữa các đơn vị đếm khác nhau (một "quả"/một "chén"/một "muỗng" không có khối
  lượng cố định cho mọi nguyên liệu). Cùng đơn vị đếm (piece→piece) thì giữ nguyên.
- Phân biệt **cup US** và **metric cup** (250 ml) — hai đơn vị riêng.
- Nhiệt độ cho phép **số âm** (đúng công thức); khối lượng/thể tích không nhận số âm.

## 4. API hàm thuần

```ts
convertUnit(value, fromCode, toCode): ConversionResult   // KHÔNG ném lỗi
convertTemperature(value, "c" | "f", "c" | "f"): number
getUnit(code); unitsByDimension(dim); convertibleTargets(fromCode)
parseAmountInput(text): number | null      // chấp nhận "1,5" → 1.5; "" / "abc" → null
formatConvertedValue(n): string            // tối đa 6 chữ số thập phân, bỏ nhiễu float
formatWithUnit(n, code): string
```

`ConversionResult` = `{ ok:true, value, from, to }` | `{ ok:false, code, message }` với các mã lỗi:
`invalid_input` (rỗng/không phải số/âm với mass-volume/quá lớn), `unknown_unit` (mã lạ),
`incompatible` (khác nhóm đại lượng), `not_convertible` (đếm/tùy biến khác nhau). Giới hạn đầu vào:
`MAX_INPUT_VALUE = 1e12`.

## 5. Xử lý đầu vào & hiển thị

- Input rỗng → gợi ý nhập; không phải số → thông báo "Vui lòng nhập một số hợp lệ."; kết quả dùng
  `aria-live="polite"`.
- Hiển thị rõ **số + ký hiệu đơn vị** ở cả hai vế và ghi **nguồn hệ số** ngay dưới công cụ.
- UI chỉ cho chọn đơn vị **cùng nhóm** (đổi nhóm → đặt lại `from`/`to` mặc định); có nút đảo chiều.
- Ghi chú cố định: chỉ quy đổi trong cùng nhóm; **không** quy đổi khối lượng↔thể tích, không quy đổi
  giữa các đơn vị đếm.

## 6. Kiểm thử

Toàn bộ công thức chuyển đổi có unit test (`tests/lib/kitchen/units.test.ts`) — xem
[TEST_REPORT.md](./TEST_REPORT.md). Bao gồm: mass, volume (US + metric), nhiệt độ (kể cả −40),
cặp đơn vị không hợp lệ, giá trị âm/quá lớn/NaN, parse/format.

## 7. Chưa xác minh

Không có môi trường đo lường thực tế trong bếp (cân/ca đong) — hệ số dựa trên định nghĩa chuẩn
(SI/US customary/avoirdupois) như đã ghi nguồn, chưa đối chiếu với dụng cụ đo vật lý.
