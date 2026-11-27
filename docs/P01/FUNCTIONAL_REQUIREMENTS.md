# P01 — FUNCTIONAL REQUIREMENTS: WALE COOKING

> Đặc tả chi tiết **20 nhóm chức năng** đã chốt tại P00. Không bỏ sót chức năng nào.
> Ưu tiên: **Must / Should / Could / Won't (MVP)**. Lý do phân kỳ: xem [MVP_SCOPE.md](./MVP_SCOPE.md).
> Quy tắc nghiệp vụ tham chiếu mã `BR-xx` ([BUSINESS_RULES.md](./BUSINESS_RULES.md)); tiêu chí nghiệm thu chi tiết tại [ACCEPTANCE_CRITERIA.md](./ACCEPTANCE_CRITERIA.md).

**Tổng quan ưu tiên:**

| FR | Nhóm | Ưu tiên MVP |
| --- | --- | --- |
| FR-01 | Trang chủ | Must |
| FR-02 | Thư viện công thức | Must |
| FR-03 | Chi tiết công thức | Must |
| FR-04 | Hệ thống phân loại | Must |
| FR-05 | Tìm kiếm | Must |
| FR-06 | Tìm món từ nguyên liệu sẵn có | Should |
| FR-07 | Bộ lọc | Must (cơ bản) |
| FR-08 | Điều chỉnh khẩu phần | Must |
| FR-09 | Chế độ nấu từng bước | Must (cơ bản) |
| FR-10 | Thư viện kiến thức nấu ăn | Should |
| FR-11 | Sổ tay cá nhân | Must (yêu thích) / Should (còn lại) |
| FR-12 | Meal Planner | Could |
| FR-13 | Shopping List | Should |
| FR-14 | Dinh dưỡng & dị ứng | Should |
| FR-15 | Trợ lý AI nấu ăn | Could |
| FR-16 | Tài khoản | Must |
| FR-17 | CMS/Admin | Must (cơ bản) |
| FR-18 | Bản quyền & nguồn nội dung | Must (trường nguồn) |
| FR-19 | SEO, chia sẻ, in, đa ngôn ngữ | Must (SEO/print) / Should (i18n EN) |
| FR-20 | Bảo mật, sao lưu, phục hồi, giám sát, kiểm thử | Must (cơ bản) |

---

## FR-01 — Trang chủ `Must`
- **Mục tiêu:** Điểm vào giúp khám phá nhanh; thể hiện cảm giác "sách nấu ăn".
- **Mô tả:** Các khối: món nổi bật, món mới, món phổ biến, danh mục, món theo quốc gia, theo nguyên liệu, theo mùa.
- **Actor:** guest, user.
- **Điều kiện tiên quyết:** Có công thức đã xuất bản.
- **Luồng chính:** Tải trang → render các khối theo dữ liệu → bấm khối → tới danh sách/chi tiết.
- **Luồng thay thế:** Khối không đủ dữ liệu → ẩn khối; có thể reorder khối theo cấu hình.
- **Trường hợp lỗi:** Lỗi tải dữ liệu khối → hiển thị các khối còn lại (không fail toàn trang).
- **Dữ liệu:** công thức (công khai), taxonomy, banner cấu hình.
- **Quy tắc:** BR-13 (chỉ hiện công thức đã xuất bản); "phổ biến" dựa trên lượt xem/lưu thực, **không** tạo dữ liệu giả (BR-02).
- **Nghiệm thu:** AC-FR01.

## FR-02 — Thư viện công thức `Must`
- **Mục tiêu:** Duyệt toàn bộ công thức.
- **Mô tả:** Danh sách có phân trang/`load more`; chế độ xem thẻ sách; truy cập tới FR-05/FR-07.
- **Actor:** guest, user.
- **Điều kiện tiên quyết:** Có công thức đã xuất bản.
- **Luồng chính:** Mở thư viện → cuộn/tải thêm → mở công thức.
- **Luồng thay thế:** Sắp xếp theo mới/phổ biến/A–Z.
- **Trường hợp lỗi:** Rỗng → trạng thái rỗng; lỗi phân trang → giữ dữ liệu đã tải.
- **Dữ liệu:** công thức (tóm tắt), taxonomy.
- **Quy tắc:** BR-13; chỉ công khai công thức đã xuất bản.
- **Nghiệm thu:** AC-FR02.

