import { describe, expect, it } from "vitest";

import {
  MAX_NOTES_LENGTH,
  MAX_URL_LENGTH,
  importReviewSchema,
  submitUrlImportSchema,
} from "@/lib/import/validation";

describe("submitUrlImportSchema (I2.2 DTO validation)", () => {
  it("nhận URL hợp lệ", () => {
    const parsed = submitUrlImportSchema.parse({ url: "https://example.com/cong-thuc" });
    expect(parsed).toEqual({ url: "https://example.com/cong-thuc" });
  });

  it("từ chối URL rỗng", () => {
    expect(submitUrlImportSchema.safeParse({ url: "" }).success).toBe(false);
  });

  it("từ chối khi thiếu trường url", () => {
    expect(submitUrlImportSchema.safeParse({}).success).toBe(false);
  });

  it("từ chối URL vượt trần ký tự", () => {
    const tooLong = `https://example.com/${"a".repeat(MAX_URL_LENGTH)}`;
    expect(submitUrlImportSchema.safeParse({ url: tooLong }).success).toBe(false);
  });

  it("chấp nhận URL đúng độ dài trần", () => {
    const prefix = "https://e.co/";
    const atLimit = prefix + "a".repeat(MAX_URL_LENGTH - prefix.length);
    expect(atLimit.length).toBe(MAX_URL_LENGTH);
    expect(submitUrlImportSchema.safeParse({ url: atLimit }).success).toBe(true);
  });

  it("LOẠI BỎ trường lạ (chống mass assignment: status/role/createdById)", () => {
    const parsed = submitUrlImportSchema.parse({
      url: "https://example.com/a",
      status: "published",
      role: "admin",
      createdById: "attacker",
      recipeId: "r-1",
    }) as Record<string, unknown>;
    expect(parsed).toEqual({ url: "https://example.com/a" });
    expect("status" in parsed).toBe(false);
    expect("role" in parsed).toBe(false);
    expect("createdById" in parsed).toBe(false);
    expect("recipeId" in parsed).toBe(false);
  });
});

describe("importReviewSchema (I2.2 DTO validation)", () => {
  it("nhận decision hợp lệ không cần notes", () => {
    expect(importReviewSchema.parse({ decision: "approved" })).toEqual({ decision: "approved" });
    expect(importReviewSchema.safeParse({ decision: "rejected" }).success).toBe(true);
    expect(importReviewSchema.safeParse({ decision: "changes_requested" }).success).toBe(true);
  });

  it("nhận notes trong giới hạn", () => {
    const parsed = importReviewSchema.parse({ decision: "approved", notes: "cần sửa định lượng" });
    expect(parsed.notes).toBe("cần sửa định lượng");
  });

  it("từ chối decision không thuộc enum (KHÔNG có 'published'/'publish')", () => {
    expect(importReviewSchema.safeParse({ decision: "published" }).success).toBe(false);
    expect(importReviewSchema.safeParse({ decision: "publish" }).success).toBe(false);
    expect(importReviewSchema.safeParse({ decision: "" }).success).toBe(false);
  });

  it("từ chối notes vượt trần", () => {
    const tooLong = "x".repeat(MAX_NOTES_LENGTH + 1);
    expect(importReviewSchema.safeParse({ decision: "approved", notes: tooLong }).success).toBe(false);
  });

  it("LOẠI BỎ trường lạ (chống client tự set trạng thái publish)", () => {
    const parsed = importReviewSchema.parse({
      decision: "approved",
      publishedAt: "2026-01-01",
      recipeId: "r-1",
    }) as Record<string, unknown>;
    expect(parsed).toEqual({ decision: "approved" });
    expect("publishedAt" in parsed).toBe(false);
    expect("recipeId" in parsed).toBe(false);
  });
});
