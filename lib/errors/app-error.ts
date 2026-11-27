/**
 * Lớp lỗi ứng dụng (P06 §8).
 *
 * - Lỗi nghiệp vụ có mã HTTP + thông điệp AN TOÀN cho người dùng.
 * - KHÔNG bao giờ trả stack trace hay thông tin database ra ngoài.
 * - Chi tiết kỹ thuật (nếu cần) chỉ ghi log phía server, không đưa vào response.
 */

export type AppErrorCode =
  | "BAD_REQUEST"
  | "VALIDATION_ERROR"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "INTERNAL";

const STATUS_BY_CODE: Record<AppErrorCode, number> = {
  BAD_REQUEST: 400,
  VALIDATION_ERROR: 422,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL: 500,
};

export class AppError extends Error {
  readonly code: AppErrorCode;
  readonly status: number;
  /** Chi tiết theo trường (an toàn để trả cho client), ví dụ lỗi validate form. */
  readonly details?: Record<string, string[]>;

  constructor(
    code: AppErrorCode,
    message: string,
    details?: Record<string, string[]>,
  ) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.status = STATUS_BY_CODE[code];
    this.details = details;
  }
}

export class ValidationError extends AppError {
  constructor(details: Record<string, string[]>, message = "Dữ liệu không hợp lệ.") {
    super("VALIDATION_ERROR", message, details);
    this.name = "ValidationError";
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Không tìm thấy dữ liệu.") {
    super("NOT_FOUND", message);
    this.name = "NotFoundError";
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "Bạn không có quyền thực hiện thao tác này.") {
    super("FORBIDDEN", message);
    this.name = "ForbiddenError";
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Bạn cần đăng nhập để thực hiện thao tác này.") {
    super("UNAUTHORIZED", message);
    this.name = "UnauthorizedError";
  }
}

export class ConflictError extends AppError {
  constructor(message = "Dữ liệu đã tồn tại.") {
    super("CONFLICT", message);
    this.name = "ConflictError";
  }
}

export interface ErrorResponseBody {
  error: {
    code: AppErrorCode;
    message: string;
    details?: Record<string, string[]>;
  };
}

/**
 * Chuyển lỗi bất kỳ thành body JSON an toàn.
 * Lỗi không xác định → 500 với thông điệp chung (không lộ chi tiết nội bộ).
 */
export function toErrorResponse(error: unknown): { status: number; body: ErrorResponseBody } {
  if (error instanceof AppError) {
    return {
      status: error.status,
      body: {
        error: {
          code: error.code,
          message: error.message,
          ...(error.details ? { details: error.details } : {}),
        },
      },
    };
  }

  return {
    status: 500,
    body: { error: { code: "INTERNAL", message: "Đã xảy ra lỗi hệ thống." } },
  };
}
