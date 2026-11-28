"use client";

import { useId, useState, type FormEvent } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/forms/input";
import { MAX_TIMER_SECONDS, MIN_TIMER_SECONDS } from "@/lib/kitchen/timers";
import { cn } from "@/lib/utils/cn";

export interface TimerFormProps {
  /** Tạo đồng hồ mới với tên + thời lượng (giây). */
  onAdd: (label: string, durationSeconds: number) => void;
  /** Vô hiệu hoá khi đã đạt số đồng hồ tối đa. */
  disabled?: boolean;
  className?: string;
}

/**
 * TimerForm — tạo đồng hồ mới (P10.1): tên + phút + giây. Chỉ chặn dữ liệu KHÔNG hợp lệ;
 * không tự gợi ý thời gian nấu cho món nào.
 */
export function TimerForm({ onAdd, disabled = false, className }: TimerFormProps) {
  const labelId = useId();
  const minId = useId();
  const secId = useId();
  const [label, setLabel] = useState("");
  const [minutes, setMinutes] = useState("");
  const [seconds, setSeconds] = useState("");
  const [error, setError] = useState<string | null>(null);

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    const m = minutes.trim() === "" ? 0 : Number(minutes);
    const s = seconds.trim() === "" ? 0 : Number(seconds);
    if (!Number.isFinite(m) || !Number.isFinite(s) || m < 0 || s < 0) {
      setError("Vui lòng nhập số phút và giây hợp lệ (không âm).");
      return;
    }
    const total = Math.round(m * 60 + s);
    if (total < MIN_TIMER_SECONDS) {
      setError("Thời lượng tối thiểu là 1 giây.");
      return;
    }
    if (total > MAX_TIMER_SECONDS) {
      setError("Thời lượng tối đa là 24 giờ.");
      return;
    }
    onAdd(label.trim() || "Đồng hồ", total);
    setLabel("");
    setMinutes("");
    setSeconds("");
    setError(null);
  };

  return (
    <form className={cn("flex flex-col gap-3", className)} onSubmit={onSubmit}>
      <div className="flex flex-col gap-1.5">
        <label htmlFor={labelId} className="text-body-sm font-semibold text-ink">
          Tên đồng hồ
        </label>
        <Input
          id={labelId}
          value={label}
          maxLength={40}
          placeholder="Ví dụ: Luộc trứng, Hấp rau…"
          onChange={(e) => setLabel(e.target.value)}
        />
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1.5">
          <label htmlFor={minId} className="text-body-sm font-semibold text-ink">
            Phút
          </label>
          <Input
            id={minId}
            type="number"
            inputMode="numeric"
            min={0}
            max={1440}
            value={minutes}
            placeholder="0"
            className="w-24"
            onChange={(e) => setMinutes(e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor={secId} className="text-body-sm font-semibold text-ink">
            Giây
          </label>
          <Input
            id={secId}
            type="number"
            inputMode="numeric"
            min={0}
            max={59}
            value={seconds}
            placeholder="0"
            className="w-24"
            onChange={(e) => setSeconds(e.target.value)}
          />
        </div>
        <Button
          type="submit"
          size="lg"
          disabled={disabled}
          leftIcon={<Plus className="size-5" aria-hidden="true" />}
        >
          Thêm đồng hồ
        </Button>
      </div>

      {error ? (
        <p role="alert" className="text-body-sm font-semibold text-danger">
          {error}
        </p>
      ) : null}
    </form>
  );
}
