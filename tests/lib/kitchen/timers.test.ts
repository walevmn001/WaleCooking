import { beforeEach, describe, expect, it } from "vitest";

import {
  MAX_TIMER_SECONDS,
  MAX_TIMERS,
  MIN_TIMER_SECONDS,
  TIMER_STATE_VERSION,
  TIMER_STORAGE_KEY,
  clampDurationSeconds,
  clearTimers,
  createTimer,
  formatClock,
  isFinished,
  loadTimers,
  normalizeTimers,
  parseTimers,
  pauseTimer,
  remainingSeconds,
  renameTimer,
  resetTimer,
  saveTimers,
  serializeTimers,
  setTimerDuration,
  startTimer,
  tickTimer,
  type KitchenTimer,
} from "@/lib/kitchen/timers";

const T0 = 1_000_000;
const timer = createTimer("Luộc trứng", 480, "t1");

describe("P10 — clampDurationSeconds", () => {
  it("kẹp trong khoảng 1 giây → 24 giờ", () => {
    expect(clampDurationSeconds(0)).toBe(MIN_TIMER_SECONDS);
    expect(clampDurationSeconds(-5)).toBe(MIN_TIMER_SECONDS);
    expect(clampDurationSeconds(MAX_TIMER_SECONDS + 100)).toBe(MAX_TIMER_SECONDS);
  });

  it("làm tròn về số nguyên giây", () => {
    expect(clampDurationSeconds(480.4)).toBe(480);
    expect(clampDurationSeconds(480.6)).toBe(481);
  });

  it("giá trị không hữu hạn → mặc định nhỏ nhất", () => {
    expect(clampDurationSeconds(Number.NaN)).toBe(MIN_TIMER_SECONDS);
    expect(clampDurationSeconds(Number.POSITIVE_INFINITY)).toBe(MIN_TIMER_SECONDS);
  });
});

describe("P10 — createTimer", () => {
  it("tạo đồng hồ ở trạng thái chờ với thời lượng đã kẹp", () => {
    expect(timer).toEqual({
      id: "t1",
      label: "Luộc trứng",
      durationSeconds: 480,
      deadline: null,
      pausedRemaining: 480,
      status: "idle",
      notified: false,
    });
  });

  it("nhãn rỗng → nhãn mặc định", () => {
    expect(createTimer("   ", 60, "x").label).toBe("Đồng hồ");
  });
});

describe("P10 — remainingSeconds", () => {
  it("đang chạy: suy ra từ deadline (nguồn sự thật)", () => {
    const running = startTimer(timer, T0);
    expect(remainingSeconds(running, T0)).toBe(480);
    expect(remainingSeconds(running, T0 + 60_000)).toBe(420);
  });

  it("đang chạy quá hạn → 0 (không âm)", () => {
    const running = startTimer(timer, T0);
    expect(remainingSeconds(running, T0 + 999_000)).toBe(0);
  });

  it("tạm dừng / chờ: trả giá trị đã chốt", () => {
    const paused = pauseTimer(startTimer(timer, T0), T0 + 60_000);
    expect(remainingSeconds(paused, T0 + 500_000)).toBe(420);
  });

  it("kết thúc → 0", () => {
    const finished = tickTimer(startTimer(timer, T0), T0 + 480_000).timer;
    expect(remainingSeconds(finished, T0 + 480_000)).toBe(0);
  });
});

describe("P10 — startTimer / pauseTimer", () => {
  it("bắt đầu đặt deadline = now + còn lại", () => {
    const running = startTimer(timer, T0);
    expect(running.status).toBe("running");
    expect(running.deadline).toBe(T0 + 480_000);
  });

  it("tiếp tục từ trạng thái tạm dừng: giữ đúng thời gian còn lại", () => {
    const paused = pauseTimer(startTimer(timer, T0), T0 + 60_000); // còn 420 giây
    const resumed = startTimer(paused, T0 + 600_000);
    expect(resumed.status).toBe("running");
    expect(resumed.deadline).toBe(T0 + 600_000 + 420_000);
  });

  it("tạm dừng: chỉ có tác dụng khi đang chạy", () => {
    expect(pauseTimer(timer, T0)).toBe(timer);
    const paused = pauseTimer(startTimer(timer, T0), T0 + 60_000);
    expect(paused.status).toBe("paused");
    expect(paused.deadline).toBeNull();
    expect(paused.pausedRemaining).toBe(420);
  });
});

describe("P10 — tickTimer (đúng khi tab bị throttle)", () => {
  it("một tick nhảy 10 phút vẫn chuyển finished đúng như deadline (không phụ thuộc số lần tick)", () => {
    const running = startTimer(timer, T0);
    // Giả lập tab bị ẩn: chỉ một lần tick sau 9 phút.
    const result = tickTimer(running, T0 + 540_000);
    expect(result.justFinished).toBe(true);
    expect(result.timer.status).toBe("finished");
    expect(result.timer.deadline).toBeNull();
  });

  it("chưa hết giờ → không đổi, không báo hoàn tất", () => {
    const running = startTimer(timer, T0);
    const result = tickTimer(running, T0 + 60_000);
    expect(result.justFinished).toBe(false);
    expect(result.timer).toBe(running);
  });

  it("chỉ chuyển finished một lần (gọi lại không báo lại)", () => {
    const running = startTimer(timer, T0);
    const first = tickTimer(running, T0 + 480_000);
    expect(first.justFinished).toBe(true);
    const second = tickTimer(first.timer, T0 + 481_000);
    expect(second.justFinished).toBe(false);
    expect(second.timer).toBe(first.timer);
  });
});

