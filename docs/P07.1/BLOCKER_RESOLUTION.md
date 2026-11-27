# P07.1 — Blocker Resolution

> Cập nhật: 2026-11-28 (P07.1).

## Phân loại blocker

| Blocker | Phân loại | Hành động P07.1 | Trạng thái |
| --- | --- | --- | --- |
| B-P06-01: Neon PostgreSQL | 2. Có impl, thiếu credentials | Cấu hình env + hướng dẫn hoàn chỉnh | ⏳ External verification pending |
| B-P06-02: Auth.js chưa nối | 3. Chưa triển khai → **đã triển khai** | Cài Auth.js v5 + PrismaAdapter + route handler | ✅ Implementation complete (chưa có provider) |
| B-P06-03: R2 credentials | 2. Có impl, thiếu credentials | Adapter R2 hoàn chỉnh (P07) + contract test (P07.1) | ⏳ External verification pending |
| B-P07-01: R2 thật | 2. Có impl, thiếu credentials | Contract test cho storage port | ⏳ External verification pending |
| B-P07-02: HTTP E2E authorization | 2. Có impl, thiếu Auth.js provider | HTTP error contract test (7) + workflow E2E (8) | ⏳ Service-level verified; HTTP E2E pending |
| B-P07-03: Upload ảnh trong form | 1. Đã giải quyết | API `POST /api/v1/media` đã có (P07); form gửi metadata | ✅ API ready (frontend chưa nối — P08+) |
| B-P07-04: UI trình duyệt thật | 2. Không có trình duyệt headless | Không thay đổi | ⏳ Cần môi trường trình duyệt |
| B-P07-05: BR-03 reviewer | 1. Đã giải quyết (một phần) | `submit-review` + `publish` hoạt động; luồng editor→admin chưa đầy đủ | 🟡 Một phần (B-P01-01) |

## Quyết định

- **B-P06-02**: Đã triển khai Auth.js v5. Chưa có provider → `auth()` trả `null` → fail-closed 401.
- **B-P07-02**: HTTP 401/403 được kiểm ở tầng service (actor từ DB test). HTTP E2E thật cần Auth.js provider.
- **External verification**: Neon, R2, Auth.js providers đều thiếu credentials → không thể xác minh trên dịch vụ thật.
