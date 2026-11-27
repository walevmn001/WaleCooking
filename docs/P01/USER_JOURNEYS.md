# P01 — USER JOURNEYS: WALE COOKING

> Mỗi hành trình gồm: **Điều kiện bắt đầu · Các bước · Dữ liệu vào · Kết quả mong đợi · Trạng thái lỗi & xử lý.**
> Liên quan: [USER_PERSONAS.md](./USER_PERSONAS.md), [FUNCTIONAL_REQUIREMENTS.md](./FUNCTIONAL_REQUIREMENTS.md).

Ký hiệu actor: P1 Khách · P2 Thành viên · P3 Người nấu thường xuyên · P4 Biên tập viên · P5 Quản trị viên.

---

## UJ-01 — Truy cập trang chủ và khám phá món ăn
- **Actor:** P1/P2 · **FR:** FR-01
- **Điều kiện bắt đầu:** Có kết nối mạng; vào URL trang chủ.
- **Các bước:** (1) Tải trang chủ → (2) Xem món nổi bật/mới/phổ biến, danh mục, món theo quốc gia/nguyên liệu/mùa → (3) Chọn một mục → (4) Tới danh sách/chi tiết.
- **Dữ liệu vào:** (không) — chỉ truy cập.
- **Kết quả mong đợi:** Trang chủ hiển thị trong ngân sách hiệu năng; các khối nội dung bấm được tới đúng đích.
- **Lỗi & xử lý:** Mất mạng → trang lỗi thân thiện + thử lại; khối nội dung rỗng → ẩn khối, không hiển thị khung trống.

## UJ-02 — Tìm món theo tên
- **Actor:** P1/P2 · **FR:** FR-05
- **Điều kiện bắt đầu:** Ở ô tìm kiếm.
- **Các bước:** (1) Nhập từ khóa (có/không dấu, có thể là tên EN/tên gốc/bí danh) → (2) Xem gợi ý → (3) Chọn/chạy tìm → (4) Xem kết quả.
- **Dữ liệu vào:** chuỗi truy vấn (≥1 ký tự sau chuẩn hóa).
- **Kết quả mong đợi:** Danh sách công thức khớp, sắp xếp theo độ liên quan (SR-07).
- **Lỗi & xử lý:** Truy vấn quá ngắn → không gọi tìm, hiện gợi ý gần đây; không có kết quả → trạng thái rỗng + gợi ý nới điều kiện; lỗi dịch vụ → thông báo + giữ truy vấn để thử lại.

## UJ-03 — Tìm món từ nguyên liệu đang có
- **Actor:** P2/P3 · **FR:** FR-06
- **Điều kiện bắt đầu:** Mở công cụ "Tìm theo nguyên liệu".
- **Các bước:** (1) Nhập/chọn các nguyên liệu đang có → (2) Chạy tìm → (3) Xem công thức, chỉ rõ **nguyên liệu còn thiếu** và **nguyên liệu thay thế** → (4) Lọc thêm nếu cần.
- **Dữ liệu vào:** tập nguyên liệu (≥1).
- **Kết quả mong đợi:** Danh sách công thức nấu được, kèm cảnh báo thiếu nguyên liệu; chỉ trả công thức **tồn tại thật**.
- **Lỗi & xử lý:** Nguyên liệu không nhận diện → gợi ý gần đúng, cho phép chọn lại; không kết quả → đề xuất nới bớt nguyên liệu; không tự tạo công thức không tồn tại (SR-08).

