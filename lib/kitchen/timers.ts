/**
 * Nhiều đồng hồ đếm ngược cho nhà bếp (P10.1) — logic THUẦN, không phụ thuộc React.
 *
 * Nguyên tắc thời gian:
 * - Nguồn sự thật là MỐC KẾT THÚC (`deadline`, epoch ms) khi đồng hồ đang chạy.
 *   `setInterval` chỉ dùng để KÍCH HOẠT render lại — KHÔNG tính thời gian dựa vào số lần tick.
 *   Nhờ vậy khi tab bị ẩn / điện thoại khóa màn hình (trình duyệt throttle), thời gian còn lại
 *   vẫn đúng khi quay lại vì được suy ra từ `deadline - now`.
 * - Trạng thái lưu CỤC BỘ (localStorage, có version) — không DB, không tài khoản.
 * - Hàm thuần ở tệp này; phần đọc/ghi storage + tạo id tách riêng, an toàn khi SSR.
 */

export const TIMER_STATE_VERSION = 1;
export const TIMER_STORAGE_KEY = "wale_timers_v1";

/** Giới hạn thời lượng mỗi đồng hồ (giây): 1 giây → 24 giờ. */
export const MIN_TIMER_SECONDS = 1;
export const MAX_TIMER_SECONDS = 24 * 60 * 60;
/** Số đồng hồ tối đa cùng lúc (tránh lạm dụng storage/không phù hợp giao diện bếp). */
export const MAX_TIMERS = 12;

export type TimerStatus = "idle" | "running" | "paused" | "finished";

export interface KitchenTimer {
  id: string;
  /** Tên đồng hồ do người dùng đặt (ví dụ "Luộc trứng"). */
  label: string;
  /** Tổng thời lượng đặt (giây). */
  durationSeconds: number;
  /** Mốc kết thúc (epoch ms) khi ĐANG CHẠY; null khi không chạy. */
  deadline: number | null;
  /** Thời gian còn lại đã "chốt" khi TẠM DỪNG hoặc CHƯA BẮT ĐẦU (giây). */
  pausedRemaining: number;
  status: TimerStatus;
  /** Đã phát thông báo hết giờ chưa (tránh phát lặp). */
  notified: boolean;
}

/** Kẹp số giây trong giới hạn cho phép; giá trị sai → mặc định tối thiểu. */
export function clampDurationSeconds(seconds: number): number {
  if (!Number.isFinite(seconds)) return MIN_TIMER_SECONDS;
  return Math.min(MAX_TIMER_SECONDS, Math.max(MIN_TIMER_SECONDS, Math.round(seconds)));
}

/** Tạo đồng hồ mới ở trạng thái chờ. */
export function createTimer(
  label: string,
  durationSeconds: number,
  id: string,
): KitchenTimer {
  const duration = clampDurationSeconds(durationSeconds);
  return {
    id,
    label: label.trim() || "Đồng hồ",
    durationSeconds: duration,
    deadline: null,
    pausedRemaining: duration,
    status: "idle",
    notified: false,
  };
}

/**
 * Thời gian còn lại (giây) tại thời điểm `now`.
 * - Đang chạy → suy ra từ `deadline` (nguồn sự thật).
 * - Tạm dừng / chờ → giá trị đã chốt.
 * - Kết thúc → 0.
 */
export function remainingSeconds(timer: KitchenTimer, now: number): number {
  if (timer.status === "running" && timer.deadline != null) {
    return Math.max(0, Math.ceil((timer.deadline - now) / 1000));
  }
  if (timer.status === "finished") return 0;
  return Math.max(0, timer.pausedRemaining);
}

/** Đồng hồ đã hết giờ tại `now` chưa (theo deadline, không theo số lần tick). */
export function isFinished(timer: KitchenTimer, now: number): boolean {
  return timer.status === "finished" || remainingSeconds(timer, now) <= 0;
}

/** Bắt đầu / tiếp tục đồng hồ kể từ `now`. */
export function startTimer(timer: KitchenTimer, now: number): KitchenTimer {
  const remaining = remainingSeconds(timer, now);
  if (remaining <= 0) return { ...timer, status: "finished", deadline: null, pausedRemaining: 0 };
  return {
    ...timer,
    status: "running",
    deadline: now + remaining * 1000,
    pausedRemaining: remaining,
    notified: false,
  };
}

/** Tạm dừng đồng hồ, chốt lại thời gian còn lại tại `now`. */
export function pauseTimer(timer: KitchenTimer, now: number): KitchenTimer {
  if (timer.status !== "running") return timer;
  return { ...timer, status: "paused", deadline: null, pausedRemaining: remainingSeconds(timer, now) };
}

/** Đặt lại về trạng thái chờ (thời lượng ban đầu). */
export function resetTimer(timer: KitchenTimer): KitchenTimer {
  return {
    ...timer,
    status: "idle",
    deadline: null,
    pausedRemaining: timer.durationSeconds,
    notified: false,
  };
}

/** Đổi thời lượng → đặt lại đồng hồ với thời lượng mới. */
export function setTimerDuration(timer: KitchenTimer, seconds: number): KitchenTimer {
  const duration = clampDurationSeconds(seconds);
  return { ...timer, durationSeconds: duration, status: "idle", deadline: null, pausedRemaining: duration, notified: false };
}

/** Đổi tên đồng hồ. */
export function renameTimer(timer: KitchenTimer, label: string): KitchenTimer {
  return { ...timer, label: label.trim() || timer.label };
}

