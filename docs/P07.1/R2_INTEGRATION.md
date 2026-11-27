# P07.1 — Cloudflare R2 Integration

> Cập nhật: 2026-11-28 (P07.1).

## 1. Trạng thái

| Mục | Kết quả |
| --- | --- |
| StoragePort interface | ✅ `lib/storage/storage.port.ts` |
| R2 adapter | ✅ `lib/storage/r2-storage.adapter.ts` (S3-compatible) |
| Local adapter | ✅ `lib/storage/local-storage.adapter.ts` (dev/test) |
| Magic bytes validation | ✅ `lib/storage/image-validation.ts` |
| Server-generated key | ✅ `MediaService.buildStorageKey()` |
| Upload API | ✅ `POST /api/v1/media` |
| Xác minh R2 thật | ⏳ Chưa có credentials |

## 2. Kiến trúc (Ports & Adapters)

```
RecipeService → MediaService → StoragePort (interface)
                                    ├── R2StorageAdapter (production)
                                    └── LocalStorageAdapter (dev/test)
```

- Bytes ở storage; metadata ở PostgreSQL (`media_assets`).
- Recipe service KHÔNG phụ thuộc trực tiếp SDK R2.
- Chọn adapter theo `hasR2Env()`.

## 3. Bảo mật upload

| Kiểm tra | Vị trí |
| --- | --- |
| Magic bytes (PNG/JPEG/WebP/GIF) | `image-validation.ts` |
| File size (≤8MB) | media route |
| File rỗng | media route |
| Path traversal | `isSafeStorageKey()` |
| Object key do server sinh | `buildStorageKey()` |
| Không tin Content-Type client | media route (dùng magic bytes) |

## 4. Cấu hình env

```env
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET=
R2_PUBLIC_BASE_URL=
MEDIA_LOCAL_DIR=.media-local   # fallback khi chưa có R2
```

## 5. Xác minh local

- `LocalStorageAdapter`: put/delete/publicUrl — pass (9 tests).
- R2 config: `hasR2Env()` false khi thiếu, `readR2Config()` ném lỗi rõ ràng.
- Upload qua API với local adapter — pass.

## 6. External verification pending

Cần R2 credentials để xác minh:
- Upload ảnh thật lên R2.
- Đọc lại ảnh.
- Presigned URL.
- CORS/CDN/public URL.
