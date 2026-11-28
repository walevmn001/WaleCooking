# P16.5 — BATCH PROCESSING ARCHITECTURE

> Phase **P16** (thiết kế) · Milestone **P16.5** · 1 AI Agent · Không triển khai code.
> Mục tiêu: đặc tả kiến trúc **batch import tối đa 500 công thức/đợt**, có **resume / retry / idempotency**, **failure isolation** (1 item lỗi không dừng cả batch), và **đánh giá tính khả thi trên stack hiện tại** (Next.js · Vercel Hobby · Neon Free · Cloudflare R2).
> Nguyên tắc gốc: **không** giả định Vercel Hobby chạy được worker dài hạn; **không** vượt hạn mức free của hosting.
> Liên quan: [ADMIN_REVIEW_WORKFLOW.md](./ADMIN_REVIEW_WORKFLOW.md) · [DATABASE_DESIGN.md](./DATABASE_DESIGN.md) · [SECURITY_LEGAL_RESOURCE_LIMITS.md](./SECURITY_LEGAL_RESOURCE_LIMITS.md) · [docs/P02/DEPLOYMENT_ARCHITECTURE.md](../P02/DEPLOYMENT_ARCHITECTURE.md).

---

## 1. Mô hình tổng thể

```
Admin ──▶ [ImportJob] ──(sinh)──▶ [ImportJobItem × N (≤500)]
             │                          │
             │ enqueue                  │ trạng thái từng item
             ▼                          ▼
       [Queue / hàng đợi DB-backed] ──▶ [Worker rời rạc (worker-loop)]
                                             │ claim item (atomic) → FETCH→EXTRACT→LOCALIZE→DEDUPE
                                             ▼
                                      cập nhật item: DONE/FAILED/NEEDS_REVIEW
                                             │
                                      checkpoint sau mỗi item (bền vững trong DB)
```

**Đặc điểm cốt lõi:** điều phối **bền vững trong DB** (Postgres/Neon), **không** giữ trạng thái trong RAM. Worker là **stateless** và **khởi động lại an toàn** — dừng giữa chừng rồi chạy lại sẽ tiếp tục đúng item dang dở.

---

## 2. Thành phần (bắt buộc)

| Thành phần | Vai trò | Ghi chú thiết kế |
|---|---|---|
| **ImportJob** | Một đợt nhập (seed) | Tổng số item, tiến độ, trạng thái, nguồn tạo, người tạo |
| **ImportJobItem** | Một đơn vị công việc (1 URL / 1 kết quả discovery) | Mang trạng thái riêng + số lần thử + lỗi cuối |
| **Queue** | Hàng đợi công việc | **DB-backed** (`SELECT ... FOR UPDATE SKIP LOCKED`) — không cần Redis |
| **Worker** | Tiến trình xử lý item | Stateless, chạy theo "lô nhỏ", khởi động lại an toàn |
| **Retry** | Thử lại có backoff | Tối đa N lần, backoff lũy tiến + jitter |
| **Timeout** | Giới hạn thời gian mỗi bước/item | Fetch/parse/dịch đều có timeout riêng |
| **Rate limit** | Giới hạn tốc độ **theo domain** | Tôn trọng `Crawl-delay`; hàng đợi riêng mỗi domain |
| **Concurrency** | Số item xử lý song song | Giới hạn **toàn cục** + **theo domain** |
| **Checkpoint** | Điểm lưu tiến độ bền vững | Ghi sau **mỗi item** (không phải cuối batch) |
| **Resume** | Tiếp tục sau khi dừng | Dựa trạng thái item + claim hết hạn |
| **Cancel** | Huỷ job | Đặt cờ; worker dừng nhận item mới; item đang chạy hoàn tất hoặc bỏ |
| **Failure isolation** | 1 item lỗi không ảnh hưởng item khác | Mỗi item độc lập, transaction riêng |
| **Progress tracking** | Tiến độ job | Đếm theo trạng thái item (derived), không đếm trong RAM |
| **Idempotency** | Retry không tạo bản ghi trùng | Khoá idempotency cho mỗi item |
| **Dead-letter** | Item thất bại vĩnh viễn | Trạng thái `FAILED`/`DEAD_LETTER` để admin xử lý/rồi retry |

---

## 3. Trạng thái & vòng đời

### 3.1 Trạng thái Item (đề xuất — tinh gọn; đồng bộ P16.6)

