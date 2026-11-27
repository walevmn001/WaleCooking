# BLOCKERS — WALE COOKING

> Các vấn đề còn tồn tại hoặc cần xác minh. Ghi rõ thay vì tự suy đoán.
> Cập nhật: 2026-11-28 (P03).

| # | Blocker | Mức độ | Trạng thái | Ghi chú |
| --- | --- | --- | --- | --- |
| B1 | Prompt P00 bị cắt ngắn ở mục 6 ("4. Phân loại…") → phạm vi chưa đầy đủ | Cao | **ĐÃ GIẢI QUYẾT (P00-FIX)** | Phạm vi 20 nhóm chức năng đã bổ sung đầy đủ |
| B2 | Chưa rõ mục đích thương mại hay phi thương mại | Cao | **ĐÃ GIẢI QUYẾT (P00)** | Phi thương mại (D1) |
| B3 | Tên brand không khớp (repo `WaleCooking` vs sản phẩm cũ) | Trung bình | **ĐÃ GIẢI QUYẾT (P00-FIX)** | Tên chính thức WALE COOKING; repo giữ nguyên (D4) |
| B4 | Chưa rõ có được commit/push checkpoint | Trung bình | **ĐÃ GIẢI QUYẾT (P00)** | Commit local, không push (D3) |
| B5 | Repo là **shallow clone** → thiếu lịch sử/refs đầy đủ | Thấp | **Còn mở** | Ảnh hưởng thấp (mới 3 commit). Cân nhắc `git fetch --unshallow` khi cần |
| B6 | **Chưa có tài khoản/môi trường triển khai** (Neon, R2, Vercel/Cloudflare…) | Trung bình | **Còn mở** | Cần trước khi deploy; thuộc phase sau |
| B7 | **Chưa có asset thật**: mascot, bộ icon minh họa riêng | Trung bình | **Còn mở** | Chặn một phần phase giao diện; cần nguồn tạo asset |
| B-P01-01 | **Quy trình phê duyệt taxonomy** giữa `editor` (đề xuất) và `admin` (phê duyệt) chưa chốt | Trung bình | **Còn mở** | Ảnh hưởng luồng CMS (FR-17, FR-04); tham chiếu [USER_PERSONAS.md](./docs/P01/USER_PERSONAS.md), tương ứng O5 |
| B-P01-02 | **Tương phản màu** Pastel Mint/Soft Pink trên nền Cream có thể chưa đạt WCAG 2.2 AA | Trung bình | **ĐÃ ĐO Ở P03 (còn phần runtime)** | P03 đã đo contrast thực tế cho toàn bộ cặp hero/UI; các cặp không đạt có quy tắc cấm + shade phụ trợ → [COLOR_ACCESSIBILITY_AUDIT.md](./docs/P03/COLOR_ACCESSIBILITY_AUDIT.md). Phần **contrast trên UI thật (alpha/overlay)** chuyển sang B-P03-01 |
| B-P01-03 | **Cơ chế xuất/xóa dữ liệu cá nhân** của người dùng chưa chốt | Trung bình | **Còn mở** | Ảnh hưởng NFR-PRIV (FR-16, FR-11); tương ứng O6 |
| B-P02-01 | **CMS MVP: admin tự viết vs Payload CMS 3** — P02 tạm chọn admin tự viết, chưa chốt dứt khoát | Thấp | **Còn mở** | Quyết định một phần (D21/D-P02-11); có thể chốt lại ở P03+; tương ứng O8 |
| B-P02-02 | **Cơ chế backup bổ sung (PITR + export định kỳ)** theo gói Neon free chưa xác minh | Trung bình | **Còn mở** | Ảnh hưởng NFR-BACKUP; cần kiểm tra hạn mức thực tế; tương ứng O9 |
| B-P02-03 | **Quy trình phê duyệt taxonomy** chưa chốt → API tạo/sửa taxonomy tạm **chỉ Admin** | Trung bình | **Còn mở** | Hệ quả kéo theo của B-P01-01; khi chốt sẽ mở quyền `editor` (xem [API_CONTRACT.md](./docs/P02/API_CONTRACT.md)) |
| B-P03-01 | **Nghiệm thu a11y/responsive/motion trên UI thật chưa thực hiện** | Trung bình | **Còn mở (chờ P05)** | P03 mới ở mức token/đặc tả: chưa chạy axe/Lighthouse, chưa test screen reader (NVDA/VoiceOver), chưa kiểm zoom 200%/320px, focus-not-obscured với header sticky, contrast có alpha/overlay. Xem [DESIGN_QA_CHECKLIST.md](./docs/P03/DESIGN_QA_CHECKLIST.md) §3 |

## Nội dung còn chờ xác minh (không phải blocker cứng)

- **O1–O9** trong [DECISIONS.md](./DECISIONS.md): thời điểm tách backend, chọn hosting, dịch vụ monitoring, nguồn asset, quy trình phê duyệt taxonomy, cơ chế xuất/xóa dữ liệu, vai trò `moderator`, CMS tự viết vs Payload, cơ chế backup PITR.
- Hạn mức gói miễn phí (Neon/R2/Vercel/Cloudflare) đã ghi trong [03-de-xuat-cong-nghe.md](./docs/P00/03-de-xuat-cong-nghe.md) **theo thời điểm 11/2026** — cần kiểm tra lại trước khi triển khai.
- Các ngưỡng NFR (Core Web Vitals, WCAG 2.2 AA, OWASP ASVS) là **mục tiêu đề xuất, chưa kiểm thử** — không tuyên bố đạt trước khi đo.