export interface TickResult {
  timer: KitchenTimer;
  /** true nếu vừa chuyển sang trạng thái "finished" ở lần tick này. */
  justFinished: boolean;
}

/**
 * Cập nhật một đồng hồ theo `now`. Nếu đang chạy và đã hết giờ → chuyển sang "finished".
 * KHÔNG phát thông báo ở đây (phần âm thanh/thông báo nằm ở tầng UI).
 */
export function tickTimer(timer: KitchenTimer, now: number): TickResult {
  if (timer.status !== "running") return { timer, justFinished: false };
  if (remainingSeconds(timer, now) > 0) return { timer, justFinished: false };
  return {
    timer: { ...timer, status: "finished", deadline: null, pausedRemaining: 0 },
    justFinished: true,
  };
}

/** Định dạng giây → "MM:SS" (hoặc "H:MM:SS" khi ≥ 1 giờ). */
export function formatClock(totalSeconds: number): string {
  const safe = Number.isFinite(totalSeconds) ? Math.max(0, Math.floor(totalSeconds)) : 0;
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  const seconds = safe % 60;
  const mm = String(minutes).padStart(2, "0");
  const ss = String(seconds).padStart(2, "0");
  return hours > 0 ? `${hours}:${mm}:${ss}` : `${mm}:${ss}`;
}

// ---------------------------------------------------------------------------
// Chuẩn hoá dữ liệu lưu trữ (đọc/ghi localStorage)
// ---------------------------------------------------------------------------

const STATUSES: TimerStatus[] = ["idle", "running", "paused", "finished"];

function coerceTimer(input: unknown): KitchenTimer | null {
  if (typeof input !== "object" || input === null || Array.isArray(input)) return null;
  const row = input as Record<string, unknown>;
  if (typeof row.id !== "string" || row.id.length === 0) return null;

  const duration = clampDurationSeconds(typeof row.durationSeconds === "number" ? row.durationSeconds : NaN);
  const status: TimerStatus =
    typeof row.status === "string" && (STATUSES as string[]).includes(row.status)
      ? (row.status as TimerStatus)
      : "idle";

  const deadline =
    typeof row.deadline === "number" && Number.isFinite(row.deadline) ? row.deadline : null;
  const pausedRemaining =
    typeof row.pausedRemaining === "number" && Number.isFinite(row.pausedRemaining)
      ? Math.min(MAX_TIMER_SECONDS, Math.max(0, Math.round(row.pausedRemaining)))
      : duration;

  return {
    id: row.id,
    label: typeof row.label === "string" && row.label.trim() ? row.label : "Đồng hồ",
    durationSeconds: duration,
    deadline: status === "running" ? deadline : null,
    pausedRemaining,
    status,
    notified: row.notified === true,
  };
}

/** Lọc + loại trùng id + giới hạn số lượng. Bỏ mọi bản ghi không hợp lệ. */
export function normalizeTimers(input: unknown): KitchenTimer[] {
  if (!Array.isArray(input)) return [];
  const seen = new Set<string>();
  const result: KitchenTimer[] = [];
  for (const item of input) {
    const timer = coerceTimer(item);
    if (!timer || seen.has(timer.id)) continue;
    seen.add(timer.id);
    result.push(timer);
    if (result.length >= MAX_TIMERS) break;
  }
  return result;
}

/** Đọc danh sách đồng hồ từ chuỗi JSON; sai/hỏng → mảng rỗng (không ném lỗi). */
export function parseTimers(raw: string | null | undefined): KitchenTimer[] {
  if (raw == null || raw === "") return [];
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return [];
  }
  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) return [];
  const record = parsed as Record<string, unknown>;
  if (record.v !== TIMER_STATE_VERSION) return [];
  return normalizeTimers(record.timers);
}

export function serializeTimers(timers: KitchenTimer[]): string {
  return JSON.stringify({ v: TIMER_STATE_VERSION, timers });
}

/** Tạo id cho đồng hồ (ưu tiên crypto.randomUUID; có fallback). Chỉ gọi ở client. */
export function createTimerId(): string {
  try {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
      return crypto.randomUUID();
    }
  } catch {
    // bỏ qua — dùng fallback bên dưới
  }
  return `t_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

// ---------------------------------------------------------------------------
// Truy cập localStorage (có kiểm tra môi trường — an toàn khi SSR)
// ---------------------------------------------------------------------------

function getStorage(): Storage | null {
  try {
    if (typeof window === "undefined" || !window.localStorage) return null;
    return window.localStorage;
  } catch {
    return null;
  }
}

/** Đọc danh sách đồng hồ đã lưu; trả mảng rỗng nếu không có/không đọc được. */
export function loadTimers(): KitchenTimer[] {
  const storage = getStorage();
  if (!storage) return [];
  let raw: string | null = null;
  try {
    raw = storage.getItem(TIMER_STORAGE_KEY);
  } catch {
    raw = null;
  }
  return parseTimers(raw);
}

/** Ghi danh sách đồng hồ; bỏ qua an toàn nếu không có storage. */
export function saveTimers(timers: KitchenTimer[]): void {
  const storage = getStorage();
  if (!storage) return;
  try {
    storage.setItem(TIMER_STORAGE_KEY, serializeTimers(timers));
  } catch {
    // hết dung lượng / bị chặn → bỏ qua
  }
}

/** Xoá toàn bộ đồng hồ đã lưu. */
export function clearTimers(): void {
  const storage = getStorage();
  if (!storage) return;
  try {
    storage.removeItem(TIMER_STORAGE_KEY);
  } catch {
    // bỏ qua
  }
}
