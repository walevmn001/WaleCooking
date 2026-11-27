import { describe, it, expect } from "vitest";
import { formatMinutes, formatServings } from "@/lib/utils/format";

describe("formatMinutes", () => {
  it("định dạng giờ + phút", () => {
    expect(formatMinutes(90)).toBe("1 giờ 30 phút");
  });

  it("chỉ phút khi dưới 60", () => {
    expect(formatMinutes(45)).toBe("45 phút");
  });

  it("chỉ giờ khi chẵn giờ", () => {
    expect(formatMinutes(120)).toBe("2 giờ");
  });

  it("0 phút", () => {
    expect(formatMinutes(0)).toBe("0 phút");
  });

  it("trả dấu gạch cho giá trị thiếu/không hợp lệ", () => {
    expect(formatMinutes(undefined)).toBe("—");
    expect(formatMinutes(null)).toBe("—");
    expect(formatMinutes(-5)).toBe("—");
    expect(formatMinutes(Number.NaN)).toBe("—");
  });
});

describe("formatServings", () => {
  it("định dạng khẩu phần", () => {
    expect(formatServings(4)).toBe("4 khẩu phần");
  });

  it("trả dấu gạch cho giá trị thiếu/không hợp lệ", () => {
    expect(formatServings(0)).toBe("—");
    expect(formatServings(undefined)).toBe("—");
    expect(formatServings(null)).toBe("—");
  });
});
