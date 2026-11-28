# P16.6 — ADMIN REVIEW WORKFLOW

> Phase **P16** (thiết kế) · Milestone **P16.6** · 1 AI Agent · Không triển khai code.
> Mục tiêu: thiết kế **giao diện & luồng duyệt** cho admin nhập công thức — **đánh giá và tinh gọn** tập trạng thái, đặc tả các thao tác admin cần, và **chốt quyền truy cập**.
> Nguyên tắc gốc: **chỉ admin** thao tác; **không** tài khoản công khai, **không** chức năng cộng đồng; **không** auto-publish (P16.3).
> Liên quan: [BATCH_PROCESSING_ARCHITECTURE.md](./BATCH_PROCESSING_ARCHITECTURE.md) · [VIETNAMESE_LOCALIZATION.md](./VIETNAMESE_LOCALIZATION.md) · [DUPLICATE_DETECTION.md](./DUPLICATE_DETECTION.md) · [API_DESIGN.md](./API_DESIGN.md).

---

## 1. Đánh giá tập trạng thái đề xuất (bắt buộc)

Đề xuất gốc có **12 trạng thái**. Đánh giá theo nguyên tắc "đủ để vận hành, không dư thừa":

| # | Trạng thái đề xuất | Đánh giá | Kết luận |
|---|---|---|---|
| 1 | `DISCOVERED` | Hữu ích ở Auto Discovery (đã tìm thấy URL, chưa vào job) | **Giữ** (chỉ dùng cho auto-discovery) |
| 2 | `QUEUED` | Đã vào job, chờ xử lý | **Giữ** |
| 3 | `FETCHING` | Trạng thái **kỹ thuật tạm thời** của pipeline | **GỘP** vào `PROCESSING` |
| 4 | `EXTRACTED` | Trạng thái **kỹ thuật tạm thời** | **GỘP** vào `PROCESSING` |
| 5 | `TRANSLATING` | Trạng thái **kỹ thuật tạm thời** | **GỘP** vào `PROCESSING` |
| 6 | `VALIDATING` | Trạng thái **kỹ thuật tạm thời** | **GỘP** vào `PROCESSING` |
| 7 | `NEEDS_REVIEW` | Admin cần hành động | **Giữ** (trọng tâm) |
| 8 | `APPROVED` | Quyết định của admin | **Giữ** |
| 9 | `REJECTED` | Quyết định của admin | **Giữ** |
| 10 | `DUPLICATE` | Kết quả phát hiện trùng | **Giữ** |
| 11 | `FAILED` | Kết quả lỗi (dead-letter) | **Giữ** |
| 12 | `PUBLISHED` | Kết thúc | **Giữ** (ánh xạ `RecipeStatus = published`) |

**Lý do gộp 3–6:** `FETCHING/EXTRACTED/TRANSLATING/VALIDATING` là **các bước bên trong pipeline** (đã là trạng thái item ở P16.5) — **không** phải trạng thái **nghiệp vụ** mà admin quyết định ở đó. Giữ 4 trạng thái này ở cấp UI tạo "ồn trạng thái", khiến dashboard khó đọc và khó đếm. Thay vào đó:
- Cấp **nghiệp vụ** (admin nhìn) dùng **1 trạng thái** `PROCESSING`.
- Tiến độ chi tiết (đang fetch/extract/dịch/kiểm) hiển thị bằng **`processingStage`** (trường phụ, chỉ để hiển thị) — **không** phải nhánh trạng thái chính.

### 1.1 Tập trạng thái **được đề xuất** (tinh gọn — 9 trạng thái)

```
DISCOVERED ─▶ QUEUED ─▶ PROCESSING ─▶ NEEDS_REVIEW ─┬─▶ APPROVED ─▶ PUBLISHED
   (auto-disc)             │                          ├─▶ REJECTED
                           ├─▶ DUPLICATE              └─▶ (sửa rồi APPROVED)
                           └─▶ FAILED
```

