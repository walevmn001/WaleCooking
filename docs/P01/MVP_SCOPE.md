# P01 — MVP SCOPE & PHÂN KỲ SẢN PHẨM: WALE COOKING

> Phân loại **toàn bộ 20 nhóm chức năng** thành: **MVP bắt buộc · Giai đoạn nâng cấp · Tính năng nâng cao**.
> **Không loại bỏ chức năng dài hạn** khỏi kế hoạch tổng thể — mọi FR-01..FR-20 đều có chỗ trong phân kỳ.
> Ưu tiên MoSCoW chi tiết theo từng FR: [FUNCTIONAL_REQUIREMENTS.md](./FUNCTIONAL_REQUIREMENTS.md). Liên quan: [PRD.md](./PRD.md), [ACCEPTANCE_CRITERIA.md](./ACCEPTANCE_CRITERIA.md).

## 1. Định nghĩa ba nhóm

| Nhóm | Ý nghĩa | Điều kiện vào nhóm |
| --- | --- | --- |
| **MVP bắt buộc** | Không có thì sản phẩm **không dùng được** cho mục tiêu cốt lõi (khám phá → xem → nấu). | Cần cho luồng nấu cơ bản + điều hướng nội dung + hạ tầng an toàn tối thiểu. |
| **Giai đoạn nâng cấp** | Tăng giá trị rõ rệt nhưng **không chặn** trải nghiệm nấu cơ bản. | Có thể trì hoãn mà MVP vẫn "đứng vững". |
| **Tính năng nâng cao** | Giá trị cao/độ phức tạp cao; phụ thuộc dữ liệu/dịch vụ hoặc có rủi ro (AI, offline). | Yêu cầu nguồn lực/dữ liệu chưa sẵn sàng ở MVP. |

> Lưu ý: "MVP" ở đây là **phạm vi tối thiểu để phát hành dùng được**, không phải bản demo. Nguyên tắc: **ưu tiên độ chính xác (PC-02) hơn số lượng tính năng.**

## 2. MVP phải đủ để người dùng làm được gì

Theo yêu cầu P01, MVP tối thiểu phải cho phép:

1. **Khám phá công thức** — vào trang chủ, duyệt thư viện, mở chi tiết. (FR-01, FR-02, FR-03)
2. **Tìm kiếm và lọc** — theo tên/nguyên liệu; lọc theo thời gian, độ khó, chế độ ăn. (FR-05, FR-07)
3. **Xem công thức đầy đủ** — nguyên liệu, định lượng, bước, dụng cụ, thời gian, độ khó, nguồn. (FR-03, FR-18)
4. **Điều chỉnh khẩu phần** — tính lại định lượng quy đổi hợp lệ. (FR-08)
5. **Chế độ nấu cơ bản** — hướng dẫn từng bước, chữ lớn, đếm giờ. (FR-09)
6. **Trải nghiệm responsive và SEO cơ bản.** (FR-19, NFR-RESP, NFR-SEO)

Đối chiếu: **cả 6 năng lực trên đều nằm trong nhóm MVP bắt buộc** ở mục 3.

## 3. Phân loại 20 nhóm chức năng

