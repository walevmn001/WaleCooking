import type { NextRequest } from "next/server";

import { handle, jsonOk } from "@/lib/api/http";
import { getCurrentActor } from "@/lib/auth/session";
import { taxonomyService } from "@/lib/services";

/**
 * `/api/v1/admin/taxonomy/{id}`
 *
 * - `PATCH`  — cập nhật danh mục (tên, mô tả, slug cha, thứ tự, trạng thái hoạt động).
 * - `DELETE` — xóa danh mục; CHỈ khi không còn công thức/danh mục con tham chiếu.
 *
 * Cả hai yêu cầu quyền `taxonomy:manage` (Admin). `PATCH { isActive: false }` = lưu trữ,
 * `PATCH { isActive: true }` = khôi phục — thay vì xóa cứng gây mất liên kết dữ liệu.
 */

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  return handle(async () => {
    const actor = await getCurrentActor();
    const { id } = await params;
    const body: unknown = await request.json().catch(() => null);
    const term = await taxonomyService.updateTerm(actor, id, body);
    return jsonOk({ term });
  });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  return handle(async () => {
    const actor = await getCurrentActor();
    const { id } = await params;
    await taxonomyService.deleteTerm(actor, id);
    return jsonOk({ ok: true });
  });
}
