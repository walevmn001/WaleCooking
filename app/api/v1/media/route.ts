import type { NextRequest } from "next/server";

import { handle, jsonOk } from "@/lib/api/http";
import { getCurrentActor } from "@/lib/auth/session";
import { ValidationError } from "@/lib/errors/app-error";
import { mediaService } from "@/lib/services";

/**
 * `POST /api/v1/media` — tải ảnh lên (Editor/Admin).
 *
 * - Nhận `multipart/form-data` với trường `file` (+ `altText` tùy chọn).
 * - Loại tệp xác định bằng magic bytes ở tầng service (KHÔNG tin `Content-Type` client).
 * - KHÔNG lưu bytes vào Postgres: bytes → storage adapter, metadata → DB.
 */
export async function POST(request: NextRequest): Promise<Response> {
  return handle(async () => {
    const actor = await getCurrentActor();

    const form = await request.formData().catch(() => null);
    if (!form) throw new ValidationError({ file: ["Thiếu dữ liệu tải lên."] });

    const file = form.get("file");
    if (!(file instanceof File)) {
      throw new ValidationError({ file: ["Cần chọn tệp ảnh."] });
    }

    const bytes = new Uint8Array(await file.arrayBuffer());
    const altTextRaw = form.get("altText");
    const altText = typeof altTextRaw === "string" && altTextRaw.trim() ? altTextRaw.trim() : undefined;

    const asset = await mediaService.upload(actor, {
      bytes,
      filename: file.name,
      altText,
    });
    return jsonOk({ asset }, 201);
  });
}
