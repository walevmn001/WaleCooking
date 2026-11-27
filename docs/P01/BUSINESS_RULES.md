# P01 — BUSINESS RULES: WALE COOKING

> Quy tắc nghiệp vụ bắt buộc. Mọi FR phải tuân thủ. Mã `BR-xx` được tham chiếu từ [FUNCTIONAL_REQUIREMENTS.md](./FUNCTIONAL_REQUIREMENTS.md).
> Liên quan: [PRODUCT_CONSTITUTION.md](./PRODUCT_CONSTITUTION.md), [ACCEPTANCE_CRITERIA.md](./ACCEPTANCE_CRITERIA.md).

## A. Quy tắc nội dung & xuất bản

| Mã | Quy tắc | Kiểm chứng |
| --- | --- | --- |
| **BR-01** | **Không xuất bản** công thức thiếu trường bắt buộc (mục A ở [Recipe schema](./FUNCTIONAL_REQUIREMENTS.md#a-trường-bắt-buộc-để-tạo-bản-nháp-hợp-lệ)). Hệ thống chặn ở trạng thái xuất bản và chỉ rõ trường thiếu. | AC-FR17 |
| **BR-02** | **Không tạo công thức giả** để lấp đầy thư viện. Nội dung phải có thật, có người chịu trách nhiệm. | AC-FR01, AC-FR17 |
| **BR-03** | Công thức **phải có nguồn tham khảo** khi không phải nội dung gốc; **không khẳng định "đã thử nghiệm"** nếu chưa thử nghiệm thực tế. Tôn trọng bản quyền/giấy phép. | AC-FR18 |
| **BR-13** | Chỉ **công khai công thức đã xuất bản** (`published`). Bản `draft`/`in_review`/`archived` không xuất hiện cho người dùng thường. | AC-FR01, AC-FR02 |

## B. Quy tắc dữ liệu & độ chính xác

| Mã | Quy tắc | Kiểm chứng |
| --- | --- | --- |
| **BR-04** | **7 trục phân loại độc lập** (Food type, Cuisine/Origin, Ingredient, Cooking method, Meal type, Dietary preference, Allergen) — **không gộp** thành một danh mục chung. | AC-FR04 |
| **BR-05** | **Không tự bịa** nhiệt độ, thời gian hoặc định lượng. Khi thiếu dữ liệu, để trống/ghi chú, không suy diễn. Áp dụng cả cho AI. | AC-FR09, AC-FR15 |
| **BR-06** | Điều chỉnh khẩu phần **chỉ tính lại các nguyên liệu quy đổi hợp lệ**. **Không chuyển đổi thể tích ↔ khối lượng** nếu thiếu dữ liệu mật độ đáng tin. Nguyên liệu đánh dấu "không chia tỉ lệ" (vd "để nếm") **giữ nguyên**. | AC-FR08 |
| **BR-07** | **Giữ đơn vị gốc** khi không thể quy đổi chính xác; hiển thị kèm ghi chú thay vì làm tròn gây sai lệch. | AC-FR08, AC-FR13 |
| **BR-08** | Phân biệt rõ **nguyên liệu bắt buộc / tùy chọn / thay thế**. Nguyên liệu thay thế phải có căn cứ quan hệ, không tự gợi ý tùy tiện. | AC-FR06 |
| **BR-09** | **Cảnh báo dị ứng** phải dựa trên **thành phần thực tế** và dữ liệu được quản lý (trục Allergen + quan hệ với nguyên liệu). Không hiển thị cảnh báo ngoài dữ liệu. | AC-FR14 |

## C. Quy tắc người dùng & phiên

| Mã | Quy tắc | Kiểm chứng |
| --- | --- | --- |
| **BR-10** | **Tiến độ nấu** (và lịch sử nấu) phải được **lưu khi người dùng đã đăng nhập**; đồng bộ qua thiết bị. | AC-FR09, AC-FR11 |
| **BR-11** | **Người chưa đăng nhập** có thể dùng các chức năng công khai (xem, tìm, lọc, điều chỉnh khẩu phần, chế độ nấu không lưu) **mà không bị ép tạo tài khoản**. Chỉ chức năng lưu cá nhân mới yêu cầu đăng nhập. | AC-FR16 |

## D. Quy tắc vòng đời nội dung

| Mã | Quy tắc | Kiểm chứng |
| --- | --- | --- |
| **BR-12** | Công thức bị **lưu trữ (archive) hoặc gỡ xuất bản** phải có hành vi rõ ràng: (a) liên kết cũ (URL/slug) chuyển tới trang thông báo phù hợp hoặc tới công thức thay thế nếu có; (b) công thức **đã lưu** của người dùng được giữ với nhãn "không còn xuất bản", không tự xóa dữ liệu người dùng. | AC-FR11, AC-FR17 |
| **BR-14** | Thông tin dinh dưỡng/sức khỏe **không đưa ra tuyên bố chữa bệnh**; chỉ là thông tin tham khảo. | AC-FR14 |
| **BR-15** | Danh mục phân loại **mở rộng bằng dữ liệu**, **không hardcode** toàn bộ trong frontend; thêm giá trị qua CMS/Admin. | AC-FR04 |

---

## Quy tắc tìm kiếm & phân loại (`SR-xx`)

| Mã | Quy tắc |
| --- | --- |
| **SR-01** | Tìm kiếm **có dấu và không dấu** tiếng Việt đều cho kết quả đúng (chuẩn hóa `unaccent`). |
| **SR-02** | Khớp cả **tên tiếng Anh và tên gốc** ngoài tên tiếng Việt. |
| **SR-03** | Hỗ trợ **bí danh/từ đồng nghĩa** (vd "cà chua" ↔ "tomato", "hành tây" ↔ "hành củ"). |
| **SR-04** | Tìm theo **nguyên liệu** (không chỉ tên món). |
| **SR-05** | Hỗ trợ **nhiều điều kiện cùng lúc**; ngữ nghĩa AND/OR phải xác định rõ và phản ánh được trong URL. |
| **SR-06** | Với tìm-theo-nguyên-liệu: **hiển thị nguyên liệu còn thiếu** và **nguyên liệu thay thế**. |
| **SR-07** | **Quy tắc ưu tiên & sắp xếp:** (1) khớp chính xác tên > khớp một phần; (2) độ phủ nguyên liệu (cao hơn lên trước); (3) mức phổ biến (lượt xem/lưu thực); (4) mới cập nhật. Không dùng số liệu giả để "đẩy" kết quả. |
| **SR-08** | **Trạng thái không có kết quả:** hiển thị thông báo + gợi ý nới điều kiện. **Không tạo kết quả hoặc công thức không tồn tại** (liên hệ BR-02). |

> **Tìm kiếm ngôn ngữ tự nhiên** phải được **quy đổi thành điều kiện có thể kiểm tra** (trục phân loại + thuộc tính số). Ví dụ: "món chay nhanh dưới 30 phút" → `dietary = chay` AND `total_time ≤ 30`. Không trả về kết quả nằm ngoài điều kiện.

## Tóm tắt ánh xạ BR ↔ FR

| BR | FR liên quan |
| --- | --- |
| BR-01 | FR-03, FR-17 |
| BR-02 | FR-01, FR-17 |
| BR-03 | FR-03, FR-10, FR-17, FR-18 |
| BR-04 | FR-04, FR-07 |
| BR-05 | FR-08, FR-09, FR-15 |
| BR-06 | FR-08, FR-12, FR-13 |
| BR-07 | FR-08, FR-13 |
| BR-08 | FR-06 |
| BR-09 | FR-03, FR-07, FR-14 |
| BR-10 | FR-09, FR-11 |
| BR-11 | FR-11, FR-16 |
| BR-12 | FR-11, FR-17 |
| BR-13 | FR-01, FR-02, FR-03 |
| BR-14 | FR-10, FR-14 |
| BR-15 | FR-04 |
| SR-01..08 | FR-05, FR-06, FR-07 |
