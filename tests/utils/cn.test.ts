import { describe, it, expect } from "vitest";
import { cn } from "@/lib/utils/cn";

describe("cn", () => {
  it("ghép nhiều class string", () => {
    expect(cn("a", "b", "c")).toBe("a b c");
  });

  it("bỏ qua giá trị falsy (null/undefined/false)", () => {
    expect(cn("a", null, undefined, false, "b")).toBe("a b");
  });

  it("giữ số 0 (không coi là falsy)", () => {
    expect(cn("gap", 0)).toBe("gap 0");
  });

  it("làm phẳng mảng lồng nhau", () => {
    expect(cn("a", ["b", ["c", false, "d"]])).toBe("a b c d");
  });

  it("trả chuỗi rỗng khi không có input hợp lệ", () => {
    expect(cn(null, false, undefined)).toBe("");
  });
});
