import { describe, expect, it } from "vitest";

import {
  addFavorite,
  clearFavorites,
  FAVORITES_COOKIE_MAX_AGE,
  FAVORITES_COOKIE_NAME,
  FAVORITES_VERSION,
  hasFavorite,
  isFavoritesPayloadChanged,
  isRecipeSlug,
  MAX_COOKIE_VALUE_LENGTH,
  MAX_FAVORITES,
  normalizeFavorites,
  parseFavoritesCookie,
  removeFavorite,
  serializeFavoritesCookie,
} from "@/lib/favorites/cookie";

/**
 * P07.1 §7.1.4 — Module yêu thích bằng cookie (tầng THUẦN).
 * Bao phủ: cookie chưa tồn tại, hợp lệ, sai định dạng, quá lớn, trùng slug,
 * version không hỗ trợ, giới hạn số lượng, thêm/xoá/xoá-hết, slug không hợp lệ.
 */
describe("P07.1 — hằng số cookie yêu thích", () => {
  it("tên cookie và version ổn định", () => {
    expect(FAVORITES_COOKIE_NAME).toBe("wale_favorites");
    expect(FAVORITES_VERSION).toBe(1);
  });

  it("giới hạn số lượng và thời hạn hợp lý", () => {
    expect(MAX_FAVORITES).toBe(50);
    expect(FAVORITES_COOKIE_MAX_AGE).toBe(60 * 60 * 24 * 180);
    expect(MAX_COOKIE_VALUE_LENGTH).toBeLessThan(4096);
  });
});

describe("P07.1 — isRecipeSlug", () => {
  it("chấp nhận slug thường và có gạch ngang/gạch dưới", () => {
    expect(isRecipeSlug("pho-bo")).toBe(true);
    expect(isRecipeSlug("banh_mi")).toBe(true);
    expect(isRecipeSlug("a1-b2_c3")).toBe(true);
  });

  it("từ chối giá trị không hợp lệ", () => {
    expect(isRecipeSlug("")).toBe(false);
    expect(isRecipeSlug("Phở Bò")).toBe(false);
    expect(isRecipeSlug("pho bo")).toBe(false);
    expect(isRecipeSlug("-pho")).toBe(false);
    expect(isRecipeSlug("pho--bò")).toBe(false);
    expect(isRecipeSlug("a".repeat(201))).toBe(false);
    expect(isRecipeSlug(123)).toBe(false);
    expect(isRecipeSlug(null)).toBe(false);
    expect(isRecipeSlug(undefined)).toBe(false);
  });
});

describe("P07.1 — normalizeFavorites", () => {
  it("lọc giá trị không hợp lệ và bỏ trùng, giữ thứ tự", () => {
    expect(normalizeFavorites(["pho-bo", "pho-bo", "Banh Mi", "banh-mi", ""])).toEqual([
      "pho-bo",
      "banh-mi",
    ]);
  });

  it("đầu vào không phải mảng → rỗng", () => {
    expect(normalizeFavorites(null)).toEqual([]);
    expect(normalizeFavorites("pho-bo")).toEqual([]);
    expect(normalizeFavorites({ items: [] })).toEqual([]);
  });

  it("cắt theo giới hạn MAX_FAVORITES", () => {
    const many = Array.from({ length: MAX_FAVORITES + 20 }, (_, i) => `mon-${i}`);
    const result = normalizeFavorites(many);
    expect(result).toHaveLength(MAX_FAVORITES);
    expect(result[0]).toBe("mon-0");
    expect(result[result.length - 1]).toBe(`mon-${MAX_FAVORITES - 1}`);
  });
});

describe("P07.1 — parseFavoritesCookie", () => {
  it("cookie chưa tồn tại (null/undefined/rỗng) → rỗng, hợp lệ", () => {
    for (const raw of [null, undefined, ""]) {
      const result = parseFavoritesCookie(raw);
      expect(result.items).toEqual([]);
      expect(result.invalid).toBe(false);
      expect(result.unsupportedVersion).toBe(false);
      expect(result.version).toBe(FAVORITES_VERSION);
    }
  });

  it("cookie hợp lệ → đọc đúng danh sách", () => {
    const raw = JSON.stringify({ v: 1, items: ["pho-bo", "banh-mi"] });
    const result = parseFavoritesCookie(raw);
    expect(result.items).toEqual(["pho-bo", "banh-mi"]);
    expect(result.invalid).toBe(false);
    expect(result.unsupportedVersion).toBe(false);
  });

  it("cookie hợp lệ nhưng có slug trùng/không hợp lệ → chuẩn hoá", () => {
    const raw = JSON.stringify({ v: 1, items: ["pho-bo", "pho-bo", "Bad Slug", 5] });
    const result = parseFavoritesCookie(raw);
    expect(result.items).toEqual(["pho-bo"]);
    expect(result.invalid).toBe(false);
  });

  it("cookie sai định dạng JSON → rỗng + invalid", () => {
    const result = parseFavoritesCookie("{not-json");
    expect(result.items).toEqual([]);
    expect(result.invalid).toBe(true);
  });

  it("giá trị JSON là mảng/số/chuỗi → rỗng + invalid", () => {
    for (const raw of ["[]", '"abc"', "42", "null"]) {
      const result = parseFavoritesCookie(raw);
      expect(result.items).toEqual([]);
      expect(result.invalid).toBe(true);
    }
  });

  it("thiếu hoặc sai kiểu `v` → invalid", () => {
    const result = parseFavoritesCookie(JSON.stringify({ items: ["pho-bo"] }));
    expect(result.invalid).toBe(true);
    expect(result.items).toEqual([]);
  });

  it("`items` không phải mảng → invalid", () => {
    const result = parseFavoritesCookie(JSON.stringify({ v: 1, items: "pho-bo" }));
    expect(result.invalid).toBe(true);
    expect(result.items).toEqual([]);
  });

  it("version không được hỗ trợ → unsupportedVersion, KHÔNG invalid", () => {
    const result = parseFavoritesCookie(JSON.stringify({ v: 2, items: ["pho-bo"] }));
    expect(result.unsupportedVersion).toBe(true);
    expect(result.invalid).toBe(false);
    expect(result.items).toEqual([]);
    expect(result.version).toBe(2);
  });

  it("cookie quá lớn → rỗng + invalid", () => {
    const huge = "x".repeat(MAX_COOKIE_VALUE_LENGTH + 1);
    const result = parseFavoritesCookie(huge);
    expect(result.items).toEqual([]);
    expect(result.invalid).toBe(true);
  });
});

