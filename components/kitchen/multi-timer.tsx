"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Bell, BellRing, Volume2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { TimerCard } from "./timer-card";
import { TimerForm } from "./timer-form";
import { cn } from "@/lib/utils/cn";
import {
  MAX_TIMERS,
  createTimer,
  createTimerId,
  loadTimers,
  pauseTimer,
  renameTimer,
  resetTimer,
  saveTimers,
  startTimer,
  tickTimer,
  type KitchenTimer,
} from "@/lib/kitchen/timers";
import {
  getNotificationPermission,
  isAudioUnlocked,
  notifyTimerFinished,
  playTimerChime,
  requestNotificationPermission,
  unlockAudio,
  vibrateTimer,
  type NotificationPermissionState,
} from "@/lib/kitchen/alerts";

interface FinishedAlert {
  id: string;
  label: string;
}

/**
 * MultiTimer — hệ thống nhiều đồng hồ đếm ngược (P10.1).
 *
 * - Thời gian còn lại LUÔN suy ra từ `deadline` (không dựa vào số lần tick) → khi tab bị ẩn
 *   hoặc màn hình khoá, đồng hồ vẫn đúng khi quay lại. `setInterval` chỉ để cập nhật hiển thị.
 * - Trạng thái lưu cục bộ (localStorage, có version) → tải lại trang vẫn khôi phục.
 * - Âm thanh chỉ phát sau khi người dùng bật (tránh autoplay bị chặn). Thông báo hệ thống chỉ
 *   xin quyền khi người dùng bấm. Luôn có cảnh báo TRONG TRANG làm phương án dự phòng.
 */
