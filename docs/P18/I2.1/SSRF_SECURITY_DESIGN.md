# I2.1 — SSRF SECURITY DESIGN (Thiết kế bảo vệ SSRF cho URL Import)

> Phase **I2.1** (thiết kế, **KHÔNG triển khai**) · 1 AI Agent · không sub-agent.
> Mục tiêu: đặc tả **đầy đủ các lớp bảo vệ SSRF** (yêu cầu B) cho luồng URL Import (I2), đánh giá khả thi trên **Vercel Hobby + Node.js runtime**, và ghi rõ **giới hạn không thể bảo đảm** kèm phương án an toàn.
> Nguồn: `docs/P16/SECURITY_LEGAL_RESOURCE_LIMITS.md` §2.1–§2.3, §3 (pipeline 8 bước), §6 (checklist 10 mục); `docs/P16/BATCH_PROCESSING_ARCHITECTURE.md` §6.
> Nguyên tắc: nội dung website nguồn là **không đáng tin** (untrusted). Địa chỉ IP mà server *kết nối tới* là **giá trị nhạy cảm nội bộ** — tuyệt đối không trả về client.

---

## 0. Mô hình mối đe dọa (tóm tắt)

| # | Mối đe dọa | Kịch bản | Lớp chặn (dưới) |
|---|---|---|---|
| T1 | SSRF tới dịch vụ nội bộ | URL trỏ `http://127.0.0.1:5432` / `http://10.0.0.5` | L2, L4 |
| T2 | Cloud metadata endpoint | `http://169.254.169.254/latest/meta-data/` | L2 (`169.254.0.0/16`), L5 (hostname metadata) |
| T3 | DNS rebinding (TOCTOU) | host resolve public rồi đổi thành private giữa kiểm-tra và kết-nối | L3, L4 (pin IP) |
| T4 | Redirect sang IP nội bộ | nguồn trả `302 → http://192.168.0.1` | L6 |
| T5 | Smuggling scheme | `file:`, `gopher:`, `dict:`, `ftp:`, `data:` | L1 |
| T6 | Credentials trong URL | `http://user:pass@host/` | L1 |
| T7 | Port quét nội bộ | `http://host:6379/` | L7 |
| T8 | Resource exhaustion | body cực lớn / slow-loris / gzip bomb | L8, L9 |
| T9 | Rò rỉ danh tính hệ thống | gửi `Cookie`/`Authorization` của WALE sang site ngoài | L10 |
| T10 | Lộ thông tin qua lỗi | trả IP nội bộ / lỗi DNS chi tiết cho client | L11 |

---

## 1. Các lớp bảo vệ (bắt buộc)

### L1 — Chỉ HTTP/HTTPS · không credentials · giới hạn URL
- Chỉ chấp nhận scheme `http:` và `https:` (so khớp **sau** `new URL()`); mọi scheme khác (`file:`, `gopher:`, `dict:`, `ftp:`, `data:`, `blob:`, `ws:`…) → **422 VALIDATION_ERROR**.
- **Chặn URL chứa credentials**: `url.username !== "" || url.password !== ""` → chặn (chống lộ/định tuyến bất thường).
- Hostname phải không rỗng; **loại bỏ** hostname dạng số thập phân/octal/hex đặc biệt (ví dụ `http://2130706433/` = `127.0.0.1`) — **không** tự diễn giải thành IP; chỉ chấp nhận hostname dạng tên miền hoặc IP literal hợp lệ theo `net.isIP()`.
- Giới hạn độ dài URL ≤ 2048 ký tự; chuẩn hoá host (lowercase, bỏ dấu `.` cuối).

### L2 — Chặn IP bị cấm (IPv4 · IPv6 · IPv4-mapped IPv6)
Sau khi resolve DNS (L3), **mọi** địa chỉ trả về phải qua kiểm tra; nếu **bất kỳ** địa chỉ nào bị cấm → **chặn toàn bộ** (không thử địa chỉ khác).

**IPv4 — dải cấm:**
- `0.0.0.0/8` (this-network), `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16` (private)
- `127.0.0.0/8` (loopback)
- `169.254.0.0/16` (**link-local — bao gồm `169.254.169.254` cloud metadata**)
- `100.64.0.0/10` (CGNAT), `192.0.0.0/24`, `192.0.2.0/24`, `198.18.0.0/15`, `198.51.100.0/24`, `203.0.113.0/24` (reserved/documentation)
- `224.0.0.0/4` (multicast), `240.0.0.0/4` (reserved/broadcast)

