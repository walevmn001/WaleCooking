# P16.1 — SOURCE DISCOVERY STRATEGY

> Phase **P16** (thiết kế) · Milestone **P16.1** · 1 AI Agent · Không triển khai code.
> Mục tiêu: thiết kế **cách tìm & đánh giá nguồn công thức** cho hệ thống WALE COOKING Recipe Importer, và đặc tả **Source Registry**.
> Nguyên tắc gốc: **không mặc định** bất kỳ website nào cho phép crawl hoặc tái sử dụng nội dung. Mỗi nguồn phải được **đánh giá riêng** trước khi bật.
> Liên quan: [P16.0_AUDIT.md](../checkpoints/P16.0_AUDIT.md) · [SECURITY_LEGAL_RESOURCE_LIMITS.md](./SECURITY_LEGAL_RESOURCE_LIMITS.md) · [DATABASE_DESIGN.md](./DATABASE_DESIGN.md).

---

## 1. Hai phương thức thu thập (bối cảnh)

| Phương thức | Mô tả | Mức kiểm soát | Giai đoạn |
|---|---|---|---|
| **A. URL Import** | Admin dán 1 hoặc nhiều URL → hệ thống tải & trích xuất | **Cao** (admin chọn nguồn cụ thể) | **Ưu tiên trước** |
| **B. Auto Discovery** | Hệ thống tự tìm công thức từ nhiều website nguồn | Thấp (phải qua Source Registry + chính sách) | Sau, khi A ổn định |

> **Nguyên tắc thứ tự:** URL Import hoạt động ổn định → mới mở Auto Discovery. Auto Discovery **chỉ** chạy trên nguồn đã được đánh giá & bật trong Source Registry; **không** crawl toàn Internet.

---

## 2. Các phương thức Discovery & Extraction nguồn (phân tích)

| # | Phương thức | Cơ chế | Ưu điểm | Rủi ro / giới hạn | Dùng cho |
|---|---|---|---|---|---|
| D1 | **Search engine công khai** | Truy vấn engine (Bing/DuckDuckGo API, hoặc tự dựng từ nguồn cho phép) để tìm URL công thức | Tìm được nguồn mới | **Bị ToS/rate limit** của engine; kết quả nhiễu; phụ thuộc bên thứ ba | Auto Discovery (có kiểm soát) |
| D2 | **Trang công thức công khai** | Lấy danh sách URL từ trang danh mục/index của website (phân trang, "recipe index") | Nguồn có cấu trúc, đúng chủ đề | Mỗi site một cấu trúc → cần adapter | Auto Discovery |
| D3 | **Sitemap.xml / sitemap index** | Tải `/sitemap.xml` (+ `/robots.txt` khai báo sitemap), lọc URL theo pattern công thức | Chuẩn hoá, nhẹ, lịch sự | Không phải site nào cũng có; có thể chứa hàng trăm nghìn URL | Auto Discovery (**ưu tiên**) |
| D4 | **RSS / Atom feed** | Theo dõi feed để lấy bài **mới** | Nhẹ, có "delta", thân thiện | Chỉ bài mới; số site có feed công thức hạn chế | Auto Discovery |
| D5 | **Schema.org Recipe / JSON-LD** | Đọc `<script type="application/ld+json">` với `@type: Recipe` | **Chuẩn ngành**, hầu hết blog ẩm thực hiện đại có | Không phải site nào cũng có; JSON-LD có thể thiếu trường | **Extraction (P16.2)** |
| D6 | **URL do admin cấp** | Người quản trị dán URL | **Kiểm soát cao, rõ ý định**, dễ audit | Thủ công, tốn công người | **URL Import (ưu tiên)** |
| D7 | **Public API được nguồn cho phép** | Gọi API chính thức (có key/giới hạn) | Hợp pháp, ổn định | Cần đăng ký/key; ít nguồn mở API công thức | Tùy nguồn |
| D8 | **Open dataset / nội dung CC** | Dataset công thức giấy phép mở | Hợp pháp rõ ràng | Chất lượng biến động; cần ghi attribution | Backlog |
| D9 | **Nhập thủ công / biên tập** | Admin tự nhập, hoặc chỉ **dùng nguồn để tham khảo** | **Luôn hợp lệ**; kiểm soát 100% | Không tự động hoá | Nguồn "cần xử lý thủ công" |

