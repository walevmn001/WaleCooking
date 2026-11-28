import { describe, expect, it } from "vitest";

import {
  toFieldCategory,
  type FieldState,
  type ProvenancedField,
} from "@/lib/import/field-state";

const ALL_STATES: FieldState[] = [
  "MISSING",
  "UNREADABLE",
  "CONFIRMED",
  "DERIVED",
  "CONFLICT",
];

describe("FieldState → FieldCategory (I2.2)", () => {
  it.each<[FieldState, string]>([
    ["CONFIRMED", "extracted"],
    ["DERIVED", "extracted"],
    ["MISSING", "missing"],
    ["UNREADABLE", "uncertain"],
    ["CONFLICT", "uncertain"],
  ])("ánh xạ %s → %s", (state, expected) => {
    expect(toFieldCategory(state)).toBe(expected);
  });

  it("luôn phủ hết 5 trạng thái (không rơi vào nhánh ngầm)", () => {
    for (const state of ALL_STATES) {
      expect(["extracted", "missing", "uncertain"]).toContain(toFieldCategory(state));
    }
  });

  it("KHÔNG bao giờ trả 'failed' ở mức trường (failed là mức kết quả E1)", () => {
    for (const state of ALL_STATES) {
      expect(toFieldCategory(state)).not.toBe("failed");
    }
  });

  it("ProvenancedField giữ bất biến: trường MISSING phải value = null", () => {
    const missing: ProvenancedField<number> = {
      value: null,
      state: "MISSING",
      tier: "E1",
    };
    expect(missing.value).toBeNull();
    expect(toFieldCategory(missing.state)).toBe("missing");
    expect(missing.evidence).toBeUndefined();
  });

  it("ProvenancedField CONFIRMED giữ value + evidence để truy vết", () => {
    const confirmed: ProvenancedField<string> = {
      value: "Bánh mì",
      state: "CONFIRMED",
      tier: "E1",
      evidence: "$.recipe.name",
    };
    expect(toFieldCategory(confirmed.state)).toBe("extracted");
    expect(confirmed.evidence).toBe("$.recipe.name");
  });
});
