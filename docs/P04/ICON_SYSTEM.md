# P04 — ICON SYSTEM: WALE COOKING

> Hệ icon đồng bộ cho WALE COOKING — **38 icon** (24×24), màu `currentColor`.
> Lưu tại `public/assets/icons/`. Nguồn sinh: [scripts/p04_generate_assets.py](../../scripts/p04_generate_assets.py).

## 1. Quy cách chung

| Thuộc tính | Giá trị |
| --- | --- |
| Khung (viewBox) | `0 0 24 24` |
| Kích thước hiển thị | 16 / 20 / 24 / 32 px (`size.icon` P03) |
| Nét | `stroke-width: 2`, `fill: none` |
| Đầu nét | `stroke-linecap: round`, `stroke-linejoin: round` |
| Màu | `currentColor` (kế thừa theo ngữ cảnh) |
| Vùng chạm | khi là nút icon: ≥ 44×44px (đệm vùng chạm, không phóng to hình) |
| Thuộc tính | `role="img"`, `aria-hidden="true"`, `focusable="false"` (icon **thuần trang trí**; nút chứa icon tự mang `aria-label`) |

> **Ưu tiên Lucide** cho icon chức năng thông thường (Home, Search, Add, Edit, Delete…): P04 vẽ **nguyên bản** theo cùng tinh thần hình học (lưới 24, nét 2px bo tròn) để đồng bộ — không copy tệp. Icon đặc trưng thương hiệu (món ăn, nguyên liệu, danh mục) được thiết kế riêng theo phong cách minh họa WALE COOKING.
> **Không dùng emoji** thay icon trong giao diện chính.

## 2. Danh mục icon theo nhóm

### 2.1 Điều hướng — `icons/nav/` (7)
| Icon | Ý nghĩa |
| --- | --- |
| `home` | Trang chủ |
| `recipes` | Công thức (sách mở) |
| `categories` | Danh mục (lưới) |
| `search` | Tìm kiếm |
| `favorites` | Yêu thích (tim) |
| `profile` | Hồ sơ người dùng |
| `settings` | Cài đặt |

### 2.2 Nấu ăn — `icons/cooking/` (9)
| Icon | Ý nghĩa |
| --- | --- |
| `ingredient` | Nguyên liệu (cà rốt) |
| `cooking-time` | Thời gian nấu (đồng hồ bấm) |
| `prep-time` | Thời gian sơ chế (đồng hồ cát) |
| `servings` | Khẩu phần (dao–dĩa) |
| `difficulty` | Độ khó (cột tăng dần) |
| `cooking-method` | Phương pháp nấu (lửa) |
| `temperature` | Nhiệt độ (nhiệt kế) |
| `nutrition` | Dinh dưỡng (quả táo) |
| `allergen` | Dị ứng (khiên cảnh báo) |

### 2.3 Tương tác — `icons/interaction/` (13)
| Icon | Ý nghĩa |
| --- | --- |
| `add` | Thêm (+) |
| `edit` | Sửa (bút chì) |
| `delete` | Xóa (thùng rác) |
| `save` | Lưu (bookmark) |
| `share` | Chia sẻ |
| `print` | In |
| `filter` | Lọc |
| `sort` | Sắp xếp |
| `back` | Quay lại |
| `close` | Đóng (×) |
| `check` | Đạt (✓) |
| `warning` | Cảnh báo (tam giác) |
| `error` | Lỗi (× trong vòng) |

### 2.4 Nội dung — `icons/content/` (9)
| Icon | Ý nghĩa |
| --- | --- |
| `breakfast` | Bữa sáng (trứng) |
| `lunch` | Bữa trưa (bát) |
| `dinner` | Bữa tối (khay/cloche) |
| `dessert` | Tráng miệng (bánh cupcake) |
| `drink` | Đồ uống (ly + ống hút) |
| `vegetarian` | Món chay (lá) |
| `meat` | Món thịt |
| `seafood` | Hải sản (cá) |
| `baking` | Làm bánh (phới lồng) |

**Tổng: 7 + 9 + 13 + 9 = 38 icon.**

## 3. Quy tắc màu icon

- Mặc định `currentColor` = `text.primary` `#594B40`.
- Trên nền màu: dùng màu chữ tương ứng đạt tương phản (xem [COLOR_ACCESSIBILITY_AUDIT.md](../P03/COLOR_ACCESSIBILITY_AUDIT.md)).
- **Không** đổi nét/màu riêng lẻ từng icon để tránh phá hệ thống.
- Icon trạng thái (warning/error/check) phải đi kèm **màu semantic + text**, không chỉ dựa vào màu (PC-07).

## 4. Accessibility

- Icon trang trí: `aria-hidden="true"` (đã đặt sẵn).
- Nút icon-only: bọc trong `<button>` có `aria-label` mô tả hành động.
- Không dùng icon một mình để truyền thông tin thiết yếu (luôn có nhãn/chữ).

## 5. Truy vết
PC-06, PC-07; `size.icon` ([design-tokens.json](../P03/tokens/design-tokens.json)); [COMPONENT_SPECIFICATIONS.md](../P03/COMPONENT_SPECIFICATIONS.md).
