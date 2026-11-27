import type { NextRequest } from "next/server";

import { handle, jsonOk } from "@/lib/api/http";
import { getCurrentActor } from "@/lib/auth/session";
import { recipeService } from "@/lib/services";

/** `GET /api/v1/recipes/{id}/versions` — lịch sử phiên bản (Editor/Admin). */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  return handle(async () => {
    const actor = await getCurrentActor();
    const { id } = await params;
    const versions = await recipeService.listVersions(actor, id);
    return jsonOk({ versions });
  });
}
