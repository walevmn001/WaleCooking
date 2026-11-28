import type { NextRequest } from "next/server";

import { handle, jsonOk } from "@/lib/api/http";
import { getCurrentActor } from "@/lib/auth/session";
import { taxonomyService } from "@/lib/services";

/**
 * `POST /api/v1/admin/taxonomy` — tạo danh mục (term) mới (Admin).
 *
 * Yêu cầu quyền `taxonomy:manage`. Actor lấy từ phiên đăng nhập; khi Auth.js chưa nối,
 * `getCurrentActor()` trả `null` → bị từ chối (401). Kiểm tra quyền ở SERVER, không chỉ UI.
 */
export async function POST(request: NextRequest): Promise<Response> {
  return handle(async () => {
    const actor = await getCurrentActor();
    const body: unknown = await request.json().catch(() => null);
    const term = await taxonomyService.createTerm(actor, body);
    return jsonOk({ term }, 201);
  });
}
