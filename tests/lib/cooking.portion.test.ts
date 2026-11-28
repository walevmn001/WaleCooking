import { describe, expect, it } from "vitest";

import {
  MAX_SERVINGS,
  MIN_SERVINGS,
  clampServings,
  formatScaledNumber,
  parseServingsInput,
  scaleIngredientAmount,
  scaleIngredients,
  servingFactor,
} from "@/lib/cooking/portion";
import type { RecipeIngredient } from "@/components/recipe/types";

/** Nguyên liệu có số GỐC để tính toán (giống dữ liệu do `toRecipeIngredient` tạo ra). */
function ing(overrides: Partial<RecipeIngredient>): RecipeIngredient {
  return {
    id: "i1",
    name: "Bột mì",
    amount: "200 g",
    quantityData: {
      type: "decimal",
      numeric: "200",
      numericMax: null,
      text: null,
      unit: "g",
    },
    ...overrides,
  };
}

describe("P09 — servingFactor", () => {
  it("nhân đôi khi gấp đôi khẩu phần", () => {
    expect(servingFactor(2, 4)).toBe(2);
  });

  it("giữ nguyên khi cùng khẩu phần", () => {
    expect(servingFactor(4, 4)).toBe(1);
  });

  it("trả null khi khẩu phần gốc không hợp lệ", () => {
    expect(servingFactor(0, 4)).toBeNull();
    expect(servingFactor(-2, 4)).toBeNull();
    expect(servingFactor(Number.NaN, 4)).toBeNull();
  });

  it("trả null khi khẩu phần đích không hợp lệ", () => {
    expect(servingFactor(2, 0)).toBeNull();
    expect(servingFactor(2, Number.POSITIVE_INFINITY)).toBeNull();
  });
});

describe("P09 — clampServings", () => {
  it("kẹp trong khoảng cho phép và làm tròn về số nguyên", () => {
    expect(clampServings(0)).toBe(MIN_SERVINGS);
    expect(clampServings(999)).toBe(MAX_SERVINGS);
    expect(clampServings(4.6)).toBe(5);
    expect(clampServings(4.4)).toBe(4);
  });

  it("giá trị không hữu hạn → mặc định nhỏ nhất", () => {
    expect(clampServings(Number.NaN)).toBe(MIN_SERVINGS);
    expect(clampServings(Number.NEGATIVE_INFINITY)).toBe(MIN_SERVINGS);
  });
});

describe("P09 — parseServingsInput", () => {
  it("nhận số nguyên và thập phân (dấu chấm hoặc phẩy)", () => {
    expect(parseServingsInput("4")).toBe(4);
    expect(parseServingsInput("4.5")).toBe(4.5);
    expect(parseServingsInput("4,5")).toBe(4.5);
    expect(parseServingsInput(" 6 ")).toBe(6);
  });

  it("nhận phân số", () => {
    expect(parseServingsInput("1/2")).toBe(0.5);
    expect(parseServingsInput("3/2")).toBe(1.5);
    expect(parseServingsInput("1 / 4")).toBe(0.25);
  });

  it("từ chối giá trị không hợp lệ", () => {
    expect(parseServingsInput("")).toBeNull();
    expect(parseServingsInput("abc")).toBeNull();
    expect(parseServingsInput("0")).toBeNull();
    expect(parseServingsInput("-2")).toBeNull();
    expect(parseServingsInput("1/0")).toBeNull();
    expect(parseServingsInput("1.2.3")).toBeNull();
  });
});

describe("P09 — formatScaledNumber", () => {
  it("tối đa 2 chữ số thập phân, bỏ số 0 thừa", () => {
    expect(formatScaledNumber(800)).toBe("800");
    expect(formatScaledNumber(0.5)).toBe("0.5");
    expect(formatScaledNumber(1 / 3)).toBe("0.33");
    expect(formatScaledNumber(0.125)).toBe("0.13");
  });

  it("không tạo '-0'", () => {
    expect(formatScaledNumber(-0)).toBe("0");
  });
});

describe("P09 — scaleIngredientAmount", () => {
  it("factor = 1 → giữ nguyên định lượng gốc (không làm tròn lại)", () => {
    const ingredient = ing({ amount: "200.000 g" });
    expect(scaleIngredientAmount(ingredient, 1)).toBe("200.000 g");
  });

  it("decimal: nhân số, GIỮ NGUYÊN đơn vị", () => {
    expect(scaleIngredientAmount(ing({}), 2)).toBe("400 g");
  });

  it("fraction: nhân số gốc", () => {
    const ingredient = ing({
      amount: "1/2 thìa",
      quantityData: { type: "fraction", numeric: "0.5", text: null, unit: "thìa" },
    });
    expect(scaleIngredientAmount(ingredient, 2)).toBe("1 thìa");
  });

  it("range: nhân cả min và max", () => {
    const ingredient = ing({
      amount: "1–2 tbsp",
      quantityData: { type: "range", numeric: "1", numericMax: "2", text: null, unit: "tbsp" },
    });
    expect(scaleIngredientAmount(ingredient, 2)).toBe("2–4 tbsp");
  });

  it("text: KHÔNG nhân — giữ nguyên chữ", () => {
    const ingredient = ing({
      amount: "vừa đủ",
      quantityData: { type: "text", numeric: null, text: "vừa đủ", unit: null },
    });
    expect(scaleIngredientAmount(ingredient, 3)).toBe("vừa đủ");
  });

  it("đơn vị không hỗ trợ quy đổi: chỉ đổi số, giữ nguyên đơn vị", () => {
    const ingredient = ing({
      amount: "2 quả",
      quantityData: { type: "decimal", numeric: "2", text: null, unit: "quả" },
    });
    expect(scaleIngredientAmount(ingredient, 1.5)).toBe("3 quả");
  });

  it("thiếu dữ liệu số (quantityData không có) → trả định lượng gốc", () => {
    const ingredient: RecipeIngredient = { id: "i9", name: "Tiêu", amount: "một ít" };
    expect(scaleIngredientAmount(ingredient, 2)).toBe("một ít");
  });

  it("factor không hợp lệ → trả định lượng gốc", () => {
    expect(scaleIngredientAmount(ing({}), Number.NaN)).toBe("200 g");
  });
});

describe("P09 — scaleIngredients", () => {
  it("nhân toàn bộ danh sách theo khẩu phần mục tiêu", () => {
    const list: RecipeIngredient[] = [
      ing({ id: "i1", amount: "200 g" }),
      ing({
        id: "i2",
        name: "Muối",
        amount: "vừa đủ",
        quantityData: { type: "text", numeric: null, text: "vừa đủ", unit: null },
      }),
    ];
    const scaled = scaleIngredients(list, 2, 4);
    expect(scaled[0].amount).toBe("400 g");
    expect(scaled[1].amount).toBe("vừa đủ");
  });

  it("khẩu phần gốc không hợp lệ → trả nguyên danh sách gốc", () => {
    const list: RecipeIngredient[] = [ing({})];
    expect(scaleIngredients(list, 0, 4)).toBe(list);
  });
});
