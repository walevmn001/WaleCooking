import { requirePermission, type Actor } from "@/lib/auth/authorization";
import type {
  CreateImportJobInput,
  CreateImportJobItemInput,
  ImportJobDto,
  ImportJobItemDto,
  ImportRepository,
} from "@/lib/db/repositories/import.repository";

/**
 * Service Recipe Importer (P16 — I1: **khung**).
 *
 * Phạm vi I1: dựng khung + cưỡng chế quyền `import:*`. Việc tải/trích xuất URL,
 * localization, dedupe & worker (I2–I7) sẽ bổ sung sau — **không** triển khai ở đây.
 *
 * Mọi thao tác đều đi qua `requirePermission(...)` (RBAC tập trung). `actor = null`
 * (guest) bị chặn 401; thiếu quyền bị chặn 403.
 */
export class ImportService {
  constructor(private readonly repository: ImportRepository) {}

  /** Đọc tiến độ job (quyền `import:read`). */
  async getJob(actor: Actor | null, jobId: string): Promise<ImportJobDto | null> {
    requirePermission(actor, "import:read");
    return this.repository.findJobById(jobId);
  }

  /** Đọc chi tiết item (quyền `import:read`). */
  async getItem(actor: Actor | null, itemId: string): Promise<ImportJobItemDto | null> {
    requirePermission(actor, "import:read");
    return this.repository.findItemById(itemId);
  }

  /** Liệt kê item của một job (quyền `import:read`). */
  async listJobItems(actor: Actor | null, jobId: string): Promise<ImportJobItemDto[]> {
    requirePermission(actor, "import:read");
    return this.repository.listItemsByJob(jobId);
  }

  /** Tạo job import (quyền `import:manage`). `createdById` luôn lấy từ actor. */
  async createJob(
    actor: Actor | null,
    input: Omit<CreateImportJobInput, "createdById">,
  ): Promise<ImportJobDto> {
    const current = requirePermission(actor, "import:manage");
    return this.repository.createJob({ ...input, createdById: current.id });
  }

  /** Thêm URL vào job (quyền `import:manage`). */
  async addItem(
    actor: Actor | null,
    input: Omit<CreateImportJobItemInput, "sourceId">,
  ): Promise<ImportJobItemDto> {
    requirePermission(actor, "import:manage");
    return this.repository.createItem(input);
  }
}