```
PENDING ─▶ LEASED(đang xử lý) ─▶ FETCHING ─▶ EXTRACTED ─▶ TRANSLATING ─▶ VALIDATING
   ▲                                  │                                        │
   │                                  ▼                                        ▼
   └── retry (nếu còn lượt) ◀── FAILED ◀─────────────────────── NEEDS_REVIEW / DUPLICATE
                                                                     │
                                                                 APPROVED → PUBLISHED (admin)
```

- Trạng thái lưu ở `ImportJobItem.status`; **mỗi chuyển trạng thái là một UPDATE** (checkpoint tự nhiên).
- `LEASED` có `leaseExpiresAt`: nếu worker chết, lease hết hạn → item quay lại `PENDING` (cơ chế resume).
- Retry tăng `attempts`; vượt `maxAttempts` → `FAILED` (dead-letter) để admin xử lý.

### 3.2 Trạng thái Job (dẫn xuất)
- `RUNNING` khi còn item chưa kết thúc; `PAUSED` (do blocked) / `CANCELLED` (admin) / `DONE` khi mọi item kết thúc; `PARTIAL` khi có item `FAILED`.
- Tiến độ = đếm item theo trạng thái (truy vấn DB), **không** lưu biến đếm trong RAM.

---

## 4. Cơ chế cốt lõi (chi tiết)

### 4.1 Claim item nguyên tử (chống trùng khi nhiều worker)
- Worker **claim** item bằng `UPDATE ... WHERE status='PENDING' OR (status='LEASED' AND lease_expires_at < now()) ... LIMIT k RETURNING ...` kết hợp `FOR UPDATE SKIP LOCKED` → nhiều worker song song không giành cùng item.
- Trong cùng transaction: gán `workerId`, `leaseExpiresAt = now() + leaseTTL`, `attempts += 1`.

### 4.2 Checkpoint & Resume
- **Checkpoint = trạng thái item trong DB.** Sau mỗi bước (fetch/extract/dịch) cập nhật item → nếu worker/sandbox dừng, không mất tiến độ.
- **Resume:** worker mới chỉ cần query item `PENDING` + item `LEASED` hết lease → tiếp tục **từ đúng item dang dở**, không phải chạy lại từ đầu.
- **Không** lưu checkpoint trong file/RAM (sandbox có thể bị xoá).

### 4.3 Idempotency (retry không tạo bản ghi trùng)
- **Khoá idempotency** ở cấp item: `ImportJobItem.idempotencyKey` (đề xuất `unique`), suy ra từ `jobId + normalizedUrl` (P16.4 L1).
- Tạo bản ghi phụ đề xuất (`RecipeExtraction`/`RecipeTranslationDraft`) **upsert theo khoá** (`extractionId`/`jobItemId`) → retry ghi đè chính bản ghi cũ, **không** tạo bản mới.
- **Publish** là bước **chỉ admin**, chạy qua `RecipeService.create()` (BR-01/BR-03) → không có đường tự động publish trùng.
- Enqueue trùng URL vào cùng job → bị chặn bởi unique `(jobId, idempotencyKey)`.

### 4.4 Failure isolation
- **Mỗi item xử lý trong phạm vi lỗi riêng**: lỗi fetch/lỗi parse/lỗi dịch của item i **không** ảnh hưởng item khác.
- Mẫu đã có trong repo: homepage service tách lỗi từng khối + `Promise.all` (P16.0 §4) → áp dụng tương tự: `Promise.allSettled` cho lô nhỏ.
- Lỗi ở tầng item → đánh dấu item `FAILED`, tiếp tục item kế. Lỗi ở tầng job (hết dung lượng DB) → `PAUSED` toàn job (có kiểm soát), không crash im lặng.

### 4.5 Retry / Timeout
- **Retry**: chỉ cho lỗi **tạm thời** (timeout mạng, 429/503, lỗi tạm DB). Lỗi vĩnh viễn (404, ToS cấm, MIME sai) → **không** retry, đánh dấu `FAILED` + lý do.
- **Backoff**: lũy tiến (vd 2s→8s→30s) + **jitter**; tôn trọng `Retry-After` nếu có.
- **Timeout** mỗi tầng: fetch (vd ≤15s), parse (≤5s), dịch (≤30s); vượt → fail item (không treo worker).

### 4.6 Rate limit & concurrency (theo domain)
- **Rate limit theo domain**: đọc `ImportSource.rate_limit` + `robots Crawl-delay`; xếp item theo domain vào "làn" riêng; mỗi domain có `minDelayMs` + trần RPM.
- **Concurrency**: giới hạn **toàn cục** (bảo vệ Neon/R2) + **theo domain** (lịch sự). Mặc định thấp (vd toàn cục 2–4; mỗi domain 1–2).
- **Tạm dừng khi website từ chối** (403/429 lặp lại): đặt nguồn `PAUSED_BLOCKED` (P16.1 §5) + tạm hoãn item thuộc domain đó; không retry dồn dập.

