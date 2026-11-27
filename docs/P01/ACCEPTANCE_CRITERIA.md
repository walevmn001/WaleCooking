# P01 — ACCEPTANCE CRITERIA: WALE COOKING

> Tiêu chí nghiệm thu cho **20 nhóm chức năng**. Mỗi tiêu chí phải **kiểm tra được** (quan sát/đo lường), không dùng mô tả cảm tính.
> Mã `AC-FRxx` được tham chiếu từ [FUNCTIONAL_REQUIREMENTS.md](./FUNCTIONAL_REQUIREMENTS.md) và [BUSINESS_RULES.md](./BUSINESS_RULES.md).
> Trạng thái: **đề xuất cho P01 — chưa kiểm thử.** Không đánh dấu đạt khi chưa có kiểm chứng thực tế.
> Định dạng chung: kết quả áp dụng cho actor tương ứng; khi FR có luồng thay thế/lỗi thì AC phải phủ kèm.

---

## AC-FR01 — Trang chủ
- [ ] Trang chủ tải thành công và hiển thị ≥1 khối nội dung khi có công thức `published`.
- [ ] Khối không đủ dữ liệu → **ẩn khối**, không hiển thị khung/placeholder rỗng.
- [ ] Mọi mục bấm trong khối dẫn tới danh sách/chi tiết đúng.
- [ ] Chỉ hiển thị công thức `published` (BR-13); thứ hạng "phổ biến" dựa trên số liệu thực, **không** dữ liệu giả (BR-02).
- [ ] Một khối lỗi dữ liệu **không** làm fail toàn trang.
- **Truy vết:** BR-02, BR-13 · NFR-PERF.

## AC-FR02 — Thư viện công thức
- [ ] Danh sách phân trang hoặc `load more`; tải thêm giữ dữ liệu đã tải khi gặp lỗi phân trang.
- [ ] Sắp xếp theo mới/phổ biến/A–Z cho kết quả đúng thứ tự.
- [ ] Thư viện rỗng → trạng thái rỗng thân thiện (không lỗi).
- [ ] Chỉ liệt kê công thức `published` (BR-13).
- **Truy vết:** BR-13.

## AC-FR03 — Chi tiết công thức
- [ ] Hiển thị đúng các phần có dữ liệu: ảnh, giới thiệu, khẩu phần, thời gian (CB/nấu/tổng), độ khó, nguyên liệu + định lượng, dụng cụ, bước, mẹo, lỗi thường gặp, bảo quản, dinh dưỡng, dị ứng, nguồn, tác giả, trạng thái, ngày tạo/cập nhật (FR-03).
- [ ] Phần thiếu dữ liệu → **ẩn khối**, không hiển thị giá trị 0/giả.
- [ ] Slug không tồn tại → trang **404 thân thiện** (có điều hướng quay lại).
- [ ] Công thức đã lưu trữ → áp dụng BR-12 (thông báo phù hợp / chuyển tới công thức thay thế nếu có).
- [ ] Cảnh báo dị ứng (nếu có) khớp dữ liệu thành phần thực tế (BR-09).
- **Truy vết:** BR-01, BR-03, BR-09, BR-12, BR-13.

## AC-FR04 — Hệ thống phân loại
- [ ] Tồn tại **7 trục độc lập** (Food type, Cuisine/Origin, Ingredient, Cooking method, Meal type, Dietary preference, Allergen); **không gộp** (BR-04).
- [ ] Giá trị taxonomy nạp từ **database**, không hardcode trong frontend (BR-15).
- [ ] Tra cứu theo một trục → liệt kê đúng công thức thuộc giá trị đó.
- [ ] Thêm giá trị trùng tên → bị chặn + thông báo.
- [ ] Trục/giá trị nhiều cấp (vd Cuisine có vùng miền con) hiển thị đúng quan hệ.
- **Truy vết:** BR-04, BR-15.

