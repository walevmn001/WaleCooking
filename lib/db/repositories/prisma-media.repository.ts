import type { PrismaClient } from "@prisma/client";

import type { CreateMediaAssetInput, MediaAssetDto, MediaRepository } from "./media.repository";

type MediaRow = {
  id: string;
  storageKey: string;
  publicUrl: string | null;
  mimeType: string;
  sizeBytes: number;
  width: number | null;
  height: number | null;
  altTextDefault: string | null;
  status: MediaAssetDto["status"];
  createdAt: Date;
};

/** Triển khai Prisma cho `MediaRepository`. */
export class PrismaMediaRepository implements MediaRepository {
  constructor(private readonly db: PrismaClient) {}

  async create(input: CreateMediaAssetInput): Promise<MediaAssetDto> {
    const row = await this.db.mediaAsset.create({
      data: {
        storageKey: input.storageKey,
        publicUrl: input.publicUrl,
        mimeType: input.mimeType,
        sizeBytes: input.sizeBytes,
        width: input.width ?? null,
        height: input.height ?? null,
        checksum: input.checksum ?? null,
        altTextDefault: input.altTextDefault ?? null,
        createdById: input.createdById ?? null,
      },
    });
    return this.toDto(row);
  }

  async findById(id: string): Promise<MediaAssetDto | null> {
    const row = await this.db.mediaAsset.findUnique({ where: { id } });
    return row ? this.toDto(row) : null;
  }

  async archive(id: string): Promise<void> {
    await this.db.mediaAsset.update({ where: { id }, data: { status: "archived" } });
  }

  async countRecipeLinks(mediaAssetId: string): Promise<number> {
    return this.db.recipeImage.count({ where: { mediaAssetId } });
  }

  private toDto(row: MediaRow): MediaAssetDto {
    return {
      id: row.id,
      storageKey: row.storageKey,
      publicUrl: row.publicUrl,
      mimeType: row.mimeType,
      sizeBytes: row.sizeBytes,
      width: row.width,
      height: row.height,
      altTextDefault: row.altTextDefault,
      status: row.status,
      createdAt: row.createdAt,
    };
  }
}
