"use client";

import { useId } from "react";
import { cn } from "@/lib/utils/cn";
import { Badge } from "@/components/ui/badge";
import type { RecipeIngredient } from "./types";

export interface IngredientRowProps {
  ingredient: RecipeIngredient;
  /** Cho phép tick nguyên liệu (chế độ đi chợ/nấu). */
  checkable?: boolean;
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  className?: string;
}

/**
 * IngredientRow — một dòng nguyên liệu (`<li>`). Khi `checkable`, checkbox gắn nhãn
 * chính là tên nguyên liệu (đảm bảo accessible name).
 */
export function IngredientRow({
  ingredient,
  checkable = false,
  checked = false,
  onCheckedChange,
  className,
}: IngredientRowProps) {
  const id = useId();

  return (
    <li
      className={cn(
        "flex items-center justify-between gap-3 border-b border-line-subtle py-2.5 last:border-b-0",
        className,
      )}
    >
      <div className="flex min-w-0 items-center gap-3">
        {checkable ? (
          <input
            type="checkbox"
            id={id}
            checked={checked}
            onChange={(e) => onCheckedChange?.(e.target.checked)}
            className="size-5 shrink-0 cursor-pointer rounded-sm accent-primary focus-visible:outline-none focus-visible:focus-ring"
          />
        ) : null}
        <label
          htmlFor={checkable ? id : undefined}
          className={cn(
            "flex flex-col text-body text-ink",
            checkable && "cursor-pointer select-none",
            checked && "text-ink-muted line-through",
          )}
        >
          <span>{ingredient.name}</span>
          {ingredient.note ? (
            <span className="text-body-sm text-ink-muted no-underline">{ingredient.note}</span>
          ) : null}
        </label>
        {ingredient.optional ? (
          <Badge variant="neutral" size="sm">
            Tuỳ chọn
          </Badge>
        ) : null}
      </div>
      {ingredient.amount ? (
        <span className="shrink-0 text-body-sm font-semibold text-ink-muted">
          {ingredient.amount}
        </span>
      ) : null}
    </li>
  );
}

export interface IngredientListProps {
  ingredients: RecipeIngredient[];
  checkable?: boolean;
  /** Tập id đã tick. */
  checkedIds?: string[];
  onCheckedChange?: (id: string, checked: boolean) => void;
  className?: string;
  /** Nhãn cho danh sách (bắt buộc cho a11y). */
  "aria-label"?: string;
}

/**
 * IngredientList — danh sách nguyên liệu dạng `<ul>`.
 */
export function IngredientList({
  ingredients,
  checkable = false,
  checkedIds = [],
  onCheckedChange,
  className,
  "aria-label": ariaLabel = "Nguyên liệu",
}: IngredientListProps) {
  return (
    <ul aria-label={ariaLabel} className={cn("flex flex-col", className)}>
      {ingredients.map((ingredient) => (
        <IngredientRow
          key={ingredient.id}
          ingredient={ingredient}
          checkable={checkable}
          checked={checkedIds.includes(ingredient.id)}
          onCheckedChange={(checked) => onCheckedChange?.(ingredient.id, checked)}
        />
      ))}
    </ul>
  );
}
