# P08 — TAXONOMY & RECIPE DISCOVERY: Domain phân loại

> Phase: **P08** · Ngày: 2026-11-28 · Trạng thái: đã triển khai (xem checkpoint).
> Phạm vi: P08 §P08.1 — tận dụng schema taxonomy P06, **không** tạo taxonomy trùng lặp.

## 1. Nguyên tắc

- P08 **kế thừa nguyên vẹn** mô hình taxonomy của P06/P02 (D14/D-P02-04): `TaxonomyType` +
  `TaxonomyTerm` + `TaxonomyTermTranslation` + `TaxonomyTermAlias`. **Không** thêm model,
  **không** thêm cột (theo **ADR-P07_1-02** — không thêm cột SEO/ảnh taxonomy trong P07.1/P08).
- Taxonomy là **dữ liệu**, không hardcode vào frontend: term thêm/sửa trong quản trị không cần
  sửa giao diện. Chỉ khi thêm **một trục phân loại mới** mới cần khai báo metadata ở
  [lib/constants/taxonomy.ts](../../lib/constants/taxonomy.ts).
- **7 trục độc lập** đã chốt ở D6 vẫn giữ; P08 chỉ **chọn 6 trục** làm khu vực khám phá công khai
  (một số trục còn lại dùng nội bộ/nguyên liệu chi tiết).

## 2. Sáu trục khám phá (`DISCOVERY_TAXONOMIES`)

Khai báo tại [lib/constants/taxonomy.ts](../../lib/constants/taxonomy.ts). Đây là **metadata thiết kế**
(nhãn, đoạn URL, cách lọc) — danh sách term thực tế lấy từ DB.

| # | `code` (DB) | Đoạn URL | Nhãn | Phân cấp | `filterKind` |
| --- | --- | --- | --- | --- | --- |
| 1 | `food_type` | `/danh-muc/nhom-mon` | Nhóm món ăn | Không | `direct` |
| 2 | `cuisine` | `/danh-muc/am-thuc` | Ẩm thực | Không | `direct` |
| 3 | `meal_type` | `/danh-muc/bua-an` | Bữa ăn | Không | `direct` |
| 4 | `cooking_method` | `/danh-muc/phuong-phap` | Phương pháp chế biến | Không | `direct` |
| 5 | `dietary_preference` | `/danh-muc/dac-diem` | Đặc điểm món ăn | Không | `direct` |
| 6 | `ingredient_category` | `/danh-muc/nguyen-lieu` | Nguyên liệu chính | **Có** | `ingredient_category` |

Các trục `country`, `region`, `allergen` (đã seed ở P06) **vẫn tồn tại** trong dữ liệu nhưng
**không** hiển thị trong khu vực khám phá ở P08 (không tạo taxonomy trùng; có thể bổ sung sau).

## 3. Ý nghĩa `filterKind`

| `filterKind` | Liên kết công thức ↔ term | Ví dụ |
| --- | --- | --- |
| `direct` | Quan hệ trực tiếp qua `recipe_taxonomy_terms` | `meal_type` = `an-sang` |
| `ingredient_category` | Công thức có **nguyên liệu** thuộc nhóm nguyên liệu đó | `ingredient_category` = `thit` |

Trục `ingredient_category` phân cấp: term gốc (thịt, hải sản, rau củ…) có term con. Lọc theo
term cha cũng trả công thức của term con (do quan hệ nguyên liệu → nhóm nguyên liệu).

## 4. Kiểu và hàm tra cứu

```ts
export type RecipeFilterKind = "direct" | "ingredient_category";

export interface DiscoveryTaxonomy {
  code: string;          // taxonomy_types.code
  segment: string;       // đoạn URL /danh-muc/{segment}
  label: string;         // nhãn hiển thị (vi)
  description: string;   // mô tả SEO/UX
  isHierarchical: boolean;
  filterKind: RecipeFilterKind;
}
```

- `getDiscoveryTaxonomyByCode(code)` — tra theo `code`.
- `getDiscoveryTaxonomyBySegment(segment)` — tra theo đoạn URL.
- `isDiscoveryTaxonomy(code)` — trục có thuộc khu vực khám phá?

Tra cứu dùng `Map` dựng sẵn (`BY_CODE`/`BY_SEGMENT`) — O(1), không quét mảng.

## 5. Phân loại định hướng (tham chiếu prompt §P08.1)

Các nhóm định hướng (Món Việt, Món Á, Món Âu, Món chay, Món mặn, Món nước, Món chiên, Món xào,
Món hấp, Món nướng, Món ăn sáng/trưa/tối/vặt/tráng miệng, Đồ uống) **ánh xạ** vào các trục:

- Ẩm thực (`cuisine`): Món Việt / Á / Âu.
- Đặc điểm (`dietary_preference`): chay / mặn.
- Phương pháp (`cooking_method`): nước / chiên / xào / hấp / nướng.
- Bữa ăn (`meal_type`): sáng / trưa / tối / vặt / tráng miệng / đồ uống.

Các term này nằm trong **seed P06** (dữ liệu), không hardcode ở frontend. Admin có thể thêm/sửa
term trực tiếp (P08.4).

## 6. Quan hệ với P06/P07

- **Không** migration mới cho taxonomy ở P08 (schema đã đủ).
- Repository: [lib/db/repositories/taxonomy.repository.ts](../../lib/db/repositories/taxonomy.repository.ts)
  bổ sung đọc kèm số liệu (`listTermsWithCounts`, `countActiveTermsByType`, `countRecipeUsage`) và
  ghi (`createTerm`, `updateTerm`, `setTermActive`, `deleteTermById`).
- Service: [lib/services/taxonomy.service.ts](../../lib/services/taxonomy.service.ts).