---

## 3. Ma trận phân loại nguồn (4 tầng + thủ công)

Mỗi nguồn được chấm **độc lập** theo 5 tầng. **Không** suy diễn: một nguồn "truy cập được" **không** đồng nghĩa "được phép tái sử dụng".

| Tầng | Câu hỏi | Cách xác minh | Nếu KHÔNG đạt |
|---|---|---|---|
| **L1 — Tìm kiếm được** (discoverable) | Có cách lấy danh sách URL công thức không? | Có sitemap / recipe index / feed / search | Chỉ dùng khi admin dán URL |
| **L2 — Truy cập được** (accessible) | Tải được HTML/JSON-LD qua HTTP(S) công khai? | HEAD/GET, không cần login/paywall | **Dừng tự động**; chuyển xử lý thủ công |
| **L3 — Trích xuất được** (extractable) | Parse được dữ liệu công thức (JSON-LD hoặc HTML adapter)? | Có `schema.org/Recipe` hoặc HTML khớp selector | Fallback extractor → nếu vẫn fail → review thủ công |
| **L4 — Được phép sử dụng** (permitted) | Robots.txt + ToS + bản quyền cho phép dùng **nội dung & ảnh** (và cách dùng: dẫn nguồn/không sao chép)? | Đọc `robots.txt`, ToS, license, ghi chú bản quyền | **Chỉ tham khảo thủ công**; **không** sao chép nguyên văn/ảnh vào WALE COOKING |
| **L5 — Thủ công** | Nguồn cần con người xử lý (paywall, CAPTCHA, anti-bot, license mơ hồ) | Đánh dấu `MANUAL_ONLY` | Admin tự đọc & **viết lại** theo BR-03 (ghi nguồn, không sao chép) |

> **Ví dụ minh hoạ** (KHÔNG phải danh sách "đã được phép crawl" — mỗi mục vẫn phải kiểm robots/ToS thực tế khi bật):
> - Blog ẩm thực dùng JSON-LD phổ biến → tiềm năng L1–L4 (kiểm ToS trước).
> - Website có paywall/CAPTCHA → **L5 MANUAL_ONLY**, tuyệt đối **không** vượt qua (xem `SECURITY_LEGAL_RESOURCE_LIMITS.md §5`).
> - Dataset giấy phép mở (CC) → L4 (điều kiện: ghi attribution theo license).

---

## 4. Phân tích chính sách pháp lý & kỹ thuật (bắt buộc cho mỗi nguồn)

### 4.1 Robots.txt
- **Bắt buộc đọc** `https://<domain>/robots.txt` trước khi truy cập bất kỳ URL nào; **tôn trọng** `Disallow`/`Allow` theo user-agent của importer.
- Ghi lại `Crawl-delay` (nếu có) → áp cho rate limit theo domain (P16.5).
- Đọc khai báo `Sitemap:` trong robots.txt để nạp nguồn D3.
- Cache kết quả robots có TTL (vd 24h) — **không** đọc lại mỗi request.
- Nếu robots **cấm** đường dẫn công thức → nguồn ở trạng thái **`BLOCKED_BY_ROBOTS`**, không auto-discovery.

### 4.2 Terms of Service (ToS)
- Rà soát ToS: có điều khoản **cấm thu thập tự động (scraping)**, **cấm tái sử dụng nội dung**, hoặc yêu cầu **giấy phép/đồng ý** không?
- Nếu ToS cấm → **`MANUAL_ONLY`** (chỉ admin tham khảo & viết lại; không crawler).
- Ghi lại **ngày** đọc ToS + **trích dẫn điều khoản** vào `usage_conditions` của nguồn để có bằng chứng.

### 4.3 Copyright & bản quyền
- **Sự thật (facts)** như tên món, danh sách nguyên liệu cơ bản → thường **không** được bảo hộ (nhưng cách diễn đạt thì có).
- **Cách diễn đạt** (mô tả, hướng dẫn viết) → **được bảo hộ** → **không** sao chép nguyên văn.
- **Ảnh** → hầu như **luôn** được bảo hộ riêng → **không** tải/hiển thị lại trừ khi có quyền/giấy phép rõ ràng (xem §4.6).
- Hệ quả cho WALE COOKING: importer thu thập để **admin biên tập lại** thành nội dung WALE COOKING (theo `docs/P07/RECIPE_CONTENT_POLICY.md`, BR-03); **không** đăng nguyên văn/ảnh nguồn như nội dung của mình.