export function MultiTimer({ className }: { className?: string }) {
  const [timers, setTimers] = useState<KitchenTimer[]>([]);
  const [now, setNow] = useState(() => Date.now());
  const [hydrated, setHydrated] = useState(false);
  const [alerts, setAlerts] = useState<FinishedAlert[]>([]);
  const [audioReady, setAudioReady] = useState(false);
  const [notifPermission, setNotifPermission] = useState<NotificationPermissionState>("default");
  const firedRef = useRef<Set<string>>(new Set());

  // Khôi phục đồng hồ đã lưu sau khi mount (tránh lệch hydration SSR).
  useEffect(() => {
    setTimers(loadTimers());
    setNow(Date.now());
    setAudioReady(isAudioUnlocked());
    setNotifPermission(getNotificationPermission());
    setHydrated(true);
  }, []);

  // Lưu mỗi khi danh sách thay đổi (chỉ sau khi đã hydrate).
  useEffect(() => {
    if (hydrated) saveTimers(timers);
  }, [timers, hydrated]);

  /** Cập nhật đồng hồ + thời điểm hiện tại; chuyển đồng hồ đã hết giờ sang "finished". */
  const refresh = useCallback(() => {
    const current = Date.now();
    setNow(current);
    setTimers((prev) => {
      let changed = false;
      const next = prev.map((t) => {
        const result = tickTimer(t, current);
        if (result.timer !== t) changed = true;
        return result.timer;
      });
      return changed ? next : prev;
    });
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    const interval = window.setInterval(refresh, 500);
    const onVisibility = () => refresh();
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [hydrated, refresh]);

  // Phát cảnh báo ĐÚNG MỘT LẦN cho mỗi đồng hồ vừa hết giờ (banner trong trang là dự phòng).
  useEffect(() => {
    if (!hydrated) return;
    const finished = timers.filter((t) => t.status === "finished" && !t.notified);
    if (finished.length === 0) return;

    const newly = finished.filter((t) => !firedRef.current.has(t.id));
    for (const timer of newly) {
      firedRef.current.add(timer.id);
      playTimerChime();
      notifyTimerFinished(timer.label);
      vibrateTimer();
    }
    if (newly.length > 0) {
      setAlerts((prev) => {
        const existing = new Set(prev.map((a) => a.id));
        const added = newly
          .filter((t) => !existing.has(t.id))
          .map((t) => ({ id: t.id, label: t.label }));
        return added.length > 0 ? [...prev, ...added] : prev;
      });
    }
    setTimers((prev) =>
      prev.map((t) => (t.status === "finished" && !t.notified ? { ...t, notified: true } : t)),
    );
  }, [timers, hydrated]);

  const handleAdd = (label: string, durationSeconds: number) => {
    setTimers((prev) => [...prev, createTimer(label, durationSeconds, createTimerId())]);
  };

  const handleStart = (id: string) => {
    firedRef.current.delete(id);
    setAlerts((prev) => prev.filter((a) => a.id !== id));
    setTimers((prev) =>
      prev.map((t) => {
        if (t.id !== id) return t;
        const base = t.status === "finished" ? resetTimer(t) : t;
        return startTimer(base, Date.now());
      }),
    );
  };

  const handlePause = (id: string) =>
    setTimers((prev) => prev.map((t) => (t.id === id ? pauseTimer(t, Date.now()) : t)));

  const handleReset = (id: string) => {
    firedRef.current.delete(id);
    setAlerts((prev) => prev.filter((a) => a.id !== id));
    setTimers((prev) => prev.map((t) => (t.id === id ? resetTimer(t) : t)));
  };

  const handleDelete = (id: string) => {
    firedRef.current.delete(id);
    setAlerts((prev) => prev.filter((a) => a.id !== id));
    setTimers((prev) => prev.filter((t) => t.id !== id));
  };

  const handleRename = (id: string, label: string) =>
    setTimers((prev) => prev.map((t) => (t.id === id ? renameTimer(t, label) : t)));

  const enableAudio = async () => {
    const ok = await unlockAudio();
    setAudioReady(ok);
  };

  const enableNotifications = async () => {
    const result = await requestNotificationPermission();
    setNotifPermission(result);
  };

  const atLimit = timers.length >= MAX_TIMERS;

  return (
    <div className={cn("flex flex-col gap-6", className)}>
      {/* Cảnh báo hết giờ trong trang (dự phòng khi notification/âm thanh không khả dụng) */}
      <div aria-live="assertive" className="flex flex-col gap-2">
        {alerts.map((alert) => (
          <div
            key={alert.id}
            role="status"
            className="flex items-center justify-between gap-3 rounded-lg border border-success bg-chip-success-bg px-4 py-3"
          >
            <p className="flex items-center gap-2 text-body font-semibold text-chip-success-text">
              <BellRing className="size-5 shrink-0" aria-hidden="true" />
              Hết giờ: {alert.label}
            </p>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setAlerts((prev) => prev.filter((a) => a.id !== alert.id))}
              leftIcon={<X className="size-4" aria-hidden="true" />}
            >
              Đóng
            </Button>
          </div>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle as="h2">Thêm đồng hồ mới</CardTitle>
        </CardHeader>
        <CardBody className="flex flex-col gap-4">
          <TimerForm onAdd={handleAdd} disabled={atLimit} />
          {atLimit ? (
            <p className="text-body-sm text-ink-muted">
              Đã đạt tối đa {MAX_TIMERS} đồng hồ. Hãy xoá bớt để thêm mới.
            </p>
          ) : null}

          <div className="flex flex-wrap items-center gap-2 border-t border-line-subtle pt-4">
            <Button
              variant={audioReady ? "ghost" : "outline"}
              size="sm"
              onClick={enableAudio}
              disabled={audioReady}
              leftIcon={<Volume2 className="size-4" aria-hidden="true" />}
            >
              {audioReady ? "Đã bật âm thanh" : "Bật âm thanh"}
            </Button>
            <Button
              variant={notifPermission === "granted" ? "ghost" : "outline"}
              size="sm"
              onClick={enableNotifications}
              disabled={notifPermission === "granted" || notifPermission === "unsupported"}
              leftIcon={<Bell className="size-4" aria-hidden="true" />}
            >
              {notifPermission === "granted"
                ? "Đã bật thông báo"
                : notifPermission === "unsupported"
                  ? "Thiết bị không hỗ trợ thông báo"
                  : "Bật thông báo"}
            </Button>
          </div>
        </CardBody>
      </Card>

      {timers.length === 0 ? (
        <EmptyState
          title="Chưa có đồng hồ nào"
          description="Tạo đồng hồ để theo dõi nhiều bước nấu cùng lúc. Bạn có thể bật âm thanh và thông báo để không bỏ lỡ."
        />
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {timers.map((timer) => (
            <li key={timer.id}>
              <TimerCard
                timer={timer}
                now={now}
                onStart={handleStart}
                onPause={handlePause}
                onReset={handleReset}
                onDelete={handleDelete}
                onRename={handleRename}
                className="h-full"
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
