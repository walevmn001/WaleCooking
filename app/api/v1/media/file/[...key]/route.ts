import { readFile } from "node:fs/promises";
import path from "node:path";

import { NextResponse } from "next/server";

import { hasR2Env, isSafeStorageKey } from "@/lib/storage";

/**
 * Phục vụ tệp media cục bộ (CHỈ khi dùng local provider — dev/test).
 *
 * - Tinh thần server-proxy MVP (D-P02-06): client không truy cập trực tiếp kho lưu.
 * - Chặn path traversal (khóa phải an toàn và nằm trong thư mục gốc).
 * - Khi đã cấu hình R2, route này trả 404 (R2 tự phục vụ qua public URL/CDN).
 */

const MIME_BY_EXT: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  avif: "image/avif",
};

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ key: string[] }> },
): Promise<NextResponse> {
  if (hasR2Env()) {
    return new NextResponse(null, { status: 404 });
  }

  const { key } = await params;
  const joined = key.join("/");
  if (!isSafeStorageKey(joined)) {
    return new NextResponse(null, { status: 404 });
  }

  const root = path.resolve(process.env.MEDIA_LOCAL_DIR ?? ".media-local");
  const target = path.resolve(root, joined);
  if (target !== root && !target.startsWith(root + path.sep)) {
    return new NextResponse(null, { status: 404 });
  }

  try {
    const data = await readFile(target);
    const ext = path.extname(target).slice(1).toLowerCase();
    return new NextResponse(new Uint8Array(data), {
      status: 200,
      headers: {
        "Content-Type": MIME_BY_EXT[ext] ?? "application/octet-stream",
        "Cache-Control": "public, max-age=3600",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return new NextResponse(null, { status: 404 });
  }
}
