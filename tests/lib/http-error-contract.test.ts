import { describe, expect, it } from "vitest";

import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
  toErrorResponse,
  UnauthorizedError,
  ValidationError,
} from "@/lib/errors/app-error";

/**
 * Kiểm chứng contract lỗi HTTP cho API (P07.1 §5.3, §7).
 *
 * Mọi lỗi nghiệp vụ phải trả về `{ error: { code, message, details? } }`
 * với status code đúng. Lỗi không xác định → 500, không lộ chi tiết nội bộ.
 */
describe("HTTP error contract", () => {
  it("UnauthorizedError → 401 + code UNAUTHORIZED", () => {
    const { status, body } = toErrorResponse(new UnauthorizedError());
    expect(status).toBe(401);
    expect(body.error.code).toBe("UNAUTHORIZED");
    expect(body.error.message).toBeTruthy();
    expect(body.error.details).toBeUndefined();
  });

  it("ForbiddenError → 403 + code FORBIDDEN", () => {
    const { status, body } = toErrorResponse(new ForbiddenError());
    expect(status).toBe(403);
    expect(body.error.code).toBe("FORBIDDEN");
  });

  it("ValidationError → 422 + chi tiết theo trường", () => {
    const { status, body } = toErrorResponse(
      new ValidationError({ slug: ["Slug đã được sử dụng."] }),
    );
    expect(status).toBe(422);
    expect(body.error.code).toBe("VALIDATION_ERROR");
    expect(body.error.details?.slug).toEqual(["Slug đã được sử dụng."]);
  });

  it("NotFoundError → 404", () => {
    const { status, body } = toErrorResponse(new NotFoundError());
    expect(status).toBe(404);
    expect(body.error.code).toBe("NOT_FOUND");
  });

  it("ConflictError → 409", () => {
    const { status, body } = toErrorResponse(new ConflictError());
    expect(status).toBe(409);
    expect(body.error.code).toBe("CONFLICT");
  });

  it("Lỗi không xác định → 500, không lộ stack trace / chi tiết nội bộ", () => {
    const { status, body } = toErrorResponse(new Error("secret internal detail: password=123"));
    expect(status).toBe(500);
    expect(body.error.code).toBe("INTERNAL");
    expect(body.error.message).toBe("Đã xảy ra lỗi hệ thống.");
    expect(JSON.stringify(body)).not.toContain("password=123");
    expect(JSON.stringify(body)).not.toContain("secret");
  });

  it("Body lỗi luôn có dạng { error: { code, message } }", () => {
    const { body } = toErrorResponse(new UnauthorizedError());
    expect(body).toHaveProperty("error");
    expect(body.error).toHaveProperty("code");
    expect(body.error).toHaveProperty("message");
  });
});
