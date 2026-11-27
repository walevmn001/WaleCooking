# P01 — NON-FUNCTIONAL REQUIREMENTS: WALE COOKING

> Tiêu chí phi chức năng với **ngưỡng đo lường được**. Các ngưỡng là **mục tiêu đề xuất**, chưa được kiểm thử.
> ⚠️ **Không tuyên bố đạt tiêu chuẩn** (Core Web Vitals / WCAG / OWASP) cho tới khi **đo thực tế**.
> Tham chiếu tiêu chuẩn phổ biến: **Core Web Vitals**, **WCAG 2.2 AA**, **OWASP ASVS** ở mức phù hợp quy mô.

| Mã | Nhóm | Tiêu chuẩn tham chiếu |
| --- | --- | --- |
| NFR-PERF | Hiệu năng | Core Web Vitals |
| NFR-RESP | Responsive | Mobile-first |
| NFR-A11Y | Trợ năng | WCAG 2.2 AA |
| NFR-SEO | SEO | Google Search Essentials |
| NFR-SEC | Bảo mật | OWASP ASVS (L1; L2 cho auth) |
| NFR-PRIV | Quyền riêng tư | Nguyên tắc tối thiểu hóa dữ liệu |
| NFR-SCALE | Mở rộng | — |
| NFR-BACKUP | Sao lưu & phục hồi | RPO/RTO |
| NFR-DATA | Tin cậy dữ liệu | Toàn vẹn tham chiếu |
| NFR-TEST | Kiểm thử | Kim tự tháp test |
| NFR-FREE | Vận hành trên gói miễn phí | — |

---

## NFR-PERF — Hiệu năng
| Chỉ số | Ngưỡng mục tiêu (p75, mobile) |
| --- | --- |
| LCP | < 2.5 s |
| INP | < 200 ms |
| CLS | < 0.1 |
| TTFB (SSR/ISR) | < 0.8 s |
| Ảnh | Responsive + lazy-load; không phục vụ ảnh gốc quá lớn |
| JS | Budget theo trang; hạn chế thư viện nặng |
**Kiểm chứng:** đo bằng công cụ (Lighthouse/PageSpeed) trên các trang chính (trang chủ, chi tiết công thức). Chỉ ghi nhận khi đo thực tế.
**Liên hệ:** PC-08; UJ-01.

## NFR-RESP — Responsive
- Breakpoint: mobile `< 640px` · tablet `640–1024px` · desktop `> 1024px`.
- Không có cuộn ngang ở `320px`.
- Vùng chạm (touch target) ≥ 44×44px cho hành động chính.
- Chế độ nấu tối ưu cho màn hình nhỏ (chữ lớn, một tay).
**Kiểm chứng:** kiểm tra tại các breakpoint; PC-05.

## NFR-A11Y — Trợ năng (WCAG 2.2 AA)
- Điều hướng **bàn phím** cho toàn bộ luồng chính; focus hiển thị rõ.
- Tương phản văn bản ≥ 4.5:1 (văn bản thường), ≥ 3:1 (chữ lớn) — **lưu ý bảng màu Pastel Mint cần kiểm tra tương phản thực tế**.
- Ảnh có `alt`; thành phần tương tác có nhãn cho trình đọc màn hình.
- Tôn trọng `prefers-reduced-motion`.
**Kiểm chứng:** audit tự động + kiểm thử thủ công; PC-07.
**Rủi ro:** màu `Soft Pink`/`Pastel Mint` trên nền `Cream` có thể không đủ tương phản → cần xác minh (xem [BLOCKERS.md](../../BLOCKERS.md)).

## NFR-SEO — SEO
- Render phía máy chủ (SSR/SSG/ISR) cho trang công thức.
- Mỗi công thức đã xuất bản có: `title` duy nhất, `meta description`, `canonical`, URL slug ổn định, OG tags.
- Structured data **schema.org Recipe** cho trang công thức.
- `sitemap.xml` gồm toàn bộ công thức `published`; `robots.txt` hợp lệ.
**Kiểm chứng:** 100% công thức `published` đủ metadata; sitemap khớp số lượng published.
**Liên hệ:** FR-19.

