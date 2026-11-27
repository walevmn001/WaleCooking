import type { NextRequest } from "next/server";

import { handle, jsonOk } from "@/lib/api/http";
import { getCurrentActor } from "@/lib/auth/session";
import { mediaService } from "@/lib/services";

/**
 * `/api/v1/media/{id}`
 * - `GET` — thông tin metadata tệp.
 * - `DELETE` — lưu trữ (soft-archive) tệp; chỉ khi không còn công thức tham chiếu.
 */

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  return handle(async () => {
    const { id } = await params;
    const asset = await mediaService.getById(id);
    return jsonOk({ asset });
  });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  return handle(async () => {
    const actor = await getCurrentActor();
    const { id } = await params;
    await mediaService.archive(actor, id);
    return jsonOk({ ok: true });
  });
}
