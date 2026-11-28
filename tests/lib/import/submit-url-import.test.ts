import { describe, expect, it, vi } from "vitest";

import type { Actor } from "@/lib/auth/authorization";
import type {
  CreateImportJobInput,
  CreateImportJobItemInput,
  ImportJobDto,
  ImportJobItemDto,
  ImportRepository,
  ImportSourceDto,
} from "@/lib/db/repositories/import.repository";
import {
  AppError,
  ForbiddenError,
  NotFoundError,
  UnauthorizedError,
  ValidationError,
  toErrorResponse,
} from "@/lib/errors/app-error";
import type { SourceIdentificationResult } from "@/lib/import/source";
import type { SourceRegistry, UrlValidator } from "@/lib/import/ports";
import type { UrlValidationResult } from "@/lib/import/url";
import { ImportService, type ImportPipelineDeps } from "@/lib/services/import.service";

/** Fake in-memory adapter cho port ImportRepository (kiểm hợp đồng, không cần DB). */
class FakeImportRepository implements ImportRepository {
  private readonly jobs = new Map<string, ImportJobDto>();
  private readonly items = new Map<string, ImportJobItemDto>();
  private seq = 0;

  createItemCalls = 0;

  seedJob(job: ImportJobDto): void {
    this.jobs.set(job.id, job);
  }

  async findJobById(id: string): Promise<ImportJobDto | null> {
    return this.jobs.get(id) ?? null;
  }

  async createJob(input: CreateImportJobInput): Promise<ImportJobDto> {
    this.seq += 1;
    const now = new Date();
    const job: ImportJobDto = {
      id: `job-${this.seq}`,
      mode: input.mode,
      status: "created",
      createdById: input.createdById,
      sourceId: input.sourceId ?? null,
      maxItems: input.maxItems ?? 500,
      notes: input.notes ?? null,
      createdAt: now,
      updatedAt: now,
    };
    this.jobs.set(job.id, job);
    return job;
  }

  async findItemById(id: string): Promise<ImportJobItemDto | null> {
    return this.items.get(id) ?? null;
  }

  async findItemByJobAndKey(
    jobId: string,
    idempotencyKey: string,
  ): Promise<ImportJobItemDto | null> {
    return (
      [...this.items.values()].find(
        (item) => item.jobId === jobId && item.idempotencyKey === idempotencyKey,
      ) ?? null
    );
  }

  async listItemsByJob(jobId: string): Promise<ImportJobItemDto[]> {
    return [...this.items.values()].filter((item) => item.jobId === jobId);
  }

  async createItem(input: CreateImportJobItemInput): Promise<ImportJobItemDto> {
    this.createItemCalls += 1;
    this.seq += 1;
    const now = new Date();
    const item: ImportJobItemDto = {
      id: `item-${this.seq}`,
      jobId: input.jobId,
      sourceId: input.sourceId ?? null,
      sourceUrl: input.sourceUrl,
      normalizedUrl: input.normalizedUrl,
      idempotencyKey: input.idempotencyKey,
      status: "queued",
      processingStage: null,
      attempts: 0,
      maxAttempts: 3,
      leaseExpiresAt: null,
      workerId: null,
      lastError: null,
      extractionId: null,
      duplicateOfItemId: null,
      recipeId: null,
      createdAt: now,
      updatedAt: now,
    };
    this.items.set(item.id, item);
    return item;
  }

  async findSourceByDomain(_domain: string): Promise<ImportSourceDto | null> {
    return null;
  }
}

const guest: Actor | null = null;
const editor: Actor = { id: "e1", role: "editor" };
const admin: Actor = { id: "a1", role: "admin" };

const JOB_ID = "job-1";

function makeJob(): ImportJobDto {
  const now = new Date();
  return {
    id: JOB_ID,
    mode: "url_import",
    status: "created",
    createdById: admin.id,
    sourceId: null,
    maxItems: 500,
    notes: null,
    createdAt: now,
    updatedAt: now,
  };
}

const okUrl: UrlValidationResult = {
  ok: true,
  info: {
    raw: "https://example.com/a",
    normalized: "https://example.com/a",
    protocol: "https:",
    hostname: "example.com",
    domain: "example.com",
    port: null,
    path: "/a",
  },
};

const unregisteredSource: SourceIdentificationResult = {
  domain: "example.com",
  registered: false,
  sourceId: null,
  decision: "allowed_with_warning",
  policy: {
    supportStatus: "manual_only",
    contentPolicy: "manual_only",
    imagePolicy: "do_not_copy",
  },
  warnings: ["SOURCES_UNREGISTERED", "CONTENT_POLICY_MANUAL_ONLY"],
};

function makePipeline(overrides: Partial<ImportPipelineDeps> = {}): ImportPipelineDeps {
  const urlValidator: UrlValidator = {
    validate: vi.fn((): UrlValidationResult => okUrl),
  };
  const sourceRegistry: SourceRegistry = {
    resolve: vi.fn(async (): Promise<SourceIdentificationResult> => unregisteredSource),
  };
  return { urlValidator, sourceRegistry, ...overrides };
}

function makeService(pipeline: ImportPipelineDeps | null = makePipeline()) {
  const repository = new FakeImportRepository();
  repository.seedJob(makeJob());
  return { service: new ImportService(repository, pipeline), repository };
}

