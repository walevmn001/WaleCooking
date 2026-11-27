import type { NextRequest } from "next/server";

import { handle, jsonOk } from "@/lib/api/http";
import { getCurrentActor } from "@/lib/auth/session";
import { recipeService } from "@/lib/services";

/**
 * `POST /api/v1/recipes/{id}/submit-review` — gửi công thức sang trạng thái `in_review`
 * (Editor/Admin).
 *
 * Ghi chú: P02 API_CONTRACT mô tả luồng duyệt qua `POST /admin/recipes/{id}/review`.
 * Endpoint chuyển trạng thái `draft → in_review` này là phần bổ sung tối thiểu để hoàn
 * thiện workflow soạn thảo (xem DECISIONS.md — D-P07-04), không thay thế endpoint duyệt.
 */
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  return handle(async () => {
    const actor = await getCurrentActor();
    const { id } = await params;
    const recipe = await recipeService.submitForReview(actor, id);
    return jsonOk({ recipe });
  });
}
