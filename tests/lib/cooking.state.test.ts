import { beforeEach, describe, expect, it } from "vitest";

import {
  COOKING_STATE_VERSION,
  clearCookingState,
  checklistProgress,
  createCookingState,
  loadCookingState,
  normalizeCheckedIds,
  parseCookingState,
  saveCookingState,
  serializeCookingState,
  storageKey,
} from "@/lib/cooking/state";

const OPTIONS = { stepCount: 5, validIngredientIds: ["i1", "i2", "i3"], baseServings: 2 };

describe("P09 — createCookingState", () => {
  it("tạo trạng thái mặc định với số khẩu phần gốc", () => {
    const state = createCookingState("pho-bo", 4);
    expect(state).toEqual({
      v: COOKING_STATE_VERSION,
      slug: "pho-bo",
      servings: 4,
      checkedIds: [],
      stepIndex: 0,
      startedAt: null,
      status: "idle",
    });
  });

  it("khẩu phần gốc không hợp lệ → mặc định 1", () => {
    expect(createCookingState("x", 0).servings).toBe(1);
    expect(createCookingState("x", Number.NaN).servings).toBe(1);
  });
});

describe("P09 — normalizeCheckedIds", () => {
  it("loại trùng và giữ thứ tự xuất hiện", () => {
    expect(normalizeCheckedIds(["i1", "i1", "i2", "i1"])).toEqual(["i1", "i2"]);
  });

  it("bỏ giá trị không phải chuỗi rỗng/không hợp lệ", () => {
    expect(normalizeCheckedIds(["i1", "", 5, null, "i2"])).toEqual(["i1", "i2"]);
  });

  it("lọc theo danh sách id hợp lệ khi được cung cấp", () => {
    expect(normalizeCheckedIds(["i1", "z9", "i2"], ["i1", "i2"])).toEqual(["i1", "i2"]);
  });

  it("đầu vào không phải mảng → mảng rỗng", () => {
    expect(normalizeCheckedIds("i1")).toEqual([]);
    expect(normalizeCheckedIds(undefined)).toEqual([]);
  });
});

describe("P09 — parseCookingState", () => {
  it("JSON hỏng → trạng thái mặc định", () => {
    expect(parseCookingState("not-json", "pho-bo", OPTIONS)).toEqual(
      createCookingState("pho-bo", 2),
    );
  });

  it("version khác → trạng thái mặc định", () => {
    const raw = JSON.stringify({ v: 999, slug: "pho-bo", servings: 4 });
    expect(parseCookingState(raw, "pho-bo", OPTIONS)).toEqual(createCookingState("pho-bo", 2));
  });

  it("slug khác → không lẫn tiến độ giữa các món", () => {
    const raw = serializeCookingState({ ...createCookingState("khac", 2), stepIndex: 3 });
    expect(parseCookingState(raw, "pho-bo", OPTIONS).stepIndex).toBe(0);
  });

  it("kẹp stepIndex khi công thức ít bước hơn (đổi phiên bản)", () => {
    const state = { ...createCookingState("pho-bo", 2), stepIndex: 9 };
    const parsed = parseCookingState(serializeCookingState(state), "pho-bo", {
      ...OPTIONS,
      stepCount: 3,
    });
    expect(parsed.stepIndex).toBe(2);
  });

  it("loại bỏ nguyên liệu không còn tồn tại trong công thức hiện tại", () => {
    const state = {
      ...createCookingState("pho-bo", 2),
      checkedIds: ["i1", "gone", "i2"],
    };
    const parsed = parseCookingState(serializeCookingState(state), "pho-bo", OPTIONS);
    expect(parsed.checkedIds).toEqual(["i1", "i2"]);
  });

  it("giữ số khẩu phần người dùng đã chọn", () => {
    const state = { ...createCookingState("pho-bo", 2), servings: 6, status: "active" as const };
    const parsed = parseCookingState(serializeCookingState(state), "pho-bo", OPTIONS);
    expect(parsed.servings).toBe(6);
    expect(parsed.status).toBe("active");
  });
});

describe("P09 — checklistProgress", () => {
  it("tính số đã chuẩn bị trên tổng (bỏ id không hợp lệ)", () => {
    expect(checklistProgress(["i1", "i2", "i3"], ["i1", "z9"])).toEqual({
      done: 1,
      total: 3,
      ratio: 1 / 3,
    });
  });

  it("danh sách rỗng → ratio 0", () => {
    expect(checklistProgress([], ["i1"])).toEqual({ done: 0, total: 0, ratio: 0 });
  });
});

describe("P09 — localStorage (jsdom)", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("lưu và khôi phục trạng thái", () => {
    const state = { ...createCookingState("pho-bo", 2), checkedIds: ["i1"], stepIndex: 2 };
    saveCookingState(state);
    expect(window.localStorage.getItem(storageKey("pho-bo"))).toContain("pho-bo");
    expect(loadCookingState("pho-bo", OPTIONS)).toEqual(state);
  });

  it("khôi phục khi tải lại: số khẩu phần + checklist còn nguyên", () => {
    saveCookingState({ ...createCookingState("pho-bo", 2), servings: 4, checkedIds: ["i1", "i2"] });
    const restored = loadCookingState("pho-bo", OPTIONS);
    expect(restored.servings).toBe(4);
    expect(restored.checkedIds).toEqual(["i1", "i2"]);
  });

  it("chưa có dữ liệu → trạng thái mặc định", () => {
    expect(loadCookingState("moi", OPTIONS)).toEqual(createCookingState("moi", 2));
  });

  it("clearCookingState xoá dữ liệu của công thức", () => {
    saveCookingState(createCookingState("pho-bo", 2));
    clearCookingState("pho-bo");
    expect(window.localStorage.getItem(storageKey("pho-bo"))).toBeNull();
  });
});