**IPv6 — dải cấm:**
- `::/128` (unspecified), `::1/128` (loopback)
- `fc00::/7` (unique local), `fe80::/10` (link-local)
- `ff00::/8` (multicast), `2001:db8::/32` (documentation), `64:ff9b::/96` (NAT64)
- `::ffff:0:0/96` (**IPv4-mapped** → **giải nén phần IPv4 nhúng và kiểm lại theo IPv4**; đây là bẫy phổ biến — `::ffff:127.0.0.1`)
- IPv4-compatible `::/96`, 6to4 `2002::/16`, Teredo `2001::/32` → chặn.

### L3 — Phòng DNS rebinding (resolve-once)
- **Resolve DNS đúng một lần** ngay trước khi kết nối; lấy **tập** địa chỉ; nếu tập rỗng → chặn.
- Kiểm **toàn bộ** tập địa chỉ theo L2. Chỉ khi **mọi** địa chỉ hợp lệ mới đi tiếp.
- **Không** resolve lại lần hai (tránh TOCTOU).
- Không chấp nhận CNAME trỏ về tên nội bộ (việc kiểm IP sau resolve đã bao trùm trường hợp này).

### L4 — Pin IP: kết nối tới **đúng IP đã kiểm**
- Kết nối TCP tới **IP cụ thể** đã resolve & đã kiểm (không để tầng dưới resolve lại theo hostname).
- Gửi header **`Host: <hostname-gốc>`** (giữ TLS SNI = hostname gốc cho https) để website nguồn phục vụ đúng virtual host.
- Bảo đảm **kết nối thực tế đi tới đúng IP đã kiểm**; nếu tầng HTTP client không cho pin IP → phải tự quản lý socket/agent hoặc dùng cơ chế `lookup` tùy biến trả IP đã kiểm (xem §3 khả thi).

### L5 — Chặn hostname metadata & tên nội bộ
- Deny-list theo hostname: `localhost`, `*.localhost`, `*.local`, `*.internal`, `metadata.google.internal`, `metadata`, `169.254.169.254`, `fd00:ec2::254` (AWS IMDSv6), `*.cluster.local`.
- Deny-list này **bổ sung** cho kiểm IP ở L2 (phòng khi hostname tự resolve nội bộ).

### L6 — Kiểm lại **mọi** redirect (không tin nguồn)
- **Không** auto-follow redirect mù. Mỗi hop redirect (3xx) phải:
  1. đọc `Location`, resolve thành URL tuyệt đối;
  2. **chạy lại toàn bộ L1–L5** trên URL mới (scheme/credentials/resolve/IP);
  3. chỉ kết nối nếu hợp lệ.
- **Giới hạn số redirect ≤ 5**; vượt → dừng, item `failed` (không lộ chi tiết).
- Không cho phép downgrade `https → http` (tuỳ chọn siết: chặn).
- **Không tin** redirect từ website nguồn — coi mỗi `Location` như một URL mới chưa kiểm.

### L7 — Kiểm soát port
- Chỉ cho phép cổng mặc định theo scheme: **80** (http), **443** (https). Port khác → chặn (chống quét `6379`, `3306`, `5432`, `11211`, `9200`…).
- Nếu cần mở rộng (ví dụ nguồn dùng `:8080`), phải khai báo **allow-list port tường minh** trong Source Registry — mặc định I2 **không** mở.

### L8 — Timeout, kích thước, content type, chống compression bomb
- **Timeout** (đề xuất): connect ≤5s, tổng fetch ≤15s; huỷ cứng khi vượt.
- **Giới hạn kích thước**: HTML ≤ **5MB**, đọc **stream** và **ngắt** ngay khi vượt (không đợi tải xong).
- **MIME allow-list**: chỉ `text/html`, `application/xhtml+xml` (đọc từ `Content-Type`; nếu thiếu → sniff **giới hạn**).
- **Chống compression bomb**: nếu `Content-Encoding: gzip/br/deflate` → giải nén **tăng dần** và **đếm byte đã giải nén**, ngắt khi vượt trần (tỉ lệ nén bất thường → chặn).
- **Slow-loris**: dùng timeout đọc từng chunk, không treo vô hạn.

### L9 — Không thực thi nội dung nguồn
- **Không** chạy JavaScript; **không** render headless; chỉ parse HTML tĩnh + JSON-LD.
- Sanitize/escape trước khi lưu hiển thị; **không** nội suy HTML thô vào UI.

