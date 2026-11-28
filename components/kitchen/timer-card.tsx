"use client";

import { Check, Pause, Pencil, Play, RotateCcw, Trash2 } from "lucide-react";
import { useState } from "react";
import { Badge, type BadgeVariant } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { IconButton } from "@/components/ui/icon-button";
import { Card, CardBody } from "@/components/ui/card";
import { Input } from "@/components/forms/input";
import { cn } from "@/lib/utils/cn";
import {
  formatClock,
  remainingSeconds,
  type KitchenTimer,
  type TimerStatus,
} from "@/lib/kitchen/timers";

const STATUS_LABEL: Record<TimerStatus, string> = {
  idle: "Chưa chạy",
  running: "Đang chạy",
  paused: "Tạm dừng",
  finished: "Hết giờ",
};

const STATUS_VARIANT: Record<TimerStatus, BadgeVariant> = {
  idle: "neutral",
  running: "info",
  paused: "warning",
  finished: "success",
};

export interface TimerCardProps {
  timer: KitchenTimer;
  /** Thời điểm hiện tại (epoch ms) — dùng suy ra thời gian còn lại từ deadline. */
  now: number;
  onStart: (id: string) => void;
  onPause: (id: string) => void;
  onReset: (id: string) => void;
  onDelete: (id: string) => void;
  onRename: (id: string, label: string) => void;
  className?: string;
}

/**
 * TimerCard — một đồng hồ đếm ngược (P10.1). Hiển thị trạng thái bằng CHỮ + màu,
 * nút lớn dễ bấm khi đang ở bếp, hỗ trợ đổi tên/bắt đầu/tạm dừng/đặt lại/xoá.
 */
export function TimerCard({
  timer,
  now,
  onStart,
  onPause,
  onReset,
  onDelete,
  onRename,
  className,
}: TimerCardProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(timer.label);

  const remaining = remainingSeconds(timer, now);
  const elapsedRatio =
    timer.durationSeconds > 0
      ? Math.min(1, Math.max(0, 1 - remaining / timer.durationSeconds))
      : 0;
  const percent = Math.round(elapsedRatio * 100);
  const isFinished = timer.status === "finished";

  const commitRename = () => {
    onRename(timer.id, draft);
    setEditing(false);
  };

  return (
    <Card
      as="article"
      variant={isFinished ? "outline" : "default"}
      className={cn(isFinished && "ring-2 ring-success", className)}
      aria-live="off"
    >
      <CardBody className="flex flex-col gap-3">
        <div className="flex items-start justify-between gap-2">
          {editing ? (
            <div className="flex min-w-0 flex-1 items-center gap-2">
              <label htmlFor={`timer-label-${timer.id}`} className="sr-only">
                Tên đồng hồ
              </label>
              <Input
                id={`timer-label-${timer.id}`}
                size="sm"
                value={draft}
                maxLength={40}
                autoFocus
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") commitRename();
                  if (e.key === "Escape") {
                    setDraft(timer.label);
                    setEditing(false);
                  }
                }}
              />
              <IconButton size="sm" aria-label="Lưu tên đồng hồ" onClick={commitRename}>
                <Check className="size-4" aria-hidden="true" />
              </IconButton>
            </div>
          ) : (
            <div className="flex min-w-0 flex-1 items-center gap-1.5">
              <h3 className="truncate text-h4 text-ink">{timer.label}</h3>
              <IconButton
                size="sm"
                variant="ghost"
                aria-label="Đổi tên đồng hồ"
                onClick={() => {
                  setDraft(timer.label);
                  setEditing(true);
                }}
              >
                <Pencil className="size-4" aria-hidden="true" />
              </IconButton>
            </div>
          )}
          <Badge variant={STATUS_VARIANT[timer.status]} size="md">
            {STATUS_LABEL[timer.status]}
          </Badge>
        </div>

        <p
          className="font-heading text-4xl font-bold tabular-nums text-ink sm:text-5xl"
          aria-label={`Thời gian còn lại ${formatClock(remaining)}`}
        >
          {formatClock(remaining)}
        </p>

        <div
          role="progressbar"
          aria-valuenow={percent}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Tiến độ đồng hồ ${timer.label}`}
          className="h-2 overflow-hidden rounded-pill bg-surface-muted"
        >
          <div
            className={cn(
              "h-full rounded-pill transition-[width] duration-base ease-standard",
              isFinished ? "bg-success" : "bg-primary",
            )}
            style={{ width: `${percent}%` }}
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {timer.status === "running" ? (
            <Button
              variant="outline"
              size="lg"
              onClick={() => onPause(timer.id)}
              leftIcon={<Pause className="size-5" aria-hidden="true" />}
            >
              Tạm dừng
            </Button>
          ) : (
            <Button
              variant="primary"
              size="lg"
              onClick={() => onStart(timer.id)}
              disabled={remaining <= 0 && !isFinished}
              leftIcon={<Play className="size-5" aria-hidden="true" />}
            >
              {timer.status === "paused" ? "Tiếp tục" : isFinished ? "Chạy lại" : "Bắt đầu"}
            </Button>
          )}

          <Button
            variant="ghost"
            size="lg"
            onClick={() => onReset(timer.id)}
            leftIcon={<RotateCcw className="size-5" aria-hidden="true" />}
          >
            Đặt lại
          </Button>

          <IconButton
            size="lg"
            aria-label={`Xoá đồng hồ ${timer.label}`}
            onClick={() => onDelete(timer.id)}
          >
            <Trash2 className="size-5" aria-hidden="true" />
          </IconButton>
        </div>
      </CardBody>
    </Card>
  );
}