| Trạng thái (đề xuất) | Ý nghĩa | Ai/ cái gì đặt | Trạng thái kết thúc? |
|---|---|---|---|
| `DISCOVERED` | Auto Discovery tìm thấy URL, chưa đưa vào job | Hệ thống (discovery) | Không |
| `QUEUED` | Đã vào job, chờ xử lý | Hệ thống/Admin | Không |
| `PROCESSING` | Đang chạy pipeline (fetch→extract→dịch→kiểm) | Worker | Không |
| `NEEDS_REVIEW` | Đã xử lý xong, cần admin duyệt | Worker | Không |
| `DUPLICATE` | Nghi/ xác định trùng (P16.4) | Worker/admin | Không (chờ admin quyết) |
| `FAILED` | Thất bại (dead-letter, P16.5) | Worker | Không (admin retry) |
| `APPROVED` | Admin đã duyệt nội dung | **Admin** | Không (chờ publish) |
| `REJECTED` | Admin từ chối | **Admin** | **Có** |
| `PUBLISHED` | Đã xuất bản (`RecipeStatus = published`) | **Admin** (qua `RecipeService.publish()`) | **Có** |

> **Ánh xạ sang schema hiện tại:** vùng **recipe chính thức** đã có `RecipeStatus (draft/in_review/published/archived)` + `ContentReviewAction (submit/approve/request_changes/publish/archive)` + `ContentReview`/`ContentReviewRecord` + `ReviewDecision (approved/rejected/changes_requested)`. Trạng thái importer (bảng trên) là **chiều riêng ở cấp `ImportJobItem`**; khi admin APPROVED + PUBLISHED → gọi `RecipeService.create()` (tạo `draft`/`in_review` → `publish()`) → dùng **đúng** các enum sẵn có, **không** tạo vòng đời recipe song song.

---

## 2. Luồng nghiệp vụ (end-to-end)

```
[Auto Discovery] ──▶ DISCOVERED ──(admin/auto-enqueue)──▶ QUEUED
[URL Import]     ─────────────────────────────────────▶ QUEUED
      QUEUED ──(worker claim)──▶ PROCESSING
      PROCESSING ──┬─(có kết quả)──▶ NEEDS_REVIEW
                   ├─(nghi trùng)──▶ DUPLICATE
                   └─(lỗi vĩnh viễn)─▶ FAILED
      NEEDS_REVIEW ──(admin)──┬─▶ APPROVED ──(publish)──▶ PUBLISHED
                              └─▶ REJECTED
      DUPLICATE ──(admin)──┬─▶ (hợp nhất/ bỏ qua) ─▶ (kết thúc nhánh)
                           └─▶ NEEDS_REVIEW (nếu admin xác nhận khác)
      FAILED ──(admin retry)──▶ QUEUED
```

**Tất cả** quyết định APPROVED/REJECTED/PUBLISHED/retry/hợp nhất → ghi `AuditLog` (không có hành động ẩn).

---

## 3. Thao tác admin (bắt buộc — theo yêu cầu)

| # | Yêu cầu | Màn hình/ thao tác | Dữ liệu nguồn |
|---|---|---|---|
| 1 | Xem danh sách công thức được tìm thấy | **Import Inbox** (bảng, lọc theo trạng thái/nguồn/job) | `ImportJobItem` + nhãn |
| 2 | Xem nguồn gốc | Panel "Nguồn": domain, URL gốc/canonical, registry status, robots/ToS, ngày truy cập | `ImportSource`, `ImportJobItem.sourceUrl`, `ContentSource` |
| 3 | Xem bản gốc & bản Việt hoá **song song** | Split view 2 cột (Original ↔ Vietnamese), đồng bộ cuộn | `RecipeTranslationDraft.originalContent`/`localizedContent` (P16.3) |
| 4 | Xem nguyên liệu & định lượng | Bảng nguyên liệu (tên, định lượng, đơn vị, trạng thái `MISSING/CONFIRMED`...) | `ExtractionResult.ingredients` (P16.2) |
| 5 | Xem cảnh báo dữ liệu | Khối "Cảnh báo": trường thiếu/xung đột, lỗi dịch I1–I9 | `warnings[]`, `validationResult` |
| 6 | Xem công thức nghi trùng | Panel "Trùng lặp": nhãn + công thức gần trùng + điểm từng lớp | `DuplicateCandidate` (P16.4) |
| 7 | Chỉnh sửa nội dung | Editor chỉnh bản Việt hoá (title/desc/nguyên liệu/bước) | — |
| 8 | Duyệt / từ chối | Nút APPROVE/REJECT + ghi chú | → `ContentReview`, `ReviewDecision` |
| 9 | Retry item lỗi | Nút Retry trên item FAILED → về QUEUED | `ImportJobItem` |
| 10 | Xem lịch sử import | Trang History: job, thời gian, kết quả, người thao tác | `ImportJob` + `AuditLog` |
| 11 | Xuất bản sau khi duyệt | Nút Publish (chỉ khi APPROVED & đạt `assertPublishable`) | `RecipeService.publish()` |

