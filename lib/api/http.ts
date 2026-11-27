import { NextResponse } from "next/server";

import { toErrorResponse } from "@/lib/errors/app-error";

/**
 * Tiện ích response cho API (P07 §14).
 * - Định dạng lỗi thống nhất `{ error: { code, message, details? } }` (P02 API contract).
 * - KHÔNG trả stack trace / chi tiết nội bộ cho client.
 */

export function jsonOk<T>(data: T, status = 200): NextResponse {
  return NextResponse.json(data, { status });
}

/**
 * Bọc handler: mọi lỗi (AppError hoặc không xác định) được chuyển thành response an toàn.
 */
export async function handle(fn: () => Promise<NextResponse>): Promise<NextResponse> {
  try {
    return await fn();
  } catch (error) {
    const { status, body } = toErrorResponse(error);
    return NextResponse.json(body, { status });
  }
}