describe("ImportService.submitUrlImport — điều phối (I2.2)", () => {
  it("admin gửi URL hợp lệ ⇒ lưu nháp item 'queued' đúng dữ liệu", async () => {
    const { service, repository } = makeService();
    const result = await service.submitUrlImport(admin, JOB_ID, { url: "https://example.com/a" });

    expect(repository.createItemCalls).toBe(1);
    expect(result.status).toBe("queued");
    expect(result.normalizedUrl).toBe("https://example.com/a");
    expect(result.domain).toBe("example.com");
    expect(result.itemId).toBeTruthy();
    expect(result.warnings).toContain("SOURCES_UNREGISTERED");
  });

  it("KHÔNG truyền thông tin nguồn thừa: sourceId = null khi nguồn chưa đăng ký", async () => {
    const { service, repository } = makeService();
    const result = await service.submitUrlImport(admin, JOB_ID, { url: "https://example.com/a" });
    const stored = await repository.findItemById(result.itemId as string);
    expect(stored?.sourceId).toBeNull();
    expect(stored?.sourceUrl).toBe("https://example.com/a");
  });

  it("idempotent: cùng (job, url) lần hai KHÔNG tạo item mới", async () => {
    const { service, repository } = makeService();
    const first = await service.submitUrlImport(admin, JOB_ID, { url: "https://example.com/a" });
    const second = await service.submitUrlImport(admin, JOB_ID, { url: "https://example.com/a" });

    expect(repository.createItemCalls).toBe(1);
    expect(second.itemId).toBe(first.itemId);
    expect(second.status).toBe("queued");
  });

  it("job không tồn tại ⇒ 404 NOT_FOUND", async () => {
    const { service } = makeService();
    await expect(
      service.submitUrlImport(admin, "missing-job", { url: "https://example.com/a" }),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it("URL sai (validator từ chối) ⇒ 422 VALIDATION_ERROR kèm message an toàn", async () => {
    const pipeline = makePipeline({
      urlValidator: {
        validate: (): UrlValidationResult => ({
          ok: false,
          reason: "DISALLOWED_IP_LITERAL",
          message: "URL trỏ tới địa chỉ không được phép.",
        }),
      },
    });
    const { service, repository } = makeService(pipeline);

    await expect(
      service.submitUrlImport(admin, JOB_ID, { url: "http://169.254.169.254/latest/meta-data" }),
    ).rejects.toBeInstanceOf(ValidationError);
    expect(repository.createItemCalls).toBe(0);
  });

  it("nguồn bị chặn ⇒ 422 VALIDATION_ERROR, KHÔNG lưu item", async () => {
    const pipeline = makePipeline({
      sourceRegistry: {
        resolve: async (): Promise<SourceIdentificationResult> => ({
          ...unregisteredSource,
          decision: "blocked",
          blockReason: "Nguồn bị chặn import.",
        }),
      },
    });
    const { service, repository } = makeService(pipeline);

    await expect(
      service.submitUrlImport(admin, JOB_ID, { url: "https://example.com/a" }),
    ).rejects.toBeInstanceOf(ValidationError);
    expect(repository.createItemCalls).toBe(0);
  });

  it("body sai (thiếu url) ⇒ 422 VALIDATION_ERROR trước khi chạm repository", async () => {
    const { service, repository } = makeService();
    await expect(
      service.submitUrlImport(admin, JOB_ID, { url: "" }),
    ).rejects.toBeInstanceOf(ValidationError);
    expect(repository.createItemCalls).toBe(0);
  });

  it("pipeline chưa cấu hình ⇒ INTERNAL 500 (không tự dựng adapter giả)", async () => {
    const { service } = makeService(null);
    const err = await service
      .submitUrlImport(admin, JOB_ID, { url: "https://example.com/a" })
      .catch((e: unknown) => e);
    expect(err).toBeInstanceOf(AppError);
    expect((err as AppError).code).toBe("INTERNAL");
  });

  it("domain từ validator được dùng để tra registry (không tự suy từ chuỗi thô)", async () => {
    const resolve = vi.fn(async (): Promise<SourceIdentificationResult> => unregisteredSource);
    const pipeline = makePipeline({ sourceRegistry: { resolve } });
    const { service } = makeService(pipeline);
    await service.submitUrlImport(admin, JOB_ID, { url: "https://example.com/a" });
    expect(resolve).toHaveBeenCalledWith("example.com");
  });
});

describe("ImportService.submitUrlImport — biên quyền (I2.2)", () => {
  it("guest (actor null) ⇒ 401 UNAUTHORIZED", async () => {
    const { service, repository } = makeService();
    await expect(
      service.submitUrlImport(guest, JOB_ID, { url: "https://example.com/a" }),
    ).rejects.toBeInstanceOf(UnauthorizedError);
    expect(repository.createItemCalls).toBe(0);
  });

  it("editor (không có import:manage) ⇒ 403 FORBIDDEN", async () => {
    const { service, repository } = makeService();
    await expect(
      service.submitUrlImport(editor, JOB_ID, { url: "https://example.com/a" }),
    ).rejects.toBeInstanceOf(ForbiddenError);
    expect(repository.createItemCalls).toBe(0);
  });
});

describe("ImportService.submitUrlImport — ánh xạ lỗi an toàn (I2.2)", () => {
  it("ValidationError của URL sai → 422 với body không lộ IP/DNS/stack", async () => {
    const pipeline = makePipeline({
      urlValidator: {
        validate: (): UrlValidationResult => ({
          ok: false,
          reason: "DISALLOWED_IP_LITERAL",
          message: "URL trỏ tới địa chỉ không được phép.",
        }),
      },
    });
    const { service } = makeService(pipeline);

    const error = await service
      .submitUrlImport(admin, JOB_ID, { url: "http://10.0.0.1/" })
      .catch((e: unknown) => e);
    const { status, body } = toErrorResponse(error);

    expect(status).toBe(422);
    expect(body.error.code).toBe("VALIDATION_ERROR");
    const serialized = JSON.stringify(body);
    expect(serialized).not.toContain("10.0.0.1");
    expect(serialized.toLowerCase()).not.toContain("stack");
    expect(serialized).not.toContain("/workspace");
  });
});