## UJ-04 — Lọc công thức theo thời gian, độ khó và chế độ ăn
- **Actor:** P1/P2 · **FR:** FR-07
- **Điều kiện bắt đầu:** Ở thư viện hoặc kết quả tìm kiếm.
- **Các bước:** (1) Mở bộ lọc → (2) Chọn tiêu chí (tổng thời gian, độ khó, chế độ ăn, dị ứng, dụng cụ, ngân sách, khẩu phần, độ cay) → (3) Áp dụng → (4) Xem kết quả, xóa từng filter.
- **Dữ liệu vào:** tập tiêu chí lọc.
- **Kết quả mong đợi:** Kết quả phản ánh đúng tiêu chí; bộ lọc phản ánh trong URL để chia sẻ lại.
- **Lỗi & xử lý:** Kết hợp mâu thuẫn (vd chay + nguyên liệu thịt) → kết quả rỗng có giải thích; filter không hợp lệ → bỏ qua + thông báo.

## UJ-05 — Xem công thức và thay đổi khẩu phần
- **Actor:** P1/P2 · **FR:** FR-03, FR-08
- **Điều kiện bắt đầu:** Mở trang chi tiết công thức.
- **Các bước:** (1) Đọc thông tin (ảnh, mô tả, khẩu phần, thời gian, độ khó, nguyên liệu, dụng cụ, dinh dưỡng, dị ứng, nguồn) → (2) Tăng/giảm số khẩu phần → (3) Xem định lượng tính lại → (4) (Tùy chọn) chuyển đơn vị hiển thị.
- **Dữ liệu vào:** số khẩu phần mong muốn (>0).
- **Kết quả mong đợi:** Định lượng quy đổi hợp lệ; nguyên liệu không quy đổi được giữ **đơn vị gốc** (BR-07).
- **Lỗi & xử lý:** Khẩu phần ≤0/không hợp lệ → chặn + thông báo; nguyên liệu thiếu dữ liệu quy đổi → giữ gốc + ghi chú.

## UJ-06 — Bắt đầu chế độ nấu từng bước
- **Actor:** P1/P2 · **FR:** FR-09
- **Điều kiện bắt đầu:** Ở trang chi tiết, đã có bước chế biến.
- **Các bước:** (1) Nhấn "Bắt đầu nấu" → (2) Xem từng bước chữ lớn → (3) Đánh dấu hoàn thành → (4) Tiếp/tạm dừng/tiếp tục → (5) Tới bước cuối.
- **Dữ liệu vào:** công thức hiện tại; trạng thái tiến độ.
- **Kết quả mong đợi:** Tiến độ hiển thị; nếu **đã đăng nhập**, tiến độ được lưu (BR-10); khách vẫn nấu được nhưng không lưu.
- **Lỗi & xử lý:** Mất mạng khi đã đăng nhập → giữ tiến độ cục bộ và đồng bộ lại; công thức không có bước → ẩn nút bắt đầu.

## UJ-07 — Sử dụng bộ đếm thời gian
- **Actor:** P1/P2 · **FR:** FR-09
- **Điều kiện bắt đầu:** Trong chế độ nấu hoặc trang chi tiết, ở bước có thời gian.
- **Các bước:** (1) Nhấn đặt hẹn giờ → (2) Đếm ngược → (3) Tạm dừng/tiếp tục/đặt lại → (4) Nhận thông báo khi hết giờ.
- **Dữ liệu vào:** thời lượng hẹn giờ.
- **Kết quả mong đợi:** Đồng hồ chính xác; thông báo khi hết (nếu được cấp quyền).
- **Lỗi & xử lý:** Tab bị đưa nền → giữ đúng thời gian khi quay lại (dựa mốc thời gian thực); không có quyền thông báo → hiển thị cảnh báo trong trang.

## UJ-08 — Lưu công thức yêu thích
- **Actor:** P2 · **FR:** FR-11
- **Điều kiện bắt đầu:** Đã đăng nhập; ở thẻ hoặc trang chi tiết công thức.
- **Các bước:** (1) Nhấn "Yêu thích" → (2) Trạng thái đổi ngay (optimistic) → (3) Xem trong Sổ tay → (4) Bỏ yêu thích nếu muốn.
- **Dữ liệu vào:** id công thức.
- **Kết quả mong đợi:** Lưu/bỏ lưu thành công, đồng bộ qua thiết bị.
- **Lỗi & xử lý:** Chưa đăng nhập → mời đăng nhập nhưng **không chặn** đọc; lỗi lưu → hoàn tác trạng thái + thông báo.

