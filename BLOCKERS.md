# BLOCKERS — WALE COOKING

> Các vấn đề còn tồn tại hoặc cần xác minh. Ghi rõ thay vì tự suy đoán.
> Cập nhật: 2026-11-28 (P00-FIX).

| # | Blocker | Mức độ | Trạng thái | Ghi chú |
| --- | --- | --- | --- | --- |
| B1 | Prompt P00 bị cắt ngắn ở mục 6 ("4. Phân loại…") → phạm vi chưa đầy đủ | Cao | **ĐÃ GIẢI QUYẾT (P00-FIX)** | Phạm vi 20 nhóm chức năng đã bổ sung đầy đủ |
| B2 | Chưa rõ mục đích thương mại hay phi thương mại | Cao | **ĐÃ GIẢI QUYẾT (P00)** | Phi thương mại (D1) |
| B3 | Tên brand không khớp (repo `WaleCooking` vs sản phẩm cũ) | Trung bình | **ĐÃ GIẢI QUYẾT (P00-FIX)** | Tên chính thức WALE COOKING; repo giữ nguyên (D4) |
| B4 | Chưa rõ có được commit/push checkpoint | Trung bình | **ĐÃ GIẢI QUYẾT (P00)** | Commit local, không push (D3) |
| B5 | Repo là **shallow clone** → thiếu lịch sử/refs đầy đủ | Thấp | **Còn mở** | Ảnh hưởng thấp (mới 2 commit). Cân nhắc `git fetch --unshallow` khi cần |
| B6 | **Chưa có tài khoản/môi trường triển khai** (Neon, R2, Vercel/Cloudflare…) | Trung bình | **Còn mở** | Cần trước khi deploy; thuộc phase sau |
| B7 | **Chưa có asset thật**: mascot, bộ icon minh họa riêng | Trung bình | **Còn mở** | Chặn một phần phase giao diện; cần nguồn tạo asset |

## Nội dung còn chờ xác minh (không phải blocker cứng)

- **O1–O4** trong [DECISIONS.md](./DECISIONS.md): thời điểm tách backend, chọn hosting, dịch vụ monitoring, nguồn asset.
- Hạn mức gói miễn phí (Neon/R2/Vercel/Cloudflare) đã ghi trong [03-de-xuat-cong-nghe.md](./docs/P00/03-de-xuat-cong-nghe.md) **theo thời điểm 11/2026** — cần kiểm tra lại trước khi triển khai.
