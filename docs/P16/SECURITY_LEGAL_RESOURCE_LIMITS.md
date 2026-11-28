# P16.8 — SECURITY, LEGAL & RESOURCE LIMITS

> Phase **P16** (thiết kế) · Milestone **P16.8** · 1 AI Agent · Không triển khai code.
> Mục tiêu: phân tích **rủi ro bảo mật & pháp lý** của Recipe Importer và đặc tả **biện pháp bảo vệ**, cùng **giới hạn tài nguyên/chi phí**.
> Nguyên tắc gốc: URL do người dùng nhập là **dữ liệu không đáng tin**; **không** thiết kế bất kỳ tính năng vượt paywall/CAPTCHA/anti-bot.
> Liên quan: [SOURCE_DISCOVERY_STRATEGY.md](./SOURCE_DISCOVERY_STRATEGY.md) · [EXTRACTION_ENGINE.md](./EXTRACTION_ENGINE.md) · [BATCH_PROCESSING_ARCHITECTURE.md](./BATCH_PROCESSING_ARCHITECTURE.md) · [docs/P07/RECIPE_CONTENT_POLICY.md](../P07/RECIPE_CONTENT_POLICY.md).

---

## 1. Mô hình mối đe dọa (tóm tắt)

```
Nguồn ngoài (không tin) ──▶ [FETCH] ──▶ [PARSE] ──▶ [DỊCH/AI] ──▶ [LƯU] ──▶ [DUYỆT]
   HTML/ảnh/redirect          │           │            │          │
                              │           │            └─ prompt injection (nội dung→AI)
                              │           └─ HTML độc hại, kích thước lớn
                              └─ SSRF, private IP, DNS rebinding, redirect nội bộ, file độc hại
Người dùng nội bộ (admin) ──▶ [API] ──▶ lạm dụng, chi phí, tải DB
```

---

## 2. Rủi ro & biện pháp (bắt buộc)

### 2.1 SSRF & URL không tin cậy

| Rủi ro | Biện pháp |
|---|---|
| **SSRF khi nhập URL** | Chỉ cho phép **http/https**; **deny** mọi scheme khác (`file:`, `gopher:`, `ftp:`, `data:`) |
| **Truy cập localhost/private IP** | Resolve DNS rồi **chặn** dải private/loopback/link-local/reserved: `127.0.0.0/8`, `10/8`, `172.16/12`, `192.168/16`, `169.254/16`, `::1`, `fc00::/7`, `fe80::/10`, `0.0.0.0`, và metadata cloud (vd `169.254.169.254`) |
| **DNS rebinding** | **Resolve DNS → pin IP đã kiểm tra** rồi kết nối tới **ĐÚNG IP đó** (không resolve lần hai); kiểm lại IP ở **mỗi** redirect |
| **Redirect tới địa chỉ nội bộ** | **Giới hạn số redirect** (vd ≤5); ở **mỗi** hop: kiểm scheme + IP; hop trỏ private → **dừng** |
| URL allow/deny | **Deny-list domain** (P16.1 §4.7) ưu tiên tuyệt đối; chỉ http/https; hostname hợp lệ |
| Port lạ | Chỉ cho phép **80/443** (hoặc cổng chuẩn); chặn port nội bộ |

### 2.2 Fetch an toàn

| Rủi ro | Biện pháp |
|---|---|
| **File quá lớn** | **Giới hạn response size** (vd ≤5 MB HTML; ảnh ≤8 MB theo `MAX_IMAGE_BYTES` hiện có); đọc theo **stream + ngắt** khi vượt |
| **File ảnh độc tệ** | **Không** thực thi ảnh; validate **magic bytes** bằng `validateImageFile()` (chỉ JPEG/PNG/WebP/AVIF); **không** tin `Content-Type` |
| **Giới hạn loại file và MIME** | **Allow-list** MIME (`text/html`, `application/xhtml+xml`, `application/ld+json`, ảnh cho phép); khác → bỏ |
| Content-Type sai | Sniff **magic bytes** cho ảnh; HTML phải có `text/html`/`application/xhtml+xml` |
| **Giới hạn timeout** | Timeout fetch (vd ≤15s), đọc body (≤10s), tổng item (P16.5) |
| Nén bom (zip bomb) | Không giải nén không giới hạn; bỏ nếu `Content-Encoding` bất thường |

### 2.3 Xử lý HTML/JS