## NFR-SEC — Bảo mật (OWASP ASVS mức phù hợp)
- Mức **L1** cho toàn hệ thống; **L2** cho luồng xác thực.
- HTTPS bắt buộc; **không lưu bí mật trong repo**.
- Phân quyền RBAC; kiểm tra quyền ở **phía máy chủ** (không tin client).
- Kiểm tra/khử dữ liệu đầu vào; chống XSS/CSRF; rate-limit điểm nhạy cảm.
- Quét phụ thuộc (dependency scanning) trong CI.
**Kiểm chứng:** checklist ASVS (sẽ lập ở P02+); chưa tuyên bố đạt cho tới khi kiểm thử.
**Liên hệ:** PC-09.

## NFR-PRIV — Quyền riêng tư
- **Tối thiểu hóa dữ liệu**: chỉ thu thập dữ liệu cần thiết.
- Người dùng kiểm soát dữ liệu cá nhân (yêu cầu xuất/xóa dữ liệu — cần chốt cơ chế).
- Không theo dõi bên thứ ba mặc định; nếu có analytics → cần thông báo/đồng thuận.
**Liên hệ:** PC-09; [BLOCKERS.md](../../BLOCKERS.md) (cơ chế xuất/xóa dữ liệu chưa chốt).

## NFR-SCALE — Khả năng mở rộng
- CDN + ISR cho nội dung ít đổi; phân trang/`load more` cho danh sách.
- Kết nối DB qua connection pooling (Neon PgBouncer).
- Mục tiêu đề xuất: vận hành tốt ở quy mô **~10.000 công thức** và tăng trưởng người dùng trong hạn mức free (sẽ kiểm chứng bằng đo tải ở phase sau).
**Liên hệ:** PC-11; NFR-FREE.

## NFR-BACKUP — Sao lưu & phục hồi
| Chỉ số | Mục tiêu đề xuất |
| --- | --- |
| RPO (mất mát dữ liệu tối đa) | ≤ 24 giờ |
| RTO (thời gian phục hồi) | ≤ 4 giờ |
| Tần suất sao lưu | Hằng ngày (tối thiểu) |
| Kiểm thử phục hồi | Định kỳ (đề xuất hàng tháng) |
- Có thể xuất nội dung (export) để tránh phụ thuộc nhà cung cấp.
**Ghi chú:** Neon Free cung cấp cửa sổ instant-restore ngắn (PITR đầy đủ là tính năng trả phí ở một số nền tảng) → cơ chế sao lưu bổ sung cần chốt (xem BLOCKERS).

## NFR-DATA — Tin cậy dữ liệu
- Ràng buộc toàn vẹn tham chiếu (công thức ↔ taxonomy ↔ nguyên liệu).
- Kiểm tra hợp lệ trước khi lưu/xuất bản (liên hệ BR-01).
- Thao tác quan trọng có tính idempotent khi phù hợp.
- Audit cơ bản: ai tạo/sửa/xuất bản (liên hệ FR-17).

## NFR-TEST — Khả năng kiểm thử
- Unit + integration + e2e cho các FR mức **Must**.
- Bao phủ logic nghiệp vụ (đề xuất ≥ 70% cho module lõi).
- CI chạy test tự động trước khi merge.
**Liên hệ:** PC-12; [ACCEPTANCE_CRITERIA.md](./ACCEPTANCE_CRITERIA.md).

## NFR-FREE — Vận hành trên gói miễn phí
- Toàn bộ MVP vận hành trong hạn mức free (Neon/R2/Vercel-or-Cloudflare/GitHub Actions).
- Theo dõi hạn mức định kỳ; có phương án khi chạm trần.
- Suy giảm mềm (graceful degradation): khi chạm giới hạn, hệ thống **không sập** mà giảm tính năng phụ.
**Liên hệ:** [03-de-xuat-cong-nghe.md](../P00/03-de-xuat-cong-nghe.md).

---

## Ma trận truy vết NFR ↔ Nguyên tắc

| NFR | Nguyên tắc Constitution |
| --- | --- |
| NFR-PERF | PC-08 |
| NFR-RESP | PC-05 |
| NFR-A11Y | PC-07 |
| NFR-SEO | PC-01, PC-03 |
| NFR-SEC / NFR-PRIV | PC-09 |
| NFR-SCALE | PC-11 |
| NFR-TEST | PC-12 |
| NFR-FREE | PC-11 |
