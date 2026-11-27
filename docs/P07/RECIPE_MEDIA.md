# P07 — RECIPE MEDIA

> Tích hợp media cho module công thức theo [docs/P02/MEDIA_STORAGE.md](../P02/MEDIA_STORAGE.md).
> Nguyên tắc: **Postgres chỉ lưu metadata; bytes ở storage adapter**. Cập nhật: 2026-11-28 (P07).

---

## 1. Kiến trúc (Ports & Adapters)

```
Client ──multipart/form-data──▶ POST /api/v1/media
                                      │ mediaService.upload(actor, input)
                                      │  ├─ requirePermission(actor,"media:upload")
                                      │  ├─ validateImageFile(bytes)   ← magic bytes + ≤8MB
                                      │  ├─ buildStorageKey(ext, filename)  ← server sinh
                                      │  ├─ storage.put({key, body, contentType})
                                      │  └─ mediaRepository.create({...metadata})
                                      ▼
                       StoragePort (R2 mục tiêu │ Local dev/test)  +  Postgres (metadata)
```

- `StoragePort` ([storage.port.ts](../../lib/storage/storage.port.ts)): `put`, `delete`,
  `publicUrl`, `getSignedUrl?`.
- `getStorage()` ([lib/storage/index.ts](../../lib/storage/index.ts)): chọn **R2** nếu có đủ env
  `R2_*`, ngược lại **Local**. Singleton theo tiến trình.
- KHÔNG hardcode credential. KHÔNG lưu bytes vào Postgres.

---

## 2. Kiểm tra tệp (không tin client)

[lib/storage/image-validation.ts](../../lib/storage/image-validation.ts):

| Kiểm | Cách | Vi phạm |
| --- | --- | --- |
| Loại tệp thật | **magic bytes** (`detectImageType`) | `ValidationError` 422 |
| Định dạng cho phép | JPEG, PNG, WebP, AVIF | 422 |
| Dung lượng | ≤ **8 MB** (`MAX_IMAGE_BYTES`) | 422 |
| Kích thước pixel | ≤ **8192** cạnh (`isWithinDimensionLimit`, khi biết) | 422 |

- **KHÔNG** tin `Content-Type` hay `filename` từ client để suy ra loại tệp.
- `toSafeSlugSegment(name)`: chuyển tên gợi ý thành slug an toàn (chỉ dùng cho mô tả phần khóa).

## 3. Khóa lưu trữ do server sinh

```
recipes/YYYY/MM/<uuid>-<slug>.<ext>
```

[buildStorageKey()](../../lib/services/media.service.ts#L96-L103) — dùng UUID ngẫu nhiên (chống
ghi đè/path traversal), `YYYY/MM` theo **UTC**, `ext` suy từ magic bytes (không từ client).

## 4. Nhà cung cấp

### 4.1 R2StorageAdapter (mục tiêu)

[lib/storage/r2-storage.adapter.ts](../../lib/storage/r2-storage.adapter.ts) — Cloudflare R2 qua
API tương thích S3 (`@aws-sdk/client-s3`):

- Endpoint: `https://<R2_ACCOUNT_ID>.r2.cloudflarestorage.com`, region `auto`.
- `put` đặt `Cache-Control: public, max-age=31536000, immutable`.
- `publicUrl` dùng `R2_PUBLIC_BASE_URL` (nếu cấu hình).
- `getSignedUrl` (presign GET, TTL ngắn) cho asset nháp/chưa xuất bản.
- `readR2Config()` chỉ nêu **tên** biến thiếu, **không** in giá trị bí mật.

### 4.2 LocalStorageAdapter (dev/test)

[lib/storage/local-storage.adapter.ts](../../lib/storage/local-storage.adapter.ts) — ghi bytes
xuống `MEDIA_LOCAL_DIR` (mặc định `.media-local`). Phục vụ qua route proxy
`/api/v1/media/file/{key}` ([route](../../app/api/v1/media/file/[...key]/route.ts)):
chặn path traversal (`isSafeStorageKey`), đặt `X-Content-Type-Options: nosniff`,
`Content-Type` suy từ **phần mở rộng**; khi đã có R2 → trả **404** (R2 tự phục vụ).
⚠️ KHÔNG dùng cho production (ghi đĩa không phù hợp serverless).

## 5. Metadata trong Postgres

Bảng `media_assets` — model `MediaAsset`; DTO `MediaAssetDto`
([media.repository.ts](../../lib/db/repositories/media.repository.ts)):
`storageKey`, `publicUrl`, `mimeType`, `sizeBytes`, `width`, `height`, `altTextDefault`,
`status`, `createdAt`.

- Bytes **không** nằm trong DB.
- Ảnh liên kết công thức qua `recipe_images` (`role`: `primary|gallery|step`, `altText`, `sortOrder`).

## 6. Vòng đời & xóa

- `POST /api/v1/media` → tạo asset (201).
- `DELETE /api/v1/media/{id}` → **soft-archive** (`status='archived'`).
  - `countRecipeLinks(id) > 0` → `ConflictError` **409** ("đang được công thức sử dụng").
  - Cho phép khi không còn tham chiếu (đúng P02 §12 "204 khi không còn tham chiếu").
- Xóa cứng tệp khỏi storage là thao tác riêng (chưa bật mặc định — ưu tiên an toàn).

## 7. Quyền

- `media:upload` cho Editor & Admin (upload/archive).
- `GET /api/v1/media/{id}` (metadata) hiện không yêu cầu quyền — **chỉ** trả metadata an toàn,
  không lộ storage nội bộ. (Cân nhắc siết ở phase sau.)

## 8. Ảnh lỗi / chưa có

- Frontend: `RecipeImage` (P05) hiển thị **mascot P04** khi thiếu/lỗi ảnh → không ảnh vỡ.
- Chi tiết hiển thị: [RECIPE_FRONTEND.md](./RECIPE_FRONTEND.md) §8.

---

## 9. Phần CHƯA xác minh (ghi rõ)

- ⛔ **Chưa có credentials Cloudflare R2** → toàn bộ luồng media đã kiểm trên
  **LocalStorageAdapter** (dev/test). R2 adapter đã hoàn thiện về code nhưng **chưa** kết nối
  bucket/endpoint thật, chưa kiểm SSL/CORS/CDN (B-P06-03 → B-P07-01).
- ⛔ Chưa có pipeline xử lý ảnh (resize/optimize/AVIF variants) — P02 để phase sau.
- ⛔ Luồng upload trong form quản trị chưa nối vào `POST /api/v1/media` (xem
  [RECIPE_FRONTEND.md](./RECIPE_FRONTEND.md) §10).
- ⛔ Chưa cấu hình bucket policy / giới hạn rate upload.
