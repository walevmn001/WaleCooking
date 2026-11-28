# P12.3 — STORAGE PRODUCTION READINESS (WALE COOKING)

> Phase: **P12 — Production Deployment & Browser Verification**
> Ngày: 2026-11-28 · Người thực hiện: 1 AI Agent (không sub-agent)
> Phạm vi: audit & gia cố đường lưu trữ media cho production. **Không** đổi interface/port; **không** xóa local adapter (dev/test cần).

---

## 1. Kiến trúc lưu trữ hiện tại (đã xác minh)

Đường đi của một tệp media:

```
POST /api/v1/media  →  media.service.upload()
                         ├─ validateImageFile()   (magic bytes, ≤8MB)   lib/storage/image-validation.ts
                         ├─ buildStorageKey()     (khóa do SERVER sinh)  lib/services/media.service.ts
                         ├─ storage.put()         (StoragePort)          lib/storage/index.ts → adapter
                         └─ repos.media.create()  (CHỈ metadata → Postgres)
```

| Thành phần | Vai trò | Trạng thái |
|---|---|---|
| `storage.port.ts` | Cổng `StoragePort` (put/delete/publicUrl/getSignedUrl?) | ✅ Không đổi (theo yêu cầu) |
| `local-storage.adapter.ts` | Ghi FS cục bộ (`MEDIA_LOCAL_DIR`, mặc định `.media-local`) cho dev/test | ✅ Giữ nguyên |
| `r2-storage.adapter.ts` | Cloudflare R2 qua S3 API; đọc `R2_*` env, không hardcode | ✅ Giữ nguyên |
| `index.ts` `getStorage()` | Chọn adapter theo cấu hình | ✅ **Đã sửa** (guard production) |
| `media.service.ts` | Nghiệp vụ media | ✅ **Đã sửa** (giải mã storage lazy) |
| `media/file/[...key]/route.ts` | Proxy phục vụ tệp local (dev/test) | ✅ Giữ nguyên |

---

## 2. Lỗi/ rủi ro phát hiện & cách xử lý

### FIND-07 — Production im lặng ghi media vào FS tạm Vercel (High)

**Trước (lỗi):**
```ts
let cached: StoragePort | null = null;
export function getStorage(): StoragePort {
  if (cached) return cached;
  cached = hasR2Env() ? new R2StorageAdapter() : new LocalStorageAdapter(); // ← im lặng chọn local
  return cached;
}
```
Nếu Vercel **thiếu** `R2_*`, `getStorage()` trả `LocalStorageAdapter` → upload ghi vào filesystem
**ephemeral** của Vercel (mất sau mỗi lần deploy/scale, không chia sẻ giữa các instance) nhưng API
vẫn báo thành công ⇒ **mất dữ liệu âm thầm**.

