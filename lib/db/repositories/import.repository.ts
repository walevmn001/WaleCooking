import type {
  ContentReusePolicy,
  ImageReusePolicy,
  ImportJobItemStatus,
  ImportJobMode,
  ImportJobStatus,
  ImportSourceLastStatus,
  ImportSourceStatus,
} from "@prisma/client";

/**
 * Cổng dữ liệu cho Recipe Importer (P16 — I1).
 *
 * I1 chỉ định nghĩa **port** (hợp đồng) + DTO; adapter Prisma tương ứng sẽ được
 * triển khai ở I2/I3 khi bắt đầu luồng URL Import. Không truy vấn dữ liệu ở đây.
 */

/** Nguồn import đã đăng ký (Source Registry — P16.1). */
export interface ImportSourceDto {
  id: string;
  name: string;
  domain: string;
  homepageUrl: string | null;
  supportStatus: ImportSourceStatus;
  contentPolicy: ContentReusePolicy;
  imagePolicy: ImageReusePolicy;
  lastStatus: ImportSourceLastStatus;
  enabled: boolean;
}

/** Một lượt import (gom nhiều item). */
export interface ImportJobDto {
  id: string;
  mode: ImportJobMode;
  status: ImportJobStatus;
  createdById: string;
  sourceId: string | null;
  maxItems: number;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/** Một URL trong một job. */
export interface ImportJobItemDto {
  id: string;
  jobId: string;
  sourceId: string | null;
  sourceUrl: string;
  normalizedUrl: string;
  idempotencyKey: string;
  status: ImportJobItemStatus;
  attempts: number;
  maxAttempts: number;
  recipeId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateImportJobInput {
  mode: ImportJobMode;
  createdById: string;
  sourceId?: string | null;
  maxItems?: number;
  notes?: string | null;
}

export interface CreateImportJobItemInput {
  jobId: string;
  sourceId?: string | null;
  sourceUrl: string;
  normalizedUrl: string;
  idempotencyKey: string;
}

/**
 * Hợp đồng truy cập dữ liệu importer. Tầng service gọi port này;
 * UI KHÔNG import trực tiếp (theo kiến trúc ports/adapters hiện có).
 */
export interface ImportRepository {
  findJobById(id: string): Promise<ImportJobDto | null>;
  createJob(input: CreateImportJobInput): Promise<ImportJobDto>;
  findItemById(id: string): Promise<ImportJobItemDto | null>;
  listItemsByJob(jobId: string): Promise<ImportJobItemDto[]>;
  createItem(input: CreateImportJobItemInput): Promise<ImportJobItemDto>;
  findSourceByDomain(domain: string): Promise<ImportSourceDto | null>;
}
