import type { NextRequest } from "next/server";

import { handle, jsonOk } from "@/lib/api/http";
import { getCurrentActor } from "@/lib/auth/session";
import { recipeService } from "@/lib/services";

/**
 * `/api/v1/recipes/{idOrSlug}`
 *
 * - `GET`  — chi tiết công khai theo SLUG (chỉ `published`; draft/archived → 404).
 * - `PATCH` — cập nhật theo ID (Editor/Admin).
 * - `DELETE` — xóa mềm theo ID (Admin).
 *
 * Ghi chú thiết kế: P02 dùng `{slug}` cho GET và `{id}` cho thao tác ghi. Hai loại
 * định danh chia sẻ cùng vị trí đường dẫn; GET diễn giải là slug, PATCH/DELETE là id.
 */

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  return handle(async () => {
    const { id } = await params;
    const recipe = await recipeService.getPublicBySlug(id);
    return jsonOk({ recipe });
  });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  return handle(async () => {
    const actor = await getCurrentActor();
    const { id } = await params;
    const body: unknown = await request.json().catch(() => null);
    const recipe = await recipeService.update(actor, id, body);
    return jsonOk({ recipe });
  });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  return handle(async () => {
    const actor = await getCurrentActor();
    const { id } = await params;
    await recipeService.remove(actor, id);
    return jsonOk({ ok: true });
  });
}
