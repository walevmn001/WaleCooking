# P16.4 — DUPLICATE DETECTION & DATA QUALITY

> Phase **P16** (thiết kế) · Milestone **P16.4** · 1 AI Agent · Không triển khai code.
> Mục tiêu: đặc tả **thuật toán phát hiện công thức trùng lặp** (6 lớp kiểm) + **phân loại 4 mức** + **điểm chất lượng dữ liệu** có giải thích.
> Nguyên tắc gốc: **KHÔNG tự xoá, KHÔNG tự ghi đè** công thức đã tồn tại. Điểm số **chỉ hỗ trợ ưu tiên**, **không thay thế** kiểm duyệt người.
> Liên quan: [EXTRACTION_ENGINE.md](./EXTRACTION_ENGINE.md) · [VIETNAMESE_LOCALIZATION.md](./VIETNAMESE_LOCALIZATION.md) · [ADMIN_REVIEW_WORKFLOW.md](./ADMIN_REVIEW_WORKFLOW.md) · [DATABASE_DESIGN.md](./DATABASE_DESIGN.md).

---

## 1. Vị trí trong luồng

```
ExtractionResult (P16.2) ─▶ [DEDUPE SCAN] ─▶ nhãn: NONE / EXACT / LIKELY / SIMILAR
                               P16.4                    │
                                                        ├─ EXACT/LIKELY → item DUPLICATE (P16.6)
                                                        └─ NONE/SIMILAR → tiếp tục LOCALIZE (P16.3)
```

Dedupe **chạy sớm** (ngay sau extraction, trước khi tốn chi phí dịch) và **chạy lại** ở bước review (để so với công thức đã publish trong lúc chờ).

---

## 2. Sáu lớp kiểm (theo thứ tự, dừng sớm khi đã kết luận)

| Lớp | Kiểm gì | Cách thực hiện | Ý nghĩa |
|---|---|---|---|
| **L1 — Canonical URL** | URL chuẩn hoá trùng? | Chuẩn hoá URL (bỏ `utm_*`, `#fragment`, `www.`, theo dõi redirect, `rel=canonical`) → so khớp chính xác | Trùng **chắc chắn** cùng nguồn |
| **L2 — Source URL** | URL đã nhập trong hệ thống? | So URL gốc với `RecipeExtraction.sourceUrl` / `ContentSource.url` đã có | URL **đã import trước đó** |
| **L3 — Normalized title** | Tên món chuẩn hoá trùng/gần trùng? | Chuẩn hoá: lowercase, bỏ dấu (`unaccent`), bỏ stopword, gộp khoảng trắng → so exact + `pg_trgm` similarity | Cùng món, khác nguồn |
| **L4 — Ingredient similarity** | Tập nguyên liệu giống nhau? | Chuẩn hoá tên nguyên liệu (khớp `Ingredient`/alias); Jaccard/F1 trên tập nguyên liệu; `pg_trgm` cho tên gần đúng | Nội dung món tương đồng |
| **L5 — Instruction similarity** | Hướng dẫn giống nhau? | Chuẩn hoá text bước; so **shingle**/tỉ lệ trùng token giữa các bước; giữ **thứ tự** | Cùng cách làm |
| **L6 — Image similarity** | Ảnh giống nhau? | **Chỉ khi có điều kiện phù hợp**: ảnh đã tải & có quyền; so **perceptual hash** (aHash/dHash) trên ảnh đã chuẩn hoá | Cùng nguồn ảnh (yếu, chỉ bổ trợ) |

**Ghi chú:**
- L1–L2 là **cứng** (deterministic). L3–L5 là **xác suất** (dùng ngưỡng). L6 là **bổ trợ** (chỉ khi đủ điều kiện; mặc định tắt vì phần lớn công thức **không** tải ảnh nguồn — P16.8).
- Mọi lớp **không** gọi AI; nếu cần AI (semantic) → chỉ ở mức **gợi ý**, gắn cờ, không quyết định.
- Tận dụng `pg_trgm`/`unaccent`/`citext` **đã có sẵn** trong DB (P16.0 audit) — không thêm extension mới ở phase này.

---

## 3. Phân loại kết quả (4 mức)