> **Chỉnh sửa nội dung (7)** không ghi trực tiếp vào `recipes`; ghi vào bản nháp, chỉ khi APPROVED + PUBLISHED mới gọi `RecipeService`. Điều này giữ **một đường ghi dữ liệu chính thức** duy nhất.

---

## 4. Ràng buộc bảo mật & quyền

- **Chỉ admin** (hoặc editor có quyền importer) thao tác. **Không** route công khai; **không** đăng ký tài khoản; **không** tính năng cộng đồng.
- RBAC hiện có: `Actor{id, role: user|editor|admin}` + `requirePermission()` trong `lib/auth/authorization.ts`. Permission union **hiện chưa có** permission cho importer → **đề xuất bổ sung** (vd `import:read`, `import:manage`, `import:approve`, `import:publish`) — **P16 không đổi code**, chỉ ghi đề xuất (xem P16.7/P16.9).
- Lưu ý thực tế đã audit: `getCurrentActor()` hiện trả `null` (Auth.js chưa nối — blocker B-P06-02). Do đó **mọi route admin importer đều phụ thuộc việc nối Auth.js**; đây là **phụ thuộc bắt buộc** trước khi triển khai UI thật.
- **Không** hiển thị nội dung nguồn công khai; raw HTML/ảnh chỉ admin xem.
- Mọi hành động duyệt/publish đều ghi `AuditLog` (actor, action, entity, thời gian).

---

## 5. Thành phần UI (đề xuất — không triển khai ở P16)

| Màn hình | Chức năng |
|---|---|
| **Import Inbox** | Danh sách item theo trạng thái; lọc/đếm; mở chi tiết |
| **Item Detail** | Split view gốc↔Việt; bảng nguyên liệu; cảnh báo; panel nguồn; panel trùng lặp; editor; nút APPROVE/REJECT/Retry/Publish |
| **Jobs** | Danh sách ImportJob + tiến độ (đếm theo trạng thái) + Cancel/Resume |
| **Sources** | Quản lý Source Registry (P16.1): bật/tắt, trạng thái, robots/ToS |
| **History/Audit** | Lịch sử import & thao tác admin |

- Thiết kế theo **component hiện có** (App Router + Tailwind 4 + Lucide); tái sử dụng pattern list/detail của trang admin recipe hiện tại.

---

## 6. Ràng buộc & tiêu chí nghiệm thu (workflow)

- Không thể tới `PUBLISHED` nếu **chưa** `APPROVED` hoặc chưa đạt `assertPublishable()` (BR-01/BR-03).
- Item `FAILED`/`DUPLICATE` **không** bị xoá tự động; admin quyết định.
- Mọi thao tác admin đều qua RBAC + `AuditLog`.
- Bản gốc **luôn** xem được cạnh bản Việt hoá (không mất nguồn).

---

## 7. Rủi ro & giảm thiểu

| Rủi ro | Giảm thiểu |
|---|---|
| Trạng thái quá nhiều → khó vận hành | Tinh gọn về **9** trạng thái; tách `processingStage` chỉ để hiển thị |
| Lộ nội dung nguồn/ ảnh | Chỉ admin; raw không công khai |
| Publish nhầm | Bắt buộc APPROVED + `assertPublishable()` + AuditLog |
| Phụ thuộc Auth.js chưa nối | Ghi rõ là **điều kiện tiên quyết** triển khai UI (blocker B-P06-02) |
| Admin sửa trực tiếp DB | Không cho ghi thẳng `recipes`; chỉ một đường ghi qua `RecipeService` |

---

## 8. Kết luận P16.6

- **Đánh giá & tinh gọn**: từ **12 → 9 trạng thái** (gộp `FETCHING/EXTRACTED/TRANSLATING/VALIDATING` vào `PROCESSING` + `processingStage`).
- Đặc tả **11 thao tác admin** (đúng yêu cầu), split view gốc↔Việt, panel nguồn/cảnh báo/trùng.
- **Chỉ admin**, không tài khoản công khai/cộng đồng; RBAC + `AuditLog`; phụ thuộc Auth.js (blocker).
- Một **đường ghi chính thức duy nhất** (`RecipeService`); không auto-publish. Đầu ra liên kết P16.3/P16.4/P16.5/P16.7.
