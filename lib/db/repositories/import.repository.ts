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

/**
 * Một URL trong một job.
 *
 * I2 (D10) mở rộng thêm các trường vòng đời để API/admin hiển thị tiến độ mà
 * KHÔNG cần đổi schema (đều là cột đã có ở `ImportJobItem`):
 * `processingStage`, `leaseExpiresAt`, `workerId`, `lastError`, `extractionId`,
 * `duplicateOfItemId`. `lastError` khi trả client PHẢI đã được làm sạch.
 */
export interface ImportJobItemDto {
  id: string;
  jobId: string;
  sourceId: string | null;
  sourceUrl: string;
  normalizedUrl: string;
  idempotencyKey: string;
  status: ImportJobItemStatus;
  processingStage: string | null;
  attempts: number;
  maxAttempts: number;
  leaseExpiresAt: Date | null;
  workerId: string | null;
  lastError: string | null;
  extractionId: string | null;
  duplicateOfItemId: string | null;
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
  /**
   * Tìm item theo khoá chống trùng `(jobId, idempotencyKey)` — phục vụ thêm URL
   * idempotent (I2.2). Đối chiếu unique `@@unique([jobId, idempotencyKey])` ở schema I1.
   */
  findItemByJobAndKey(jobId: string, idempotencyKey: string): Promise<ImportJobItemDto | null>;
  listItemsByJob(jobId: string): Promise<ImportJobItemDto[]>;
  createItem(input: CreateImportJobItemInput): Promise<ImportJobItemDto>;
  findSourceByDomain(domain: string): Promise<ImportSourceDto | null>;
}
