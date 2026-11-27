# P00 — Định hướng giao diện (đã chốt)

> ⚠️ Tài liệu này **chỉ ghi nhận** định hướng giao diện đã được xác lập.
> **Chưa triển khai giao diện.** Không tự ý đổi sang phong cách khác.

## 1. Phong cách

**WALE COOKING — Pastel Mint.** Phong cách cố định, không thay đổi.

## 2. Bảng màu nền tảng

| Vai trò | Tên | Mã HEX |
| --- | --- | --- |
| Nền chính | Cream | `#FFF9F0` |
| Màu chủ đạo (accent) | Pastel Mint | `#C9E8D5` |
| Mint đậm | Mint Dark | `#789B83` |
| Hồng nhạt | Soft Pink | `#F8DDE3` |
| Beige | Beige | `#E8DCC6` |
| Chữ | Brown Text | `#594B40` |

## 3. Typography

| Vai trò | Font |
| --- | --- |
| Tiêu đề (headings) | **Baloo 2** |
| Nội dung (body) | **Nunito** |

## 4. Quy chuẩn giao diện

- **Card bo góc 18–24px.**
- Giao diện sáng, sạch, dễ đọc.
- **Mobile-first.**
- Responsive cho **điện thoại, tablet, desktop**.
- Khoảng cách, màu sắc, typography và component phải **đồng bộ** toàn hệ thống.

## 5. Mascot & Icon

- **Mascot đầu bếp 2D riêng:**
  - Tạp dề màu **mint**.
  - Mũ đầu bếp màu **kem (cream)**.
  - Có thể có **nhiều biểu cảm** và **hoạt ảnh nhẹ**.
- **Bộ icon nhận diện** cho: món ăn, nguyên liệu, dụng cụ, danh mục.
  - Cần **đồng bộ**, ưu tiên **bộ icon minh họa riêng**.
  - **Không dùng emoji hệ thống** làm bộ icon nhận diện chính.

## 6. Trải nghiệm người dùng

- Tạo cảm giác như đang đọc **một cuốn sách nấu ăn thật**.
- Hiệu ứng **chuyển trang/chuyển cảnh mềm**, **card nổi nhẹ**.
- Có thể có **hoạt ảnh mascot** và **tiến trình nấu ăn**.
- Hiệu ứng **không được gây chậm** hoặc ảnh hưởng khả năng đọc.

## 7. Ghi chú triển khai (cho các phase sau — chưa thực hiện)

Các điểm dưới đây là **định hướng kỹ thuật gợi ý**, chưa phải quyết định đã chốt:

- Bảng màu & typography → khai báo thành **design token** (CSS variables) để dùng nhất quán.
- Bo góc, màu, spacing → cấu hình trong theme của Tailwind (theo đề xuất stack tại [03-de-xuat-cong-nghe.md](./03-de-xuat-cong-nghe.md)).
- Font **Baloo 2** + **Nunito** → tải qua `next/font` để tối ưu, tránh nhảy layout.
- Bộ icon minh họa riêng → cần thống kê danh sách icon cần thiết và nguồn tạo (thiết kế riêng/SVG) trước khi dựng.
- Mascot → cần bộ asset (các biểu cảm, frame animation) trước khi code.
- Hiệu ứng → ưu tiên GPU-friendly, có `prefers-reduced-motion`, tránh làm giảm hiệu năng đọc.

> Các hạng mục ở mục 7 cần được xác nhận và thực hiện ở phase giao diện, **không** thuộc P00.
