/**
 * Hợp đồng lỗi API Import — kế thừa ĐÚNG hợp đồng lỗi hiện có
 * (`lib/errors/app-error.ts`) để KHÔNG tạo mã lỗi trùng.
 *
 * Xem I2.1 `API_AUTH_DESIGN.md` §5: URL sai → 422 `VALIDATION_ERROR`;
 * 401/403 theo `requirePermission`; 404 khi thiếu job/item; 409 khi trùng.
 */

import type { AppErrorCode, ErrorResponseBody } from "@/lib/errors/app-error";

/** Mã lỗi dùng cho API Import — chính là tập `AppErrorCode` hiện có. */
export type ImportErrorCode = AppErrorCode;

/** Chi tiết lỗi theo trường (an toàn để trả client), ví dụ `{ url: ["scheme không được phép"] }`. */
export type ImportFieldErrors = Record<string, string[]>;

/** Body lỗi của API Import — cùng hình dạng với `toErrorResponse()`. */
export type ImportErrorResponse = ErrorResponseBody;