### L10 — Không truyền danh tính hệ thống ra ngoài
- **KHÔNG** gửi sang site ngoài: `Cookie`, `Authorization`, `Proxy-Authorization`, bất kỳ header phiên/nội bộ của WALE, hay header do trình duyệt admin gửi.
- Chỉ gửi header tối thiểu: `Host` (đúng hostname), `User-Agent` **định danh crawler của WALE** (ví dụ `WaleCookingBot/1.0 (+https://<domain>/bots)`), `Accept`, `Accept-Language`, `Accept-Encoding` (chỉ khi bật kiểm soát bomb).
- **Không** dùng lại connection pool đã gắn cookie của user.

### L11 — Không lộ thông tin nội bộ qua lỗi
- Lỗi trả client là **mã nghiệp vụ chung** (`IMPORT_FETCH_FAILED` / `IMPORT_BLOCKED_URL` …); **không** trả IP nội bộ, không tên resolver, không stack, không thông điệp lỗi DNS chi tiết.
- Chi tiết kỹ thuật chỉ ghi **server-side** (log nội bộ / `ImportJobItem.lastError` đã **làm sạch**, không chứa IP).

---

## 2. Pipeline thực thi (ánh xạ 8 bước P16 §3)

```
(1) parse scheme ── chỉ http/https, không credentials        [L1]
(2) deny-list hostname (localhost/metadata/*.internal)       [L5]
(3) resolve DNS MỘT LẦN → tập IP                             [L3]
(4) kiểm mọi IP ∉ private/loopback/link-local/reserved/
    multicast + IPv4-mapped/IPv6 nguy hiểm                    [L2]
(5) PIN IP → connect tới đúng IP, Host = hostname gốc        [L4]
(6) theo redirect ≤5: LẶP LẠI (1)–(5) cho mỗi hop            [L6]
(7) kiểm Content-Type + size + timeout + chống bomb          [L8][L9]
(8) sanitize; KHÔNG thực thi JS; KHÔNG gửi danh tính hệ thống[L9][L10]
```
Port (L7) kiểm ở bước (1)/(5); lỗi (L11) áp cho toàn pipeline.

---

## 3. Khả thi trên Vercel Hobby + Node.js runtime

### 3.1 Nền tảng
- Route Handler chạy **Node.js runtime** (`export const runtime = "nodejs"`) → có `node:net`, `node:dns`, `node:tls`. **Không** dùng Edge runtime (thiếu API cần cho pin IP).
- `fetch` toàn cầu (undici) **không** cho pin IP trực tiếp ⇒ hai lựa chọn hợp lệ:
  - **(A — khuyến nghị)** dùng `undici.Agent`/`Dispatcher` với `connect.lookup` tùy biến trả **đúng IP đã kiểm** + `servername` = hostname gốc; và **tự xử lý redirect** (`redirect: "manual"`, tự chạy lại L1–L5 mỗi hop).
  - **(B)** nếu không dùng được `connect.lookup`: mở socket `node:net`/`node:tls` tới IP đã kiểm, tự ghi/đọc HTTP header + `Host`/SNI — nhiều mã hơn, chỉ dùng khi (A) bất khả thi.
- **Không thêm dependency mới ở I2.1** (ràng buộc). Thiết kế dùng `undici` sẵn có của Node; việc hiện thực thuộc phase triển khai I2.

### 3.2 Ma trận khả thi

| Yêu cầu | Khả thi trên Vercel Hobby (Node runtime)? | Ghi chú |
|---|---|---|
| Chỉ http/https; chặn credentials; deny-list hostname | ✅ | Thuần logic URL/string |
| Resolve DNS + kiểm IP (IPv4/IPv6/mapped) | ✅ | `node:dns/promises` + `node:net.isIP` + so khớp CIDR |
| **Pin IP khi kết nối** | ⚠️ **Có điều kiện** | Bắt buộc `connect.lookup` (undici) hoặc socket thủ công; **kiểm chứng bằng test ở I2** |
| Kiểm lại mỗi redirect, ≤5 hop | ✅ | `redirect: "manual"` + vòng lặp |
| Timeout/connect budget | ⚠️ | `AbortSignal` được, nhưng **trần thời gian function** của Hobby thấp → phải ≤ ngân sách (§3.3) |
| Giới hạn size + chống bomb | ✅ | Đọc stream, đếm byte giải nén |
| Không gửi cookie/Authorization | ✅ | Tự dựng header allow-list |
| Không lộ IP/DNS cho client | ✅ | Làm sạch `lastError` + error code chung |

