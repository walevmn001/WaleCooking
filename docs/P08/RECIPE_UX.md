# P08 — Recipe UX Foundation

> Phase: **P08** · Ngày: 2026-11-28.
> Phạm vi: P08 §P08.5 — cải thiện trải nghiệm hỗ trợ nấu ăn trên trang chi tiết công thức.
> Nguyên tắc: **không** bịa nguyên liệu/định lượng/nhiệt độ/thời gian/dinh dưỡng khi nguồn không có.

## 1. Trang chi tiết công thức

[app/(public)/cong-thuc/[slug]/page.tsx](../../app/(public)/cong-thuc/[slug]/page.tsx) — Server Component,
chỉ hiển thị công thức `published`; thiếu dữ liệu → **ẩn mục** (không bịa).

| Thành phần | Component (P05/P07) | Ghi chú |
| --- | --- | --- |
| Ảnh đại diện | `RecipeImage` | mascot P04 khi thiếu ảnh |
| Thời gian chuẩn bị | `PreparationTime` | ẩn nếu `null` |
| Thời gian nấu | `CookingTime` | dùng `cookMinutes` hoặc tổng |
| Khẩu phần | `ServingsBadge` | từ `baseServings` |
| Độ khó | `DifficultyBadge` | từ `difficulty` |
| Nguyên liệu | `IngredientList` / `IngredientRow` | định lượng + đơn vị dễ đọc (P07/P02 D17) |
| Các bước nấu | `CookingStepCard` | từng bước, có `tip`/thời lượng/nhiệt độ khi có |
| Dinh dưỡng | `NutritionSummary` | chỉ khi công thức có dữ liệu |
| Dị ứng | `AllergenBadges` | từ `allergenSlugs` |
| Nguồn tham khảo | danh sách | tên/tác giả/giấy phép/ghi chú |
| Yêu thích | `FavoriteButton` | cookie (P07.1), không cần tài khoản |
| Chia sẻ | `ShareRecipeButton` | Web Share API + fallback clipboard |

## 2. Liên kết với danh mục (điều hướng vòng)

- Mỗi term taxonomy của công thức thuộc **khu vực khám phá** được render thành `Badge` **có liên kết**
  tới `/danh-muc/{segment}/{slug}` (`categoryTermHref`); term ngoài khu vực khám phá hiển thị badge không link.
- Breadcrumb: `Trang chủ → Công thức → {tên}`. Người dùng quay lại danh mục qua badge/breadcrumb.

## 3. SEO & dữ liệu có cấu trúc

- `generateMetadata`: `seoTitle`/`seoDescription` (fallback title/summary), OpenGraph `article`
  + ảnh đại diện khi có.
- JSON-LD `schema.org/Recipe` (`toRecipeJsonLd`) — **chỉ** phát trường có dữ liệu thật.

## 4. Không triển khai ở P08 (ghi backlog)

Các hạng mục sau **không** thuộc P08 (theo prompt §V — ghi backlog, không mở rộng phạm vi):

1. Bộ chuyển đổi định lượng theo khẩu phần.
2. Checklist nguyên liệu đi chợ.
3. Chế độ nấu từng bước toàn màn hình.
4. Hẹn giờ nấu cho từng công đoạn.
5. Công cụ quy đổi đơn vị đo lường.
6. Gợi ý món theo nguyên liệu đang có.
7. Thực đơn theo ngày.
8. Danh sách món đã lưu bằng cookie (mở rộng thêm).
9. Bộ lọc món theo thời gian nấu & độ khó (đã có lọc cơ bản).
10. Hướng dẫn sơ chế & bảo quản nguyên liệu.

## 5. Ràng buộc nội dung

- **Không** tự tạo nguyên liệu, định lượng, nhiệt độ, thời gian hoặc giá trị dinh dưỡng.
- **Không** xây AI chatbot, cộng đồng, bình luận, đánh giá (ngoài phạm vi sản phẩm).
- Nội dung công thức trong kiểm thử là **fixture** — không tuyên bố có công thức thật đã xuất bản.

## 6. Truy cập (a11y)

- Heading phân cấp (`h1`→`h2`→`h3`), `<section aria-labelledby>`, `<ol>` cho các bước.
- Nút yêu thích/chia sẻ có `aria-label`; badge phân loại có nhãn `<ul aria-label="Phân loại">`.
- **Chưa** kiểm axe/Lighthouse/screen reader trong môi trường (kế thừa B-P07-04) — xem blocker P08.
