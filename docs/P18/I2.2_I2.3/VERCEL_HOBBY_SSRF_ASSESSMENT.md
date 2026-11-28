# I2.2 + I2.3 — ĐÁNH GIÁ TƯƠNG THÍCH VERCEL HOBBY CHO SSRF PROTECTION

> Phase **I2.2 + I2.3** · 1 AI Agent · không sub-agent.
> Mục tiêu: đánh giá trung thực khả năng **pin IP**, **TLS/SNI**, **DNS**, **timeout** và các
> **giới hạn không thể khắc phục ở tầng ứng dụng** của cơ chế bảo vệ SSRF (`lib/import/ssrf/*`)
> khi chạy trên **Vercel Hobby + Node.js runtime**.
> Nguyên tắc: **không** tuyên bố Vercel Hobby an toàn tuyệt đối chỉ vì unit/integration tests PASS.

---

## 1. Phạm vi & phương pháp

- **Kiểm chứng cục bộ (đã làm):** toàn bộ M4–M6 chạy trên **Node `v24.1.0`**, socket thật
  (`tests/security/*`), 47/47 PASS.
- **Đánh giá Vercel Hobby (tài liệu + suy luận thiết kế):** chưa deploy thật trong sandbox này.
  Các mục phụ thuộc runtime đám mây được đánh dấu **PENDING — cần xác nhận bằng preview deploy**.
- Vercel Functions dùng cùng **Node.js engine** (Node 20/22) ⇒ cơ chế `lookup`/`tls` built-in
  hoạt động tương tự; nhưng **egress (IPv6), trần thời lượng, và metadata nội bộ** là đặc thù nền tảng.

---

## 2. Cơ chế đã triển khai (tóm tắt)

| Lớp | Cơ chế | File |
|---|---|---|
| L1/L2/L5/L7 | Validator tĩnh: scheme/credentials/độ dài/IP literal/hostname/port | `lib/import/ssrf/url-validator.ts`, `ip.ts`, `hostname.ts` |
| L3 | `resolveAndVerify`: resolve-once, kiểm **mọi** A/AAAA, chặn nếu bất kỳ địa chỉ xấu | `dns.ts` |
| L4 | `pinnedRequest`: `lookup` tuỳ biến trả **đúng IP đã xác minh**; `host`=hostname gốc; https `servername`=hostname gốc | `pinned-request.ts` |
| L6 | `SafeFetcherImpl`: không auto-follow, ≤5 hop, kiểm lại + pin lại mỗi hop, loop, chặn hạ cấp | `safe-fetcher.ts` |
| L8 | Timeout tổng, trần byte sau giải nén (chống compression bomb), allow-list content-type | `safe-fetcher.ts` |
| L10/L11 | Không Cookie/Authorization; mã lỗi an toàn | `safe-fetcher.ts` |

---

## 3. Runtime hỗ trợ & Node.js API

| Hạng mục | Đánh giá | Trạng thái |
|---|---|---|
| Runtime Vercel | Node.js runtime (Node 20/22) — hỗ trợ `node:http`, `node:https`, `node:tls`, `node:dns`, `node:zlib` built-in | ✅ tương thích (theo engine) |
| Custom `lookup` (`http(s).request`) | Là API lõi (dùng `net.connect`); hoạt động trên Node runtime Vercel | ✅ (đã chứng minh trên Node 24) |
| `undici` | **Không** dùng (không phải dependency) ⇒ không phụ thuộc API nội bộ | ✅ |
| Edge runtime | **Không** dùng (Edge không có `node:net`/custom lookup) ⇒ chỉ Node runtime | ✅ đúng lựa chọn |
| `zlib` `maxOutputLength` | Node ≥ 15 ⇒ có sẵn | ✅ |

---

## 4. PIN IP — kết quả thực tế

- **Đã chứng minh (integration test, socket thật):** kết nối đi tới **đúng IP đã pin**
  (`remoteAddress` đo được), phân biệt hai loopback khác IP, **Host header** giữ hostname gốc,
  HTTP client **không** tự resolve lại hostname (hostname không có DNS vẫn kết nối được).
- **DNS rebinding:** resolver chỉ được gọi **1 lần**; kết nối dùng đúng IP đã xác minh
  (test ma trận M6: resolver trả `8.8.8.8` lần 1 và `127.0.0.1` lần 2 ⇒ vẫn kết nối `8.8.8.8`).
- **Agent pooling:** đã đặt `agent: false` ⇒ mỗi request mở kết nối mới qua lookup đã pin,
  tránh tái dùng socket cũ (không lẫn IP giữa các lần fetch).

**Kết luận:** ở tầng engine, **pin IP đạt yêu cầu**. Trên Vercel Node runtime cơ chế này được
kỳ vọng hoạt động (cùng Node engine) — **cần** xác nhận bằng preview deploy rằng egress cho phép
TCP tới IP công khai tuỳ ý (**PENDING**).

---

## 5. TLS / SNI

- https dùng `servername` = hostname gốc ⇒ **SNI đúng** và **xác minh chứng chỉ theo hostname gốc**
  (`rejectUnauthorized: true`).