describe("P10 — resetTimer / setTimerDuration / renameTimer", () => {
  it("đặt lại về thời lượng ban đầu ở trạng thái chờ", () => {
    const paused = pauseTimer(startTimer(timer, T0), T0 + 100_000);
    const reset = resetTimer(paused);
    expect(reset.status).toBe("idle");
    expect(reset.pausedRemaining).toBe(480);
    expect(reset.deadline).toBeNull();
  });

  it("đổi thời lượng → đặt lại với giá trị mới (đã kẹp)", () => {
    const changed = setTimerDuration(timer, 90);
    expect(changed.durationSeconds).toBe(90);
    expect(changed.pausedRemaining).toBe(90);
    expect(changed.status).toBe("idle");
  });

  it("đổi tên: bỏ khoảng trắng; rỗng → giữ tên cũ", () => {
    expect(renameTimer(timer, "  Hấp rau  ").label).toBe("Hấp rau");
    expect(renameTimer(timer, "   ").label).toBe("Luộc trứng");
  });
});

describe("P10 — isFinished", () => {
  it("true khi trạng thái finished hoặc hết thời gian", () => {
    expect(isFinished(timer, T0)).toBe(false);
    const running = startTimer(timer, T0);
    expect(isFinished(running, T0 + 480_000)).toBe(true);
  });
});

describe("P10 — formatClock", () => {
  it("định dạng MM:SS và H:MM:SS", () => {
    expect(formatClock(0)).toBe("00:00");
    expect(formatClock(65)).toBe("01:05");
    expect(formatClock(480)).toBe("08:00");
    expect(formatClock(3661)).toBe("1:01:01");
  });

  it("giá trị âm/không hữu hạn → 00:00", () => {
    expect(formatClock(-10)).toBe("00:00");
    expect(formatClock(Number.NaN)).toBe("00:00");
  });
});

describe("P10 — normalizeTimers / parseTimers / serializeTimers", () => {
  it("bỏ bản ghi không hợp lệ và loại trùng id", () => {
    const raw = [
      timer,
      { id: "t1", label: "trùng id" },
      { label: "thiếu id" },
      null,
      42,
      createTimer("Hấp rau", 600, "t2"),
    ];
    const result = normalizeTimers(raw);
    expect(result.map((t) => t.id)).toEqual(["t1", "t2"]);
  });

  it("giới hạn số lượng đồng hồ tối đa", () => {
    const many = Array.from({ length: MAX_TIMERS + 5 }, (_, i) =>
      createTimer(`t${i}`, 60, `id${i}`),
    );
    expect(normalizeTimers(many)).toHaveLength(MAX_TIMERS);
  });

  it("đầu vào không phải mảng → mảng rỗng", () => {
    expect(normalizeTimers("x")).toEqual([]);
    expect(normalizeTimers(undefined)).toEqual([]);
  });

  it("JSON hỏng hoặc version khác → mảng rỗng", () => {
    expect(parseTimers("not-json")).toEqual([]);
    expect(parseTimers(JSON.stringify({ v: 999, timers: [timer] }))).toEqual([]);
    expect(parseTimers(null)).toEqual([]);
  });

  it("round-trip serialize/parse giữ nguyên dữ liệu", () => {
    const list = [timer, startTimer(createTimer("Hấp rau", 600, "t2"), T0)];
    expect(parseTimers(serializeTimers(list))).toEqual(list);
  });
});

describe("P10 — localStorage (jsdom)", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("lưu và khôi phục danh sách đồng hồ", () => {
    const list = [createTimer("Luộc trứng", 480, "t1")];
    saveTimers(list);
    expect(window.localStorage.getItem(TIMER_STORAGE_KEY)).toContain("Luộc trứng");
    expect(loadTimers()).toEqual(list);
  });

  it("khôi phục đồng hồ đang chạy với deadline còn hiệu lực", () => {
    const running = startTimer(createTimer("Nướng bánh", 1500, "t1"), T0);
    saveTimers([running]);
    const restored: KitchenTimer = loadTimers()[0];
    expect(restored.status).toBe("running");
    expect(restored.deadline).toBe(running.deadline);
  });

  it("chưa có dữ liệu → mảng rỗng", () => {
    expect(loadTimers()).toEqual([]);
  });

  it("clearTimers xoá dữ liệu", () => {
    saveTimers([timer]);
    clearTimers();
    expect(window.localStorage.getItem(TIMER_STORAGE_KEY)).toBeNull();
  });

  it("state version được ghi kèm dữ liệu", () => {
    saveTimers([timer]);
    const raw = JSON.parse(window.localStorage.getItem(TIMER_STORAGE_KEY) ?? "{}");
    expect(raw.v).toBe(TIMER_STATE_VERSION);
  });
});
