import type { NextRequest } from "next/server";

import { handle, jsonOk } from "@/lib/api/http";
import { getCurrentActor } from "@/lib/auth/session";
import { recipeService, type RawQuery } from "@/lib/services";

/**
 * `GET /api/v1/recipes` — danh sách công thức CÔNG KHAI (chỉ `published`, BR-13).
 * Hỗ trợ phân trang, lọc (foodType/cuisine/difficulty) và sắp xếp.
 *
 * `POST /api/v1/recipes` — tạo công thức (Editor/Admin). Actor lấy từ phiên đăng nhập;
 * khi Auth.js chưa nối, `getCurrentActor()` trả `null` → 401 (đúng hành vi an toàn).
 */

export async function GET(request: NextRequest): Promise<Response> {
  return handle(async () => {
    const query = Object.fromEntries(request.nextUrl.searchParams.entries()) as RawQuery;
    const result = await recipeService.listPublic(query);
    return jsonOk(result);
  });
}

export async function POST(request: NextRequest): Promise<Response> {
  return handle(async () => {
    const actor = await getCurrentActor();
    const body: unknown = await request.json().catch(() => null);
    const recipe = await recipeService.create(actor, body);
    return jsonOk({ recipe }, 201);
  });
}
