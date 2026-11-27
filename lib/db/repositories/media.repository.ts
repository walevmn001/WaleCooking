import type { MediaStatus } from "@prisma/client";

/** Metadata của một tệp media (bytes nằm ở storage, KHÔNG ở Postgres). */
export interface MediaAssetDto {
  id: string;
  storageKey: string;
  publicUrl: string | null;
  mimeType: string;
  sizeBytes: number;
  width: number | null;
  height: number | null;
  altTextDefault: string | null;
  status: MediaStatus;
  createdAt: Date;
}

export interface CreateMediaAssetInput {
  storageKey: string;
  publicUrl: string | null;
  mimeType: string;
  sizeBytes: number;
  width?: number | null;
  height?: number | null;
  checksum?: string | null;
  altTextDefault?: string | null;
  createdById?: string | null;
}

export interface MediaRepository {
  create(input: CreateMediaAssetInput): Promise<MediaAssetDto>;
  findById(id: string): Promise<MediaAssetDto | null>;
  /** Chuyển asset sang `archived` (mặc định, không xóa cứng). */
  archive(id: string): Promise<void>;
  /** Số liên kết tới công thức (`recipe_images`) — để quyết định xóa cứng. */
  countRecipeLinks(mediaAssetId: string): Promise<number>;
}
