import { describe, expect, it } from "vitest";

import {
  MAX_INPUT_VALUE,
  convertTemperature,
  convertUnit,
  convertibleTargets,
  formatConvertedValue,
  formatWithUnit,
  getUnit,
  parseAmountInput,
  unitsByDimension,
} from "@/lib/kitchen/units";

/** Lấy giá trị thành công hoặc ném lỗi để test rõ ràng. */
function value(result: ReturnType<typeof convertUnit>): number {
  if (!result.ok) throw new Error(`Mong đợi thành công nhưng nhận ${result.code}`);
  return result.value;
}

describe("P10 — quy đổi khối lượng", () => {
  it("g ↔ kg ↔ mg theo SI", () => {
    expect(value(convertUnit(1000, "g", "kg"))).toBe(1);
    expect(value(convertUnit(1, "kg", "g"))).toBe(1000);
    expect(value(convertUnit(1, "g", "mg"))).toBe(1000);
    expect(value(convertUnit(500, "mg", "g"))).toBe(0.5);
  });

  it("oz / lb theo hệ avoirdupois", () => {
    expect(value(convertUnit(1, "oz", "g"))).toBeCloseTo(28.349523125, 9);
    expect(value(convertUnit(1, "lb", "g"))).toBeCloseTo(453.59237, 9);
    expect(value(convertUnit(16, "oz", "lb"))).toBeCloseTo(1, 9);
  });
});

describe("P10 — quy đổi thể tích", () => {
  it("ml ↔ l theo SI", () => {
    expect(value(convertUnit(1000, "ml", "l"))).toBe(1);
    expect(value(convertUnit(0.5, "l", "ml"))).toBe(500);
  });

  it("thìa/cốc theo US customary", () => {
    expect(value(convertUnit(3, "tsp", "tbsp"))).toBeCloseTo(1, 9);
    expect(value(convertUnit(1, "cup", "ml"))).toBeCloseTo(236.5882365, 6);
    expect(value(convertUnit(1, "tbsp", "ml"))).toBeCloseTo(14.78676478125, 9);
    expect(value(convertUnit(8, "fl_oz", "cup"))).toBeCloseTo(1, 9);
  });

  it("phân biệt cup US và metric cup", () => {
    expect(value(convertUnit(1, "metric_cup", "ml"))).toBe(250);
    expect(value(convertUnit(1, "cup", "metric_cup"))).toBeCloseTo(236.5882365 / 250, 9);
  });
});

describe("P10 — quy đổi nhiệt độ", () => {
  it("công thức °C ↔ °F đúng", () => {
    expect(convertTemperature(0, "c", "f")).toBe(32);
    expect(convertTemperature(100, "c", "f")).toBe(212);
    expect(convertTemperature(32, "f", "c")).toBe(0);
    expect(convertTemperature(180, "c", "f")).toBe(356);
    expect(convertTemperature(-40, "c", "f")).toBe(-40);
  });

  it("qua convertUnit cho phép số âm", () => {
    expect(value(convertUnit(-40, "c", "f"))).toBe(-40);
    expect(value(convertUnit(350, "f", "c"))).toBeCloseTo(176.6666667, 5);
  });
});

describe("P10 — từ chối quy đổi sai nhóm", () => {
  it("khối lượng ↔ thể tích → incompatible (KHÔNG suy diễn tỷ trọng)", () => {
    const result = convertUnit(100, "g", "ml");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe("incompatible");
  });

  it("khối lượng ↔ nhiệt độ → incompatible", () => {
    const result = convertUnit(1, "kg", "c");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe("incompatible");
  });
});

describe("P10 — đơn vị đếm & tùy biến", () => {
  it("cùng đơn vị đếm → giữ nguyên giá trị", () => {
    expect(value(convertUnit(2, "piece", "piece"))).toBe(2);
  });

  it("khác đơn vị đếm → not_convertible (không có khối lượng cố định)", () => {
    const result = convertUnit(1, "piece", "clove");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe("not_convertible");
  });

  it("đơn vị tùy biến khác nhau → not_convertible", () => {
    const result = convertUnit(1, "pinch", "to_taste");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe("not_convertible");
    expect(value(convertUnit(1, "pinch", "pinch"))).toBe(1);
  });
});

describe("P10 — đầu vào không hợp lệ", () => {
  it("đơn vị không xác định → unknown_unit", () => {
    const result = convertUnit(1, "xyz", "g");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe("unknown_unit");
  });

  it("NaN / vô hạn → invalid_input", () => {
    expect(convertUnit(Number.NaN, "g", "kg").ok).toBe(false);
    expect(convertUnit(Number.POSITIVE_INFINITY, "g", "kg").ok).toBe(false);
  });

  it("giá trị âm với khối lượng/thể tích → invalid_input", () => {
    const result = convertUnit(-5, "g", "kg");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe("invalid_input");
  });

  it("giá trị quá lớn → invalid_input", () => {
    const result = convertUnit(MAX_INPUT_VALUE + 1, "g", "kg");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe("invalid_input");
  });
});

describe("P10 — parseAmountInput", () => {
  it("nhận số nguyên, thập phân (chấm/phẩy)", () => {
    expect(parseAmountInput("250")).toBe(250);
    expect(parseAmountInput("1.5")).toBe(1.5);
    expect(parseAmountInput("1,5")).toBe(1.5);
    expect(parseAmountInput(" 2 ")).toBe(2);
  });

  it("rỗng / không phải số → null", () => {
    expect(parseAmountInput("")).toBeNull();
    expect(parseAmountInput("   ")).toBeNull();
    expect(parseAmountInput("abc")).toBeNull();
    expect(parseAmountInput("1.2.3")).toBeNull();
  });
});

describe("P10 — định dạng kết quả", () => {
  it("bỏ nhiễu dấu phẩy động, tối đa 6 chữ số thập phân", () => {
    expect(formatConvertedValue(0.1 + 0.2)).toBe("0.3");
    expect(formatConvertedValue(1)).toBe("1");
    expect(formatConvertedValue(Number.NaN)).toBe("—");
  });

  it("formatWithUnit ghép số với ký hiệu đơn vị", () => {
    expect(formatWithUnit(1, "kg")).toBe("1 kg");
    expect(formatWithUnit(250, "metric_cup")).toBe("250 cốc");
  });
});

describe("P10 — danh mục đơn vị", () => {
  it("getUnit trả định nghĩa hoặc null", () => {
    expect(getUnit("g")?.name).toBe("gam");
    expect(getUnit("nope")).toBeNull();
  });

  it("convertibleTargets chỉ trả cùng nhóm, khác mã; đếm/tùy biến → rỗng", () => {
    const massTargets = convertibleTargets("g").map((u) => u.code);
    expect(massTargets).toContain("kg");
    expect(massTargets).not.toContain("g");
    expect(massTargets.every((code) => getUnit(code)?.dimension === "mass")).toBe(true);
    expect(convertibleTargets("piece")).toEqual([]);
    expect(convertibleTargets("pinch")).toEqual([]);
  });

  it("mọi đơn vị khối lượng/thể tích đều có hệ số quy về cơ sở", () => {
    for (const unit of [...unitsByDimension("mass"), ...unitsByDimension("volume")]) {
      expect(unit.toBase).not.toBeNull();
    }
  });
});
