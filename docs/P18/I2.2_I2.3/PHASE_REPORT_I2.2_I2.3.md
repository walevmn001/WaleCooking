# BÁO CÁO CUỐI PHASE — I2.2 + I2.3 (CONTRACT FOUNDATION & SSRF SECURITY SPIKE)

> Dự án: **WALE COOKING** · Branch: `trae/agent-GnjYMp` · 1 AI Agent · không sub-agent.
> Checkpoint xuất phát: `daa175d2cdddcb75cbe07512de006e0c4003adeb`.
> Theo: `docs/P18/I2.1/IMPLEMENTATION_PLAN.md`, `docs/P18/I2.1/SSRF_SECURITY_DESIGN.md`.
> **Phạm vi:** chỉ dựng contract + spike bảo mật SSRF. **KHÔNG** triển khai chức năng URL Import
> hoàn chỉnh, **KHÔNG** fetch nội dung để lưu DB, **KHÔNG** API Import/crawler/worker/publish,
> **KHÔNG** sửa schema/migration/seed.

---

## PHẦN I2.2 — CONTRACT FOUNDATION

### 1. DTO / contracts đã tạo (`lib/import/`)

| File | Nội dung |
|---|---|
| `field-state.ts` | `FieldState` (5: MISSING/UNREADABLE/CONFIRMED/DERIVED/CONFLICT), `FieldTier`, `ProvenancedField<T>`, `FieldCategory` (extracted/missing/uncertain/failed) + `toFieldCategory()` |
| `url.ts` | `UrlValidationResult`, `UrlRejectionReason`, `NormalizedUrlInfo` |
| `source.ts` | `SourceIdentificationResult`, `SourceDecision`, `SourcePolicySnapshot` |
| `fetch.ts` | `SafeFetchRequest`, `FetchResult`, `SafeFetchResult`, `SafeFetchFailureReason` |
| `extraction.ts` | `ExtractionResult`, `ExtractionWarningCode`, `ExtractionOutcome` |
| `job.ts` | `SubmitUrlImportRequest`, `ImportItemResult`, `ImportJobResult`, `AdminImportItemPreview`, `ImportReviewRequest` |
| `errors.ts` | `ImportErrorResponse` (kế thừa `ErrorResponseBody` — không tạo mã lỗi trùng) |
| `ports.ts` | `UrlValidator`, `SafeFetcher`, `SourceRegistry`, `RecipeExtractor` |
| `validation.ts` | Zod: `submitUrlImportSchema`, `importReviewSchema` + trần giới hạn |
| `idempotency.ts` | `buildImportIdempotencyKey()` |
| `index.ts` | barrel |

**Bất biến đã bảo đảm (test kiểm chứng):** không lộ IP/DNS/stack ra client; không tin role/actor từ client;
enum `decision` **không** có `publish`; **chống mass assignment** (loại `status`/`role`/`createdById`/`recipeId`/`publishedAt`);
**không** suy đoán dữ liệu thiếu (MISSING ⇒ value null); phân biệt raw source / normalized / reviewed.

### 2. Port / service đã mở rộng

- `lib/db/repositories/import.repository.ts`: mở rộng `ImportJobItemDto` (+`processingStage`, `leaseExpiresAt`,
  `workerId`, `lastError`, `extractionId`, `duplicateOfItemId`) + `findItemByJobAndKey` (idempotency). **Không** đổi schema.
- `lib/services/import.service.ts`: `ImportService.submitUrlImport` — điều phối validate → registry → lưu nháp `queued`;
  DI qua `ImportPipelineDeps`; `requirePipeline()` ném `AppError("INTERNAL")`. **Không** fetch/extract.

### 3. Tests & kết quả (I2.2)

- `tests/lib/import/field-state.test.ts` (9), `validation.test.ts` (11), `idempotency.test.ts` (4),
  `submit-url-import.test.ts` (12) — **41 test PASS** (unit; `ImportService` chạy thật, chỉ fake port I/O).
