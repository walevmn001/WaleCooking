import { describe, expect, it } from "vitest";

import type { Actor } from "@/lib/auth/authorization";
import { ForbiddenError, UnauthorizedError } from "@/lib/errors/app-error";
import type {
  CreateImportJobInput,
  CreateImportJobItemInput,
  ImportJobDto,
  ImportJobItemDto,
  ImportRepository,
  ImportSourceDto,
} from "@/lib/db/repositories/import.repository";
import { ImportService } from "@/lib/services/import.service";

/** Fake in-memory adapter để kiểm hợp đồng port + cưỡng chế quyền (không cần DB). */
class FakeImportRepository implements ImportRepository {
  private readonly jobs = new Map<string, ImportJobDto>();
  private readonly items = new Map<string, ImportJobItemDto>();
  private seq = 0;

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

  async listItemsByJob(jobId: string): Promise<ImportJobItemDto[]> {
    return [...this.items.values()].filter((item) => item.jobId === jobId);
  }

  async createItem(input: CreateImportJobItemInput): Promise<ImportJobItemDto> {
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
      attempts: 0,
      maxAttempts: 3,
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
const user: Actor = { id: "u1", role: "user" };
const editor: Actor = { id: "e1", role: "editor" };
const admin: Actor = { id: "a1", role: "admin" };

function makeService() {
  return new ImportService(new FakeImportRepository());
}

describe("ImportService — cưỡng chế quyền importer (I1)", () => {
  it("guest bị chặn (401) trên mọi thao tác", async () => {
    const service = makeService();
    await expect(service.getJob(guest, "job-1")).rejects.toBeInstanceOf(UnauthorizedError);
    await expect(service.createJob(guest, { mode: "url_import" })).rejects.toBeInstanceOf(
      UnauthorizedError,
    );
  });

  it("user/editor (không phải admin) bị chặn (403)", async () => {
    const service = makeService();
    await expect(service.createJob(user, { mode: "url_import" })).rejects.toBeInstanceOf(
      ForbiddenError,
    );
    await expect(service.getItem(editor, "item-1")).rejects.toBeInstanceOf(ForbiddenError);
  });

  it("admin tạo job: createdById luôn lấy từ actor (không tin client)", async () => {
    const service = makeService();
    const job = await service.createJob(admin, { mode: "url_import", notes: "test" });
    expect(job.createdById).toBe(admin.id);
    expect(job.status).toBe("created");
    expect(job.maxItems).toBe(500);

    const fetched = await service.getJob(admin, job.id);
    expect(fetched?.id).toBe(job.id);
  });

  it("admin thêm URL vào job rồi liệt kê item", async () => {
    const service = makeService();
    const job = await service.createJob(admin, { mode: "url_import" });
    const item = await service.addItem(admin, {
      jobId: job.id,
      sourceUrl: "https://example.com/a",
      normalizedUrl: "https://example.com/a",
      idempotencyKey: "k1",
    });
    expect(item.status).toBe("queued");

    const items = await service.listJobItems(admin, job.id);
    expect(items).toHaveLength(1);

    const detail = await service.getItem(admin, item.id);
    expect(detail?.idempotencyKey).toBe("k1");
  });

  it("getJob trả null với id không tồn tại", async () => {
    const service = makeService();
    await expect(service.getJob(admin, "missing")).resolves.toBeNull();
  });
});
