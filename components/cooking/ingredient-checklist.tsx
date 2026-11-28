"use client";

import { RotateCcw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { IngredientList } from "@/components/recipe/ingredient-row";
import type { RecipeIngredient } from "@/components/recipe/types";
import { cn } from "@/lib/utils/cn";
import { checklistProgress } from "@/lib/cooking/state";

export interface IngredientChecklistProps {
  /** Nguyên liệu với định lượng ĐÃ nhân theo khẩu phần hiện tại. */
  ingredients: RecipeIngredient[];
  checkedIds: string[];
  onToggle: (id: string, checked: boolean) => void;
  onReset: () => void;
  /** Nhãn danh sách (a11y). */
  label?: string;
  className?: string;
}

/**
 * IngredientChecklist — checklist nguyên liệu (P09.4). Dùng định lượng sau khi đổi khẩu phần.
 * Tiến độ biểu thị bằng CHỮ + số (không chỉ màu). Người dùng tự đánh dấu — không tự tick.
 */
export function IngredientChecklist({
  ingredients,
  checkedIds,
  onToggle,
  onReset,
  label = "Nguyên liệu cần chuẩn bị",
  className,
}: IngredientChecklistProps) {
  const { done, total } = checklistProgress(
    ingredients.map((i) => i.id),
    checkedIds,
  );
  const allDone = total > 0 && done === total;

  if (total === 0) {
    return (
      <p className={cn("text-body text-ink-muted", className)}>Chưa có thông tin nguyên liệu.</p>
    );
  }

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-body-sm text-ink-muted" role="status" aria-live="polite">
          Đã chuẩn bị{" "}
          <span className="font-semibold text-ink">
            {done}/{total}
          </span>{" "}
          nguyên liệu
        </p>
        <div className="flex items-center gap-2">
          {allDone ? (
            <Badge variant="success" size="sm">
              Đã đủ nguyên liệu
            </Badge>
          ) : null}
          <Button
            variant="ghost"
            size="sm"
            onClick={onReset}
            disabled={done === 0}
            leftIcon={<RotateCcw className="size-4" aria-hidden="true" />}
          >
            Bỏ đánh dấu
          </Button>
        </div>
      </div>

      <IngredientList
        ingredients={ingredients}
        checkable
        checkedIds={checkedIds}
        onCheckedChange={onToggle}
        aria-label={label}
      />
    </div>
  );
}
