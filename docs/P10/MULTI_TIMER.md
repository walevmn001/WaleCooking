# MULTI TIMER — Nhiều đồng hồ đếm ngược (P10.1)

> WALE COOKING · Phase P10 · Ngày: 2026-11-28.
> Logic thuần: [`lib/kitchen/timers.ts`](../../lib/kitchen/timers.ts) · Cảnh báo: [`lib/kitchen/alerts.ts`](../../lib/kitchen/alerts.ts) · UI: [`components/kitchen/multi-timer.tsx`](../../components/kitchen/multi-timer.tsx), [`timer-card.tsx`](../../components/kitchen/timer-card.tsx), [`timer-form.tsx`](../../components/kitchen/timer-form.tsx) · Trang: [`app/(public)/cong-cu/do-ng-ho/page.tsx`](../../app/(public)/cong-cu/do-ng-ho/page.tsx).

## 1. Mục tiêu

Cho phép người dùng chạy **nhiều đồng hồ đếm ngược cùng lúc** trong lúc nấu (ví dụ: luộc trứng,
hấp rau, nướng bánh). Mỗi đồng hồ: tạo, đặt tên, đặt thời lượng, bắt đầu, tạm dừng, tiếp tục,
đặt lại, xoá, và nhận cảnh báo khi hết giờ.

> Các ví dụ thời lượng trong giao diện (8 phút, 10 phút, 25 phút) **chỉ là ví dụ cách dùng**,
> KHÔNG phải khuyến nghị thời gian nấu cố định cho bất kỳ món nào.

## 2. Nguyên tắc thời gian (quan trọng)

Đây là phần quyết định tính đúng đắn khi người dùng đang ở bếp (tab bị ẩn, điện thoại khoá màn hình):

| Nguyên tắc | Cách làm |
| --- | --- |
| Nguồn sự thật là **mốc kết thúc** | Khi chạy, lưu `deadline` (epoch ms). Thời gian còn lại = `ceil((deadline − now) / 1000)`. |
| `setInterval` **chỉ để vẽ lại** | Interval 500ms chỉ kích hoạt re-render; **không** trừ theo số lần tick. |
| Không sai khi trình duyệt throttle | Vì tính từ `deadline`, dù tab ẩn vài phút thì lần tick kế tiếp vẫn ra đúng thời gian còn lại. |
| Tạm dừng "chốt" thời gian | Tạm dừng lưu `pausedRemaining`; tiếp tục đặt `deadline = now + pausedRemaining`. |
| Nghe lại khi quay lại tab | Bắt sự kiện `visibilitychange` → gọi `refresh()` ngay. |

Hệ quả đã có unit test: **một tick nhảy 10 phút** vẫn chuyển đồng hồ sang `finished` đúng như deadline
(xem [TEST_REPORT.md](./TEST_REPORT.md)).

## 3. Mô hình dữ liệu (thuần)

```ts
type TimerStatus = "idle" | "running" | "paused" | "finished";
interface KitchenTimer {
  id: string; label: string; durationSeconds: number;
  deadline: number | null;        // epoch ms khi đang chạy
  pausedRemaining: number;        // giây đã chốt khi chờ/tạm dừng
  status: TimerStatus; notified: boolean;
}
```

- Giới hạn: `MIN_TIMER_SECONDS = 1`, `MAX_TIMER_SECONDS = 24h`, `MAX_TIMERS = 12`.
- Hàm thuần: `createTimer`, `remainingSeconds`, `isFinished`, `startTimer`, `pauseTimer`,
  `resetTimer`, `setTimerDuration`, `renameTimer`, `tickTimer` (→ `{ timer, justFinished }`),
  `formatClock` (`MM:SS` / `H:MM:SS`), `clampDurationSeconds`.

## 4. Lưu trữ cục bộ (khôi phục khi tải lại)

- Key **có version**: `wale_timers_v1` (`TIMER_STORAGE_KEY`), payload `{ v: 1, timers }`.
- `parseTimers`/`normalizeTimers`: JSON hỏng, sai version, bản ghi thiếu `id`, id trùng, số lượng
  vượt giới hạn → **bỏ qua an toàn** (không ném lỗi). Chỉ nhận `deadline` khi trạng thái `running`.
- `loadTimers`/`saveTimers`/`clearTimers`: an toàn SS R (`typeof window === "undefined"`), bọc `try/catch`
  (chế độ riêng tư/hết dung lượng → bỏ qua).
- Nhờ lưu `deadline`, **tải lại trang khi đồng hồ đang chạy**: đồng hồ tiếp tục đếm đúng theo thời gian thực.

## 5. Cảnh báo khi hết giờ

Tách hoàn toàn khỏi UI ở [`lib/kitchen/alerts.ts`](../../lib/kitchen/alerts.ts):

1. **Trong trang (fallback luôn có)**: banner `role="status"` trong vùng `aria-live="assertive"`.
2. **Âm thanh (Web Audio)**: `AudioContext` chỉ được "đánh thức" qua nút **"Bật âm thanh"**
   (tương tác người dùng) → tuân thủ chính sách autoplay. `playTimerChime()` phát 3 tiếng beep ngắn;
   chưa "đánh thức" thì trả `false` và UI dùng fallback. **Không tự phát âm thanh khi tải trang.**
3. **Thông báo hệ thống (Notification API)**: **chỉ xin quyền khi người dùng bấm "Bật thông báo"**.
   `notifyTimerFinished` chỉ gửi khi đã `granted`; hỗ trợ `unsupported`/`denied` → ẩn cảnh báo phù hợp.
4. **Rung thiết bị** (`navigator.vibrate`) nếu có — kênh phụ, bỏ qua an toàn.

Mỗi đồng hồ chỉ cảnh báo **một lần** cho mỗi lần hết giờ (theo dõi `firedRef` + cờ `notified`).

## 6. Quyền riêng tư

- Không xin **microphone/camera** hay bất kỳ quyền không liên quan.
- Không gửi dữ liệu ra ngoài; toàn bộ đồng hồ nằm trong `localStorage` của thiết bị.
- Không yêu cầu đăng nhập/tài khoản.

## 7. Tương tác UI (mobile-first)

- Ô nhập **lớn**, nút `size="lg"`, khoảng cách thao tác thoải mái; lưới `sm:grid-cols-2`.
- Trạng thái hiển thị bằng **CHỮ + màu** (badge `Chưa chạy/Đang chạy/Tạm dừng/Hết giờ`), không chỉ màu.
- Tiến độ qua `role="progressbar"` với `aria-valuenow/min/max`.
- Đồng hồ đang chạy có `aria-live="off"` để tránh đọc liên tục mỗi 500ms.

## 8. Chưa xác minh

Không có trình duyệt/thiết bị thật trong sandbox → chưa kiểm: khoá màn hình điện thoại khi đang chạy,
throttling thực tế của từng trình duyệt, phát âm thanh thực, Notification API thực. Xem `BLOCKERS.md`
(B-P10-01, kế thừa B-P09-02).
