# I2.1 — VERCEL HOBBY COMPATIBILITY (Đánh giá tương thích hạ tầng)

> Phase **I2.1** (thiết kế, **KHÔNG triển khai**) · 1 AI Agent · không sub-agent.
> Mục tiêu: đánh giá khả thi triển khai URL Import trên **Vercel Hobby** (yêu cầu G) và chỉ ra trường hợp cần tách worker/đổi hạ tầng.
> Nguồn: `docs/P16/BATCH_PROCESSING_ARCHITECTURE.md` §4/§6/§7; `docs/P16/SECURITY_LEGAL_RESOURCE_LIMITS.md` §5; `docs/P02/DEPLOYMENT_ARCHITECTURE.md`; audit `next.config.ts`, `lib/db/prisma.ts`, `lib/config/env.ts`.
> Nguyên tắc: **không giả định có background worker thường trực**; **không** dùng `setTimeout`/process nền để "giả lập" queue bền vững; ưu tiên batch nhỏ + checkpoint + retry dựa **DB**.

---

## 1. Bối cảnh runtime (đã audit)

- Next.js **16.4.6** App Router, Route Handlers chạy **serverless** trên Vercel.
- Prisma 6.19.3 → Neon Postgres (prod), **Proxy lazy** (`lib/db/prisma.ts`) nên build không cần DB.
- `lib/config/env.ts` lazy/memoized; build không cần secret.
- Deploy target: **Vercel Hobby** (phi thương mại).

---

## 2. Giới hạn nền tảng (Hobby) & ảnh hưởng thiết kế

| Giới hạn | Ảnh hưởng URL Import | Thiết kế ứng phó |
|---|---|---|
| **Function timeout thấp** (Hobby giới hạn thời gian thực thi mỗi request) | 1 request **không** thể fetch + extract + parse nhiều URL | **1 URL/request**; ngân sách cứng (connect ≤5s, tổng ≤15s **hoặc** thấp hơn trần nền tảng); vượt ⇒ item `queued`, xử lý tick sau |
| **Bộ nhớ hữu hạn** | HTML lớn + giải nén bomb gây OOM | Giới hạn HTML ≤5MB, đọc stream, ngắt sớm, đếm byte sau giải nén |
| **Response size / time** | Trả raw HTML lớn cho client | **Không** trả raw qua API; raw ở object storage (ref) |
| **Stateless & ephemeral** | Không giữ tiến trình/queue trong RAM giữa các invocation | Trạng thái ở **Postgres** (job/item); mọi checkpoint ghi DB |
| **Không có worker thường trực** | Không thể chạy "nền" job dài | Kích hoạt công việc bằng **request đồng bộ ngắn** hoặc **Cron tick** (I7) |
| **Vercel Cron gói thấp ~1 lần/ngày** | Không đủ nhịp cho batch lớn | MVP I2 không cần cron; batch lớn (I7) dùng tick ngoài (xem §4) |
| **Quota** (~100GB transfer + ~1M req/tháng) | Crawler quy mô lớn tốn quota | Batch nhỏ, cache theo `contentHash`, tôn trọng rate limit nguồn |

> Số liệu hạn mức free **cần kiểm chứng lại** trước deploy (kế thừa `P16.0 §7`); sandbox không có quyền truy cập Vercel production.

---

## 3. Mô hình thực thi cho I2 (đồng bộ, không worker)

```
POST items (1 URL)
  └─ validate → registry → fetch (SSRF guard) → E1 extract → normalize → lưu nháp
     └─ trong ngân sách thời gian? → trả item ngay (needs_review | failed)
        └─ vượt ngân sách? → lưu item = queued + nextAttemptAt → 202
```
- **Ngân sách thời gian** chia nhỏ: (a) resolve+connect+đọc ≤ ~10s; (b) extract+normalize (CPU) ≤ vài trăm ms.
- **Không** `setTimeout` để "chạy tiếp" sau khi trả response (process có thể bị thu hồi ngay) — mọi việc còn dang dở phải **truy vấn được từ DB** ở lần gọi sau.
- Checkpoint: ghi `processingStage`, `attempts`, `leaseExpiresAt` để lần sau biết tiếp tục từ đâu.

---

## 4. Khi cần tách worker / đổi hạ tầng

| Phương án | Mô tả | Khi dùng |
|---|---|---|
| **A — Tick ngắn (khuyến nghị trước)** | Endpoint `POST /api/v1/admin/import/worker/tick` xử lý **vài** item `queued` mỗi lần; có thể gọi từ admin/UI hoặc cron ngoài | I2/I7 batch nhỏ; không cần hạ tầng mới |
| **B — GitHub Actions** | Scheduled workflow gọi tick định kỳ | Batch tới ~500 (I7) mà không trả phí worker |
| **C — VPS/container** | Process thường trực + firewall egress deny private | Khi cần **real-time** và/hoặc **kiểm soát egress ở tầng mạng** (bù giới hạn SSRF, xem `SSRF_SECURITY_DESIGN.md §3.4`) |
| **D — Cloudflare Workers** | Egress có kiểm soát hơn | Khi muốn giữ serverless nhưng cần network policy |

**Bất biến:** dù chọn A–D, **nguồn sự thật về trạng thái là Postgres**; worker chỉ là bên "kéo" item `queued`. Không bao giờ coi RAM/timer là queue.

---

## 5. Điểm phải "fail-safe" (không thể bảo đảm trên Hobby)

1. **Egress filtering tầng mạng:** Hobby **không** cho cấu hình → chỉ dựa kiểm IP ứng dụng; nếu không chứng minh được pin IP → **fail-closed** + cân nhắc phương án C.
2. **Trần thời gian function:** không thể biết chính xác nền tảng; thiết kế **phải** chia ngân sách nhỏ hơn trần và **luôn** có nhánh `queued`.
3. **Cron nhịp thấp:** không dùng cron Hobby cho batch lớn; dùng A/B.
4. **Không có transaction dài giữa các invocation:** dùng claim nguyên tử `FOR UPDATE SKIP LOCKED` (I7) để tránh xử lý trùng.

---

## 6. Ảnh hưởng tới thiết kế khác

- **SSRF** (`SSRF_SECURITY_DESIGN.md`): pin IP phụ thuộc runtime Node; phải test sớm; fail-closed nếu bất khả thi.
- **API** (`API_AUTH_DESIGN.md`): trả **không** raw; dùng 202 khi phải hoãn.
- **Data** (`DATA_REVIEW_WORKFLOW.md`): checkpoint (`processingStage`/`attempts`/`leaseExpiresAt`) sống ở `ImportJobItem`.

---

## 7. Bất biến

1. Không giả định worker thường trực; không RAM/timer làm queue.
2. Mọi trạng thái bền vững ở Postgres; mỗi lần gọi đọc/ghi checkpoint.
3. Ngân sách thời gian chia nhỏ; luôn có nhánh chuyển `queued`.
4. Batch nhỏ + retry + tôn trọng rate limit nguồn.
5. Có lộ trình A→B→C khi nhu cầu vượt Hobby.

---

## 8. Kết luận

- **I2 (MVP, 1 URL đồng bộ) hoàn toàn khả thi trên Vercel Hobby** với ngân sách thời gian nhỏ + nhánh `queued`.
- **Batch lớn (I7)** cần **tick ngoài** (A/B); **kiểm soát egress tầng mạng** (SSRF mạnh hơn) cần **C/D**.
- Các điểm không bảo đảm được trên Hobby đã ghi rõ (§5) kèm phương án an toàn.
