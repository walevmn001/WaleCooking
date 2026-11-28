# I2.1 — SOURCE REGISTRY DESIGN (Thiết kế Source Registry)

> Phase **I2.1** (thiết kế, **KHÔNG triển khai**) · 1 AI Agent · không sub-agent.
> Mục tiêu: đặc tả **Source Registry** (yêu cầu C) — cơ chế quản lý nguồn cho URL Import.
> Nguồn: `docs/P16/SOURCE_DISCOVERY_STRATEGY.md` §4–§5 (robots/ToS/copyright/attribution/rate/ảnh/opt-out; bảng trường + vòng đời trạng thái).
> Nguyên tắc: **không tự động tin tưởng domain chỉ vì admin nhập URL**; mọi nguồn mặc định ở trạng thái hạn chế nhất; chưa đánh giá ⇒ `manual_only` + `do_not_copy`.

---

## 1. Bảng dữ liệu đã tồn tại (đối chiếu thực tế — KHÔNG sửa schema)

Model **`ImportSource`** (`prisma/schema.prisma`, dòng 1368) đã có sẵn các trường cần cho registry:

| Trường | Kiểu | Vai trò trong registry |
|---|---|---|
| `name` | `String` | Tên hiển thị nguồn |
| `domain` | `String` **@unique** | Khoá nhận diện nguồn (tra theo domain) |
| `homepageUrl` | `String?` | Trang chủ để hiển thị |
| `sourceUrls` | `Json?` | Danh sách URL mẫu/entry (discovery) |
| `discoveryMethods` | `Json?` | Phương thức tìm thấy (D1–D9) |
| `supportStatus` | `ImportSourceStatus` | Mức hỗ trợ (xem §3) |
| `robotsPolicy` | `Json?` | Kết quả kiểm robots.txt |
| `tosPolicy` | `Json?` | Ghi chú ToS |
| `contentPolicy` | `ContentReusePolicy` | Chính sách tái sử dụng nội dung |
| `imagePolicy` | `ImageReusePolicy` | Chính sách ảnh |
| `extractorConfig` | `Json?` | **Cấu hình parser** (selector/adapter riêng theo domain) |
| `rateLimit` | `Json?` | **Rate limit theo domain** |
| `lastCrawledAt` | `DateTime?` | Lần crawl cuối |
| `lastStatus` | `ImportSourceLastStatus` | Trạng thái lần truy cập cuối |
| `lastError` | `String?` | Lỗi gần nhất (đã làm sạch) |
| `enabled` | `Boolean @default(false)` | Bật/tắt nguồn |
| `createdAt`/`updatedAt` | `DateTime` | Dấu thời gian |

Ràng buộc đã có: `@@unique([domain])`, `@@index([supportStatus, enabled])`, `@@index([lastStatus])`.
Quan hệ: `jobs ImportJob[]`, `items ImportJobItem[]`.

> **Kết luận:** registry I2 **không** cần thêm bảng/cột. Nếu về sau cần thêm (ví dụ allow-list port), ghi **đề xuất** cho phase riêng — **không** sửa schema ở I2.1.

---

## 2. Quy tắc nhận diện nguồn

1. **Chuẩn hoá host** từ URL: lowercase, bỏ `www.`, bỏ dấu `.` cuối, giữ eTLD+1 (ví dụ `www.example.com` → `example.com`).
2. Tra `ImportSource` theo `domain` (unique). Kết quả: **registered** hoặc **unregistered**.
3. **Không** tự tạo nguồn. **Không** tự tăng tin cậy. Domain lạ ⇒ áp chính sách **chặt nhất**.
4. Subdomain: mặc định coi là **cùng nguồn** với eTLD+1 (trừ khi registry khai báo tách). Ghi `warnings[]` nếu subdomain khác hostname chính của nguồn.

---

## 3. Trạng thái nguồn (`ImportSourceStatus`) & hành vi URL Import

| `supportStatus` | Ý nghĩa | Hành vi ở URL Import (I2) |
|---|---|---|
| `auto_enabled` | Nguồn ổn định, cho phép tự động (I8) | Cho phép; URL Import luôn hợp lệ |
| `url_import_only` | Chỉ cho URL Import thủ công | Cho phép (đúng luồng I2) |
| `manual_only` | Chỉ tham khảo thủ công | Cho phép tạo nháp + **cảnh báo** "không sao chép nội dung" |
| `paused_blocked` | Tạm dừng (robots/ToS/bản quyền) | **Chặn** tự động (409/422), gợi ý xử lý thủ công |
| `disallowed` | Không được phép | **Chặn** (422) |
| `disabled` | Admin tắt | **Chặn** (422) |

> **Unregistered** (domain không có trong registry): **cho phép** URL Import (admin chủ động) nhưng áp `contentPolicy=manual_only`, `imagePolicy=do_not_copy` và gắn `warnings[]` "nguồn chưa đánh giá (robots/ToS/bản quyền)". Xem `URL_IMPORT_FLOW.md` §2 bước 3.

Ngoài `supportStatus`, `enabled=false` **luôn** ⇒ chặn (kể cả `url_import_only`).

---

## 4. Chính sách nội dung & ảnh

- **`contentPolicy` (`ContentReusePolicy`)**: quyết định mức tái sử dụng nội dung (đọc hiểu vs trích nguyên văn vs chỉ số liệu ý tưởng). Với `manual_only`/chưa đánh giá ⇒ importer **chỉ** lưu bản nháp nội bộ, gắn attribution bắt buộc khi publish (BR-03).
- **`imagePolicy` (`ImageReusePolicy`)**: mặc định `do_not_copy`. I2 **không** tải ảnh (thuộc I9); nếu `do_not_copy` thì bước publish **không** được gắn ảnh nguồn.
- **Attribution/copyright**: mọi publish từ nguồn phải tạo `ContentSource` + `RecipeSource` + `SourceAttribution` (bước 9) — trường `copyrightNote`, `license`, `usageConditions`, `verifiedStatus`.