| FR | Nhóm chức năng | Phân kỳ | Mức MVP (MoSCoW) |
| --- | --- | --- | --- |
| FR-01 | Trang chủ | **MVP bắt buộc** | Must |
| FR-02 | Thư viện công thức | **MVP bắt buộc** | Must |
| FR-03 | Chi tiết công thức | **MVP bắt buộc** | Must |
| FR-04 | Hệ thống phân loại (7 trục) | **MVP bắt buộc** | Must |
| FR-05 | Tìm kiếm | **MVP bắt buộc** | Must |
| FR-06 | Tìm món từ nguyên liệu sẵn có | Giai đoạn nâng cấp | Should |
| FR-07 | Bộ lọc | **MVP bắt buộc** (cơ bản) | Must (cơ bản) |
| FR-08 | Điều chỉnh khẩu phần | **MVP bắt buộc** | Must |
| FR-09 | Chế độ nấu từng bước | **MVP bắt buộc** (cơ bản) | Must (cơ bản) |
| FR-10 | Thư viện kiến thức nấu ăn | Giai đoạn nâng cấp | Should |
| FR-11 | Sổ tay cá nhân | **MVP bắt buộc** (chỉ *Yêu thích*) | Must (yêu thích) / Should (còn lại) |
| FR-12 | Meal Planner | Tính năng nâng cao | Could |
| FR-13 | Shopping List | Giai đoạn nâng cấp | Should |
| FR-14 | Dinh dưỡng & dị ứng | Giai đoạn nâng cấp | Should |
| FR-15 | Trợ lý AI nấu ăn | Tính năng nâng cao | Could |
| FR-16 | Tài khoản | **MVP bắt buộc** | Must |
| FR-17 | CMS/Admin | **MVP bắt buộc** (cơ bản) | Must (cơ bản) |
| FR-18 | Bản quyền & nguồn nội dung | **MVP bắt buộc** (trường nguồn) | Must (trường nguồn) |
| FR-19 | SEO, chia sẻ, in, đa ngôn ngữ | **MVP bắt buộc** (SEO/print) | Must (SEO/print) / Should (i18n EN) |
| FR-20 | Bảo mật, sao lưu, phục hồi, giám sát, kiểm thử | **MVP bắt buộc** (tối thiểu) | Must (cơ bản) |

## 4. MVP bắt buộc — chi tiết & lý do

| FR | Cách hiểu trong MVP | Vì sao vào MVP |
| --- | --- | --- |
| **FR-01** Trang chủ | Các khối nổi bật/mới/phổ biến/danh mục; chỉ hiện công thức `published`. | Là điểm vào mặc định; không có thì không "khám phá được". |
| **FR-02** Thư viện | Danh sách có phân trang/`load more`. | Kênh duyệt nội dung chính. |
| **FR-03** Chi tiết công thức | Đầy đủ trường có dữ liệu; ẩn khối rỗng. | Trái tim sản phẩm — nơi diễn ra việc nấu. |
| **FR-04** Phân loại | Nạp taxonomy từ DB cho 7 trục; dùng cho lọc & điều hướng. | Mọi tìm/lọc/điều hướng phụ thuộc taxonomy; **không hardcode** (BR-15). |
| **FR-05** Tìm kiếm | Theo tên (có/không dấu), tên EN/tên gốc, nguyên liệu; xếp hạng theo SR-07. | Trục khám phá thứ hai; đo bằng G2. |
| **FR-07** Bộ lọc (cơ bản) | Thời gian, độ khó, chế độ ăn, dị ứng, dụng cụ. | Yêu cầu MVP nêu rõ; nâng cao (ngân sách, độ cay, khẩu phần) để sau. |
| **FR-08** Điều chỉnh khẩu phần | Nhân tỉ lệ cho nguyên liệu quy đổi được; giữ gốc nếu không (BR-06/07). | Năng lực MVP bắt buộc; là điểm khác biệt thực dụng. |
| **FR-09** Chế độ nấu (cơ bản) | Từng bước, chữ lớn, tiến độ, đếm giờ; lưu tiến độ khi đăng nhập (BR-10). | Cốt lõi trải nghiệm "nấu ăn thật". |
| **FR-11** Sổ tay (Yêu thích) | Chỉ **lưu/bỏ lưu yêu thích**; bộ sưu tập/lịch sử/ghi chú ở giai đoạn nâng cấp. | Yêu thích là tối thiểu để người dùng "quay lại"; phần còn lại trì hoãn được. |
| **FR-16** Tài khoản | Đăng ký/đăng nhập/đăng xuất/hồ sơ; không ép đăng nhập cho chức năng công khai (BR-11). | Điều kiện để lưu dữ liệu cá nhân. |
| **FR-17** CMS/Admin (cơ bản) | CRUD công thức + taxonomy + trạng thái xuất bản + validate (BR-01/02/03). | Không có thì không có nội dung đúng chuẩn. |
| **FR-18** Nguồn nội dung | Trường nguồn **bắt buộc khi không phải nội dung gốc**; hiển thị công khai. | Ràng buộc Content integrity (PC-03); gắn với BR-03. |
| **FR-19** SEO/print | SSR + metadata + `schema.org Recipe` + sitemap; nút in. i18n EN ở giai đoạn nâng cấp. | SEO là mục tiêu P00; chỉ cần VI ở MVP. |
| **FR-20** Hạ tầng an toàn (cơ bản) | RBAC, sao lưu định kỳ, phục hồi, kiểm thử module lõi. | Không thể phát hành an toàn nếu thiếu (PC-09/12). |

