/**
 * Cảnh báo hết giờ cho đồng hồ nhà bếp (P10.1) — tách khỏi UI.
 *
 * Nguyên tắc (bắt buộc theo đề bài):
 * - KHÔNG phát âm thanh khi chưa có tương tác người dùng (trình duyệt chặn autoplay).
 *   AudioContext chỉ được tạo/đánh thức SAU một thao tác người dùng (nút "Bật âm thanh").
 * - KHÔNG xin quyền thông báo ngay khi mở website — chỉ xin khi người dùng chủ động bấm.
 * - Có FALLBACK khi Notification API không khả dụng/chưa cấp quyền: vẫn báo trong trang.
 * - KHÔNG xin quyền microphone/camera hay quyền không liên quan.
 */

export type NotificationPermissionState = "unsupported" | "default" | "granted" | "denied";

/** Notification API có khả dụng không (kiểm tra an toàn cả SSR). */
export function notificationsSupported(): boolean {
  try {
    return typeof window !== "undefined" && "Notification" in window;
  } catch {
    return false;
  }
}

/** Trạng thái quyền thông báo hiện tại (không kích hoạt hộp thoại xin quyền). */
export function getNotificationPermission(): NotificationPermissionState {
  if (!notificationsSupported()) return "unsupported";
  try {
    return Notification.permission as NotificationPermissionState;
  } catch {
    return "unsupported";
  }
}

/**
 * Xin quyền thông báo — CHỈ gọi từ một thao tác người dùng (ví dụ bấm nút).
 * Không tự động gọi khi tải trang.
 */
export async function requestNotificationPermission(): Promise<NotificationPermissionState> {
  if (!notificationsSupported()) return "unsupported";
  try {
    if (Notification.permission === "granted" || Notification.permission === "denied") {
      return Notification.permission as NotificationPermissionState;
    }
    const result = await Notification.requestPermission();
    return result as NotificationPermissionState;
  } catch {
    return "unsupported";
  }
}

/**
 * Gửi thông báo hệ thống nếu đã được cấp quyền.
 * Trả về true nếu đã gửi; false nếu không (để UI dùng fallback trong trang).
 */
export function notifyTimerFinished(label: string, body = "Đã hết thời gian."): boolean {
  if (getNotificationPermission() !== "granted") return false;
  try {
    const notification = new Notification(label, { body, tag: `wale-timer-${label}` });
    // Tự đóng sau 20 giây — tránh tồn đọng thông báo cũ.
    setTimeout(() => {
      try {
        notification.close();
      } catch {
        // bỏ qua
      }
    }, 20_000);
    return true;
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Âm thanh (Web Audio API) — chỉ phát sau tương tác người dùng
// ---------------------------------------------------------------------------

let audioContext: AudioContext | null = null;
let audioUnlocked = false;

type AudioContextCtor = new () => AudioContext;

function getAudioContextCtor(): AudioContextCtor | null {
  try {
    if (typeof window === "undefined") return null;
    const w = window as unknown as Record<string, unknown>;
    const ctor = (w.AudioContext ?? w.webkitAudioContext) as AudioContextCtor | undefined;
    return ctor ?? null;
  } catch {
    return null;
  }
}

/** Âm thanh có khả dụng không (đã từng được "đánh thức" và trình duyệt hỗ trợ). */
export function isAudioUnlocked(): boolean {
  return audioUnlocked;
}

/**
 * "Đánh thức" AudioContext bằng một tương tác người dùng (bấm nút).
 * Trả về true nếu sẵn sàng phát âm thanh.
 */
export async function unlockAudio(): Promise<boolean> {
  const Ctor = getAudioContextCtor();
  if (!Ctor) return false;
  try {
    if (!audioContext) audioContext = new Ctor();
    if (audioContext.state === "suspended") await audioContext.resume();
    audioUnlocked = audioContext.state === "running";
    return audioUnlocked;
  } catch {
    return false;
  }
}

/**
 * Phát tiếng chuông hết giờ. Chỉ thực sự phát nếu AudioContext đã được "đánh thức"
 * qua tương tác người dùng; nếu chưa, trả false để UI dùng fallback (rung/đổi màu).
 */
export function playTimerChime(): boolean {
  if (!audioUnlocked || !audioContext) return false;
  try {
    const ctx = audioContext;
    const now = ctx.currentTime;
    // Ba tiếng "beep" ngắn để dễ nhận biết khi đang ở bếp.
    const beeps = [0, 0.28, 0.56];
    for (const offset of beeps) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = 880;
      gain.gain.setValueAtTime(0.0001, now + offset);
      gain.gain.exponentialRampToValueAtTime(0.25, now + offset + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + offset + 0.2);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + offset);
      osc.stop(now + offset + 0.22);
    }
    return true;
  } catch {
    return false;
  }
}

/** Rung thiết bị (nếu hỗ trợ) như một kênh cảnh báo phụ. Bỏ qua an toàn nếu không có. */
export function vibrateTimer(): void {
  try {
    if (typeof navigator !== "undefined" && typeof navigator.vibrate === "function") {
      navigator.vibrate([200, 100, 200]);
    }
  } catch {
    // bỏ qua
  }
}

/** Giải phóng AudioContext (gọi khi unmount/cần dọn dẹp). */
export function disposeAudio(): void {
  try {
    if (audioContext) {
      void audioContext.close();
    }
  } catch {
    // bỏ qua
  } finally {
    audioContext = null;
    audioUnlocked = false;
  }
}
