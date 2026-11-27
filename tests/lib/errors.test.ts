import { describe, expect, it } from "vitest";

import {
  AppError,
  ConflictError,
  ForbiddenError,
  NotFoundError,
  toErrorResponse,
  UnauthorizedError,
  ValidationError,
} from "@/lib/errors/app-error";

describe("errors/AppError", () => {
  it("gán mã HTTP theo loại lỗi", () => {
    expect(new ValidationError({ a: ["x"] }).status).toBe(422);
    expect(new UnauthorizedError().status).toBe(401);
    expect(new ForbiddenError().status).toBe(403);
    expect(new NotFoundError().status).toBe(404);
    expect(new ConflictError().status).toBe(409);
  });

  it("toErrorResponse trả body an toàn cho lỗi nghiệp vụ (kèm details)", () => {
    const { status, body } = toErrorResponse(new ValidationError({ slug: ["không hợp lệ"] }));
    expect(status).toBe(422);
    expect(body.error.code).toBe("VALIDATION_ERROR");
    expect(body.error.details).toEqual({ slug: ["không hợp lệ"] });
  });

  it("KHÔNG lộ chi tiết nội bộ với lỗi không xác định (không stack trace)", () => {
    const leak = new Error("Connection string postgres://user:secret@host/db bị từ chối");
    const { status, body } = toErrorResponse(leak);
    expect(status).toBe(500);
    expect(body.error.code).toBe("INTERNAL");
    expect(body.error.message).toBe("Đã xảy ra lỗi hệ thống.");
    expect(JSON.stringify(body)).not.toContain("secret");
    expect(JSON.stringify(body)).not.toContain("postgres://");
  });

  it("AppError giữ thông điệp an toàn", () => {
    const error = new AppError("CONFLICT", "Dữ liệu đã tồn tại.");
    expect(error.message).toBe("Dữ liệu đã tồn tại.");
  });
});
