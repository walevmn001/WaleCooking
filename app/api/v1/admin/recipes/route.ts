import type { NextRequest } from "next/server";

import { handle, jsonOk } from "@/lib/api/http";
import { getCurrentActor } from "@/lib/auth/session";
import { recipeService, type RawQuery } from "@/lib/services";

/**
 * `GET /api/v1/admin/recipes?status=&page=` — danh sách công thức cho quản trị
 * (Editor/Admin). Hỗ trợ lọc theo trạng thái (`draft|in_review|published|archived|any`).
 */
export async function GET(request: NextRequest): Promise<Response> {
  return handle(async () => {
    const actor = await getCurrentActor();
    const query = Object.fromEntries(request.nextUrl.searchParams.entries()) as RawQuery;
    const result = await recipeService.listAdmin(actor, query);
    return jsonOk(result);
  });
}
