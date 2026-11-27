import { Clock, Timer, Users } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { Badge } from "@/components/ui/badge";
import { formatMinutes, formatServings } from "@/lib/utils/format";
import type { DifficultyLevel } from "./types";

export interface CookingTimeProps {
  /** Tổng thời gian nấu (phút). */
  minutes?: number;
  className?: string;
}

/** CookingTime — hiển thị thời gian nấu với icon + nhãn. */
export function CookingTime({ minutes, className }: CookingTimeProps) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-caption text-ink-muted", className)}>
      <Timer className="size-4 shrink-0" aria-hidden="true" />
      <span className="sr-only">Thời gian nấu: </span>
      <span>{formatMinutes(minutes)}</span>
    </span>
  );
}

export interface PreparationTimeProps {
  minutes?: number;
  className?: string;
}

/** PreparationTime — hiển thị thời gian chuẩn bị. */
export function PreparationTime({ minutes, className }: PreparationTimeProps) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-caption text-ink-muted", className)}>
      <Clock className="size-4 shrink-0" aria-hidden="true" />
      <span className="sr-only">Thời gian chuẩn bị: </span>
      <span>{formatMinutes(minutes)}</span>
    </span>
  );
}

export interface ServingsBadgeProps {
  servings?: number;
  className?: string;
}

/** ServingsBadge — nhãn số khẩu phần. */
export function ServingsBadge({ servings, className }: ServingsBadgeProps) {
  return (
    <Badge variant="neutral" className={className}>
      <Users className="size-3.5 shrink-0" aria-hidden="true" />
      {formatServings(servings)}
    </Badge>
  );
}

const difficultyConfig: Record<DifficultyLevel, { label: string; variant: "success" | "warning" | "danger" }> = {
  easy: { label: "Dễ", variant: "success" },
  medium: { label: "Trung bình", variant: "warning" },
  hard: { label: "Khó", variant: "danger" },
};

export interface DifficultyBadgeProps {
  level?: DifficultyLevel;
  className?: string;
}

/** DifficultyBadge — nhãn độ khó. Luôn kèm chữ (không chỉ màu). */
export function DifficultyBadge({ level, className }: DifficultyBadgeProps) {
  if (!level) return null;
  const config = difficultyConfig[level];
  return (
    <Badge variant={config.variant} className={className}>
      Độ khó: {config.label}
    </Badge>
  );
}