- Đã chứng minh: cert tự ký CN/SAN `recipe.test` → SNI = `recipe.test`; cert **không khớp hostname**
  ⇒ `TLS_FAILED`; cert **không tin cậy** (self-signed, không CA) ⇒ `TLS_FAILED`.
- CA bundle của runtime Vercel (Mozilla bundle) dùng để xác minh CA công khai — **PENDING** xác nhận
  trên deploy nhưng là hành vi Node tiêu chuẩn.

---

## 6. DNS behavior

- Dùng `node:dns/promises.lookup(hostname, { all: true })` (resolver hệ thống) ⇒ trên Vercel dùng
  resolver của nền tảng; trả cả A và AAAA.
- **Chính sách:** kiểm **mọi** địa chỉ; bất kỳ địa chỉ bị cấm ⇒ chặn toàn bộ. **Ưu tiên IPv4** khi chọn.
- **IPv4/IPv6:** egress IPv6 của Vercel không đồng nhất giữa các region/thời điểm. Vì ưu tiên IPv4,
  rủi ro "chọn IPv6 không có egress" được giảm — **PENDING** xác nhận IPv6 egress trên deploy.

---

## 7. Timeout, connection, connection pooling

| Hạng mục | Thực tế |
|---|---|
| Timeout | `SafeFetcherImpl` dùng **ngân sách tổng** (deadline) trừ dần qua mỗi hop; `pinnedRequest` đặt `timeout` socket (inactivity). Mặc định 10s. |
| Trần thời lượng function | Vercel Hobby giới hạn thời lượng function (mặc định ~10s, cấu hình được tới một ngưỡng tuỳ gói/thời điểm). Timeout ứng dụng 10s **nằm trong** ngưỡng ⇒ fail closed trước khi function bị kill. **PENDING** xác nhận số chính xác theo docs hiện hành. |
| Connection limit | Mỗi fetch = 1 kết nối/hop (`agent:false`); số hop ≤ 6 ⇒ không cạn connection. |
| Keep-alive/pooling | **Tắt** (`agent:false`) — ưu tiên an toàn hơn hiệu năng (chấp nhận được với công cụ import tần suất thấp). |
| DNS cache | Không dựa vào cache; resolve-once + pin nên cache không ảnh hưởng an toàn. |

---

## 8. Giới hạn KHÔNG thể khắc phục ở tầng ứng dụng

1. **Không có egress firewall trên Hobby:** không thể chặn RFC1918/metadata ở tầng mạng ⇒
   **toàn bộ** phòng thủ SSRF dựa vào tầng ứng dụng (validator + pin IP). Không có lớp dự phòng mạng.
2. **Không có IP egress tĩnh / không cấu hình được allow-list egress** trên Hobby.
3. **Không kiểm soát được resolver nền tảng** (chỉ pin sau khi resolve).
4. **Không kiểm soát IPv6 egress** — giảm thiểu bằng ưu tiên IPv4.
5. **Không kiểm soát cold start/concurrency** (không phải vấn đề bảo mật nhưng ảnh hưởng latency).

---

## 9. Rủi ro do KHÔNG có egress firewall

- **Mất defense-in-depth:** nếu có lỗi ở validator/pin, không có backstop ở tầng mạng để chặn kết nối nội bộ.
- **Giảm thiểu hiện có:**
  - Deny-by-default theo **CIDR IANA** cho IPv4/IPv6 (kể cả IPv4-mapped/NAT64/6to4/Teredo).
  - Resolve-once + pin IP (chống TOCTOU/rebinding) — **đã chứng minh**.
  - Không credentials, không cookie/authorization, không JS, không tải ảnh/tài nguyên phụ.
  - 47 test an ninh (gồm integration socket thật) làm lưới hồi quy.
- **Khuyến nghị production (ngoài phạm vi I2):** dùng gói Vercel có **egress/Secure Compute firewall**,
  hoặc đặt một **fetch proxy cô lập** (mạng riêng, allow-list egress) trước khi bật tính năng URL Import.

---

## 10. Kết luận

| Mục | Trạng thái |
|---|---|
| Pin IP (engine Node) | ✅ **PASS** (chứng minh bằng integration test) |
| TLS/SNI giữ hostname gốc | ✅ **PASS** (socket thật) |
| Redirect/protection + response limits | ✅ **PASS** (47 test an ninh) |
| Tương thích Vercel Node runtime | ✅ theo engine — **PENDING** xác nhận bằng preview deploy |
| Egress IPv6 / trần thời lượng Hobby | ⏳ **PENDING** — cần deploy xác nhận |
| Egress firewall (B-I2-02) | ❌ **Không có trên Hobby** — residual risk, cần biện pháp production |

> **KHÔNG** tuyên bố "Vercel Hobby an toàn tuyệt đối". Kết luận: các **kiểm soát tầng ứng dụng đạt yêu cầu**;
> phần **xác nhận đặc thù nền tảng Vercel còn PENDING**; **thiếu egress firewall là residual risk đã biết**.
