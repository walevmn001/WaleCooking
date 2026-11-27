# P01 — PRD: WALE COOKING

> Product Requirements Document. Biến yêu cầu tổng quan từ P00 thành đặc tả có thể triển khai.
> Trạng thái: **Đề xuất cho P01 — chờ phê duyệt.** Không tự chuyển sang P02.
> Liên quan: [PRODUCT_CONSTITUTION.md](./PRODUCT_CONSTITUTION.md) · [USER_PERSONAS.md](./USER_PERSONAS.md) · [USER_JOURNEYS.md](./USER_JOURNEYS.md) · [FUNCTIONAL_REQUIREMENTS.md](./FUNCTIONAL_REQUIREMENTS.md) · [BUSINESS_RULES.md](./BUSINESS_RULES.md) · [NON_FUNCTIONAL_REQUIREMENTS.md](./NON_FUNCTIONAL_REQUIREMENTS.md) · [MVP_SCOPE.md](./MVP_SCOPE.md) · [ACCEPTANCE_CRITERIA.md](./ACCEPTANCE_CRITERIA.md)

## 1. Tóm tắt sản phẩm

| Trường | Giá trị |
| --- | --- |
| Sản phẩm | **WALE COOKING** |
| Loại | Website hướng dẫn nấu ăn |
| Ngôn ngữ mặc định | Tiếng Việt (sẵn sàng i18n EN) |
| Mục đích | Cá nhân / phi thương mại |
| Kiến trúc | Next.js + Prisma + Neon PostgreSQL + Auth.js + Cloudflare R2 |
| Phong cách | WALE COOKING — Pastel Mint |

## 2. Vấn đề cần giải quyết

Người nấu ăn tại nhà (đặc biệt người mới) gặp khó khăn khi:

1. Công thức rải rác, không nhất quán về định lượng và định dạng.
2. Không biết nấu gì từ nguyên liệu đang có sẵn trong bếp.
3. Thiếu hướng dẫn từng bước rõ ràng khi đang nấu (tay bẩn, khó đọc).
4. Không có công cụ lập kế hoạch bữa ăn và danh sách mua sắm liền mạch.
5. Thông tin dị ứng và dinh dưỡng không đáng tin hoặc thiếu nguồn.

**Giá trị cốt lõi WALE COOKING đem lại:** một "cuốn sách nấu ăn số" chính xác, dễ đọc, có nguồn, hỗ trợ từ khám phá → nấu → lên kế hoạch → mua sắm.

## 3. Mục tiêu & chỉ số thành công (đo lường được)

| # | Mục tiêu | Chỉ số đo | Ngưỡng MVP |
| --- | --- | --- | --- |
| G1 | Khám phá công thức | Tỉ lệ phiên có ≥1 lượt xem chi tiết công thức | ≥ 60% |
| G2 | Tìm kiếm hiệu quả | Tỉ lệ tìm kiếm có kết quả (không rỗng) | ≥ 85% với truy vấn hợp lệ phổ biến |
| G3 | Đọc công thức đầy đủ | Tỉ lệ phiên xem chi tiết có thao tác (lưu/điều chỉnh khẩu phần/chế độ nấu) | ≥ 40% |
| G4 | Trải nghiệm nấu | Tỉ lệ bắt đầu chế độ nấu và đi tới bước cuối | ≥ 50% |
| G5 | Hiệu năng | Core Web Vitals trên p75 mobile | LCP < 2.5s, CLS < 0.1, INP < 200ms |
| G6 | Nội dung chất lượng | Tỉ lệ công thức xuất bản đủ dữ liệu bắt buộc | 100% |

> Các chỉ số là **mục tiêu đề xuất**, cần phê duyệt; không tuyên bố đạt được khi chưa đo.

## 4. Người dùng mục tiêu (tóm tắt)

Chi tiết: [USER_PERSONAS.md](./USER_PERSONAS.md)

| Mã | Nhóm | Vai trò hệ thống |
| --- | --- | --- |
| P1 | Khách chưa đăng nhập | `guest` |
| P2 | Người dùng đã đăng ký | `user` |
| P3 | Người dùng thường xuyên nấu ăn | `user` (hành vi nâng cao, không phải role riêng) |
| P4 | Biên tập viên nội dung | `editor` |
| P5 | Quản trị viên | `admin` |

**Ma trận quyền (RBAC) tóm tắt:**