| Nhãn | Điều kiện (ví dụ ngưỡng khởi điểm) | Hành động |
|---|---|---|
| **EXACT DUPLICATE** | L1 khớp **hoặc** L2 khớp **hoặc** (L3 exact + L4 cao + L5 cao) | Đánh dấu `DUPLICATE`; **không** tạo bản ghi mới; cho admin gộp/xem |
| **LIKELY DUPLICATE** | (L3 ≥ cao) **và** (L4 ≥ trung bình) **hoặc** L5 ≥ cao; **hoặc** L6 khớp khi có ảnh | Đánh dấu `DUPLICATE` + cảnh báo; admin quyết định |
| **SIMILAR RECIPE** | 1–2 lớp ở mức trung bình (cùng nguyên liệu chính, khác chi tiết) | **Vẫn cho nhập**; hiển thị "công thức tương tự" cho admin |
| **DIFFERENT RECIPE** | Tất cả dưới ngưỡng | Nhập bình thường |

> Ngưỡng là **cấu hình** (không hard-code) và **có thể hiệu chỉnh**; mỗi quyết định lưu **điểm từng lớp** để giải thích (không "hộp đen").

---

## 4. Không tự xoá / không tự ghi đè (bất biến)

- Khi phát hiện trùng: hệ thống **chỉ** gắn nhãn + tạo `DuplicateCandidate` (đề xuất P16.7) để admin xem — **không** xoá item, **không** sửa/ghi đè công thức đã publish.
- `RecipeService` hiện có `softDelete()` (đặt `deletedAt`) — **chỉ** admin gọi; importer **không** bao giờ gọi xoá cứng/xoá mềm tự động.
- Mọi hành động gộp/thay thế do **admin** thực hiện, có `AuditLog`.

---

## 5. Xử lý các tình huống (bắt buộc)

### 5.1 Cùng món từ hai nguồn
- Nhãn **LIKELY/EXACT**. Đề xuất: tạo **1 công thức**, nhiều `ContentSource` (đa nguồn) — tận dụng `RecipeSource` (n-n). Admin chọn nguồn chính (`isPrimary`).
- Không tạo 2 công thức trùng nội dung; ghi rõ trong `DuplicateCandidate` để admin hợp nhất nguồn.

### 5.2 Một món có nhiều phiên bản (biến thể)
- Nếu **khác biệt có ý nghĩa** (nguyên liệu/khẩu phần/cách làm khác) → **SIMILAR RECIPE**, cho nhập **riêng** (mỗi phiên bản là công thức riêng, có thể gắn tag biến thể).
- Nếu chỉ **khác cách diễn đạt** → LIKELY DUPLICATE.

### 5.3 URL đã nhập trước đó
- **L2** khớp → **EXACT DUPLICATE**. Đề xuất: **không** tạo `RecipeExtraction`/công thức mới; liên kết tới item cũ; admin có thể "cập nhật từ nguồn" (§5.4).

### 5.4 Công thức được cập nhật từ nguồn
- Phát hiện: L2 khớp nhưng nội dung nguồn **mới hơn** (`dateModified`) → tạo **đề xuất cập nhật** (diff), **không** tự ghi đè.
- Admin xem diff (gốc cũ ↔ nguồn mới) → duyệt cập nhật → tạo `RecipeVersion` (đã có bảng snapshot) để giữ lịch sử.

### 5.5 Hai công thức tên khác nhau nhưng nguyên liệu gần giống
- **L3 thấp** nhưng **L4 cao** → **SIMILAR RECIPE** (cảnh báo "có thể cùng món"). **Không** tự coi là trùng — tên khác có thể là biến thể/phiên bản vùng miền.
- Admin quyết định: gộp, gắn "liên quan", hay giữ riêng.

---

## 6. Data Quality Score (có giải thích, không thay kiểm duyệt)

Điểm **0–100**, tổng hợp **có trọng số** từ nhiều tiêu chí, **mỗi tiêu chí nêu rõ lý do**. Điểm **chỉ** để sắp xếp ưu tiên review & hiển thị; **không** tự publish/loại.

