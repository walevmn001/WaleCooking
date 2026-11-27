# P01 — PRODUCT CONSTITUTION: WALE COOKING

> Bộ nguyên tắc **bất biến** của dự án. Mọi phase sau phải tuân thủ.
> Nếu cần ngoại lệ, phải ghi lý do và **được phê duyệt** (ghi vào [DECISIONS.md](../../DECISIONS.md)).
> Liên quan: [PRD.md](./PRD.md).

Mỗi nguyên tắc gồm: **Tuyên bố** — **Hệ quả** — **Cách kiểm chứng**.

---

## PC-01. Product-first
**Tuyên bố:** Ưu tiên trải nghiệm nấu ăn thực tế; tính năng phải phục vụ việc nấu, không phải để trưng diễn.
**Hệ quả:** Không thêm tính năng chỉ vì "trông hay". Mỗi tính năng trả lời câu hỏi "giúp người nấu điều gì?".
**Kiểm chứng:** Mỗi FR truy vết được tới một mục tiêu/mục đích nấu ăn trong [PRD.md](./PRD.md#2-vấn-đề-cần-giải-quyết).

## PC-02. Accuracy-first
**Tuyên bố:** Chính xác về nguyên liệu, định lượng và hướng dẫn.
**Hệ quả:** Không tự suy diễn số liệu. Khi không đủ dữ liệu, giữ nguyên đơn vị gốc/thông tin gốc.
**Kiểm chứng:** BR-05, BR-06, BR-07; acceptance criteria của FR-08.

## PC-03. Content integrity
**Tuyên bố:** Nội dung có nguồn, tôn trọng bản quyền.
**Hệ quả:** Công thức xuất bản phải có trường nguồn khi không phải nội dung gốc; tôn trọng giấy phép.
**Kiểm chứng:** FR-18; BR-03; điều kiện xuất bản ở FR-17.

## PC-04. User-friendly
**Tuyên bố:** Người mới học nấu cũng có thể sử dụng.
**Hệ quả:** Thuật ngữ có giải thích; luồng chính tối đa 3 bước tới nội dung.
**Kiểm chứng:** User journeys có luồng cho P1/P2; kiểm thử khả dụng.

## PC-05. Mobile-first & responsive
**Tuyên bố:** Thiết kế mobile-first, responsive cho điện thoại/tablet/desktop.
**Hệ quả:** Breakpoint chuẩn; chế độ nấu ưu tiên màn hình nhỏ.
**Kiểm chứng:** NFR-RESP; acceptance criteria responsive.

## PC-06. Design consistency
**Tuyên bố:** Mọi trang tuân thủ **WALE COOKING — Pastel Mint**.
**Hệ quả:** Chỉ dùng design token đã chốt (màu, typography Baloo 2/Nunito, card bo góc 18–24px).
**Kiểm chứng:** [02-dinh-huong-giao-dien.md](../P00/02-dinh-huong-giao-dien.md); kiểm tra token.

## PC-07. Accessibility
**Tuyên bố:** Hỗ trợ bàn phím, độ tương phản và trình đọc màn hình.
**Hệ quả:** Mục tiêu WCAG 2.2 AA cho luồng chính; `prefers-reduced-motion`.
**Kiểm chứng:** NFR-A11Y; acceptance criteria a11y.

## PC-08. Performance
**Tuyên bố:** Tránh hiệu ứng/tính năng làm chậm trải nghiệm.
**Hệ quả:** Hoạt ảnh GPU-friendly, lazy-load, ISR/CDN.
**Kiểm chứng:** NFR-PERF (Core Web Vitals).

## PC-09. Privacy & security
**Tuyên bố:** Bảo vệ dữ liệu cá nhân.
**Hệ quả:** Thu thập tối thiểu; phân quyền rõ; không lộ dữ liệu người dùng.
**Kiểm chứng:** NFR-SEC/PRIV; OWASP ASVS mức phù hợp.

## PC-10. Maintainability
**Tuyên bố:** Kiến trúc module hóa, dễ bảo trì.
**Hệ quả:** Tách module theo miền (recipes, taxonomy, accounts…); type rõ ràng.
**Kiểm chứng:** Cấu trúc module; review kiến trúc ở P02.

## PC-11. Portability
**Tuyên bố:** Hạn chế lock-in nhà cung cấp.
**Hệ quả:** Dùng chuẩn mở (Postgres, S3 API, Auth chuẩn); tránh API độc quyền cho phần lõi.
**Kiểm chứng:** [03-de-xuat-cong-nghe.md](../P00/03-de-xuat-cong-nghe.md); không dùng tính năng độc quyền cho lõi nghiệp vụ.

## PC-12. Testability
**Tuyên bố:** Chức năng quan trọng phải có kiểm thử.
**Hệ quả:** Các FR mức `Must` phải có test tự động cho luồng chính + quy tắc nghiệp vụ.
**Kiểm chứng:** NFR-TEST; [ACCEPTANCE_CRITERIA.md](./ACCEPTANCE_CRITERIA.md).

## PC-13. Honest AI
**Tuyên bố:** AI không được bịa dữ liệu hoặc đưa hướng dẫn nguy hiểm.
**Hệ quả:** Trợ lý AI chỉ trả lời dựa trên dữ liệu công thức/kiến thức có kiểm soát; từ chối khi thiếu căn cứ.
**Kiểm chứng:** BR-05; FR-15 acceptance criteria.

## PC-14. Progressive enhancement
**Tuyên bố:** Chức năng cơ bản không phụ thuộc AI.
**Hệ quả:** Toàn bộ luồng MVP hoạt động khi AI **tắt** hoặc lỗi.
**Kiểm chứng:** FR-15 là tùy chọn; test "AI disabled".

---

## Bảng tuân thủ nhanh (dùng cho các phase sau)

| Nguyên tắc | FR/NFR liên quan | Phase kiểm tra |
| --- | --- | --- |
| PC-02 Accuracy | FR-08, BR-05/06/07 | P02+ |
| PC-03 Content integrity | FR-18, BR-03 | P02+ |
| PC-07 Accessibility | NFR-A11Y | Mọi phase UI |
| PC-08 Performance | NFR-PERF | Mọi phase |
| PC-12 Testability | NFR-TEST | Mọi phase code |
| PC-13 Honest AI | FR-15, BR-05 | Khi làm AI |
| PC-14 Progressive enhancement | FR-15 | Khi làm AI |
