# P07.1 — E2E Test Report

> Cập nhật: 2026-11-28 (P07.1).

## 1. Tổng quan

| Nhóm | Tests | Kết quả |
| --- | --- | --- |
| HTTP error contract | 7 | ✅ pass |
| Storage contract (local + R2 config) | 9 | ✅ pass |
| Recipe workflow E2E | 8 | ✅ pass |
| **Tổng P07.1 mới** | **24** | **✅ pass** |
| Toàn bộ unit | 140/140 (20 file) | ✅ pass |
| Toàn bộ integration | 58/58 (8 file) | ✅ pass |

## 2. HTTP error contract (`tests/lib/http-error-contract.test.ts`)

| Test | Kết quả |
| --- | --- |
| UnauthorizedError → 401 + code UNAUTHORIZED | ✅ |
| ForbiddenError → 403 + code FORBIDDEN | ✅ |
| ValidationError → 422 + chi tiết theo trường | ✅ |
| NotFoundError → 404 | ✅ |
| ConflictError → 409 | ✅ |
| Lỗi không xác định → 500, không lộ secret | ✅ |
| Body luôn `{ error: { code, message } }` | ✅ |

## 3. Storage contract (`tests/lib/storage-contract.test.ts`)

| Test | Kết quả |
| --- | --- |
| Local adapter provider = 'local' | ✅ |
| put trả về key + url | ✅ |
| publicUrl dùng proxy nội bộ | ✅ |
| Chặn path traversal (`../`, `/absolute`) | ✅ |
| put key không hợp lệ → ConflictError | ✅ |
| delete key không tồn tại không lỗi | ✅ |
| hasR2Env() false khi thiếu | ✅ |
| readR2Config() ném lỗi rõ ràng khi thiếu | ✅ |
| readR2Config() trả cấu hình khi đủ | ✅ |

## 4. Recipe workflow E2E (`tests/integration/recipe-workflow.test.ts`)

| Test | Kết quả |
| --- | --- |
| Tạo công thức → trạng thái `draft` | ✅ |
| Draft KHÔNG hiển thị công khai | ✅ |
| Gửi duyệt → `in_review`, vẫn không công khai | ✅ |
| Editor xuất bản → `published` | ✅ |
| Published hiển thị công khai | ✅ |
| Lưu trữ → `archived`, ẩn công khai | ✅ |
| Guest (null) tạo → 401 | ✅ |
| Guest xuất bản → 401 | ✅ |

## 5. Giới hạn

- **HTTP E2E thật** (qua route handler với session thật) chưa thực hiện do thiếu Auth.js provider.
  Authorization được kiểm ở **tầng service** (actor giả tạo bằng DB test).
- **R2 upload thật** chưa kiểm tra do thiếu credentials.