## UJ-09 — Lập kế hoạch bữa ăn
- **Actor:** P2/P3 · **FR:** FR-12
- **Điều kiện bắt đầu:** Đã đăng nhập; mở Meal Planner.
- **Các bước:** (1) Chọn ngày/tuần → (2) Thêm công thức vào bữa (sáng/trưa/tối/ăn nhẹ) → (3) Chỉnh số khẩu phần → (4) Xem tổng quan → (5) (Tùy chọn) tạo shopping list.
- **Dữ liệu vào:** ngày, bữa, công thức, khẩu phần.
- **Kết quả mong đợi:** Kế hoạch lưu theo ngày/tuần; tổng nguyên liệu tính đúng.
- **Lỗi & xử lý:** Trùng mục → cho phép hoặc gộp; lỗi lưu → giữ cục bộ + thử lại.

## UJ-10 — Tạo danh sách mua sắm
- **Actor:** P2/P3 · **FR:** FR-13, từ FR-12 hoặc từ công thức
- **Điều kiện bắt đầu:** Chọn "Tạo danh sách mua sắm" từ meal plan hoặc công thức.
- **Các bước:** (1) Tổng hợp nguyên liệu → (2) **Gộp nguyên liệu trùng** → (3) Chỉnh số lượng/đơn vị → (4) Đánh dấu đã mua → (5) Chia sẻ/in.
- **Dữ liệu vào:** danh sách công thức + khẩu phần.
- **Kết quả mong đợi:** Danh sách gộp đúng; quy đổi hợp lệ; chỉ giữ gốc khi không đổi được.
- **Lỗi & xử lý:** Đơn vị khác loại không gộp được → giữ dòng riêng + ghi chú; lỗi lưu → giữ cục bộ.

## UJ-11 — Ghi chú và đánh giá trải nghiệm nấu
- **Actor:** P2/P3 · **FR:** FR-11
- **Điều kiện bắt đầu:** Đã nấu xong một công thức (đã đăng nhập).
- **Các bước:** (1) Mở "Ghi chú" của công thức → (2) Thêm ghi chú/điều chỉnh → (3) (Tùy chọn) đánh giá → (4) Lưu vào lịch sử nấu.
- **Dữ liệu vào:** nội dung ghi chú; đánh giá (nếu có).
- **Kết quả mong đợi:** Ghi chú riêng tư gắn với công thức; xuất hiện trong lịch sử nấu.
- **Lỗi & xử lý:** Chưa đăng nhập → yêu cầu đăng nhập (đây là chức năng cá nhân); lỗi lưu → giữ nháp cục bộ.

## UJ-12 — Quản trị viên/biên tập viên tạo, duyệt và xuất bản công thức
- **Actor:** P4/P5 · **FR:** FR-17, FR-18
- **Điều kiện bắt đầu:** Đã đăng nhập với vai trò `editor`/`admin`.
- **Các bước:** (1) Tạo công thức → (2) Nhập trường bắt buộc → (3) Gán taxonomy (7 trục) → (4) Thêm nguồn → (5) Hệ thống validate → (6) Lưu nháp → (7) Duyệt → (8) Xuất bản.
- **Dữ liệu vào:** toàn bộ dữ liệu công thức (xem FR-03).
- **Kết quả mong đợi:** Chỉ xuất bản khi đủ trường bắt buộc (BR-01); công thức hiển thị công khai + có SEO.
- **Lỗi & xử lý:** Thiếu trường bắt buộc → chặn xuất bản + chỉ rõ trường thiếu; thiếu nguồn khi không phải nội dung gốc → chặn; lưu trữ công thức đã xuất bản → áp dụng BR-12 (liên kết cũ + công thức đã lưu).
