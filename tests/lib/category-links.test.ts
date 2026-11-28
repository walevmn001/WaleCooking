import { describe, expect, it } from "vitest";

import {
  CATEGORY_BASE,
  categoryIndexHref,
  categoryTermHref,
  categoryTypeHref,
} from "@/lib/presentation/category-links";

/**
 * P08 §P08.3 — Helper đường dẫn khu vực danh mục (hàm thuần).
 */
describe("P08 — category links", () => {
  it("CATEGORY_BASE ổn định", () => {
    expect(CATEGORY_BASE).toBe("/danh-muc");
  });

  it("trang tổng quan danh mục", () => {
    expect(categoryIndexHref()).toBe("/danh-muc");
  });

  it("trang một trục phân loại", () => {
    expect(categoryTypeHref("nhom-mon")).toBe("/danh-muc/nhom-mon");
    expect(categoryTypeHref("nguyen-lieu")).toBe("/danh-muc/nguyen-lieu");
  });

  it("trang chi tiết danh mục — trang 1 không kèm query", () => {
    expect(categoryTermHref("nhom-mon", "mon-chinh")).toBe("/danh-muc/nhom-mon/mon-chinh");
    expect(categoryTermHref("nhom-mon", "mon-chinh", 1)).toBe("/danh-muc/nhom-mon/mon-chinh");
  });

  it("trang chi tiết danh mục — phân trang > 1 kèm `page`", () => {
    expect(categoryTermHref("nhom-mon", "mon-chinh", 2)).toBe("/danh-muc/nhom-mon/mon-chinh?page=2");
    expect(categoryTermHref("nguyen-lieu", "thit", 3)).toBe("/danh-muc/nguyen-lieu/thit?page=3");
  });
});