## AC-FR05 — Tìm kiếm
- [ ] Truy vấn **có dấu và không dấu** đều trả kết quả đúng (SR-01).
- [ ] Khớp được **tên EN/tên gốc** và **bí danh/đồng nghĩa** (SR-02, SR-03).
- [ ] Tìm theo **nguyên liệu** trả công thức chứa nguyên liệu đó (SR-04).
- [ ] Hỗ trợ **nhiều điều kiện cùng lúc**; ngữ nghĩa AND/OR xác định và phản ánh trong URL (SR-05).
- [ ] Kết quả sắp xếp theo SR-07 (khớp chính xác tên > khớp một phần > độ phổ biến > mới cập nhật); **không** dùng số liệu giả.
- [ ] Không có kết quả → thông báo + gợi ý nới điều kiện; **không** trả công thức không tồn tại (SR-08).
- [ ] Truy vấn tự nhiên được **quy đổi thành điều kiện kiểm tra được** và **không** trả kết quả ngoài điều kiện (vd "món chay dưới 30 phút" → `diet=chay` AND `total_time ≤ 30`).
- **Truy vết:** SR-01..SR-05, SR-07, SR-08.

## AC-FR06 — Tìm món từ nguyên liệu sẵn có
- [ ] Nhập/chọn ≥1 nguyên liệu → trả danh sách công thức kèm **độ phủ nguyên liệu**.
- [ ] Kết quả chỉ rõ **nguyên liệu còn thiếu** và **nguyên liệu thay thế** (SR-06, BR-08).
- [ ] Lọc "không thiếu nguyên liệu bắt buộc" → chỉ còn công thức nấu được ngay.
- [ ] Nguyên liệu không nhận diện → gợi ý gần đúng, cho phép chọn lại.
- [ ] **Không** tạo công thức không tồn tại (SR-08).
- **Truy vết:** SR-04, SR-06, SR-08, BR-08.

## AC-FR07 — Bộ lọc
- [ ] Áp dụng đồng thời nhiều filter → kết quả thỏa **tất cả** tiêu chí.
- [ ] Trạng thái filter phản ánh trong URL (chia sẻ lại đúng).
- [ ] Xóa từng filter / xóa tất cả hoạt động đúng.
- [ ] Tổ hợp rỗng → giải thích lý do; giá trị filter không hợp lệ → bỏ qua + thông báo.
- [ ] Filter dị ứng chỉ dựa dữ liệu thực (BR-09).
- **Truy vết:** BR-04, BR-09.

## AC-FR08 — Điều chỉnh khẩu phần
- [ ] Đổi số khẩu phần → định lượng **quy đổi hợp lệ** được tính lại đúng tỉ lệ.
- [ ] Nguyên liệu đánh dấu "không chia tỉ lệ" (vd "để nếm") → **giữ nguyên** + ghi chú.
- [ ] **Không** chuyển volume ↔ mass khi thiếu mật độ đáng tin; khi không quy đổi chính xác → **giữ đơn vị gốc** + ghi chú (BR-06, BR-07).
- [ ] Khẩu phần ≤ 0/không hợp lệ → bị chặn + thông báo.
- **Truy vết:** BR-06, BR-07.

## AC-FR09 — Chế độ nấu từng bước
- [ ] Hiển thị từng bước chữ lớn, có thanh tiến độ; đánh dấu hoàn thành từng bước.
- [ ] Bộ đếm thời gian: chạy đúng khi tab bị đưa nền và quay lại (dựa mốc thời gian thực).
- [ ] **Đã đăng nhập** → tiến độ được lưu và khôi phục khi quay lại (BR-10).
- [ ] **Khách** → vẫn nấu được nhưng **không** lưu; không bị ép đăng nhập (BR-11).
- [ ] Công thức không có bước → ẩn nút bắt đầu.
- [ ] Không hiển thị nhiệt độ/thời gian **không có dữ liệu** (BR-05).
- **Truy vết:** BR-05, BR-10, BR-11.

## AC-FR10 — Thư viện kiến thức nấu ăn
- [ ] Danh mục chủ đề → mở bài → có liên kết tới công thức liên quan.
- [ ] Bài viết hiển thị nguồn khi không phải nội dung gốc (BR-03).
- [ ] Nội dung an toàn thực phẩm **không** đưa tuyên bố chữa bệnh (BR-14).
- [ ] Chủ đề chưa có bài → trạng thái rỗng.
- **Truy vết:** BR-03, BR-14.