---

## 5. Cấu hình parser (`extractorConfig`) & rate limit (`rateLimit`)

### 5.1 `extractorConfig` (Json)
Cấu hình riêng theo domain cho tầng trích xuất (E3 site adapter — `EXTRACTION_DESIGN.md`), ví dụ (đề xuất cấu trúc, chỉ là hợp đồng dữ liệu):
```jsonc
{
  "adapter": "generic-jsonld" | "site:<name>",
  "selectors": { "ingredients": "...", "instructions": "...", "prepTime": "...", "cookTime": "...", "servings": "..." },
  "urlPatterns": ["https://example.com/recipe/*"],
  "encoding": "utf-8",
  "notes": "..."
}
```
- I2 chỉ dùng **E1 JSON-LD generic**; `extractorConfig` để dành cho E3 (I3), nhưng registry phải **đọc được** để không phải đổi schema sau.
- Config **không** tin được từ nguồn; do admin thiết lập.

### 5.2 `rateLimit` (Json)
Hợp đồng đề xuất:
```jsonc
{ "requestsPerMinute": 6, "concurrency": 1, "minDelayMs": 2000 }
```
- Áp **theo domain** ở tầng fetch (kết hợp rate limit theo actor — `API_AUTH_DESIGN.md`).
- Nguồn chưa đánh giá dùng **mặc định bảo thủ** (ví dụ 1 req/2s, concurrency 1).
- Vượt rate limit nguồn ⇒ dừng & đặt item `queued` với `nextAttemptAt` (không retry dồn dập).

---

## 6. Trạng thái lần truy cập (`ImportSourceLastStatus`) & lỗi

| `lastStatus` | Khi nào | Ghi chú |
|---|---|---|
| `unknown` | Mới tạo, chưa truy cập | Mặc định |
| `ok` | Fetch + parse thành công | Cập nhật `lastCrawledAt` |
| `blocked` | 401/403/robots cấm | Gắn `warnings[]`, cân nhắc `paused_blocked` |
| `rate_limited` | 429 | Tôn trọng `Retry-After` (giới hạn) |
| `parse_failed` | HTML đổi cấu trúc/không trích được | Không hạ cấp nguồn tự động |

- `lastError`: **chuỗi đã làm sạch** (không IP nội bộ/lỗi DNS chi tiết/stack). Chỉ admin xem qua UI nội bộ.
- Cập nhật trạng thái nguồn **sau** mỗi lần fetch thuộc luồng URL Import.

---

## 7. Quy trình thêm / bật / vô hiệu hoá nguồn

**Thêm nguồn (admin, `source:manage`, thủ công — không tự động ở I2):**
1. Admin nhập domain + homepage; hệ thống ghi nhận `robotsPolicy`/`tosPolicy` (kiểm thủ công hoặc công cụ — không thuộc I2).
2. Chọn `supportStatus` (**khởi điểm khuyến nghị = `url_import_only` hoặc `manual_only`**), `contentPolicy`, `imagePolicy` (**khuyến nghị `do_not_copy`**).
3. `extractorConfig`/`rateLimit` tùy chọn.
4. `enabled=true` chỉ khi đã đánh giá.
5. Ghi `AuditLog` (`entityType="import_source"`).

**Vô hiệu hoá nguồn:** đặt `enabled=false` hoặc `supportStatus=disabled`/`paused_blocked` — **không** xoá (giữ lịch sử job/item; FK `ImportJob.sourceId onDelete: SetNull`). Ghi `AuditLog`.

**Nguyên tắc quản trị:**
- Không auto-promote (unregistered → registered) trong URL Import.
- Hạ cấp phải do admin, có lý do; tự động chỉ **gắn cờ** (`blocked`/`rate_limited`), không tự đổi `supportStatus`.
- Mọi thay đổi registry → AuditLog.

---

## 8. Ánh xạ sang API (đề xuất — thuộc I6/I8, không thuộc I2)

| Thao tác | Endpoint đề xuất | Permission |
|---|---|---|
| Liệt kê nguồn | `GET /api/v1/admin/import/sources` | `import:read` |
| Xem nguồn | `GET /api/v1/admin/import/sources/:id` | `import:read` |
| Tạo nguồn | `POST /api/v1/admin/import/sources` | `source:manage` |
| Cập nhật/bật-tắt nguồn | `PATCH /api/v1/admin/import/sources/:id` | `source:manage` |

I2 chỉ cần **đọc** registry để tra cứu domain (qua port `findSourceByDomain` đã có ở I1).

---

## 9. Bất biến

1. Domain lạ **không** tự thành nguồn tin cậy.
2. `enabled=false`/`disallowed`/`paused_blocked`/`disabled` ⇒ **chặn** fetch.
3. Chính sách mặc định của nguồn chưa đánh giá = **chặt nhất** (`manual_only` + `do_not_copy`).
4. `extractorConfig`/`rateLimit` **không** tin từ nguồn; do admin đặt.
5. Xoá nguồn **không** xoá job/item (SetNull); mọi thay đổi → AuditLog.

---

## 10. Kết luận

- Source Registry dùng **đúng** model `ImportSource` đã triển khai ở I1 — **không** cần đổi schema.
- Cơ chế nhận diện nguồn + 6 trạng thái + chính sách + cấu hình parser + rate limit + trạng thái lỗi + quy trình quản trị đã đặc tả đầy đủ.
- Nguyên tắc cốt lõi giữ vững: **không tự tin tưởng domain chỉ vì admin nhập URL**.