| Tiêu chí | Nguồn | Ví dụ trừ điểm | Giải thích hiển thị |
|---|---|---|---|
| Độ đầy đủ trường | P16.2 (MISSING/UNREADABLE) | Thiếu cook time, thiếu cuisine | "Thiếu 2 trường bắt buộc để publish (BR-01)" |
| Trạng thái nguồn | P16.1 (registry) | Nguồn chưa đánh giá/`unregistered` | "Nguồn chưa có trong Source Registry" |
| Chất lượng extraction | Bậc extractor | Chỉ dùng E4/E5 | "Chỉ trích xuất được bằng heuristic/AI" |
| Chất lượng dịch | P16.3 (I1–I9) | Có lỗi cứng I1–I5 | "3 lỗi dữ kiện trong bản Việt hoá" |
| Định lượng nguyên liệu | P16.2 | Nhiều nguyên liệu `quantityText` | "7/10 nguyên liệu không có định lượng số" |
| Tín hiệu trùng lặp | §3 | LIKELY DUPLICATE | "Có 1 công thức gần trùng (độ tương đồng cao)" |
| Nguồn/bản quyền | P16.8 | Thiếu license | "Chưa rõ điều kiện sử dụng nội dung/ảnh" |

**Nguyên tắc:** score hiển thị **kèm danh sách lý do** (không chỉ con số); admin vẫn là người quyết định cuối cùng.

---

## 7. Chuẩn hoá phục vụ so khớp

- **URL**: lowercase host, bỏ `www`, bỏ query tracking (`utm_*`, `fbclid`, `gclid`), bỏ fragment, chuẩn hoá trailing slash, theo `rel=canonical`.
- **Title**: `unaccent` + lowercase + bỏ dấu câu/stopword + gộp khoảng trắng; lưu bản chuẩn hoá để so nhanh.
- **Nguyên liệu**: map về `Ingredient.slug` khi khớp (alias/trigram); chưa khớp → dùng tên chuẩn hoá.
- **Bước**: chuẩn hoá text + so shingle; **giữ thứ tự** (đảo bước ⇒ coi là khác).

---

## 8. Ngưỡng & hiệu chỉnh (đề xuất khởi điểm)

| Lớp | Tham số | Khởi điểm gợi ý |
|---|---|---|
| L3 title | `pg_trgm` similarity | ≥ 0.85 "cao"; 0.60–0.85 "trung bình" |
| L4 ingredients | Jaccard tập nguyên liệu | ≥ 0.80 "cao"; 0.55–0.80 "trung bình" |
| L5 instructions | tỉ lệ shingle trùng | ≥ 0.75 "cao" |
| L6 image | Hamming distance (dHash) | ≤ 8/64 "khớp" |

> Các giá trị này là **gợi ý**, cần hiệu chỉnh bằng dữ liệu thực khi triển khai; **không** phải hằng số đúng tuyệt đối.

---

## 9. Kiểm thử (đề xuất cho phase triển khai)

- **Deterministic**: L1/L2 (URL chuẩn hoá & đã nhập) — test chính xác tuyệt đối.
- **Similarity**: bộ fixture cặp công thức (trùng/khác) → nhãn kỳ vọng; đánh giá precision/recall.
- **Bất biến**: scan **không** tạo/xoá/sửa công thức; chỉ tạo `DuplicateCandidate` + nhãn.
- **Chuẩn hoá URL**: test bỏ tracking/redirect/canonical.

---

## 10. Rủi ro & giảm thiểu

| Rủi ro | Giảm thiểu |
|---|---|
| Âm tính giả (bỏ sót trùng) | Nhiều lớp + chạy lại ở review; admin xem "tương tự" |
| Dương tính giả (báo trùng nhầm) | Không tự xoá; admin quyết; lưu điểm từng lớp |
| Quá phụ thuộc similarity | Kết hợp lớp cứng L1/L2 + review |
| Chi phí so khớp toàn bộ | Index `pg_trgm`, giới hạn ứng viên (candidate generation) trước khi chấm điểm |
| Ảnh: quyền & chi phí | L6 **mặc định tắt**; chỉ bật khi có ảnh hợp lệ |

---

## 11. Kết luận P16.4

- **6 lớp kiểm** (L1 canonical URL → L2 source URL → L3 title → L4 nguyên liệu → L5 hướng dẫn → L6 ảnh) + **4 nhãn** (EXACT/LIKELY/SIMILAR/DIFFERENT).
- **Không tự xoá/ghi đè**; chỉ gắn nhãn + `DuplicateCandidate` cho admin; ghi `AuditLog`.
- Xử lý 5 tình huống (hai nguồn, nhiều phiên bản, URL đã nhập, cập nhật nguồn, tên khác–nguyên liệu giống).
- **Data Quality Score có giải thích từng tiêu chí**, không thay thế kiểm duyệt. Đầu ra liên kết P16.2/P16.3/P16.6/P16.7.