## 5. Giai đoạn nâng cấp — chi tiết & lý do

| FR | Nội dung | Vì sao **chưa** vào MVP |
| --- | --- | --- |
| **FR-06** Tìm theo nguyên liệu | Nhập nguyên liệu → gợi ý món + thiếu/thay thế (BR-08). | Cần dữ liệu quan hệ nguyên liệu/bí danh/thay thế đủ dày — nên xây sau khi có nền taxonomy + công thức. |
| **FR-10** Thư viện kiến thức | Bài viết chủ đề + liên kết công thức. | Content-heavy; cần nguồn biên tập, không chặn luồng nấu. |
| **FR-11 (mở rộng)** | Bộ sưu tập, lịch sử nấu, ghi chú/đánh giá. | Bổ trợ giá trị; phụ thuộc tài khoản + lịch sử (có thể bật sau FR-09). |
| **FR-13** Shopping List | Tổng hợp + gộp nguyên liệu (BR-06/07). | Giá trị cao nhưng phụ thuộc quy đổi đơn vị hoàn thiện. |
| **FR-14** Dinh dưỡng & dị ứng | Dinh dưỡng (khi có dữ liệu) + cảnh báo allergen (BR-09). | Cần dữ liệu dinh dưỡng/allergen đáng tin — **không được bịa** (BR-05). |
| **FR-19 (i18n EN)** | Bản tiếng Anh đầy đủ. | Kiến trúc sẵn sàng i18n từ đầu, nhưng khối lượng dịch để sau MVP. |

## 6. Tính năng nâng cao — chi tiết & lý do

| FR | Nội dung | Vì sao nâng cao |
| --- | --- | --- |
| **FR-12** Meal Planner | Kế hoạch bữa ăn ngày/tuần. | Độ phức tạp UI/logic cao; chưa cần cho luồng nấu cơ bản; cần lịch sử/tài khoản ổn định trước. |
| **FR-15** Trợ lý AI | Tư vấn/gợi ý/thay thế nguyên liệu. | **Rủi ro Honest AI** (BR-05/PC-13); phụ thuộc dịch vụ ngoài & ngân sách; MVP phải chạy tốt **không cần AI** (PC-14). |
| **Nâng cao chung** | Ranking tìm kiếm nâng cao (search engine chuyên dụng), PWA/offline. | Cần khi quy mô/ca dùng thực tế đòi hỏi; không cần ở MVP (Postgres FTS đủ). |

## 7. Tiêu chí "MVP hoàn thành" (Definition of Done cho MVP)

MVP được coi là đạt khi **đồng thời**:

1. 6 năng lực ở mục 2 hoạt động end-to-end trên dữ liệu thật (không dữ liệu giả — BR-02).
2. Toàn bộ **AC của các FR nhóm MVP** trong [ACCEPTANCE_CRITERIA.md](./ACCEPTANCE_CRITERIA.md) đạt.
3. 100% công thức `published` đủ trường bắt buộc (G6) và có nguồn khi cần (BR-03).
4. Vận hành trong hạn mức gói miễn phí (NFR-FREE), p75 mobile đạt ngưỡng Core Web Vitals mục tiêu (NFR-PERF) — **đo thực tế**, không tuyên bố suông.
5. Có kiểm thử cho các module lõi (NFR-TEST) và sao lưu/phục hồi hoạt động (NFR-BACKUP).

## 8. Nguyên tắc phân kỳ (không loại bỏ chức năng)

- **Không FR nào bị bỏ khỏi kế hoạch tổng thể** — chỉ dời thứ tự triển khai kèm lý do (mục 4–6).
- Bất kỳ FR nào chuyển nhóm phải ghi lại quyết định tại [DECISIONS.md](../../DECISIONS.md).
- Chức năng thuộc nhóm sau **không được làm suy giảm** độ chính xác/dữ liệu của nhóm MVP.
