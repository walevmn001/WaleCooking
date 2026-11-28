import { requirePermission, type Actor } from "@/lib/auth/authorization";
import type {
  CreateImportJobInput,
  CreateImportJobItemInput,
  ImportJobDto,
  ImportJobItemDto,
  ImportRepository,
} from "@/lib/db/repositories/import.repository";
import { AppError, NotFoundError, ValidationError } from "@/lib/errors/app-error";
import { buildImportIdempotencyKey } from "@/lib/import/idempotency";
import type { ImportItemResult, SubmitUrlImportRequest } from "@/lib/import/job";
import type { SourceRegistry, UrlValidator } from "@/lib/import/ports";
import { submitUrlImportSchema } from "@/lib/import/validation";
import { parseInput } from "@/lib/validation/common";

/**
 * Phụ thuộc ngoài (ports) cho luồng URL Import — DI để kiểm thử, KHÔNG phải adapter.
 *
 * `urlValidator` (guard SSRF, thuần) và `sourceRegistry` (chính sách nguồn) được
 * tiêm vào; implementation thật thuộc I2.3/I2.4. Không có default ở đây vì I1
 * chưa có adapter (tránh "adapter giả" trong code sản phẩm).
 */
export interface ImportPipelineDeps {
  urlValidator: UrlValidator;
  sourceRegistry: SourceRegistry;
}

/**
 * Service Recipe Importer (P16 — I1 khung + I2.2 Contract Foundation).
 *
 * - I1: khung + cưỡng chế quyền `import:*` (các method đọc/ghi cơ bản).
 * - I2.2: thêm điều phối `submitUrlImport` (validate URL → nhận diện nguồn → lưu
 *   nháp item `queued`). BƯỚC FETCH/EXTRACT/PUBLISH **không** thuộc phase này.
 *
 * Mọi thao tác đều đi qua `requirePermission(...)` (RBAC tập trung). `actor = null`
 * (guest) bị chặn 401; thiếu quyền bị chặn 403.
 */
export class ImportService {
  constructor(
    private readonly repository: ImportRepository,
    /** Ports cho luồng URL Import; `null` = chưa cấu hình (I1 chỉ dùng method cơ bản). */
    private readonly pipeline: ImportPipelineDeps | null = null,
  ) {}

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

  /**
   * Điều phối thêm MỘT URL vào job (quyền `import:manage`) — I2.2.
   *
   * Luồng (không mạng, không trích xuất):
   * 1. kiểm quyền + validate body (Zod);
   * 2. kiểm job tồn tại;
   * 3. validate URL qua `UrlValidator` (SSRF guard) — sai ⇒ 422;
   * 4. nhận diện nguồn qua `SourceRegistry` — `blocked` ⇒ 422;
   * 5. chống trùng theo `(jobId, idempotencyKey)` — đã có ⇒ trả item cũ (idempotent);
   * 6. lưu nháp item `queued` (KHÔNG fetch, KHÔNG tạo công thức).
   *
   * Bước fetch/extract/publish do phase sau (có worker) đảm nhiệm.
   */
  async submitUrlImport(
    actor: Actor | null,
    jobId: string,
    input: SubmitUrlImportRequest,
  ): Promise<ImportItemResult> {
    requirePermission(actor, "import:manage");
    const pipeline = this.requirePipeline();
    const parsed = parseInput(submitUrlImportSchema, input);

    const job = await this.repository.findJobById(jobId);
    if (!job) {
      throw new NotFoundError("Không tìm thấy job import.");
    }

    const validated = pipeline.urlValidator.validate(parsed.url);
    if (!validated.ok) {
      throw new ValidationError({ url: [validated.message] });
    }

    const source = await pipeline.sourceRegistry.resolve(validated.info.domain);
    if (source.decision === "blocked") {
      throw new ValidationError({
        url: [source.blockReason ?? "Nguồn không được phép import."],
      });
    }

    const idempotencyKey = buildImportIdempotencyKey(jobId, validated.info.normalized);
    const existing = await this.repository.findItemByJobAndKey(jobId, idempotencyKey);
    if (existing) {
      return {
        itemId: existing.id,
        normalizedUrl: existing.normalizedUrl,
        domain: validated.info.domain,
        status: existing.status,
        source,
        warnings: source.warnings,
      };
    }

    const item = await this.repository.createItem({
      jobId,
      sourceId: source.sourceId,
      sourceUrl: validated.info.raw,
      normalizedUrl: validated.info.normalized,
      idempotencyKey,
    });

    return {
      itemId: item.id,
      normalizedUrl: item.normalizedUrl,
      domain: validated.info.domain,
      status: item.status,
      source,
      warnings: source.warnings,
    };
  }

  private requirePipeline(): ImportPipelineDeps {
    if (!this.pipeline) {
      throw new AppError("INTERNAL", "Import pipeline chưa được cấu hình.");
    }
    return this.pipeline;
  }
}