## FR-03 — Chi tiết công thức `Must`
- **Mục tiêu:** Trình bày đầy đủ công thức để nấu.
- **Mô tả:** Các phần: ảnh, giới thiệu, khẩu phần, thời gian (chuẩn bị/nấu/tổng), độ khó, nguyên liệu + định lượng, dụng cụ, từng bước chế biến, mẹo, lỗi thường gặp, bảo quản, dinh dưỡng, dị ứng, nguồn, tác giả/biên tập viên, trạng thái, ngày tạo/cập nhật.
- **Actor:** guest, user.
- **Điều kiện tiên quyết:** Công thức đã xuất bản.
- **Luồng chính:** Mở chi tiết → đọc → tương tác (yêu thích, đổi khẩu phần, chế độ nấu, in).
- **Luồng thay thế:** Ẩn phần không có dữ liệu (vd dinh dưỡng nếu chưa có) — không hiện khối trống.
- **Trường hợp lỗi:** Slug không tồn tại → 404 thân thiện; công thức đã lưu trữ → áp dụng BR-12.
- **Dữ liệu:** bản ghi công thức — xem [Đặc tả dữ liệu công thức](#đặc-tả-dữ-liệu-công-thức-recipe-schema).
- **Quy tắc:** BR-01, BR-03, BR-13; cảnh báo dị ứng theo BR-09.
- **Nghiệm thu:** AC-FR03.

## FR-04 — Hệ thống phân loại `Must`
- **Mục tiêu:** Phân loại món ăn **theo 7 trục độc lập**, mở rộng bằng dữ liệu.
- **Mô tả:** Quản lý values cho: Food type, Cuisine/Origin, Ingredient, Cooking method, Meal type, Dietary preference, Allergen.
- **Actor:** guest/user (xem), editor (đề xuất), admin (quản lý).
- **Điều kiện tiên quyết:** Taxonomy được nạp từ database.
- **Luồng chính:** Tra cứu danh mục theo trục → lọc → xem công thức thuộc giá trị.
- **Luồng thay thế:** Giá trị nhiều cấp (vd Cuisine có vùng miền con).
- **Trường hợp lỗi:** Giá trị chưa có → trạng thái rỗng; trùng tên → chặn thêm.
- **Dữ liệu:** bảng taxonomy riêng cho mỗi trục; quan hệ nhiều-nhiều với công thức.
- **Quy tắc:** **Không gộp** các trục (BR-04); **không hardcode** trong frontend (PC-10/BR-15).
- **Nghiệm thu:** AC-FR04.

## FR-05 — Tìm kiếm `Must`
- **Mục tiêu:** Tìm công thức nhanh, chính xác.
- **Mô tả:** Theo tên (có/không dấu VN), tên EN/tên gốc, nguyên liệu, quốc gia, phương pháp, mô tả; hỗ trợ nhiều điều kiện cùng lúc.
- **Actor:** guest, user.
- **Điều kiện tiên quyết:** Index tìm kiếm (Postgres FTS: `tsvector` + `unaccent` + `pg_trgm`).
- **Luồng chính:** Nhập truy vấn → autocomplete → kết quả xếp hạng theo độ liên quan.
- **Luồng thay thế:** Truy vấn tự nhiên → **chuyển thành điều kiện kiểm tra được** (vd "món chay nhanh dưới 30 phút" → diet=chay AND tổng thời gian ≤30).
- **Trường hợp lỗi:** Không kết quả → trạng thái rỗng + gợi ý nới điều kiện; **không tạo kết quả/công thức không tồn tại** (SR-08).
- **Dữ liệu:** công thức, taxonomy, nguyên liệu, bí danh/đồng nghĩa.
- **Quy tắc:** SR-01, SR-05 (nhiều điều kiện), SR-07 (xếp hạng), SR-08 (không tạo kết quả không tồn tại).
- **Nghiệm thu:** AC-FR05.

## FR-06 — Tìm món từ nguyên liệu sẵn có `Should`
- **Mục tiêu:** "Nấu được gì với nguyên liệu đang có?"
- **Mô tả:** Nhập/chọn nguyên liệu; kết quả chỉ rõ nguyên liệu **còn thiếu** và **thay thế**.
- **Actor:** user, guest (không lưu).
- **Điều kiện tiên quyết:** Dữ liệu nguyên liệu + quan hệ thay thế.
- **Luồng chính:** Chọn nguyên liệu → chạy → xếp hạng công thức theo độ phủ → xem thiếu/thay thế.
- **Luồng thay thế:** Chỉ muốn công thức nấu được **ngay** → lọc "không thiếu nguyên liệu bắt buộc".
- **Trường hợp lỗi:** Nguyên liệu không nhận diện → gợi ý gần đúng; không kết quả → đề xuất bỏ bớt.
- **Dữ liệu:** nguyên liệu, quan hệ thay thế, công thức.
- **Quy tắc:** SR-04, SR-06 (thiếu/thay thế); BR-08 (phân biệt bắt buộc/tùy chọn/thay thế).
- **Nghiệm thu:** AC-FR06.

## FR-07 — Bộ lọc `Must (cơ bản)`
- **Mục tiêu:** Thu hẹp kết quả theo tiêu chí.
- **Mô tả:** Thời gian, độ khó, ngân sách, khẩu phần, chế độ ăn, dị ứng, dụng cụ, độ cay. (MVP: thời gian, độ khó, chế độ ăn, dị ứng, dụng cụ.)
- **Actor:** guest, user.
- **Điều kiện tiên quyết:** Trường dữ liệu tương ứng tồn tại.
- **Luồng chính:** Chọn tiêu chí → áp dụng → cập nhật URL → xem kết quả.
- **Luồng thay thế:** Xóa từng filter / xóa tất cả; kết hợp với tìm kiếm.
- **Trường hợp lỗi:** Tổ hợp rỗng → giải thích lý do; giá trị filter không hợp lệ → bỏ qua.
- **Dữ liệu:** taxonomy (diet, allergen), thuộc tính công thức (time, difficulty, budget, cay), dụng cụ.
- **Quy tắc:** BR-04, BR-09 (dị ứng dựa dữ liệu thực).
- **Nghiệm thu:** AC-FR07.

## FR-08 — Điều chỉnh khẩu phần `Must`
- **Mục tiêu:** Tính lại định lượng theo khẩu phần mong muốn.
- **Mô tả:** Nhập số khẩu phần; hệ thống tính lại định lượng **quy đổi hợp lệ**.
- **Actor:** guest, user.
- **Điều kiện tiên quyết:** Công thức có khẩu phần gốc > 0.
- **Luồng chính:** Đổi số khẩu phần → nhân tỉ lệ → hiển thị định lượng mới.
- **Luồng thay thế:** Nhóm nguyên liệu "không chia tỉ lệ" (vd "1 nhúm gia vị", "để nếm") → giữ nguyên + ghi chú.
- **Trường hợp lỗi:** Khẩu phần ≤ 0 → chặn.
- **Dữ liệu:** khẩu phần gốc, định lượng, đơn vị, cờ quy đổi được.
- **Quy tắc:** BR-06 (không chuyển volume↔mass thiếu mật độ); BR-07 (giữ gốc khi không quy đổi chính xác).
- **Nghiệm thu:** AC-FR08.

## FR-09 — Chế độ nấu từng bước `Must (cơ bản)`
- **Mục tiêu:** Hướng dẫn nấu rảnh tay, dễ đọc.
- **Mô tả:** Chữ lớn, thanh tiến độ, đánh dấu hoàn thành, đồng hồ đếm giờ, tạm dừng/tiếp tục, lưu tiến độ khi đã đăng nhập.
- **Actor:** guest (không lưu), user (lưu tiến độ).
- **Điều kiện tiên quyết:** Công thức có bước chế biến.
- **Luồng chính:** Bắt đầu → duyệt bước → hoàn thành bước → hẹn giờ → kết thúc.
- **Luồng thay thế:** Rời trang giữa chừng → khôi phục tiến độ (user).
- **Trường hợp lỗi:** Không có bước → ẩn nút; mất mạng (đã đăng nhập) → lưu cục bộ + đồng bộ sau.
- **Dữ liệu:** các bước, thời lượng/ nhiệt độ (nếu có), tiến độ người dùng.
- **Quy tắc:** BR-10 (lưu tiến độ khi đăng nhập); BR-05 (không bịa nhiệt độ/thời gian).
- **Nghiệm thu:** AC-FR09.

## FR-10 — Thư viện kiến thức nấu ăn `Should`
- **Mục tiêu:** Tra cứu kiến thức nền tảng.
- **Mô tả:** Bài viết theo chủ đề: sơ chế, chọn nguyên liệu, kỹ thuật chế biến, nước dùng, gia vị, bảo quản, an toàn thực phẩm.
- **Actor:** guest, user.
- **Điều kiện tiên quyết:** Có nội dung bài viết.
- **Luồng chính:** Danh mục chủ đề → đọc bài → liên kết tới công thức liên quan.
- **Luồng thay thế:** Tìm kiếm trong bài viết (giai đoạn sau).
- **Trường hợp lỗi:** Bài chưa có → trạng thái rỗng.
- **Dữ liệu:** bài viết, chủ đề, tác giả, nguồn.
- **Quy tắc:** BR-03 (nguồn); an toàn thực phẩm không thay thế tư vấn chuyên môn (BR-14).
- **Nghiệm thu:** AC-FR10.

## FR-11 — Sổ tay cá nhân `Must (yêu thích) / Should (còn lại)`
- **Mục tiêu:** Lưu và quản lý hoạt động nấu ăn cá nhân.
- **Mô tả:** Yêu thích (Must); bộ sưu tập, lịch sử nấu, ghi chú (Should).
- **Actor:** user.
- **Điều kiện tiên quyết:** Đã đăng nhập.
- **Luồng chính:** Lưu/bỏ lưu → nhóm vào bộ sưu tập → xem lịch sử → thêm ghi chú.
- **Luồng thay thế:** Khách nhấn lưu → mời đăng nhập (không chặn đọc).
- **Trường hợp lỗi:** Công thức đã bị gỡ xuất bản → áp dụng BR-12.
- **Dữ liệu:** yêu thích, bộ sưu tập, lịch sử nấu, ghi chú (gắn user_id).
- **Quy tắc:** BR-12 (hành vi với công thức bị gỡ); BR-10 (lịch sử/tiến độ khi đăng nhập).
- **Nghiệm thu:** AC-FR11.

## FR-12 — Meal Planner `Could`
- **Mục tiêu:** Lập kế hoạch bữa ăn theo ngày/tuần.
- **Mô tả:** Gán công thức vào bữa (sáng/trưa/tối/ăn nhẹ) theo ngày; điều chỉnh số khẩu phần.
- **Actor:** user.
- **Điều kiện tiên quyết:** Đã đăng nhập.
- **Luồng chính:** Chọn ngày/tuần → thêm món → chỉnh khẩu phần → xem tổng quan.
- **Luồng thay thế:** Kéo-thả sắp xếp; nhân bản tuần.
- **Trường hợp lỗi:** Trùng mục → cho phép/gộp; lỗi lưu → giữ cục bộ.
- **Dữ liệu:** kế hoạch bữa ăn, tham chiếu công thức + khẩu phần.
- **Quy tắc:** BR-06/07 khi tổng hợp nguyên liệu.
- **Nghiệm thu:** AC-FR12.

## FR-13 — Shopping List `Should`
- **Mục tiêu:** Danh sách mua sắm từ kế hoạch/công thức.
- **Mô tả:** Tự tổng hợp nguyên liệu, **gộp trùng**, chỉnh số lượng/đơn vị, đánh dấu đã mua.
- **Actor:** user.
- **Điều kiện tiên quyết:** Có nguồn (meal plan hoặc công thức).
- **Luồng chính:** Tạo → gộp → chỉnh → tick đã mua → chia sẻ/in.
- **Luồng thay thế:** Thêm nguyên liệu thủ công.
- **Trường hợp lỗi:** Đơn vị không cùng loại → dòng riêng + ghi chú.
- **Dữ liệu:** nguyên liệu, đơn vị, số lượng, trạng thái mua.
- **Quy tắc:** BR-06/07 (quy đổi/gộp hợp lệ); không tự đổi đơn vị thiếu mật độ.
- **Nghiệm thu:** AC-FR13.

## FR-14 — Dinh dưỡng & dị ứng `Should`
- **Mục tiêu:** Cung cấp thông tin dinh dưỡng & cảnh báo dị ứng.
- **Mô tả:** Hiển thị dinh dưỡng (nếu có dữ liệu) và cảnh báo allergen theo thành phần thực tế.
- **Actor:** guest, user.
- **Điều kiện tiên quyết:** Dữ liệu dinh dưỡng/allergen được quản lý.
- **Luồng chính:** Mở công thức → xem khối dinh dưỡng → xem cảnh báo dị ứng.
- **Luồng thay thế:** Thiếu dữ liệu dinh dưỡng → ẩn khối (không hiện số 0 giả).
- **Trường hợp lỗi:** Không suy đoán allergen ngoài dữ liệu.
- **Dữ liệu:** giá trị dinh dưỡng, allergen gắn nguyên liệu.
- **Quy tắc:** BR-09 (cảnh báo dựa thành phần thực tế); BR-14 (**không tuyên bố chữa bệnh**).
- **Nghiệm thu:** AC-FR14.

## FR-15 — Trợ lý AI nấu ăn `Could`
- **Mục tiêu:** Hỗ trợ tư vấn kỹ thuật/gợi ý món/thay thế nguyên liệu.
- **Mô tả:** Trợ lý hội thoại, trả lời dựa trên dữ liệu công thức/kiến thức có kiểm soát.
- **Actor:** user (có thể guest tùy chính sách — chờ xác nhận).
- **Điều kiện tiên quyết:** Có nguồn dữ liệu kiểm soát; **không bắt buộc cho MVP**.
- **Luồng chính:** Đặt câu hỏi → trả lời kèm tham chiếu công thức/kiến thức thật.
- **Luồng thay thế:** Không đủ căn cứ → **từ chối/đề nghị tra Google chuyên gia**, không bịa.
- **Trường hợp lỗi:** AI lỗi/tắt → **toàn bộ chức năng khác vẫn chạy** (PC-14).
- **Dữ liệu:** công thức, kiến thức, (log hội thoại nếu có).
- **Quy tắc:** BR-05 (**không bịa định lượng/nhiệt độ/an toàn thực phẩm**); PC-13, PC-14.
- **Nghiệm thu:** AC-FR15.

## FR-16 — Tài khoản `Must`
- **Mục tiêu:** Quản lý danh tính & đồng bộ dữ liệu.
- **Mô tả:** Đăng ký, đăng nhập, đăng xuất, hồ sơ, đồng bộ dữ liệu cá nhân.
- **Actor:** guest → user.
- **Điều kiện tiên quyết:** —
- **Luồng chính:** Đăng ký/xác thực → đăng nhập → quản lý hồ sơ → đăng xuất.
- **Luồng thay thế:** Quên mật khẩu; OAuth (giai đoạn sau).
- **Trường hợp lỗi:** Email trùng → báo rõ; sai thông tin → thông báo chung (không lộ chi tiết tài khoản).
- **Dữ liệu:** tài khoản, hồ sơ, phiên.
- **Quy tắc:** BR-11 (không ép đăng nhập cho chức năng công khai); NFR-SEC/PRIV.
- **Nghiệm thu:** AC-FR16.

## FR-17 — CMS/Admin `Must (cơ bản)`
- **Mục tiêu:** Quản trị nội dung & hệ thống.
- **Mô tả:** Quản lý công thức, nguyên liệu, danh mục, quốc gia, hình ảnh, nguồn tham khảo, người dùng, **trạng thái xuất bản**.
- **Actor:** editor, admin.
- **Điều kiện tiên quyết:** Vai trò phù hợp.
- **Luồng chính:** Tạo nháp → validate → duyệt → xuất bản; xem danh sách theo trạng thái.
- **Luồng thay thế:** Lưu trữ/gỡ xuất bản (BR-12); hoàn tác.
- **Trường hợp lỗi:** Thiếu trường bắt buộc → chặn xuất bản (BR-01); thiếu nguồn → chặn (BR-03).
- **Dữ liệu:** công thức, taxonomy, media, người dùng, audit cơ bản.
- **Quy tắc:** BR-01, BR-02, BR-03, BR-12; RBAC.
- **Nghiệm thu:** AC-FR17.

## FR-18 — Bản quyền & nguồn nội dung `Must (trường nguồn)`
- **Mục tiêu:** Tôn trọng bản quyền, minh bạch nguồn.
- **Mô tả:** Trường nguồn tham khảo bắt buộc khi không phải nội dung gốc; ghi chú giấy phép.
- **Actor:** editor, admin.
- **Điều kiện tiên quyết:** —
- **Luồng chính:** Nhập công thức → gắn nguồn/giấy phép → hiển thị nguồn công khai.
- **Luồng thay thế:** Nội dung 100% gốc → đánh dấu "nội dung gốc".
- **Trường hợp lỗi:** Thiếu nguồn khi cần → chặn xuất bản.
- **Dữ liệu:** nguồn, giấy phép, tác giả, ngày.
- **Quy tắc:** BR-03; PC-03.
- **Nghiệm thu:** AC-FR18.

## FR-19 — SEO, chia sẻ, in, đa ngôn ngữ `Must (SEO/print) / Should (i18n EN)`
- **Mục tiêu:** Nội dung được index tốt & chia sẻ dễ.
- **Mô tả:** SEO (metadata, structured data `Recipe`), chia sẻ mạng xã hội (OG), in công thức; i18n VI mặc định + EN mở rộng.
- **Actor:** guest, user.
- **Điều kiện tiên quyết:** —
- **Luồng chính:** Server-render trang công thức với metadata → crawler index; nút chia sẻ; nút in CSS tối ưu.
- **Luồng thay thế:** Đổi ngôn ngữ (khi i18n EN bật).
- **Trường hợp lỗi:** Thiếu ảnh OG → dùng ảnh mặc định.
- **Dữ liệu:** metadata, slug, ảnh, nội dung đa ngôn ngữ.
- **Quy tắc:** slug ổn định; canonical; NFR-SEO.
- **Nghiệm thu:** AC-FR19.

## FR-20 — Bảo mật, sao lưu, phục hồi, giám sát, kiểm thử `Must (cơ bản)`
- **Mục tiêu:** Vận hành an toàn, tin cậy.
- **Mô tả:** Phân quyền, sao lưu định kỳ, phục hồi, giám sát lỗi, kiểm thử.
- **Actor:** admin (vận hành).
- **Điều kiện tiên quyết:** —
- **Luồng chính:** Sao lưu tự động → giám sát lỗi → cảnh báo → phục hồi khi sự cố.
- **Luồng thay thế:** Phục hồi từ bản sao gần nhất (NFR-BACKUP).
- **Trường hợp lỗi:** Sao lưu thất bại → cảnh báo admin.
- **Dữ liệu:** backup, log, metric.
- **Quy tắc:** NFR-SEC/PRIV/BACKUP/TEST; PC-09, PC-12.
- **Nghiệm thu:** AC-FR20.

---

## Đặc tả dữ liệu công thức (Recipe schema)

Dữ liệu của một công thức được chia thành **bắt buộc**, **tùy chọn** và **có điều kiện**.

### A. Trường bắt buộc (để tạo bản nháp hợp lệ)
| Trường | Ghi chú |
| --- | --- |
| Tên tiếng Việt | Bắt buộc |
| Slug | Duy nhất, ổn định (dùng cho URL/SEO) |
| Mô tả ngắn | Tóm tắt 1–2 câu |
| Food type | Ít nhất 1 giá trị (trục taxonomy) |
| Cuisine/Origin | Ít nhất 1 giá trị |
| Số khẩu phần gốc | Số nguyên > 0 |
| Tổng thời gian | Hoặc suy ra từ chuẩn bị + nấu |
| Độ khó | Thang bậc (vd dễ/trung bình/khó) |
| Nguyên liệu | ≥ 1; mỗi dòng: tên + định lượng + đơn vị; đánh dấu **bắt buộc/tùy chọn** |
| Các bước chế biến | ≥ 1 bước, có thứ tự |
| Ảnh đại diện | Bắt buộc để xuất bản (SEO/chia sẻ) |
| Tác giả/biên tập viên | Người chịu trách nhiệm nội dung |
| Trạng thái xuất bản | draft / in_review / published / archived |
| Nguồn tham khảo | Bắt buộc **nếu không phải nội dung gốc** (BR-03) |

### B. Trường tùy chọn (mở rộng)
| Trường | Ghi chú |
| --- | --- |
| Tên tiếng Anh / tên gốc | Hỗ trợ tìm kiếm & i18n |
| Nội dung giới thiệu | Bài viết dẫn dắt |
| Ảnh hướng dẫn | Ảnh theo bước |
| Cooking method / Meal type / Dietary preference / Allergen | Trục taxonomy còn lại |
| Nguyên liệu thay thế | Gắn với từng nguyên liệu |
| Thời gian chuẩn bị / thời gian nấu | Tách riêng nếu có |
| Dụng cụ | Danh sách dụng cụ |
| Mẹo & lỗi thường gặp | Nội dung hướng dẫn |
| Bảo quản | Hướng dẫn bảo quản |
| Dinh dưỡng | Chỉ khi có dữ liệu đáng tin |
| Ngày tạo / ngày cập nhật | Tự sinh |

### C. Trường có điều kiện (chỉ một số loại món)
| Trường | Điều kiện áp dụng |
| --- | --- |
| Nhiệt độ & thời gian ở từng bước | Chỉ khi bước có gia nhiệt/nướng |
| Hẹn giờ ở bước | Chỉ khi bước có thời lượng xác định |
| Dinh dưỡng | Chỉ khi có nguồn dữ liệu đáng tin |
| Quy đổi thể tích ↔ khối lượng | Chỉ khi có **mật độ đáng tin** (BR-06) |
| Cờ "không chia tỉ lệ" cho nguyên liệu | Cho nguyên liệu "để nếm/trang trí" (BR-06) |
| Bảo quản | Chỉ khi có hướng dẫn cụ thể |

> Lưu ý: Đây là **đặc tả trường dữ liệu ở mức sản phẩm**, không phải schema database. Thiết kế DB cụ thể thuộc phase kiến trúc (P02+).

---

## Truy vết 20/20 nhóm chức năng (cross-check P00)

| P00 (#) | Nhóm | FR | Có trong đặc tả |
| :-: | --- | :-: | :-: |
| 1 | Trang chủ | FR-01 | ✔ |
| 2 | Thư viện công thức | FR-02 | ✔ |
| 3 | Trang chi tiết công thức | FR-03 | ✔ |
| 4 | Hệ thống phân loại | FR-04 | ✔ |
| 5 | Tìm kiếm | FR-05 | ✔ |
| 6 | Tìm món từ nguyên liệu | FR-06 | ✔ |
| 7 | Bộ lọc | FR-07 | ✔ |
| 8 | Điều chỉnh khẩu phần | FR-08 | ✔ |
| 9 | Chế độ nấu từng bước | FR-09 | ✔ |
| 10 | Thư viện kiến thức | FR-10 | ✔ |
| 11 | Sổ tay cá nhân | FR-11 | ✔ |
| 12 | Meal Planner | FR-12 | ✔ |
| 13 | Shopping List | FR-13 | ✔ |
| 14 | Dinh dưỡng & dị ứng | FR-14 | ✔ |
| 15 | Trợ lý AI | FR-15 | ✔ |
| 16 | Tài khoản | FR-16 | ✔ |
| 17 | CMS/Admin | FR-17 | ✔ |
| 18 | Bản quyền & nguồn | FR-18 | ✔ |
| 19 | SEO/chia sẻ/in/i18n | FR-19 | ✔ |
| 20 | Bảo mật/sao lưu/giám sát/kiểm thử | FR-20 | ✔ |

Kết quả: **20/20 nhóm chức năng đã được đặc tả, không bỏ sót.**