### 4.4 Attribution (ghi nguồn)
- Mọi công thức nhập từ nguồn ngoài **phải** có `ContentSource` + `RecipeSource` ghi `name/authorOrOrg/url/accessedAt/license` và (khi cần) `SourceAttribution.attributionText`.
- `assertPublishable()` đã **bắt buộc ≥1 nguồn** khi publish → importer **tái sử dụng** ràng buộc này làm "cổng" pháp lý (không có nguồn ⇒ không publish).

### 4.5 Rate limiting (lịch sự)
- Giới hạn **request/giây theo domain** (mặc định thấp, tôn trọng `Crawl-delay`); backoff khi 429/503.
- User-Agent **nhận diện được** + URL liên hệ (theo thông lệ tốt), **không** giả dạng trình duyệt để lách chặn.
- Nếu nguồn **từ chối** (403/429 lặp lại) → chuyển nguồn sang **`PAUSED_BLOCKED`** (P16.5).

### 4.6 Quy định về ảnh
- Mặc định **KHÔNG** tải ảnh nguồn (bản quyền riêng + MIME/SSRF rủi ro).
- Muốn dùng ảnh: chỉ khi nguồn **ghi rõ** cho phép (license CC, public domain, hoặc có văn bản đồng ý). Khi đó vẫn qua `validateImageFile()` (magic bytes, ≤8 MB) và ghi `ContentSource.license`.
- Mặc định khác: dùng **mascot/illustration P04** cho công thức chưa có ảnh đại diện (đúng `RECIPE_CONTENT_POLICY §3`).

### 4.7 Cơ chế từ chối crawl (opt-out)
- Tôn trọng: `robots.txt`, header `X-Robots-Tag: noindex/nofollow`, meta robots, và **bất kỳ yêu cầu gỡ bỏ** qua kênh liên hệ.
- Thiết kế **deny-list thủ công** ở cấp domain (admin có thể thêm bất kỳ domain nào vào danh sách cấm tuyệt đối, override mọi cấu hình khác).
- Khi nhận yêu cầu gỡ: đánh dấu nguồn `DISALLOWED` + (tùy chọn) quy trình xử lý nội dung đã nhập từ nguồn đó (xem P16.4 — không tự động xoá bừa).

---

## 5. Source Registry — đặc tả

"Source Registry" là **danh mục nguồn** (đề xuất bảng `ImportSource` — chi tiết DDL ở `docs/P16/DATABASE_DESIGN.md`). Đây là **cổng chính sách**: chỉ nguồn ở trạng thái cho phép mới được auto-discovery.

### 5.1 Các trường

| Trường (đề xuất) | Kiểu | Mô tả |
|---|---|---|
| `id` | uuid | PK |
| `name` | text | Tên website (hiển thị cho admin) |
| `domain` | text **unique** | Domain chuẩn hoá (vd `example.com`, bỏ `www.`) |
| `homepage_url` | text | URL trang chủ |
| `source_urls` | jsonb | Danh sách URL "mồi" (recipe index, sitemap, feed) nếu có |
| `discovery_methods` | text[] / jsonb | Tập con của `{url_import, sitemap, rss, index_page, search_engine, public_api, manual}` |
| `support_status` | enum | `DISABLED` · `URL_IMPORT_ONLY` · `AUTO_ENABLED` · `PAUSED_BLOCKED` · `MANUAL_ONLY` · `DISALLOWED` |
| `robots_policy` | jsonb | `{ fetchedAt, allowed: bool, crawlDelaySec, sitemaps[], notes }` |
| `tos_policy` | jsonb | `{ checkedAt, allowsReuse: "unknown"\|"yes"\|"no", allowsImages: bool, sourceNote, evidenceUrl }` |
| `content_policy` | enum | `facts_only` · `rewrite_required` · `licensed_reuse` · `manual_only` |
| `image_policy` | enum | `do_not_copy` · `allowed_with_license` · `manual_review` |
| `extractor_config` | jsonb | Chọn adapter + selector/pattern (xem P16.2 §6) |
| `rate_limit` | jsonb | `{ requestsPerMinute, concurrency, minDelayMs }` |
| `last_crawled_at` | timestamptz? | Lần crawl gần nhất |
| `last_status` | enum | `ok` · `blocked` · `rate_limited` · `parse_failed` · `unknown` |
| `last_error` | text? | Thông điệp lỗi gần nhất (an toàn, không chứa secret) |
| `enabled` | bool | Bật/tắt tổng |
| `created_at` / `updated_at` | timestamptz | Audit |