| Rủi ro | Biện pháp |
|---|---|
| **HTML độc hại** | **Sanitize** trước khi lưu/đưa vào AI: loại `<script>`, `<style>`, event handler, iframe; chỉ giữ text + cấu trúc cần cho extraction |
| **Không thực thi JavaScript từ nguồn** | **Không** chạy JS; **không** headless browser thực thi script bên thứ ba; chỉ parse HTML tĩnh (server-rendered/JSON-LD) |
| XSS khi hiển thị cho admin | Render nội dung nguồn dạng **text/escaped** trong UI (không `dangerouslySetInnerHTML`) |

### 2.4 Prompt injection & AI

| Rủi ro | Biện pháp |
|---|---|
| **Prompt injection trong nội dung website** | **Không** coi nội dung web là instruction; đặt nội dung trong **khối dữ liệu rõ ràng**; hệ thống chỉ trích/dịch, không "làm theo" văn bản trong trang |
| **AI xử lý nội dung không đáng tin** | AI **chỉ trích nguyên văn** (P16.2) / **chỉ dịch** (P16.3); **cấm** bịa/chỉnh dữ kiện; output AI **luôn** gắn cờ `ai_assisted` + **bắt buộc** review người |
| AI bỏ qua hướng dẫn | Kiểm **bất biến số** (P16.3 I1–I7) độc lập với AI; coi output AI là **đáng nghi** |

### 2.5 Lạm dụng API & tài nguyên

| Rủi ro | Biện pháp |
|---|---|
| **Lạm dụng API** | **Chỉ admin** (RBAC + permission importer); rate limit theo actor; trần 500 item/job |
| **Chi phí AI** | **Ngân sách/ngân sách cứng** cho dịch & extraction AI; **cache** theo `idempotencyKey`/`contentHash`; chỉ gọi AI khi E1–E4 không đủ; theo dõi chi phí |
| **Quá tải database** | Lô nhỏ, ít truy vấn; index đúng; checkpoint sau mỗi item; tôn trọng Neon scale-to-zero/CU-giờ (P16.5 §6.4) |
| **Rate limit và website blocking** | Rate limit **theo domain** (tôn trọng `Crawl-delay`), backoff, `PAUSED_BLOCKED`; **không** dồn dập |
| Chi phí egress/transfer | Ưu tiên worker không bị tính transfer lớn (GitHub Actions/self-host — P16.5) |

### 2.6 Kiểm soát & truy vết

| Biện pháp | Chi tiết |
|---|---|
| **Kiểm tra quyền admin** | Mọi endpoint importer qua `requirePermission(...)` (permission importer đề xuất — P16.7 §1); **không** route công khai |
| **Audit log** | Mọi hành động (tạo job, thêm URL, retry, approve/reject, publish, đổi nguồn) → `AuditLog` (actor, action, entity, thời gian, ip/UA nếu có) |
| Log an toàn | **Không** log secret/connection string; lỗi nêu tên biến, không nêu giá trị (đúng `lib/config/env.ts`) |
| Secrets | **Không** đưa credentials/API key/cookie vào Git; dùng env/secret store |

---

## 3. Kiểm tra URL — thứ tự thực thi (đề xuất)

```
1. Parse URL; yêu cầu scheme ∈ {http, https}.      (nếu khác → DENY)
2. Deny-list domain (P16.1 §4.7).                   (nếu khớp → DENY)
3. Resolve DNS → tập IP.
4. Kiểm mọi IP ∉ private/loopback/link-local/reserved/metadata. (nếu có IP cấm → DENY)
5. Pin 1 IP hợp lệ → kết nối tới ĐÚNG IP đó (Host header = hostname gốc).
6. Theo redirect (≤5): lặp bước 1–5 ở MỖI hop.
7. Kiểm Content-Type allow-list + giới hạn size + timeout.
8. Không thực thi JS; sanitize trước khi lưu/đưa cho AI.
```

> Bước 3–5 xử lý **DNS rebinding** (resolve một lần, pin IP) và **redirect nội bộ** (kiểm lại mỗi hop).

---

## 4. Bản quyền & pháp lý (đánh giá)

### 4.1 Nguyên tắc: **không mặc định được phép**
- **Không** mặc định được phép sao chép **toàn bộ công thức** hoặc **ảnh** từ nguồn.
- Mặc định an toàn: nguồn mới = `manual_only` / `do_not_copy` (P16.1 §5).

### 4.2 Phân biệt loại nội dung

| Loại | Bảo hộ | Xử lý trong WALE |
|---|---|---|
| **Facts** (tên món, danh sách nguyên liệu cơ bản) | Thường **không** được bảo hộ | Có thể dùng làm dữ kiện |
| **Cách diễn đạt** (mô tả, hướng dẫn viết) | **Được bảo hộ** | **Không** sao chép nguyên văn; **viết lại** (BR-03) |
| **Ảnh** | **Luôn** được bảo hộ riêng | **Không** tải/hiển thị lại trừ khi có quyền (P16.1 §4.6) |
| **Nội dung sáng tạo** (bài viết, mẹo riêng) | Được bảo hộ | Không sao chép |