## AC-FR11 — Sổ tay cá nhân
- [ ] **Yêu thích:** lưu/bỏ lưu thành công, trạng thái đổi ngay (optimistic), đồng bộ qua thiết bị.
- [ ] Khách nhấn lưu → được mời đăng nhập nhưng **không chặn** đọc (BR-11).
- [ ] Lỗi lưu → hoàn tác trạng thái + thông báo.
- [ ] Công thức đã lưu bị **gỡ xuất bản** → vẫn giữ trong sổ tay với nhãn "không còn xuất bản", **không tự xóa** dữ liệu người dùng (BR-12).
- [ ] Lịch sử nấu/tiến độ chỉ ghi khi đã đăng nhập (BR-10).
- **Truy vết:** BR-10, BR-11, BR-12.

## AC-FR12 — Meal Planner
- [ ] Gán công thức vào bữa (sáng/trưa/tối/ăn nhẹ) theo ngày; lưu và hiển thị lại đúng.
- [ ] Điều chỉnh số khẩu phần cho từng mục.
- [ ] Tổng hợp nguyên liệu áp dụng đúng quy tắc quy đổi (BR-06/07).
- [ ] Lỗi lưu → giữ bản cục bộ + thử lại.
- **Truy vết:** BR-06, BR-07.

## AC-FR13 — Shopping List
- [ ] Tổng hợp nguyên liệu từ meal plan/công thức; **gộp nguyên liệu trùng** đúng.
- [ ] Đơn vị khác loại không gộp được → giữ **dòng riêng** + ghi chú (BR-07).
- [ ] Tick "đã mua" lưu đúng; chia sẻ/in hoạt động.
- [ ] Thêm nguyên liệu thủ công được.
- **Truy vết:** BR-06, BR-07.

## AC-FR14 — Dinh dưỡng & dị ứng
- [ ] Dinh dưỡng chỉ hiển thị khi **có dữ liệu đáng tin**; thiếu → **ẩn khối** (không hiện 0 giả).
- [ ] Cảnh báo dị ứng dựa trên allergen gắn **nguyên liệu thực tế**; **không** suy đoán ngoài dữ liệu (BR-09).
- [ ] Không đưa tuyên bố chữa bệnh (BR-14).
- **Truy vết:** BR-05, BR-09, BR-14.

## AC-FR15 — Trợ lý AI nấu ăn
- [ ] Trả lời kèm **tham chiếu công thức/kiến thức thật**; khi không đủ căn cứ → **từ chối/đề nghị tra cứu**, không bịa (BR-05).
- [ ] **Không** tự sinh định lượng/nhiệt độ/thời gian không có nguồn (BR-05, PC-13).
- [ ] Khi AI lỗi/tắt → **toàn bộ chức năng khác vẫn hoạt động** (PC-14).
- **Truy vết:** BR-05, PC-13, PC-14.

## AC-FR16 — Tài khoản
- [ ] Đăng ký → xác thực → đăng nhập → đăng xuất hoạt động.
- [ ] Email trùng → báo rõ; **sai thông tin đăng nhập → thông báo chung** (không lộ tài khoản tồn tại).
- [ ] Chức năng công khai **không** yêu cầu đăng nhập (BR-11).
- [ ] Thông tin xác thực không lưu dạng thô; kiểm tra quyền ở phía máy chủ (NFR-SEC).
- **Truy vết:** BR-11, NFR-SEC, NFR-PRIV.

## AC-FR17 — CMS/Admin
- [ ] Tạo bản nháp → validate → duyệt → xuất bản; danh sách lọc theo trạng thái.
- [ ] Thiếu trường bắt buộc → **chặn xuất bản** + chỉ rõ trường thiếu (BR-01).
- [ ] Thiếu nguồn khi không phải nội dung gốc → **chặn** (BR-03).
- [ ] Lưu trữ/gỡ xuất bản → áp dụng BR-12.
- [ ] Phân quyền theo RBAC; `user` thường **không** truy cập được CMS.
- **Truy vết:** BR-01, BR-02, BR-03, BR-12.

