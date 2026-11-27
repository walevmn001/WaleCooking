# BLOCKERS — WALE COOKING

> Các vấn đề còn tồn tại hoặc cần xác minh. Ghi rõ thay vì tự suy đoán.
> Cập nhật: 2026-11-28 (P06).

| # | Blocker | Mức độ | Trạng thái | Ghi chú |
| --- | --- | --- | --- | --- |
| B1 | Prompt P00 bị cắt ngắn ở mục 6 ("4. Phân loại…") → phạm vi chưa đầy đủ | Cao | **ĐÃ GIẢI QUYẾT (P00-FIX)** | Phạm vi 20 nhóm chức năng đã bổ sung đầy đủ |
| B2 | Chưa rõ mục đích thương mại hay phi thương mại | Cao | **ĐÃ GIẢI QUYẾT (P00)** | Phi thương mại (D1) |
| B3 | Tên brand không khớp (repo `WaleCooking` vs sản phẩm cũ) | Trung bình | **ĐÃ GIẢI QUYẾT (P00-FIX)** | Tên chính thức WALE COOKING; repo giữ nguyên (D4) |
| B4 | Chưa rõ có được commit/push checkpoint | Trung bình | **ĐÃ GIẢI QUYẾT (P00)** | Commit local, không push (D3) |
| B5 | Repo là **shallow clone** → thiếu lịch sử/refs đầy đủ | Thấp | **Còn mở** | Ảnh hưởng thấp (mới 3 commit). Cân nhắc `git fetch --unshallow` khi cần |
| B6 | **Chưa có tài khoản/môi trường triển khai** (Neon, R2, Vercel/Cloudflare…) | Trung bình | **Còn mở** | Cần trước khi deploy; thuộc phase sau |
| B7 | **Chưa có asset thật**: mascot, bộ icon minh họa riêng | Trung bình | **ĐÃ GIẢI QUYẾT (P04)** | 60 SVG nguyên bản (5 logo, 8 mascot, 38 icon, 9 illustration) + quy chuẩn trong `docs/P04/`; xem [ASSET_CATALOG.md](./docs/P04/ASSET_CATALOG.md) |
| B-P01-01 | **Quy trình phê duyệt taxonomy** giữa `editor` (đề xuất) và `admin` (phê duyệt) chưa chốt | Trung bình | **Còn mở** | Ảnh hưởng luồng CMS (FR-17, FR-04); tham chiếu [USER_PERSONAS.md](./docs/P01/USER_PERSONAS.md), tương ứng O5 |
| B-P01-02 | **Tương phản màu** Pastel Mint/Soft Pink trên nền Cream có thể chưa đạt WCAG 2.2 AA | Trung bình | **ĐÃ ĐO Ở P03 (còn phần runtime)** | P03 đã đo contrast thực tế cho toàn bộ cặp hero/UI; các cặp không đạt có quy tắc cấm + shade phụ trợ → [COLOR_ACCESSIBILITY_AUDIT.md](./docs/P03/COLOR_ACCESSIBILITY_AUDIT.md). Phần **contrast trên UI thật (alpha/overlay)** chuyển sang B-P03-01 |
| B-P01-03 | **Cơ chế xuất/xóa dữ liệu cá nhân** của người dùng chưa chốt | Trung bình | **Còn mở** | Ảnh hưởng NFR-PRIV (FR-16, FR-11); tương ứng O6 |
| B-P02-01 | **CMS MVP: admin tự viết vs Payload CMS 3** — P02 tạm chọn admin tự viết, chưa chốt dứt khoát | Thấp | **Còn mở** | Quyết định một phần (D21/D-P02-11); có thể chốt lại ở P03+; tương ứng O8 |
| B-P02-02 | **Cơ chế backup bổ sung (PITR + export định kỳ)** theo gói Neon free chưa xác minh | Trung bình | **Còn mở** | Ảnh hưởng NFR-BACKUP; cần kiểm tra hạn mức thực tế; tương ứng O9 |
| B-P02-03 | **Quy trình phê duyệt taxonomy** chưa chốt → API tạo/sửa taxonomy tạm **chỉ Admin** | Trung bình | **Còn mở** | Hệ quả kéo theo của B-P01-01; khi chốt sẽ mở quyền `editor` (xem [API_CONTRACT.md](./docs/P02/API_CONTRACT.md)) |
| B-P03-01 | **Nghiệm thu a11y/responsive/motion trên UI thật chưa thực hiện** | Trung bình | **CÒN MỞ (P05 đã có UI, chưa kiểm trên trình duyệt)** | P05 đã dựng UI thật + hiện thực a11y ở mức code/đặc tả (skip-link, focus-ring, ARIA, focus trap, reduced-motion). **Nhưng** môi trường không có trình duyệt headless → chưa chạy axe/Lighthouse, chưa test screen reader (NVDA/VoiceOver), chưa kiểm zoom 200%/320px, focus-not-obscured với header sticky, contrast có alpha/overlay. Xem [ACCESSIBILITY_REPORT.md](./docs/P05/ACCESSIBILITY_REPORT.md) §6 và [DESIGN_QA_CHECKLIST.md](./docs/P03/DESIGN_QA_CHECKLIST.md) §3 |
| B-P04-01 | **Render pixel & tương thích runtime của asset P04 chưa xác minh** | Thấp | **CÒN MỞ (asset đã tích hợp UI ở P05, chưa xác minh render)** | P05 đã tích hợp asset P04 vào `SiteLogo`, `RecipeImage` (mascot khi thiếu ảnh), `EmptyState`, `ErrorState`, `not-found`. Môi trường build không có SVG rasterizer/trình duyệt → vẫn chưa kiểm bằng mắt: mascot trên các nền P03, logo ≥16–24px, `currentColor` trong icon trên Safari/Firefox. Xem [ASSET_QA_CHECKLIST.md](./docs/P04/ASSET_QA_CHECKLIST.md) §10 |
| B-P05-01 | **Chưa kiểm trình duyệt thật / E2E / console runtime** | Trung bình | **Còn mở** | Môi trường P05 không có trình duyệt headless; đã kiểm `typecheck`/`lint`/`test` (60)/`build` (15 route) nhưng chưa kiểm responsive thực tế, focus thực tế, tràn ngang, console runtime. Không tuyên bố đạt WCAG 2.2 AA. Xem [TEST_REPORT.md](./docs/P05/TEST_REPORT.md) §5 |
| B-P06-01 | **Chưa xác minh kết nối Neon PostgreSQL thật** | Trung bình | **Còn mở** | Chưa có connection string Neon → toàn bộ kiểm chứng P06 chạy trên **PostgreSQL 16.15 local** (`wale_dev`/`wale_test`). Chưa kiểm pooled/direct thật, SSL, `?pgbouncer=true`. Cấu hình đã sẵn (`DATABASE_URL` + `DIRECT_URL`). Xem [MIGRATION_GUIDE.md](./docs/P06/MIGRATION_GUIDE.md) §6 |
| B-P06-02 | **Auth.js chưa nối → chưa kiểm luồng 401/403 end-to-end** | Trung bình | **Còn mở** | `getCurrentActor()` trả `null`; chưa có phiên đăng nhập thật. Mọi thao tác ghi trong test được kiểm ở tầng authorization (unit) nhưng **chưa** qua HTTP. Không giả lập người dùng đã đăng nhập. Xem [DATABASE_SECURITY.md](./docs/P06/DATABASE_SECURITY.md) §3 |
| B-P06-03 | **Chưa có credentials Cloudflare R2** | Trung bình | **Chưa xử lý (thuộc P07)** | Biến `R2_*` để trống; media adapter (R2/local) triển khai ở P07. Không tuyên bố R2 đã kết nối. Xem [MEDIA_STORAGE.md](./docs/P02/MEDIA_STORAGE.md) |

## Nội dung còn chờ xác minh (không phải blocker cứng)

- **O1–O9** trong [DECISIONS.md](./DECISIONS.md): thời điểm tách backend, chọn hosting, dịch vụ monitoring, nguồn asset, quy trình phê duyệt taxonomy, cơ chế xuất/xóa dữ liệu, vai trò `moderator`, CMS tự viết vs Payload, cơ chế backup PITR.
- Hạn mức gói miễn phí (Neon/R2/Vercel/Cloudflare) đã ghi trong [03-de-xuat-cong-nghe.md](./docs/P00/03-de-xuat-cong-nghe.md) **theo thời điểm 11/2026** — cần kiểm tra lại trước khi triển khai.
- Các ngưỡng NFR (Core Web Vitals, WCAG 2.2 AA, OWASP ASVS) là **mục tiêu đề xuất, chưa kiểm thử** — không tuyên bố đạt trước khi đo.
