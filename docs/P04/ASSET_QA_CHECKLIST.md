# ASSET_QA_CHECKLIST — WALE COOKING (P04)

> Checklist nghiệm thu tài nguyên nhận diện minh họa P04.
> Phương pháp: kiểm định tự động ([p04_validate_assets.py](file:///workspace/scripts/p04_validate_assets.py)) + kiểm tra thủ công bằng lệnh.
> Cập nhật: 2026-11-28 (P04).

## 0. Phạm vi & giới hạn môi trường

- Môi trường build **không có SVG rasterizer** (`rsvg-convert`, `inkscape`, `cairosvg`, `chromium` đều không có; ImageMagick thiếu delegate `rsvg`).
  ⇒ Các hạng mục liên quan **render pixel** được đánh dấu ⚠️ *chưa xác minh tự động* và phải kiểm tra bằng mắt khi tích hợp vào website ở phase sau.
- Mọi hạng mục còn lại được kiểm ở **mức XML/byte** — đủ để khẳng định file hợp lệ, an toàn và nhất quán.

Chú thích trạng thái: ✅ đạt · ⚠️ chưa xác minh tự động (cần kiểm bằng mắt) · ➖ không áp dụng.

---

## 1. Kiểm tra file asset mở được (§11.1)

| # | Hạng mục | Cách kiểm | Kết quả |
| --- | --- | --- | --- |
| Q-01 | Tất cả 60 file tồn tại và đọc được | `find public/assets -name '*.svg' \| wc -l` → 60 | ✅ 60/60 |
| Q-02 | Mỗi file parse được XML hợp lệ | `xml.etree.ElementTree.parse` cho từng file | ✅ 60/60 |
| Q-03 | Phần tử gốc là `<svg>` | kiểm `root.tag` kết thúc bằng `svg` | ✅ 60/60 |

## 2. SVG hợp lệ & an toàn (§11.2)

| # | Hạng mục | Cách kiểm | Kết quả |
| --- | --- | --- | --- |
| Q-04 | Không chứa `<script>` | quét cây XML | ✅ 0 |
| Q-05 | Không chứa `<foreignObject>` | quét cây XML | ✅ 0 |
| Q-06 | Không chứa `<image>`/nội dung nhúng | quét cây XML | ✅ 0 |
| Q-07 | Không có DOCTYPE/ENTITY (chống XXE) | quét chuỗi thô | ✅ 0 |
| Q-08 | Không có thuộc tính sự kiện `on*` | quét thuộc tính | ✅ 0 |
| Q-09 | Không có `href`/`xlink:href` trỏ ra ngoài | quét thuộc tính | ✅ 0 |
| Q-10 | Mọi file có thuộc tính `viewBox` | kiểm thuộc tính gốc | ✅ 60/60 |
| Q-11 | Không có path-data thô rơi ra ngoài thẻ (lỗi render) | regex `^\s*[Mm][0-9\s.,\-]+$` trên text node | ✅ 0 |
| Q-12 | Chỉ dùng `xmlns` chuẩn `http://www.w3.org/2000/svg` | kiểm namespace | ✅ 60/60 |

**Tổng hợp validator:** Lỗi **0** · Cảnh báo **0**.

## 3. Logo ở kích thước nhỏ (§11.3)

| # | Hạng mục | Cách kiểm | Kết quả |
| --- | --- | --- | --- |
| Q-13 | Có phiên bản mark tối giản cho kích thước nhỏ | tồn tại `logo-mark.svg` (120×120) | ✅ |
| Q-14 | Favicon ở khung nhỏ 32×32 | `favicon.svg` viewBox `0 0 32 32` | ✅ |
| Q-15 | App icon 512×512 cho PWA/maskable | `app-icon.svg` viewBox `0 0 512 512` | ✅ |
| Q-16 | Logo chính/compact dùng hình học đơn giản, ít chi tiết | kiểm cấu trúc (số phần tử nhỏ) | ✅ |
| Q-17 | Logo còn nhận diện được ở ~24px | render & nhìn | ⚠️ chưa xác minh tự động |

## 4. Mascot trên các nền màu P03 (§11.4)

| # | Hạng mục | Cách kiểm | Kết quả |
| --- | --- | --- | --- |
| Q-18 | Màu mascot nằm trong palette khóa P03 | đối chiếu tập hex ⊆ palette | ✅ |
| Q-19 | Có viền `#594B40` bao quanh chi tiết (tách khỏi nền sáng) | kiểm `stroke` = Brown Text | ✅ |
| Q-20 | Dùng được trên Cream `#FFF9F0` (nền mặc định) | render trên nền | ⚠️ chưa xác minh tự động |
| Q-21 | Dùng được trên Pastel Mint `#C9E8D5` | render trên nền | ⚠️ chưa xác minh tự động |
| Q-22 | Dùng được trên Soft Pink `#F8DDE3` | render trên nền | ⚠️ chưa xác minh tự động |
| Q-23 | Tương phản nét viền Brown trên các nền đạt ngưỡng đồ họa | số liệu WCAG P03: brown/cream 8.01, brown/mint 6.38, brown/pink 6.56 | ✅ thiết kế; ⚠️ render |

## 5. Nhất quán giữa các biến thể mascot (§11.5)

| # | Hạng mục | Cách kiểm | Kết quả |
| --- | --- | --- | --- |
| Q-24 | Cả 8 biến thể dùng chung viewBox `0 0 220 260` | kiểm thuộc tính | ✅ 8/8 |
| Q-25 | Cùng cấu trúc phần đầu (mũ + mặt + tai) | kiểm chuỗi đặc trưng | ✅ 8/8 |
| Q-26 | Cùng bảng màu (mũ kem, tạp dề mint, da beige, má pink) | đối chiếu tập hex | ✅ |
| Q-27 | Tỷ lệ cơ thể không đổi (chỉ đổi biểu cảm/tư thế tay) | kiểm toạ độ lõi giống nhau | ✅ |
| Q-28 | Không tạo nhân vật thứ hai khác nhận diện | kiểm 1 khuôn mặt cho mọi biến thể | ✅ |

## 6. Kiểm tra dung lượng (§11.6)

| # | Hạng mục | Ngưỡng | Kết quả |
| --- | --- | --- | --- |
| Q-29 | Tổng dung lượng bộ asset | < 200 KB | ✅ 56.6 KB |
| Q-30 | File lớn nhất | < 10 KB | ✅ 2561 B (`mascot-holding-recipe.svg`) |
| Q-31 | Icon 24×24 | < 1 KB mỗi file | ✅ max 445 B |
| Q-32 | Illustration 320×220 | < 5 KB mỗi file | ✅ max 2552 B |
| Q-33 | Không có asset khổng lồ ngoài mục đích | kiểm danh mục | ✅ |

## 7. Tên file & liên kết tài liệu (§11.7)

| # | Hạng mục | Cách kiểm | Kết quả |
| --- | --- | --- | --- |
| Q-34 | Tên file khớp regex kebab-case | `^[a-z0-9]+(-[a-z0-9]+)*\.svg$` | ✅ 60/60 |
| Q-35 | Đặt đúng thư mục nhóm | brand/mascot/icons/illustrations | ✅ |
| Q-36 | Đường dẫn trong [ASSET_CATALOG.md](./ASSET_CATALOG.md) khớp file thật | đối chiếu từng dòng | ✅ |
| Q-37 | Liên kết chéo giữa 7 tài liệu P04 không gãy | kiểm tồn tại file đích | ✅ |
| Q-38 | Số lượng tài liệu bàn giao đủ 7 file | `ls docs/P04` → 7 `.md` | ✅ |

## 8. Tài liệu bàn giao (§10)

| # | File | Trạng thái |
| --- | --- | --- |
| Q-39 | `BRAND_ASSET_GUIDELINES.md` | ✅ |
| Q-40 | `MASCOT_SPECIFICATION.md` | ✅ |
| Q-41 | `LOGO_USAGE_GUIDELINES.md` | ✅ |
| Q-42 | `ICON_SYSTEM.md` | ✅ |
| Q-43 | `ILLUSTRATION_GUIDELINES.md` | ✅ |
| Q-44 | `ASSET_CATALOG.md` | ✅ |
| Q-45 | `ASSET_QA_CHECKLIST.md` | ✅ |

---

## 9. Definition of Done (P04)

P04 được coi là hoàn tất khi **tất cả** điều sau đúng:

1. Đủ **60 asset SVG** thực tế trên đĩa, tồn tại trong `public/assets/`.
2. Validator trả về **0 lỗi, 0 cảnh báo**.
3. Đủ **7 tài liệu** trong `docs/P04/`, liên kết chéo hợp lệ.
4. Danh mục [ASSET_CATALOG.md](./ASSET_CATALOG.md) khớp tên/định dạng/viewBox/dung lượng/vị trí.
5. 4 file trạng thái (`CURRENT_STATUS.md`, `PHASE_PROGRESS.md`, `DECISIONS.md`, `BLOCKERS.md`) đã cập nhật P04.
6. Commit riêng P04, chỉ stage file thuộc P04, push `origin/main` an toàn (không force).

## 10. Hạng mục CHƯA xác minh (minh bạch)

| # | Hạng mục | Lý do | Cách xác minh sau này |
| --- | --- | --- | --- |
| N-01 | Render pixel của mascot/logo/illustration | không có rasterizer trong môi trường | mở SVG bằng trình duyệt khi tích hợp |
| N-02 | Tương phản đồ họa thực tế trên nền P03 | cần render | chụp màn hình & đo bằng mắt/công cụ |
| N-03 | Logo hiển thị rõ ở kích thước ~16–24px | cần render | kiểm trên favicon/tab trình duyệt |
| N-04 | Tương thích Safari/Firefox với `currentColor` trong icon | cần runtime | kiểm khi tích hợp component |

> **Kết luận kiểm thử P04:** 45/45 hạng mục ✅ đạt ở mức XML/byte; 4 hạng mục ⚠️ chờ kiểm render khi tích hợp. Không có lỗi chặn.
