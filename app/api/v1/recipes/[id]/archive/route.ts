import type { NextRequest } from "next/server";

import { handle, jsonOk } from "@/lib/api/http";
import { getCurrentActor } from "@/lib/auth/session";
import { recipeService } from "@/lib/services";

/** `POST /api/v1/recipes/{id}/archive` — lưu trữ/gỡ xuất bản (Editor/Admin). */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  return handle(async () => {
    const actor = await getCurrentActor();
    const { id } = await params;
    const body: unknown = await request.json().catch(() => ({}));
    const recipe = await recipeService.archive(actor, id, body);
    return jsonOk({ recipe });
  });
}