### 5.2 Quy tắc vận hành registry

1. **Mặc định an toàn:** nguồn mới tạo luôn ở `DISABLED` hoặc `MANUAL_ONLY`; admin phải **chủ động** kiểm robots/ToS rồi mới nâng lên `URL_IMPORT_ONLY`/`AUTO_ENABLED`.
2. **Chỉ nguồn `AUTO_ENABLED`** được Auto Discovery dùng.
3. `URL_IMPORT_ONLY`: cho phép admin dán URL thủ công (L2/L3 vẫn phải đạt khi chạy); **không** tự tìm URL.
4. `DISALLOWED`/`BLOCKED_BY_ROBOTS`/`PAUSED_BLOCKED`: **chặn mọi** truy cập tự động.
5. Mọi thay đổi trạng thái nguồn → ghi `AuditLog`.

### 5.3 Vòng đời trạng thái nguồn

```
DISABLED ──(admin kiểm robots+ToS OK, L4 đạt)──▶ URL_IMPORT_ONLY ──(đạt L1)──▶ AUTO_ENABLED
   ▲                                                                              │
   │                                                            (403/429/robots)  ▼
   └──────────────────────────── PAUSED_BLOCKED ◀────────────────────────────────┘
MANUAL_ONLY  (ToS mơ hồ / paywall / CAPTCHA)     DISALLOWED (yêu cầu gỡ / ban tuyệt đối)
```

---

## 6. Chiến lược phát hiện theo từng tầng (tóm tắt triển khai)

1. **URL Import trước** (D6): admin dán URL → hệ thống kiểm SSRF/scheme → tải → extract (P16.2). Nguồn chưa có trong registry vẫn xử lý được nhưng ở chế độ **"unregistered/manual confirm"** (ghi nhận domain, cảnh báo chưa đánh giá).
2. **Auto Discovery theo thứ tự ưu tiên nguồn dữ liệu:** sitemap (D3) → RSS (D4) → index page (D2) → search engine (D1, chỉ khi ToS engine cho phép). Mỗi bước **lọc theo registry** + **dedupe URL** (P16.4 lớp 1–2).
3. **Không** vượt paywall/CAPTCHA/anti-bot; gặp → `MANUAL_ONLY`.
4. **Ghi lại nguồn gốc URL** (domain, thời điểm, robots snapshot) để audit & tuân thủ.

---

## 7. Rủi ro & giảm thiểu (P16.1)

| Rủi ro | Mức | Giảm thiểu |
|---|---|---|
| Crawl nhầm site cấm | Cao | Registry mặc định an toàn; đọc robots/ToS; deny-list |
| Sao chép nội dung/ảnh trái phép | Cao | `facts_only`/`rewrite_required`; không tải ảnh mặc định; ghi nguồn bắt buộc (BR-03) |
| Bị chặn IP/domain | Trung bình | Rate limit theo domain, backoff, `PAUSED_BLOCKED` |
| Nguồn đổi cấu trúc HTML | Trung bình | Adapter theo site + fallback + review thủ công (P16.2) |
| Phụ thuộc search engine (ToS/lock-in) | Trung bình | Ưu tiên sitemap/RSS/URL import; search engine là tùy chọn |

---

## 8. Kết luận P16.1

- Có **6 lớp phương thức discovery** (D1–D4, D6–D7) và **3 lớp extraction** (D5, D8, D9); URL Import (D6) là **ưu tiên số 1**.
- **Source Registry** là trung tâm chính sách: mặc định **an toàn**, chỉ nguồn `AUTO_ENABLED` mới tự động.
- Phân tích đầy đủ robots.txt / ToS / copyright / attribution / rate limit / ảnh / opt-out — **không mặc định** bất kỳ site nào được phép.
- Đầu ra: thiết kế registry (trường + vòng đời) để P16.7 chuyển thành entity `ImportSource`.
