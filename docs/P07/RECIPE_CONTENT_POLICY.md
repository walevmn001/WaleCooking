# P07 — RECIPE CONTENT POLICY

> Chính sách về tính chính xác và nguồn gốc nội dung công thức (P07 §17).
> Cập nhật: 2026-11-28 (P07).

---

## 1. Nguyên tắc gốc

1. **Không bịa** nguyên liệu, định lượng, nhiệt độ, thời gian, thông tin dinh dưỡng.
2. **Không sao chép** nguyên văn công thức nước ngoài/website khác khi chưa có quyền.
3. **Ghi nguồn** khi dùng thông tin tham khảo.
4. **Phân biệt** nội dung WALE COOKING tự biên soạn vs nội dung được cấp phép.
5. **Không tự nhận** sở hữu nội dung bên thứ ba.
6. **Không tạo hàng loạt** công thức giả để lấp trang.
7. Fixture rõ ràng **chỉ** dùng trong môi trường **test**, không lên production như nội dung đã xuất bản.

---

## 2. Thực thi ở tầng dữ liệu (DB)

- **Nguồn** là bắt buộc khi xuất bản (BR-03): `recipe_sources` → `content_sources` ghi
  `name`, `authorOrOrg`, `url`, `license`, `note`, `isPrimary`.
- **Dinh dưỡng** mang `basis` + `dataSourceType` (`measured|calculated|estimated|unknown`) +
  `sourceNote` — UI hiển thị kèm cơ sở tính và nguồn, không trình bày như số liệu chắc chắn
  nếu là ước tính.
- **Định lượng** lưu dạng số (`numeric`) — không ép chuỗi tùy tiện; timer chỉ tồn tại khi người
  dùng nhập (không tự sinh).
- **Allergen** phân biệt `source` (`declared|derived|contains|may_contain`) — không tự thêm
  cảnh báo dị ứng khi thiếu dữ liệu.

## 3. Thực thi ở tầng trình bày (UI)

- Presentation mapper **chỉ định dạng lại** dữ liệu có thật; thiếu trường → `undefined`, ẩn mục.
- JSON-LD `schema.org/Recipe`: **chỉ** thêm trường có dữ liệu (không có `cookMinutes` → không
  có `cookTime`).
- Trang chi tiết có mục **"Nguồn tham khảo"** hiển thị khi có dữ liệu.
- Ảnh: chỉ dùng ảnh có quyền; khi thiếu → mascot P04 (không lấy ảnh ngoài).

## 4. Điểm cần lưu ý — BR-03 "tự biên soạn"

[assertPublishable()](../../lib/services/recipe.service.ts#L216-L243) yêu cầu **ít nhất một nguồn**
khi xuất bản. Vì server **không thể xác định chắc chắn** tính "gốc" của nội dung:

- Nội dung do WALE COOKING tự biên soạn phải khai báo bằng nguồn **hệ thống**
  "WALE COOKING (tự biên soạn)" (đã có trong seed: `content_sources`).
- Đây là cách **fail-safe**: buộc người tạo công thức chủ động khai báo nguồn gốc, kể cả
  nội dung tự viết — thay vì để trống và ngầm hiểu là "của mình".
- ⚠️ Hiện **chưa** ràng buộc cứng "nếu `isPrimary` là nguồn tự biên soạn thì bắt buộc có ghi chú".
  Đây là điểm **cần siết** trong phase sau (xem §7).

## 5. Dữ liệu seed & fixture

- **Seed hệ thống** (P06): chỉ dữ liệu tham chiếu (taxonomy, đơn vị, thiết bị, nguyên liệu,
  1 `content_source` tự biên soạn). **KHÔNG** chứa công thức.
- **Bảng `recipes` = 0** sau seed hệ thống → không có công thức giả nào hiển thị như đã xuất bản.
- **Test** tạo dữ liệu công thức **cách ly** (slug có tiền tố duy nhất `uniqueSlug`/`uniqueSuffix`),
  rồi dọn; chạy trên `wale_test`, **không** đụng dữ liệu thật.
- **`lib/mock/recipes.ts`** (P05) là mock **dev-only**, gắn nhãn `[MOCK]`, **không** dùng ở
  trang production.

## 6. Sắp xếp "phổ biến" (popular)

- Chưa có bảng đo lượt xem/yêu thích thực ở P07. Vì vậy không bịa "độ phổ biến":
  nếu chọn `sort=popular` mà thiếu dữ liệu, thứ tự dựa trên chỉ số sẵn có (thời điểm xuất bản)
  — **không** hiển thị số liệu phổ biến giả. Xem [RECIPE_API_IMPLEMENTATION.md](./RECIPE_API_IMPLEMENTATION.md) §10.

## 7. Việc cần siết ở phase sau (chưa làm — ghi rõ)

- Ràng buộc cứng: nguồn `isPrimary` = nội dung gốc thì **bắt buộc** có `note` mô tả/attribution.
- Cảnh báo khi phát hiện nội dung trùng/đáng ngờ sao chép (chưa có công cụ).
- Trường "giấy phép sử dụng" ở cấp công thức (ngoài từng nguồn) nếu cần.
- Quy trình reviewer (editor → admin) để duyệt nội dung trước publish (liên quan B-P01-01).

## 8. Cam kết ở báo cáo P07

Trong [TEST_REPORT.md](./TEST_REPORT.md) và báo cáo tổng kết: mọi công thức dùng trong kiểm thử
đều là **fixture rõ ràng** trong môi trường test — **không** tuyên bố có nội dung công thức
thật đã xuất bản trên production.
