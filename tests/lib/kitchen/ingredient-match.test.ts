import { describe, expect, it } from "vitest";

import {
  dedupeIngredients,
  ingredientMatches,
  matchRecipesByIngredients,
  normalizeText,
  type IngredientMatchCandidate,
} from "@/lib/kitchen/ingredient-match";

function candidate(overrides: Partial<IngredientMatchCandidate>): IngredientMatchCandidate {
  return {
    slug: "mon-a",
    title: "Món A",
    imageUrl: null,
    totalMinutes: 30,
    cookMinutes: 20,
    baseServings: 2,
    ingredients: [],
    ...overrides,
  };
}

describe("P10 — normalizeText", () => {
  it("bỏ dấu tiếng Việt, chữ thường", () => {
    expect(normalizeText("Trứng")).toBe("trung");
    expect(normalizeText("Cà chua")).toBe("ca chua");
    expect(normalizeText("Hành lá")).toBe("hanh la");
    expect(normalizeText("Đậu phụ")).toBe("dau phu");
  });

  it("gộp khoảng trắng và bỏ ký tự đặc biệt", () => {
    expect(normalizeText("  Bột   mì  ")).toBe("bot mi");
    expect(normalizeText("Nước mắm!")).toBe("nuoc mam");
  });
});

describe("P10 — dedupeIngredients", () => {
  it("loại trùng theo dạng chuẩn hoá (không phân biệt hoa/thường, dấu)", () => {
    expect(dedupeIngredients(["Trứng", "trứng", "TRỨNG", "Cà chua"])).toEqual([
      "Trứng",
      "Cà chua",
    ]);
  });

  it("bỏ giá trị rỗng và giữ hình thức hiển thị đầu tiên", () => {
    expect(dedupeIngredients(["  ", "Muối", "", "  muối "])).toEqual(["Muối"]);
  });

  it("đầu vào rỗng → mảng rỗng", () => {
    expect(dedupeIngredients([])).toEqual([]);
  });
});

describe("P10 — ingredientMatches", () => {
  it("khớp theo tên đã chuẩn hoá (bỏ dấu)", () => {
    expect(ingredientMatches("trung", { name: "Trứng" })).toBe(true);
    expect(ingredientMatches("ca chua", { name: "Cà chua" })).toBe(true);
  });

  it("khớp theo từ trọn vẹn, không khớp một phần tuỳ tiện", () => {
    expect(ingredientMatches("hanh", { name: "Hành lá" })).toBe(true);
    expect(ingredientMatches("han", { name: "Hành lá" })).toBe(false);
  });

  it("khớp theo slug khi có", () => {
    expect(ingredientMatches("ca chua", { name: "Cà chua bi", slug: "ca-chua" })).toBe(true);
  });

  it("từ khoá rỗng → false", () => {
    expect(ingredientMatches("", { name: "Trứng" })).toBe(false);
  });
});

describe("P10 — matchRecipesByIngredients", () => {
  it("tính matched / missing / tỷ lệ khớp từ dữ liệu thực", () => {
    const [result] = matchRecipesByIngredients(
      ["Trứng", "Cà chua"],
      [
        candidate({
          ingredients: [
            { name: "Trứng", required: true },
            { name: "Cà chua", required: true },
            { name: "Hành lá", required: false },
          ],
        }),
      ],
    );
    expect(result.matched).toEqual(["Trứng", "Cà chua"]);
    expect(result.missing).toEqual(["Hành lá"]);
    expect(result.matchedCount).toBe(2);
    expect(result.totalIngredients).toBe(3);
    expect(result.coverage).toBeCloseTo(2 / 3, 9);
    expect(result.missingRequired).toEqual([]);
    expect(result.completeRequired).toBe(true);
  });

  it("tách riêng nguyên liệu thiếu BẮT BUỘC (không khẳng định nấu được)", () => {
    const [result] = matchRecipesByIngredients(
      ["Trứng"],
      [
        candidate({
          ingredients: [
            { name: "Trứng", required: true },
            { name: "Nước mắm", required: true },
            { name: "Hành lá", required: false },
          ],
        }),
      ],
    );
    expect(result.missingRequired).toEqual(["Nước mắm"]);
    expect(result.completeRequired).toBe(false);
  });

  it("nguyên liệu thiếu không nêu required vẫn tính là bắt buộc (mặc định)", () => {
    const [result] = matchRecipesByIngredients(
      ["Trứng"],
      [candidate({ ingredients: [{ name: "Trứng" }, { name: "Muối" }] })],
    );
    expect(result.missingRequired).toEqual(["Muối"]);
  });

  it("không khớp nguyên liệu nào → không đưa vào kết quả", () => {
    const results = matchRecipesByIngredients(
      ["Thịt bò"],
      [candidate({ ingredients: [{ name: "Trứng" }, { name: "Cà chua" }] })],
    );
    expect(results).toEqual([]);
  });

  it("minMatched lọc kết quả theo số nguyên liệu người dùng khớp", () => {
    const results = matchRecipesByIngredients(
      ["Trứng", "Cà chua"],
      [candidate({ ingredients: [{ name: "Trứng" }] })],
      { minMatched: 2 },
    );
    expect(results).toEqual([]);
  });

  it("xếp hạng: khớp nhiều nguyên liệu người dùng hơn lên trước", () => {
    const results = matchRecipesByIngredients(
      ["Trứng", "Cà chua"],
      [
        candidate({ slug: "it", title: "Ít", ingredients: [{ name: "Trứng" }] }),
        candidate({
          slug: "nhieu",
          title: "Nhiều",
          ingredients: [{ name: "Trứng" }, { name: "Cà chua" }],
        }),
      ],
    );
    expect(results.map((r) => r.candidate.slug)).toEqual(["nhieu", "it"]);
  });

  it("chuẩn hoá & loại trùng đầu vào người dùng", () => {
    const [result] = matchRecipesByIngredients(
      ["trứng", "TRỨNG", "  Trứng "],
      [candidate({ ingredients: [{ name: "Trứng" }] })],
    );
    expect(result.userMatchedCount).toBe(1);
    expect(result.userCoverage).toBe(1);
  });

  it("danh sách người dùng rỗng → không kết quả", () => {
    expect(matchRecipesByIngredients([], [candidate({})])).toEqual([]);
  });
});
