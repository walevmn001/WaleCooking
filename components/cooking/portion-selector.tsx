"use client";

import { useEffect, useId, useState } from "react";
import { Minus, Plus, RotateCcw, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { IconButton } from "@/components/ui/icon-button";
import { cn } from "@/lib/utils/cn";
import {
  MAX_SERVINGS,
  MIN_SERVINGS,
  clampServings,
  parseServingsInput,
} from "@/lib/cooking/portion";

export interface PortionSelectorProps {
  /** Số khẩu phần gốc của công thức. */
  baseServings: number;
  /** Số khẩu phần đang chọn. */
  servings: number;
  onChange: (servings: number) => void;
  className?: string;
}

/**
 * PortionSelector — điều khiển số khẩu phần (P09.3). Có nút giảm/tăng, ô nhập trực tiếp
 * và nút khôi phục khẩu phần gốc. Không sửa dữ liệu công thức gốc.
 */
export function PortionSelector({
  baseServings,
  servings,
  onChange,
  className,
}: PortionSelectorProps) {
  const inputId = useId();
  const [draft, setDraft] = useState(String(servings));

  // Đồng bộ khi giá trị thay đổi từ nút +/- hoặc khôi phục.
  useEffect(() => {
    setDraft(String(servings));
  }, [servings]);

  const atBase = servings === baseServings;

  const commitDraft = (raw: string) => {
    const parsed = parseServingsInput(raw);
    if (parsed == null) {
      setDraft(String(servings)); // nhập không hợp lệ → trả về giá trị đang dùng
      return;
    }
    const next = clampServings(parsed);
    setDraft(String(next));
    if (next !== servings) onChange(next);
  };

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <span className="text-body-sm font-semibold text-ink">Số khẩu phần</span>
      <div className="flex flex-wrap items-center gap-2">
        <IconButton
          aria-label="Giảm khẩu phần"
          size="md"
          onClick={() => onChange(clampServings(servings - 1))}
          disabled={servings <= MIN_SERVINGS}
        >
          <Minus className="size-4" aria-hidden="true" />
        </IconButton>

        <div className="flex items-center gap-2">
          <label htmlFor={inputId} className="sr-only">
            Số khẩu phần
          </label>
          <input
            id={inputId}
            type="number"
            inputMode="numeric"
            min={MIN_SERVINGS}
            max={MAX_SERVINGS}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={(e) => commitDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") commitDraft((e.target as HTMLInputElement).value);
            }}
            className={cn(
              "h-11 w-20 rounded-md border border-line-strong bg-surface text-center text-body-lg font-semibold text-ink",
              "focus-visible:outline-none focus-visible:focus-ring",
            )}
          />
          <span className="inline-flex items-center gap-1.5 text-body text-ink-muted">
            <Users className="size-4 shrink-0" aria-hidden="true" />
            người
          </span>
        </div>

        <IconButton
          aria-label="Tăng khẩu phần"
          size="md"
          onClick={() => onChange(clampServings(servings + 1))}
          disabled={servings >= MAX_SERVINGS}
        >
          <Plus className="size-4" aria-hidden="true" />
        </IconButton>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => onChange(clampServings(baseServings))}
          disabled={atBase}
          leftIcon={<RotateCcw className="size-4" aria-hidden="true" />}
        >
          Khôi phục
        </Button>
      </div>
      <p className="text-caption text-ink-subtle">
        Công thức gốc cho {baseServings} khẩu phần. Định lượng bên dưới được cập nhật theo số
        khẩu phần bạn chọn.
      </p>
      <span className="sr-only" role="status" aria-live="polite">
        Đang chọn {servings} khẩu phần
      </span>
    </div>
  );
}
