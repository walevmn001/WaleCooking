import { describe, expect, it } from "vitest";

import { buildImportIdempotencyKey } from "@/lib/import/idempotency";

describe("buildImportIdempotencyKey (I2.2)", () => {
  it("là hàm thuần: cùng đầu vào ⇒ cùng khoá", () => {
    const a = buildImportIdempotencyKey("job-1", "https://example.com/a");
    const b = buildImportIdempotencyKey("job-1", "https://example.com/a");
    expect(a).toBe(b);
  });

  it("trả chuỗi sha256 hex (64 ký tự)", () => {
    const key = buildImportIdempotencyKey("job-1", "https://example.com/a");
    expect(key).toMatch(/^[0-9a-f]{64}$/);
  });

  it("khác jobId ⇒ khác khoá", () => {
    const a = buildImportIdempotencyKey("job-1", "https://example.com/a");
    const b = buildImportIdempotencyKey("job-2", "https://example.com/a");
    expect(a).not.toBe(b);
  });

  it("khác normalizedUrl ⇒ khác khoá", () => {
    const a = buildImportIdempotencyKey("job-1", "https://example.com/a");
    const b = buildImportIdempotencyKey("job-1", "https://example.com/b");
    expect(a).not.toBe(b);
  });
});
