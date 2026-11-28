# PORTION SCALING — P09.3

> WALE COOKING · Phase P09 · Cập nhật: 2026-11-28.
> Điều chỉnh định lượng nguyên liệu theo số khẩu phần người dùng chọn.

## 1. Công thức

```
định lượng mới = định lượng gốc × (số khẩu phần mới / số khẩu phần gốc)
```

`servingFactor(baseServings, target) = target / base` — trả `null` nếu `base ≤ 0` hoặc không hữu hạn.

## 2. Module thuần

Toàn bộ logic ở [lib/cooking/portion.ts](../../lib/cooking/portion.ts) (hàm thuần, không React/DB →
dùng chung server/client, dễ kiểm thử).

| Hàm | Vai trò |
| --- | --- |
| `servingFactor(base, target)` | Hệ số nhân (hoặc `null`) |
| `clampServings(v)` | Kẹp `[1, 100]`, làm tròn về số nguyên |
| `parseServingsInput(raw)` | Nhập "4", "4.5", "4,5", phân số "1/2" → số (hoặc `null`) |
| `formatScaledNumber(v)` | Tối đa 2 chữ số thập phân, bỏ số 0 thừa, tránh "-0" |
| `scaleIngredientAmount(ing, factor)` | Định lượng hiển thị sau khi nhân |
| `scaleIngredients(list, base, target)` | Nhân cả danh sách |

## 3. Quy tắc xử lý định lượng & đơn vị

| Trường hợp | Xử lý |
| --- | --- |
| `quantityType = "text"` (vừa đủ, tuỳ ý…) | **Không nhân** — giữ nguyên chữ |
| `quantityType = "decimal"` | Nhân số gốc, **giữ nguyên đơn vị** |
| `quantityType = "fraction"` | Lưu giá trị thập phân → nhân số, giữ đơn vị |
| `quantityType = "range"` | Nhân **cả** min và max |
| Đơn vị khối lượng (g/kg/mg) | Chỉ nhân số; **không** quy đổi |
| Đơn vị thể tích (ml/l/tsp/tbsp/cup) | Chỉ nhân số; **không** quy đổi |
| Đơn vị đếm (quả/cái/miếng…) | Chỉ nhân số |
| Đơn vị không xác định | Chỉ nhân số, giữ nguyên đơn vị |
| `factor === 1` hoặc không hợp lệ | Trả **định lượng gốc** nguyên vẹn (không làm tròn lại) |
| Thiếu `quantityData` | Trả định lượng gốc |

**Không quy đổi khối lượng ↔ thể tích.** `IngredientDensity` trong schema **rỗng** (không có tỷ trọng
đáng tin cậy) → tuyệt đối không suy ra 100 g bột mì = bao nhiêu ml (P09 §P09.3, §V.1).

**Không làm tròn gây sai lệch lớn:** làm tròn tối đa 2 chữ số thập phân.

## 4. UI — `PortionSelector`

`components/cooking/portion-selector.tsx`:

- Nút **giảm/tăng** (IconButton, `aria-label` rõ ràng), kẹp trong `[1, 100]`.
- **Ô nhập trực tiếp** (`input type="number"`, có label `sr-only`); commit khi `blur`/`Enter`;
  giá trị không hợp lệ/rỗng → **trả về giá trị đang dùng**, không báo lỗi ồn ào.
- Nút **Khôi phục** về khẩu phần gốc (disabled khi đang ở khẩu phần gốc).
- Thông báo `sr-only role="status" aria-live="polite"` đọc số khẩu phần đang chọn.
- Dòng ghi chú nêu khẩu phần gốc và việc định lượng bên dưới sẽ cập nhật theo.

## 5. Bất biến dữ liệu

- **Không** sửa dữ liệu công thức gốc trong DB — chỉ tính ở tầng trình bày client.
- Định lượng đã nhân dùng cho cả **checklist** lẫn hiển thị, nên checklist luôn đúng định lượng hiện tại.
- Đổi khẩu phần **không** mất trạng thái checklist đã tick (lưu theo id nguyên liệu).

## 6. Kiểm thử

`tests/lib/cooking.portion.test.ts` (P09.7): hệ số, kẹp giá trị, parse số/phân số/giá trị sai,
định dạng số, nhân decimal/fraction/range/text, đơn vị không hỗ trợ, `factor` không hợp lệ.