### 4.7 Cancel
- Admin đặt `ImportJob.status = CANCELLED`. Worker: trước khi claim mỗi item, kiểm cờ job → ngừng claim; item đang chạy: hoàn tất an toàn (ghi kết quả) hoặc bỏ giữa bước (lease hết hạn sẽ trả item về `PENDING` nếu job được resume).

### 4.8 Dead-letter handling
- Item vượt `maxAttempts` hoặc lỗi vĩnh viễn → `FAILED` (dead-letter) kèm `lastError` (an toàn, không secret).
- Admin xem danh sách dead-letter, có thể **retry thủ công** (đưa về `PENDING`) hoặc `REJECTED`.

---

## 5. Mô hình dữ liệu batch (đề xuất — chi tiết DDL ở P16.7)

| Entity | Vai trò | Trường then chốt (tóm tắt) |
|---|---|---|
| `ImportJob` | Đợt nhập | `id`, `createdById`, `mode` (`url_import`/`auto_discovery`), `status`, `totalItems`, `createdAt` |
| `ImportJobItem` | Đơn vị công việc | `id`, `jobId`, `sourceUrl`, `idempotencyKey` (**unique**), `status`, `attempts`, `maxAttempts`, `leaseExpiresAt`, `workerId`, `lastError`, `recipeId?` |

- **Checkpoint** = cột `status`/`attempts`/`leaseExpiresAt` của item (không cần bảng checkpoint riêng).
- **Index**: `(jobId, status)`, `(status, leaseExpiresAt)`, `unique(jobId, idempotencyKey)`.
- **Retention**: dọn item `DONE` cũ theo TTL (P16.7).

---

## 6. Khả thi trên stack hiện tại (Next.js / Vercel Hobby / Neon Free / R2)

### 6.1 Hạn mức free (theo `docs/P02/DEPLOYMENT_ARCHITECTURE.md §`, đã kiểm chứng)
| Nền tảng | Hạn mức free |
|---|---|
| **Vercel Hobby** | ~100 GB transfer + 1M request/tháng; **chỉ phi thương mại** |
| **Neon Free** | 1 GB storage/project; 100 CU-giờ/tháng; 5 GB egress; **scale-to-zero** |
| **R2 Free** | 10 GB storage; 1M Class A + 10M Class B ops; egress $0 |
| **GitHub Actions** | Free cho repo public (private có hạn mức phút) |
> Các hạn mức này **đã có trong tài liệu repo**; số cụ thể của Vercel/Neon có thể thay đổi theo thời điểm → **cần kiểm chứng lại khi triển khai** (đánh dấu "chưa kiểm chứng live" ở P16.0 §7).

### 6.2 Vấn đề với Vercel Hobby làm nơi chạy worker
> **KHÔNG giả định Vercel Hobby phù hợp chạy worker dài hạn.**

- Serverless function Vercel có **giới hạn thời gian thực thi** (Hobby thấp); xử lý 1 item (fetch + parse + dịch AI) có thể **vượt** giới hạn → bị cắt giữa chừng.
- **Vercel Cron** trên gói thấp bị **giới hạn tần suất** (thường 1 lần/ngày) và **không** phù hợp để "chạy liên tục".
- Vercel **không** có compute chạy nền dài hạn; function là **ephemeral**.
> **Kết luận:** Vercel Hobby dùng tốt cho **web/API admin + enqueue + xử lý "lát cắt ngắn" (1 item/lần gọi, trả kết quả nhanh)**, **không** dùng làm worker chạy dài.

### 6.3 Phương án worker tương thích ngân sách thấp

| Phương án | Cách chạy | Ưu điểm | Nhược điểm |
|---|---|---|---|
| **A. Worker kiểu "tick" do Cron/API đánh thức** | Mỗi lần gọi (Vercel Cron 1 lần/ngày, hoặc admin bấm "chạy tiếp", hoặc external cron) → worker claim **1 lô nhỏ** item rồi thoát | Không cần hạ tầng mới; tận dụng Vercel + Neon; resume tự nhiên theo DB | Thông lượng thấp; phụ thuộc tần suất đánh thức; mỗi lần phải < giới hạn function |
| **B. GitHub Actions làm worker (scheduled workflow)** | Workflow chạy `worker-loop` (claim → xử lý lô → lặp đến khi hết/ngân sách thời gian) | **Free cho repo public**; chạy được lâu; có secret store an toàn; log rõ | Có độ trễ theo lịch; giới hạn phút (private); không "realtime" |
| **C. Một worker process nhỏ (VPS giá rẻ / container ngoài)** | Chạy process Next-less (Node) polling DB | Kiểm soát tốt, chạy liên tục, resume chuẩn | **Tốn chi phí** (phá ngân sách free) — phương án **dự phòng** |
| **D. Cloudflare Workers + Cron Triggers** | Worker + scheduled trigger | Rẻ/nhanh, cron thật | Khác runtime (không chạy trực tiếp code Node/Prisma) → cần adapter DB HTTP; phức tạp hơn |

