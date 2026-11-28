import { describe, expect, it } from "vitest";

import {
  DISCOVERY_TAXONOMIES,
  getDiscoveryTaxonomyByCode,
  getDiscoveryTaxonomyBySegment,
  isDiscoveryTaxonomy,
} from "@/lib/constants/taxonomy";

/**
 * P08 §P08.1/P08.3 — Cấu hình trục phân loại dùng cho khu vực khám phá.
 * Bao phủ: tính duy nhất code/segment, metadata bắt buộc, cách lọc term,
 * và tra cứu theo code/segment (dựng URL `/danh-muc/{segment}`).
 */
describe("P08 — DISCOVERY_TAXONOMIES", () => {
  it("code và segment không trùng nhau", () => {
    const codes = DISCOVERY_TAXONOMIES.map((t) => t.code);
    const segments = DISCOVERY_TAXONOMIES.map((t) => t.segment);
    expect(new Set(codes).size).toBe(codes.length);
    expect(new Set(segments).size).toBe(segments.length);
  });

  it("mọi trục có đủ metadata bắt buộc và định dạng hợp lệ", () => {
    for (const taxonomy of DISCOVERY_TAXONOMIES) {
      expect(taxonomy.code).toMatch(/^[a-z][a-z0-9_]*$/);
      expect(taxonomy.segment).toMatch(/^[a-z][a-z0-9-]*$/);
      expect(taxonomy.label.trim().length).toBeGreaterThan(0);
      expect(taxonomy.description.trim().length).toBeGreaterThan(0);
    }
  });

  it("segment không đụng vùng URL hệ thống", () => {
    const segments = DISCOVERY_TAXONOMIES.map((t) => t.segment);
    for (const reserved of ["admin", "api", "danh-muc"]) {
      expect(segments).not.toContain(reserved);
    }
  });

  it("chỉ trục nguyên liệu dùng filterKind `ingredient_category`", () => {
    const special = DISCOVERY_TAXONOMIES.filter((t) => t.filterKind === "ingredient_category");
    expect(special.map((t) => t.code)).toEqual(["ingredient_category"]);
  });

  it("chỉ trục nguyên liệu được đánh dấu phân cấp", () => {
    const hierarchical = DISCOVERY_TAXONOMIES.filter((t) => t.isHierarchical).map((t) => t.code);
    expect(hierarchical).toEqual(["ingredient_category"]);
  });
});

describe("P08 — tra cứu trục khám phá", () => {
  it("getDiscoveryTaxonomyByCode", () => {
    expect(getDiscoveryTaxonomyByCode("food_type")?.segment).toBe("nhom-mon");
    expect(getDiscoveryTaxonomyByCode("meal_type")?.segment).toBe("bua-an");
    expect(getDiscoveryTaxonomyByCode("khong_ton_tai")).toBeUndefined();
  });

  it("getDiscoveryTaxonomyBySegment", () => {
    expect(getDiscoveryTaxonomyBySegment("am-thuc")?.code).toBe("cuisine");
    expect(getDiscoveryTaxonomyBySegment("nguyen-lieu")?.filterKind).toBe("ingredient_category");
    expect(getDiscoveryTaxonomyBySegment("khong-ton-tai")).toBeUndefined();
  });

  it("isDiscoveryTaxonomy: trục hệ thống KHÔNG thuộc khu vực khám phá", () => {
    expect(isDiscoveryTaxonomy("meal_type")).toBe(true);
    // `country`/`region` có trong seed P06 nhưng không nằm trong khám phá P08.
    expect(isDiscoveryTaxonomy("country")).toBe(false);
    expect(isDiscoveryTaxonomy("region")).toBe(false);
  });
});