- **Typecheck PASS**; toàn bộ 485 unit test hiện có PASS (không phá vỡ I1).

---

## PHẦN I2.3 — SSRF SECURITY SPIKE

### 4. SSRF validator (`lib/import/ssrf/`)

- `ip.ts` — `classifyIp`/`isBlockedIp`: IPv4→uint32, IPv6→BigInt 128-bit (mở rộng `::`, nhúng IPv4), so khớp **CIDR IANA**.
  Dải IPv4/IPv6 đầy đủ; **IPv4-mapped (`::ffff:0:0/96`)** và **NAT64 (`64:ff9b::/96`)** giải nén IPv4 nhúng kiểm lại.
- `hostname.ts` — deny-list hostname (localhost/metadata/*.local/*.internal/*.cluster.local/*.home.arpa), eTLD+1 best-effort.
- `url-validator.ts` — `SsrfUrlValidator` (L1 http/https + credentials + ≤2048; L2 IP literal; L5 hostname; L7 port {80,443}).
- **68 test PASS** (`tests/lib/import/ssrf-validator.test.ts`).

### 5. HTTP client / agent đã thử nghiệm

- **`node:http`/`node:https` built-in** (không dùng `undici` — không phải dependency).
- `pinned-request.ts`: `pinnedRequest()` dùng option **`lookup` tuỳ biến** trả đúng IP đã xác minh; `host`=hostname gốc
  (HTTP `Host`), https `servername`=hostname gốc (SNI + xác minh cert), `rejectUnauthorized: true`, `agent: false`.
- `dns.ts`: `resolveAndVerify` (resolve-once) + cổng `DnsResolver` (SystemDnsResolver mặc định).

### 6. Kết quả IP pinning THỰC TẾ

- ✅ **Chứng minh bằng integration test socket thật:** kết nối tới **đúng IP đã pin** (`remoteAddress` đo được);
  phân biệt hai loopback khác IP; **Host header** giữ hostname gốc; hostname **không có DNS** vẫn kết nối được (không tự resolve lại).
- ✅ **CONTROL:** cùng hostname **không** pin ⇒ thất bại (loại trừ khả năng "thành công nhờ DNS thật").
- ✅ **DNS rebinding:** resolver gọi **đúng 1 lần**; kết nối dùng IP đã xác minh (M6: resolver trả `8.8.8.8` rồi `127.0.0.1` ⇒ vẫn `8.8.8.8`).
- **Blocker B-I2-01:** ✅ RESOLVED ở tầng engine Node.

### 7. TLS / SNI

- ✅ SNI = hostname gốc; xác minh chứng chỉ theo hostname gốc.
- ✅ Cert sai hostname (`evil.test`) ⇒ `TLS_FAILED`; ✅ cert **không tin cậy** (self-signed, không CA) ⇒ `TLS_FAILED`.

### 8. Redirect handling (L6)

- ✅ **Không** auto-follow; theo ≤ `maxRedirects` (mặc định 5); resolve Location tương đối.
- ✅ **Kiểm lại URL + resolve/pin lại MỖI hop**; phát hiện **loop**; chặn **hạ cấp HTTPS→HTTP**.
- ✅ **Không** gửi Cookie/Authorization (kể cả redirect khác domain); 3xx thiếu Location ⇒ `HTTP_ERROR_STATUS`.

### 9. Response limits (L8)

- ✅ **Timeout** (ngân sách tổng + socket inactivity) ⇒ fail closed.
- ✅ Trần **byte sau giải nén** (chống **compression bomb** — dùng `zlib maxOutputLength`).
- ✅ Allow-list **content-type**; không tải ảnh/tài nguyên phụ; không thực thi JS.

### 10. Security test results (tổng 47 test — `pnpm test:security`)

- `ssrf-pinning.test.ts` — **11** (pin IP, control, phân biệt IP, TLS/SNI, resolveAndVerify).
- `safe-fetcher.test.ts` — **20** (redirect integration + limits + logic SSRF + unit helpers).
- `ssrf-threat-matrix.test.ts` — **16** (ánh xạ bảng §4.6: public allow; loopback/private/link-local/metadata/mapped/port/credentials block;
  DNS mixed + rebinding; redirect private/loop; timeout/body; TLS untrusted).
- **47/47 PASS.** Unit: **485/485 PASS.** Typecheck + eslint: sạch.

### 11. Vercel Hobby compatibility

Chi tiết: `docs/P18/I2.2_I2.3/VERCEL_HOBBY_SSRF_ASSESSMENT.md`.

- Runtime Node.js: tương thích theo engine (custom `lookup`, `tls`, `zlib` built-in); Edge **không** dùng.
- Pin IP/TLS-SNI/DNS: hoạt động theo engine — **PENDING** xác nhận bằng **preview deploy** (egress IPv6, trần thời lượng, metadata).
- **B-I2-02:** ❌ **Không có egress firewall trên Hobby** ⇒ mất defense-in-depth; residual risk đã biết.
- Không tuyên bố "Vercel Hobby an toàn tuyệt đối".

### 12. Blocker còn lại

| Mã | Nội dung | Trạng thái |
|---|---|---|
| B-I2-01 | Pin IP | ✅ RESOLVED (engine Node); Vercel confirm **PENDING** (không phải blocker kỹ thuật tầng app) |
| B-I2-02 | Egress firewall Hobby | ❌ Không có — **residual risk**; khuyến nghị production: egress firewall/Secure Compute hoặc fetch proxy cô lập |

---

## KẾT LUẬN CUỐI PHASE

### PASS

- **I2.2:** DTO/contracts type-safe, tương thích schema I1, không migration, không phá vỡ service/repo hiện có; unit tests PASS.
- **I2.3:** validator IPv4/IPv6 đúng; DNS mixed bị từ chối; **IP pinning chứng minh bằng integration test**;
  TLS/SNI giữ hostname gốc; redirect kiểm lại từng hop; response size/timeout enforce; không rò rỉ thông tin nội bộ;
  không có đường fetch bỏ qua guard (SafeFetcher là đường duy nhất, luôn kiểm + pin).
- **Git:** tất cả thay đổi đã commit + push fast-forward `origin/main`; không force/rewrite; không secrets.

### BLOCKED

- **Không có mục nào BLOCKED.** Blocker B-I2-02 (egress firewall) là **residual risk đã biết**, không chặn việc
  hoàn thành I2.2/I2.3 (đã ghi rõ + khuyến nghị biện pháp production).

### PENDING

- Xác nhận **đặc thù Vercel Hobby** (egress IPv6, trần thời lượng function, metadata) bằng **preview deploy**.
- Việc bật URL Import thực tế thuộc các phase sau (I2.4+), **không** thực hiện trong phase này.

### Có đủ điều kiện chuyển sang I2.4?

- **Có** — nền tảng contract (I2.2) và guard SSRF (I2.3) đã sẵn sàng **ở tầng engine Node**, có test chứng minh.
  Khuyến nghị: khi bật fetch thật ở I2.4+, (a) xác nhận Vercel bằng preview deploy, (b) cân nhắc bổ sung egress firewall
  ở production. **Không** tự chuyển I2.4 — chờ chủ dự án đánh giá.

### Commit hash / push / Git status

| Milestone | Commit |
|---|---|
| Xuất phát | `daa175d` |
| M1 Contract Foundation | `98d2ea7` |
| M2 Unit tests | `c327f81` |
| M3 SSRF validator | `e1fd0f0` |
| M4 DNS + IP pinning | `ae6ede8` |
| M5 SafeFetcher | `d39e8dc` |
| M6 Threat matrix + Vercel | `2e6f317` |
| M7 Tổng kết | (commit này) |

- **Push:** fast-forward `origin/main` sau mỗi milestone — thành công.
- **Git status:** working tree sạch; `HEAD = origin/main`.