### 3.3 Giới hạn **không thể bảo đảm tuyệt đối** (ghi rõ + phương án)
1. **Không có egress filtering ở tầng hạ tầng.** Vercel không cho cấu hình firewall egress; nên **kiểm IP trong ứng dụng (L2/L4) là tuyến phòng thủ duy nhất**. Nếu có sai sót logic → có thể chạm mạng nội bộ nền tảng.
   - **Phương án an toàn:** (a) **kiểm IP là bắt buộc & có test** cho cả IPv4/IPv6/mapped; (b) **pin IP** để loại TOCTOU; (c) nếu môi trường không chứng minh được pin IP → **fallback an toàn = từ chối fetch** (fail-closed) và chuyển phương án worker/hạ tầng (§3.4).
2. **Trần thời gian function thấp** ⇒ một fetch chậm + redirect + extract có thể vượt ngân sách 1 request.
   - **Phương án:** ngân sách cứng (connect ≤5s, tổng ≤15s **hoặc** nhỏ hơn trần nền tảng); nếu vượt → lưu item `queued` + `nextAttemptAt`, xử lý ở tick sau (không chặn request).
3. **DNS resolver là của nền tảng** — không tự chọn resolver/DPR. Phòng rebinding đặt ở **resolve-once + pin IP**, không ở resolver.
4. **Không có worker thường trực** ⇒ không thể "chạy nền" job dài (chi tiết VERCEL_COMPATIBILITY.md).

### 3.4 Khi nào cần tách hạ tầng
- Nếu **không chứng minh được pin IP** trên runtime hiện tại → chuyển fetch sang: **worker GitHub Actions** (batch, egress kiểm soát hơn) hoặc **VPS/container** có firewall egress deny private (phương án B/C trong `BATCH_PROCESSING_ARCHITECTURE.md §6`).
- Khi cần IP allow-list/deny ở tầng mạng → chỉ VPS/Cloudflare Workers (D) mới bảo đảm.

---

## 4. Checklist nghiệm thu SSRF (10 mục — P16 §6)

- [ ] scheme chỉ http/https; credentials bị chặn; URL dạng số nguyên/octal/hex bị chặn.
- [ ] `127.0.0.1`, `10./172.16-31./192.168.`, `169.254.169.254`, `::1`, `fc00::/7`, `fe80::/10` đều bị chặn.
- [ ] `::ffff:127.0.0.1` (IPv4-mapped) bị chặn.
- [ ] DNS rebinding: đổi bản ghi sau resolve **không** ảnh hưởng kết nối (pin IP).
- [ ] Redirect tới IP nội bộ bị chặn; >5 redirect bị dừng.
- [ ] Port không thuộc {80,443} bị chặn.
- [ ] Body > 5MB bị ngắt; gzip bomb bị ngắt.
- [ ] `Content-Type` ngoài allow-list bị từ chối.
- [ ] Cookie/Authorization/header nội bộ **không** được gửi đi.
- [ ] Client **không** nhận IP nội bộ/lỗi DNS chi tiết (chỉ error code chung).

---

## 5. Bất biến & rủi ro còn lại

**Bất biến (test bắt buộc ở I2):**
1. Không request nào tới IP private/loopback/link-local/reserved/metadata — kể cả qua redirect.
2. Kết nối luôn tới **IP đã kiểm** (pin), không resolve lại.
3. Không header danh tính hệ thống nào rời khỏi hệ thống.
4. Mọi lỗi fetch trả client ở dạng **code chung**, không lộ chi tiết.

**Rủi ro còn lại:** (a) pin IP phụ thuộc khả năng `connect.lookup` của runtime → cần test sớm; (b) không có egress firewall tầng mạng → phụ thuộc kiểm IP ứng dụng; (c) biến thể biểu diễn IP lạ (IPv6 zone id, encoding) → cần bộ test biên đầy đủ; (d) chuyển hướng chuỗi dài/dị thường → giới hạn cứng ≤5.

---

## 6. Kết luận

- Đã đặc tả **11 lớp bảo vệ** bao trùm toàn bộ yêu cầu B, ánh xạ vào pipeline 8 bước P16.
- Trên **Vercel Hobby + Node runtime**: hầu hết lớp **khả thi**; **pin IP** là điểm **có điều kiện** (cần `connect.lookup`/socket thủ công + test) — nếu không chứng minh được → **fail-closed** và chuyển fetch sang worker/ hạ tầng có egress kiểm soát.
- I2.1 **không** hiện thực bất kỳ lớp nào; đây là thiết kế để hiện thực ở I2 và kiểm thử ở phase test.