## AC-FR18 — Bản quyền & nguồn nội dung
- [ ] Trường nguồn **bắt buộc** khi không phải nội dung gốc; thiếu → chặn xuất bản (BR-03).
- [ ] Nguồn hiển thị công khai trên trang công thức.
- [ ] Nội dung 100% gốc → đánh dấu "nội dung gốc".
- [ ] **Không** hiển thị khẳng định "đã thử nghiệm" khi chưa thử nghiệm (BR-03).
- **Truy vết:** BR-03, PC-03.

## AC-FR19 — SEO, chia sẻ, in, đa ngôn ngữ
- [ ] Trang công thức `published` có: `title` duy nhất, `meta description`, `canonical`, slug ổn định, OG tags (NFR-SEO).
- [ ] Có structured data **schema.org Recipe** hợp lệ.
- [ ] `sitemap.xml` gồm **toàn bộ** công thức `published`; `robots.txt` hợp lệ.
- [ ] Nút chia sẻ mạng xã hội dùng OG; thiếu ảnh OG → dùng ảnh mặc định.
- [ ] Chế độ in ẩn điều hướng/không cần thiết, giữ nội dung công thức.
- **Truy vết:** NFR-SEO.

## AC-FR20 — Bảo mật, sao lưu, phục hồi, giám sát, kiểm thử
- [ ] HTTPS bắt buộc; không có bí mật trong repo.
- [ ] Kiểm tra quyền RBAC ở **phía máy chủ** cho mọi hành động nhạy cảm.
- [ ] Sao lưu tự động theo lịch; **kiểm thử phục hồi** cho ra bản khôi phục hợp lệ (NFR-BACKUP: RPO ≤ 24h, RTO ≤ 4h).
- [ ] Có giám sát lỗi + cảnh báo; sao lưu thất bại → cảnh báo admin.
- [ ] Có kiểm thử tự động cho các module lõi (NFR-TEST: đề xuất ≥ 70%).
- **Truy vết:** NFR-SEC, NFR-PRIV, NFR-BACKUP, NFR-TEST, PC-09, PC-12.

---

## Ma trận truy vết AC ↔ Ưu tiên MVP

| AC | FR | Ưu tiên MVP |
| --- | --- | --- |
| AC-FR01 | Trang chủ | Must |
| AC-FR02 | Thư viện công thức | Must |
| AC-FR03 | Chi tiết công thức | Must |
| AC-FR04 | Hệ thống phân loại | Must |
| AC-FR05 | Tìm kiếm | Must |
| AC-FR06 | Tìm món từ nguyên liệu | Should |
| AC-FR07 | Bộ lọc | Must (cơ bản) |
| AC-FR08 | Điều chỉnh khẩu phần | Must |
| AC-FR09 | Chế độ nấu từng bước | Must (cơ bản) |
| AC-FR10 | Thư viện kiến thức | Should |
| AC-FR11 | Sổ tay cá nhân | Must (yêu thích) / Should |
| AC-FR12 | Meal Planner | Could |
| AC-FR13 | Shopping List | Should |
| AC-FR14 | Dinh dưỡng & dị ứng | Should |
| AC-FR15 | Trợ lý AI | Could |
| AC-FR16 | Tài khoản | Must |
| AC-FR17 | CMS/Admin | Must (cơ bản) |
| AC-FR18 | Bản quyền & nguồn | Must (trường nguồn) |
| AC-FR19 | SEO/chia sẻ/in/i18n | Must (SEO/print) / Should (i18n EN) |
| AC-FR20 | Bảo mật/sao lưu/giám sát/kiểm thử | Must (cơ bản) |

> **Cross-check:** 20/20 nhóm chức năng đều có ít nhất một `AC-FRxx` kiểm tra được. Lý do phân kỳ: [MVP_SCOPE.md](./MVP_SCOPE.md).