### 4.3 Attribution & chính sách tái sử dụng
- **Lưu attribution + link nguồn**: mọi công thức nhập ngoài → `ContentSource` (`name/url/authorOrOrg/accessedAt/license`) + `RecipeSource` (BR-03); `assertPublishable()` **bắt buộc ≥1 nguồn** (cổng pháp lý).
- **Xác định chính sách sử dụng lại nội dung TRƯỚC khi xuất bản**: `ImportSource.content_policy` (`facts_only`/`rewrite_required`/`licensed_reuse`/`manual_only`) + `image_policy`. Không rõ → **manual_only**.

### 4.4 Không vượt rào cản kỹ thuật
- **Không** thiết kế tính năng nhằm **vượt paywall, CAPTCHA, hoặc biện pháp chống bot** (P16.1 §4.7).
- Gặp rào cản → `MANUAL_ONLY` (admin tự đọc & viết lại), **không** né tránh.
- Tôn trọng `robots.txt`, `X-Robots-Tag`, meta robots, deny-list, và yêu cầu gỡ bỏ.

---

## 5. Giới hạn tài nguyên & chi phí (bám nền tảng free)

| Tài nguyên | Nền tảng | Giới hạn | Biện pháp không vượt |
|---|---|---|---|
| Function duration/worker | Vercel Hobby | Không chạy worker dài hạn | Tick ngắn / worker ở GitHub Actions (P16.5 §6.3) |
| Transfer/request | Vercel Hobby | ~100GB/~1M req/tháng | Trần 500 item; lô nhỏ |
| DB storage/CU-giờ | Neon Free | 1GB / 100 CU-giờ / scale-to-zero | Ít truy vấn; checkpoint nhẹ; dọn TTL |
| Object storage/ops | R2 Free | 10GB / 1M+10M ops / egress $0 | Chỉ tải ảnh khi được phép; raw có TTL |
| **Chi phí AI** | (biến số) | — | Ngân sách cứng + cache + chỉ dùng khi cần |
| Rate/website | Nguồn ngoài | ToS/robots | Rate limit theo domain + backoff + PAUSED_BLOCKED |

> Số liệu nền tảng theo `docs/P02/DEPLOYMENT_ARCHITECTURE.md §` (đã kiểm chứng); **cần kiểm chứng live khi triển khai** (đánh dấu "chưa kiểm chứng" ở P16.0 §7).

---

## 6. Checklist bảo mật (để triển khai & test)

- [ ] Chỉ http/https; deny scheme khác.
- [ ] Chặn private/loopback/link-local/reserved/metadata IP.
- [ ] Resolve-once + pin IP (chống DNS rebinding); kiểm lại mỗi redirect.
- [ ] Giới hạn redirect (≤5), timeout, response size, MIME allow-list.
- [ ] Ảnh: magic bytes + `MAX_IMAGE_BYTES`; không thực thi.
- [ ] Sanitize HTML; không chạy JS; render escaped cho admin.
- [ ] Không coi nội dung web là instruction; AI chỉ trích/dịch; kiểm bất biến số độc lập.
- [ ] RBAC + permission importer; không route công khai.
- [ ] AuditLog mọi thao tác; log không chứa secret.
- [ ] Ngân sách AI + cache; rate limit theo domain; trần 500 item/đợt.

---

## 7. Rủi ro còn lại (chưa giải quyết ở P16)

- **Chưa có test tự động** cho URL validator/SSRF guard → cần khi triển khai (P16.9).
- Cơ chế **allow/deny-list** cần dữ liệu vận hành (nguồn thực) để hiệu chỉnh.
- **Chi phí AI** thực tế chưa đo; chỉ có thiết kế ngân sách.
- Phụ thuộc **Auth.js chưa nối** (B-P06-02) → mọi kiểm quyền chưa hoạt động thật.

---

## 8. Kết luận P16.8

- Đặc tả bảo vệ đầy đủ cho **SSRF/private IP/DNS rebinding/redirect/file-HTML độc hại/prompt injection/lạm dụng/chi phí/tải DB/blocking**.
- **Không** vượt paywall/CAPTCHA/anti-bot; **không** mặc định được phép sao chép nội dung/ảnh.
- **Attribution bắt buộc** (BR-03), xác định **chính sách tái sử dụng trước khi publish**.
- **Giới hạn tài nguyên/chi phí** bám nền tảng free. Đầu ra liên kết P16.1/P16.2/P16.5/P16.7/P16.9.