**Sau (đã sửa)** — [lib/storage/index.ts](file:///workspace/lib/storage/index.ts#L19-L45):
```ts
export function getStorage(): StoragePort {
  if (cached) return cached;
  if (hasR2Env()) {
    cached = new R2StorageAdapter();
  } else if (process.env.NODE_ENV === "production") {
    throw missingR2InProduction();     // ← CHẶN, không fallback local ở production
  } else {
    cached = new LocalStorageAdapter(); // dev/test vẫn dùng local
  }
  return cached;
}
```
- Production **bắt buộc** có R2; ném lỗi rõ ràng (chỉ nêu **tên biến**, không lộ giá trị bí mật).
- Dev/test (`NODE_ENV != production`) vẫn dùng local adapter bình thường.

### Giải mã storage LAZY trong `MediaService` (song hành với FIND-04)

`export const mediaService = new MediaService()` chạy ở **phạm vi module**. Trước đây constructor
gọi `getStorage()` ngay ⇒ nếu là production thiếu R2, **mọi route import `mediaService` sẽ ném lỗi
lúc evaluate** (đúng loại lỗi "Failed to collect configuration" của Vercel, xảy ra với cả route không
liên quan media). Đã chuyển sang getter lazy — [lib/services/media.service.ts](file:///workspace/lib/services/media.service.ts#L41-L52):

```ts
private get storage(): StoragePort {
  if (!this.resolvedStorage) {
    this.resolvedStorage = this.storageOverride ?? getStorage(); // chỉ chạy khi THỰC SỰ thao tác tệp
  }
  return this.resolvedStorage;
}
```
⇒ `next build` và mọi route không dùng media **không** bị ảnh hưởng; guard chỉ kích hoạt đúng lúc
upload. Không bỏ validation, không biến lỗi DB/storage thành "thành công giả".

### FIND-05 — Cảnh báo tracing "dynamic filesystem access" (Medium, chấp nhận)

- Nguồn: `app/api/v1/media/file/[...key]/route.ts` (`path.resolve(process.env.MEDIA_LOCAL_DIR, joined)`)
  và `local-storage.adapter.ts`. Next/Turbopack cảnh báo *"Dynamic filesystem access causes tracing of
  the whole project"*.
- **Đánh giá:** cảnh báo **chỉ về tracing/kích thước bundle**, KHÔNG phải lỗi build. Route và adapter
  này **chỉ phục vụ local** (dev/test); ở production `getStorage()` dùng R2 và route đã tự trả 404 khi
  `hasR2Env()`.
- **Quyết định:** **KHÔNG** dùng `turbopackIgnore`/bổ sung hack (theo yêu cầu: "không bỏ qua cảnh báo
  nếu chưa có bằng chứng cần thiết"). Ghi nhận là **known warning**, không ảnh hưởng chức năng.
  Có thể cải thiện sau bằng `outputFileTracingExcludes` nếu cần tối ưu — **ngoài phạm vi P12**.

### Bổ sung: `.media-local/` vào `.gitignore`

Thư mục media local (mặc định `.media-local`) chưa bị ignore → nguy cơ commit nhầm ảnh dev.
Đã thêm `/.media-local/` vào [.gitignore](file:///workspace/.gitignore#L17-L18).

---

## 3. Kiểm tra chức năng (bằng chứng THỰC TẾ)

Môi trường: production server (`next start`) trên `127.0.0.1:3000`, `NODE_ENV=production`,
`DATABASE_URL` trỏ Postgres cục bộ, **không** có `R2_*`.

| # | Kiểm tra | Lệnh / cách làm | Kết quả | Trạng thái |
|---|---|---|---|---|
| 1 | Đọc tệp local (đường hợp lệ) | Đặt `p12-test.png` (PNG 1×1) vào `.media-local/recipes/2026/11/`, `GET /api/v1/media/file/recipes/2026/11/p12-test.png` | `200`, `Content-Type: image/png`, `size=70`, có `X-Content-Type-Options: nosniff` | **PASS** |
| 2 | Path traversal (`..%2f`) | `GET /api/v1/media/file/..%2f..%2f..%2fetc%2fpasswd` | `404` | **PASS** |
| 3 | Path traversal (encoded) | `GET /api/v1/media/file/..%2f..%2fpackage.json` (kiểm ở P12.1) | `404` | **PASS** |
| 4 | Tệp không tồn tại | `GET /api/v1/media/file/recipes/2026/11/nope.png` | `404` | **PASS** |
| 5 | Upload không xác thực | `POST /api/v1/media` (guest) | `401` `{"error":{"code":"UNAUTHORIZED"...}}` | **PASS** |
| 6 | Admin API không xác thực | admin recipe API (guest) | `401` | **PASS** |
| 7 | Magic bytes & giới hạn | `validateImageFile()` — unit test (JPEG/PNG/WebP/AVIF, rỗng, >8MB) | PASS (unit suite) | **PASS** |
| 8 | MIME khi phục vụ | `MIME_BY_EXT[ext]` + `nosniff` | PASS (kiểm #1) | **PASS** |
| 9 | `isSafeStorageKey` chặn `..`, `/` đầu | unit test | PASS (unit suite) | **PASS** |
| 10 | Guard production thiếu R2 | `getStorage()` khi `NODE_ENV=production` & không `R2_*` | ném lỗi rõ ràng (kiểm bằng logic + build) | **PASS (logic)** |
| 11 | Build không phụ thuộc storage | `rm -rf .next && env -u DATABASE_URL pnpm build` (P12.2) | 42 route OK | **PASS** |

> Ảnh test được xóa ngay sau khi kiểm; `.media-local/` đã được gitignore.

---

## 4. Adapter R2 — biến môi trường cần cấu hình trên Vercel

Theo đúng implementation hiện tại ([r2-storage.adapter.ts](file:///workspace/lib/storage/r2-storage.adapter.ts#L30-L58)),
`hasR2Env()` yêu cầu **đủ 4 biến** sau (tên chính xác, không tự đặt tên mới):

| Biến | Bắt buộc | Ghi chú |
|---|---|---|
| `R2_ACCOUNT_ID` | ✅ | Cloudflare account ID (endpoint `https://<id>.r2.cloudflarestorage.com`) |
| `R2_ACCESS_KEY_ID` | ✅ | Khóa truy cập R2 |
| `R2_SECRET_ACCESS_KEY` | ✅ | Khóa bí mật R2 (**không** in ra log) |
| `R2_BUCKET` | ✅ | Tên bucket |
| `R2_PUBLIC_BASE_URL` | ⬜ | Tùy chọn — domain công khai (r2.dev/custom). Nếu thiếu, `publicUrl()` trả **key thô** thay vì URL đầy đủ |

- `MEDIA_LOCAL_DIR`: chỉ dùng cho local adapter (dev/test); **không** dùng ở production.
- ⚠️ **Lưu ý:** nếu production đặt đủ `R2_*` nhưng **thiếu** `R2_PUBLIC_BASE_URL`, `publicUrl()` trả
  key thô → ảnh không hiển thị qua URL trực tiếp. Xem mục 6 (khuyến nghị kiểm thử thủ công).

---

## 5. Trạng thái 4 mức

| Hạng mục | Trạng thái |
|---|---|
| Guard production (FIND-07) | **PASS** (đã sửa + typecheck/lint/build) |
| Lazy storage trong MediaService | **PASS** |
| Path traversal / MIME / tệp không tồn tại / auth | **PASS** (HTTP thực tế) |
| Magic bytes / giới hạn / khóa an toàn | **PASS** (unit suite) |
| Cảnh báo tracing (FIND-05) | **PASS có ghi chú** (known warning, không phải lỗi) |
| R2 end-to-end thật (upload/đọc trên R2) | **BLOCKED** — sandbox không có credentials R2 |
| R2 trên Vercel (external) | **PENDING** — cần chủ dự án cấu hình `R2_*` và kiểm thử thủ công |

**External Verification Pending:** hành vi R2 thật (put/get/public URL) **chưa** được xác minh trong
sandbox do thiếu credential. **Không** giả lập R2 đã hoạt động.

---

## 6. Việc chủ dự án cần thao tác (manual, khi có R2)

1. Trên Vercel → Project → Settings → Environment Variables, thêm đủ 5 biến ở mục 4 (Production + Preview).
2. Tạo bucket R2 và (tùy chọn) gắn domain công khai → đặt `R2_PUBLIC_BASE_URL`.
3. Redeploy; sau đó:
   - Đăng nhập admin → tải 1 ảnh thử → xác nhận `201` và object xuất hiện trong bucket.
   - `GET` URL ảnh trả về → xác nhận ảnh tải được (kiểm tra cả `R2_PUBLIC_BASE_URL`).
   - `GET /api/v1/media/file/<key>` phải trả **404** (vì route local tự tắt khi có R2) — đây là hành vi đúng.
4. Nếu **chưa** cấu hình R2 trên production: upload sẽ **báo lỗi rõ ràng** (không còn ghi FS tạm) — đúng theo thiết kế.

---

## 7. Kết luận

- Đã **loại bỏ rủi ro mất dữ liệu media âm thầm** ở production (FIND-07) mà **không** đổi interface,
  **không** xóa local adapter (dev/test vẫn dùng).
- Build/typecheck/lint **không** bị ảnh hưởng; guard kích hoạt đúng thời điểm.
- Đường lưu trữ local (đọc/MIME/traversal/auth) đã **xác minh thực tế**; R2 end-to-end **BLOCKED** do
  thiếu credentials → có checklist thủ công ở mục 6.