> **Đề xuất P16:** bắt đầu với **A** (tick ngắn, phù hợp URL Import lô nhỏ, tận dụng stack hiện tại, **không thêm chi phí/hạ tầng**), và **chuẩn bị sẵn B** cho batch 500 (chạy lâu). **C** chỉ khi thực sự cần realtime. Kiến trúc **DB-backed queue + checkpoint trong DB** khiến việc **đổi nơi chạy worker** (A↔B↔C) **không đổi logic** — chỉ đổi "cách đánh thức worker".

### 6.4 Ràng buộc tài nguyên (không vượt hạn mức)
- **Neon Free**: giới hạn storage/CU-giờ + **scale-to-zero** → thiết kế **ít truy vấn, lô nhỏ**, tránh polling dày; checkpoint sau mỗi item (không ghi thừa).
- **R2 Free**: chỉ tải/ghi ảnh khi **được phép** (P16.8); ảnh ngoài (không tải) → chỉ lưu URL.
- **Egress/transfer**: fetch nguồn ngoài chủ yếu tốn bandwidth nơi chạy worker → chọn worker không bị tính transfer lớn (GitHub Actions/self-host phù hợp hơn Vercel cho luồng này).
- **Giới hạn 500 item/đợt** là **trần cứng** để bảo toàn tài nguyên free.

### 6.5 Ước lượng nhanh tải 500 item
- 500 item × (fetch+parse ~ vài chục KB) = vài MB transfer → **nhỏ** với mọi nền tảng.
- 500 × (1 dịch AI) → chi phí AI là **biến số chính** → bắt buộc **giới hạn chi phí** (P16.8) + **cache** kết quả dịch theo `idempotencyKey`.

---

## 7. Bất biến & kiểm thử (đề xuất cho phase triển khai)

**Bất biến (invariants):**
1. Một item **không** bị 2 worker xử lý đồng thời (claim nguyên tử).
2. Resume **không** tạo bản ghi trùng (idempotency key + upsert).
3. 1 item lỗi **không** làm dừng job (failure isolation).
4. Job **không** tự publish — chỉ admin (qua `RecipeService`).
5. Worker **không** giữ trạng thái tiến độ ngoài DB.

**Kiểm thử:** claim đồng thời (2 worker) chỉ 1 thắng; kill worker giữa chừng → resume đúng item; retry 429 → backoff & tôn trọng `Retry-After`; cancel → ngừng claim.

---

## 8. Rủi ro & giảm thiểu

| Rủi ro | Giảm thiểu |
|---|---|
| Vercel function timeout cắt giữa item | Tick ngắn (1 item/lô nhỏ); worker dài chạy ở A/B/C |
| Vượt hạn mức free | Trần 500 item; lô nhỏ; ít truy vấn; chỉ tải ảnh khi được phép |
| Trùng khi retry | Idempotency key + upsert |
| Mất tiến độ khi sandbox/worker dừng | Checkpoint trong DB + lease/resume |
| Website chặn (403/429) | Rate limit theo domain + `PAUSED_BLOCKED` + backoff |
| Chi phí AI vượt kiểm soát | Giới hạn chi phí/ngân sách + cache (P16.8) |

---

## 9. Kết luận P16.5

- Kiến trúc **DB-backed queue** + **checkpoint trong DB** + **worker stateless** → resume/retry/idempotency **không phụ thuộc nơi chạy**.
- **Failure isolation** ở cấp item; 1 item lỗi không dừng batch; dead-letter cho item thất bại.
- **KHÔNG** dùng Vercel Hobby làm worker dài hạn; đề xuất **A (tick ngắn)** trước, **B (GitHub Actions)** cho batch 500; **C (VPS)** chỉ khi cần realtime.
- Giới hạn **500 item/đợt** + lô nhỏ + rate limit theo domain để **không vượt Neon/R2/Vercel free**. Đầu ra liên kết P16.1 (rate/registry), P16.6 (trạng thái admin), P16.7 (schema job/item).