describe("P07.1 — serializeFavoritesCookie", () => {
  it("tuần tự hoá có version và chuẩn hoá slug", () => {
    const raw = serializeFavoritesCookie(["pho-bo", "pho-bo", "Bad"]);
    const parsed = JSON.parse(raw) as { v: number; items: string[] };
    expect(parsed.v).toBe(FAVORITES_VERSION);
    expect(parsed.items).toEqual(["pho-bo"]);
  });

  it("round-trip ổn định", () => {
    const items = ["pho-bo", "banh-mi", "com-tam"];
    const raw = serializeFavoritesCookie(items);
    expect(parseFavoritesCookie(raw).items).toEqual(items);
  });
});

describe("P07.1 — add / remove / clear / has", () => {
  it("addFavorite: thêm và bỏ trùng", () => {
    expect(addFavorite([], "pho-bo")).toEqual(["pho-bo"]);
    expect(addFavorite(["pho-bo"], "pho-bo")).toEqual(["pho-bo"]);
    expect(addFavorite(["pho-bo"], "banh-mi")).toEqual(["pho-bo", "banh-mi"]);
  });

  it("addFavorite: bỏ qua slug không hợp lệ", () => {
    expect(addFavorite(["pho-bo"], "Bad Slug")).toEqual(["pho-bo"]);
  });

  it("addFavorite: tôn trọng giới hạn MAX_FAVORITES", () => {
    const full = Array.from({ length: MAX_FAVORITES }, (_, i) => `mon-${i}`);
    const next = addFavorite(full, "mon-moi");
    expect(next).toHaveLength(MAX_FAVORITES);
    expect(next).not.toContain("mon-moi");
  });

  it("removeFavorite: xoá đúng slug, giữ slug khác", () => {
    expect(removeFavorite(["pho-bo", "banh-mi"], "pho-bo")).toEqual(["banh-mi"]);
  });

  it("removeFavorite: slug không tồn tại không đổi", () => {
    expect(removeFavorite(["pho-bo"], "khong-co")).toEqual(["pho-bo"]);
  });

  it("clearFavorites: trả mảng rỗng", () => {
    expect(clearFavorites()).toEqual([]);
  });

  it("hasFavorite: kiểm tra đúng, tolerant với dữ liệu bẩn", () => {
    expect(hasFavorite(["pho-bo"], "pho-bo")).toBe(true);
    expect(hasFavorite(["pho-bo"], "banh-mi")).toBe(false);
    expect(hasFavorite(["pho-bo"], "Bad Slug")).toBe(false);
  });

  it("thêm/xoá liên tục giữ trạng thái đúng", () => {
    let items: string[] = [];
    items = addFavorite(items, "a");
    items = addFavorite(items, "b");
    items = removeFavorite(items, "a");
    items = addFavorite(items, "a");
    expect(items).toEqual(["b", "a"]);
    items = removeFavorite(items, "a");
    expect(items).toEqual(["b"]);
  });
});

describe("P07.1 — isFavoritesPayloadChanged", () => {
  it("phát hiện thay đổi khi độ dài khác", () => {
    expect(isFavoritesPayloadChanged(["a"], ["a", "b"])).toBe(true);
  });

  it("phát hiện thay đổi khi phần tử khác", () => {
    expect(isFavoritesPayloadChanged(["a", "b"], ["b", "a"])).toBe(true);
  });

  it("bỏ qua khác biệt khi đã chuẩn hoá (trùng/không hợp lệ)", () => {
    expect(isFavoritesPayloadChanged(["a", "a", "Bad"], ["a"])).toBe(false);
    expect(isFavoritesPayloadChanged(["a"], ["a"])).toBe(false);
  });
});
