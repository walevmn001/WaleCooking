import "server-only";

import { requirePermission, type Actor } from "@/lib/auth/authorization";
import { mapPrismaError } from "@/lib/db/prisma-errors";
import { repositories, type Repositories } from "@/lib/db/repositories";
import type { MediaAssetDto } from "@/lib/db/repositories/media.repository";
import { ConflictError, NotFoundError, ValidationError } from "@/lib/errors/app-error";
import { getStorage, type StoragePort } from "@/lib/storage";
import {
  isWithinDimensionLimit,
  toSafeSlugSegment,
  validateImageFile,
} from "@/lib/storage/image-validation";

export interface UploadMediaInput {
  bytes: Uint8Array;
  /** Tên gợi ý từ client — CHỈ dùng cho mô tả, không tin để suy ra loại tệp. */
  filename?: string;
  altText?: string;
  width?: number | null;
  height?: number | null;
}

/**
 * MediaService — nghiệp vụ tệp media (P07 §15, P02 §MEDIA_STORAGE).
 *
 * - Bytes lưu ở storage adapter (R2 mục tiêu; local cho dev/test); Postgres CHỈ lưu metadata.
 * - Loại tệp xác định bằng magic bytes (KHÔNG tin `Content-Type` client).
 * - Khóa lưu trữ do server sinh (không dùng thẳng tên tệp client).
 */
export class MediaService {
  private readonly deps: Repositories;
  private readonly storageOverride?: StoragePort;
  private resolvedStorage?: StoragePort;

  constructor(deps: Repositories = repositories, storage?: StoragePort) {
    this.deps = deps;
    this.storageOverride = storage;
  }

  /**
   * Giải mã storage LAZY (P12.3): chỉ chọn adapter khi thực sự thao tác tệp.
   * Nhờ đó `export const mediaService = new MediaService()` ở phạm vi module KHÔNG
   * khởi tạo adapter lúc import → `next build` không bị ảnh hưởng; đồng thời guard
   * "production phải dùng R2" chỉ kích hoạt đúng khi thực sự upload.
   */
  private get storage(): StoragePort {
    if (!this.resolvedStorage) {
      this.resolvedStorage = this.storageOverride ?? getStorage();
    }
    return this.resolvedStorage;
  }

  async upload(actor: Actor | null, input: UploadMediaInput): Promise<MediaAssetDto> {
    const current = requirePermission(actor, "media:upload");

    // Loại tệp thật + giới hạn dung lượng (ném 422 nếu sai).
    const type = validateImageFile(input.bytes);

    if (input.width != null && input.height != null && !isWithinDimensionLimit(input.width, input.height)) {
      throw new ValidationError({ file: ["Kích thước ảnh vượt quá giới hạn cho phép."] });
    }

    const key = buildStorageKey(type.ext, input.filename);
    const stored = await this.storage.put({
      key,
      body: input.bytes,
      contentType: type.mime,
    });

    try {
      return await this.deps.media.create({
        storageKey: stored.key,
        publicUrl: stored.url,
        mimeType: type.mime,
        sizeBytes: input.bytes.byteLength,
        width: input.width ?? null,
        height: input.height ?? null,
        altTextDefault: input.altText ?? null,
        createdById: current.id,
      });
    } catch (error) {
      mapPrismaError(error);
    }
  }

  async getById(id: string): Promise<MediaAssetDto> {
    const asset = await this.deps.media.findById(id);
    if (!asset) throw new NotFoundError("Không tìm thấy tệp media.");
    return asset;
  }

  /**
   * Lưu trữ tệp (soft-archive). CHỈ cho phép khi tệp không còn được công thức tham chiếu
   * (P02: `DELETE /media/{id}` → 204 khi không còn tham chiếu).
   */
  async archive(actor: Actor | null, id: string): Promise<void> {
    requirePermission(actor, "media:upload");
    await this.getById(id);
    const links = await this.deps.media.countRecipeLinks(id);
    if (links > 0) {
      throw new ConflictError("Tệp đang được công thức sử dụng, không thể lưu trữ.");
    }
    try {
      await this.deps.media.archive(id);
    } catch (error) {
      mapPrismaError(error);
    }
  }
}

/** Sinh khóa lưu trữ an toàn phía server: `recipes/YYYY/MM/<uuid>-<slug>.<ext>`. */
export function buildStorageKey(ext: string, filename?: string): string {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, "0");
  const slug = toSafeSlugSegment(filename ?? "image");
  const id = globalThis.crypto.randomUUID();
  return `recipes/${year}/${month}/${id}-${slug}.${ext}`;
}

export const mediaService = new MediaService();