| Quyền | guest | user | editor | admin |
| --- | :-: | :-: | :-: | :-: |
| Xem/tìm/lọc công thức đã xuất bản | ✔ | ✔ | ✔ | ✔ |
| Điều chỉnh khẩu phần / chế độ nấu (không lưu) | ✔ | ✔ | ✔ | ✔ |
| Lưu yêu thích / sổ tay / meal plan / shopping list | — | ✔ | ✔ | ✔ |
| Tạo & sửa công thức (bản nháp) | — | — | ✔ | ✔ |
| Duyệt & xuất bản công thức | — | — | ✔ | ✔ |
| Quản lý taxonomy, người dùng, cấu hình hệ thống | — | — | — | ✔ |

## 5. Phạm vi tổng thể

Đủ **20 nhóm chức năng** đã chốt tại P00. Đặc tả chi tiết: [FUNCTIONAL_REQUIREMENTS.md](./FUNCTIONAL_REQUIREMENTS.md).

| Mã | Nhóm chức năng |
| --- | --- |
| FR-01 | Trang chủ |
| FR-02 | Thư viện công thức |
| FR-03 | Chi tiết công thức |
| FR-04 | Hệ thống phân loại |
| FR-05 | Tìm kiếm |
| FR-06 | Tìm món từ nguyên liệu sẵn có |
| FR-07 | Bộ lọc |
| FR-08 | Điều chỉnh khẩu phần |
| FR-09 | Chế độ nấu từng bước |
| FR-10 | Thư viện kiến thức nấu ăn |
| FR-11 | Sổ tay cá nhân |
| FR-12 | Meal Planner |
| FR-13 | Shopping List |
| FR-14 | Dinh dưỡng & dị ứng |
| FR-15 | Trợ lý AI nấu ăn |
| FR-16 | Tài khoản |
| FR-17 | CMS/Admin |
| FR-18 | Bản quyền & nguồn nội dung |
| FR-19 | SEO, chia sẻ, in, đa ngôn ngữ |
| FR-20 | Bảo mật, sao lưu, phục hồi, giám sát, kiểm thử |

## 6. Phân kỳ (tóm tắt)

Chi tiết & lý do: [MVP_SCOPE.md](./MVP_SCOPE.md)

- **MVP (bắt buộc):** khám phá, tìm kiếm & lọc cơ bản, xem công thức đầy đủ, điều chỉnh khẩu phần, chế độ nấu cơ bản, tài khoản, admin cơ bản, SEO & responsive cơ bản, hạ tầng an toàn tối thiểu.
- **Giai đoạn nâng cấp:** tìm món từ nguyên liệu, sổ tay đầy đủ, shopping list, dinh dưỡng/dị ứng, thư viện kiến thức, i18n EN đầy đủ.
- **Tính năng nâng cao:** Meal Planner, Trợ lý AI, ranking tìm kiếm nâng cao (search engine chuyên dụng), PWA/offline.

## 7. Rủi ro sản phẩm chính

| # | Rủi ro | Ảnh hưởng | Giảm thiểu |
| --- | --- | --- | --- |
| R1 | Nội dung công thức không đủ/không chính xác | Cao | Quy trình biên tập + nguồn bắt buộc (BR-03, FR-18) |
| R2 | Bịa định lượng/nhiệt độ bởi AI | Cao | Honest AI (BR-05, PC-13) — AI không tự sinh số liệu |
| R3 | Vượt hạn mức gói miễn phí | Trung bình | Thiết kế tiết kiệm, ISR/CDN; theo dõi hạn mức |
| R4 | Lock-in nhà cung cấp | Trung bình | Chuẩn mở: Postgres, S3 API, Auth chuẩn (PC-11) |
| R5 | Lạm dụng/thiếu kiểm soát nội dung do người dùng | Trung bình | RBAC, CMS duyệt xuất bản (FR-17) |

## 8. Tiêu chí hoàn thành P01

- [x] Đủ 9 tài liệu P01 theo yêu cầu.
- [x] Đủ 20 nhóm chức năng, mỗi nhóm có mã + acceptance criteria.
- [x] Có Product Constitution, personas, journeys, business rules, NFR, MVP scope.
- [x] Cập nhật CURRENT_STATUS / PHASE_PROGRESS / DECISIONS / BLOCKERS.
- [ ] **Phê duyệt của người dùng** trước khi sang P02. ← đang chờ
