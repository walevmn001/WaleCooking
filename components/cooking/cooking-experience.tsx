"use client";

import { useEffect, useMemo, useState } from "react";
import { Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CookingExitConfirmation } from "./cooking-exit-confirmation";
import { CookingModeLayout } from "./cooking-mode";
import { IngredientChecklist } from "./ingredient-checklist";
import { PortionSelector } from "./portion-selector";
import { scaleIngredients } from "@/lib/cooking/portion";
import {
  createCookingState,
  loadCookingState,
  saveCookingState,
  type CookingState,
} from "@/lib/cooking/state";
import type { RecipeIngredient, RecipeStep } from "@/components/recipe/types";

export interface CookingExperienceProps {
  slug: string;
  title: string;
  baseServings: number;
  ingredients: RecipeIngredient[];
  steps: RecipeStep[];
}

/**
 * CookingExperience — không gian hỗ trợ nấu ngay trên trang công thức (P09).
 * Gộp: chọn khẩu phần (P09.3) · checklist nguyên liệu (P09.4) · chế độ nấu (P09.2),
 * lưu tiến độ & checklist cục bộ trên thiết bị (localStorage, có version).
 */
export function CookingExperience({
  slug,
  title,
  baseServings,
  ingredients,
  steps,
}: CookingExperienceProps) {
  const validIngredientIds = useMemo(() => ingredients.map((i) => i.id), [ingredients]);

  const [state, setState] = useState<CookingState>(() =>
    createCookingState(slug, baseServings),
  );
  const [hydrated, setHydrated] = useState(false);
  const [modeOpen, setModeOpen] = useState(false);
  const [confirmExit, setConfirmExit] = useState(false);

  // Khôi phục trạng thái đã lưu sau khi mount (tránh lệch hydration SSR).
  useEffect(() => {
    setState(
      loadCookingState(slug, {
        stepCount: steps.length,
        validIngredientIds,
        baseServings,
      }),
    );
    setHydrated(true);
  }, [slug, steps.length, validIngredientIds, baseServings]);

  // Lưu trạng thái mỗi khi đổi (chỉ sau khi đã hydrate).
  useEffect(() => {
    if (hydrated) saveCookingState(state);
  }, [state, hydrated]);

  const scaledIngredients = useMemo(
    () => scaleIngredients(ingredients, baseServings, state.servings),
    [ingredients, baseServings, state.servings],
  );

  const setServings = (servings: number) => setState((s) => ({ ...s, servings }));

  const toggleIngredient = (id: string, checked: boolean) =>
    setState((s) => ({
      ...s,
      checkedIds: checked
        ? Array.from(new Set([...s.checkedIds, id]))
        : s.checkedIds.filter((x) => x !== id),
    }));

  const resetChecklist = () => setState((s) => ({ ...s, checkedIds: [] }));

  const setStepIndex = (index: number) =>
    setState((s) => ({ ...s, stepIndex: index, status: s.status === "idle" ? "active" : s.status }));

  const startCooking = () => {
    setState((s) => ({
      ...s,
      status: "active",
      startedAt: s.startedAt ?? Date.now(),
    }));
    setModeOpen(true);
  };

  const handleConfirmExit = () => {
    setConfirmExit(false);
    setModeOpen(false);
    setState((s) => ({ ...s, status: "completed" }));
  };

  const hasIngredients = ingredients.length > 0;
  const hasSteps = steps.length > 0;
  const canScale = Number.isFinite(baseServings) && baseServings > 0;

  return (
    <div className="flex flex-col gap-5">
      {canScale && hasIngredients ? (
        <PortionSelector
          baseServings={baseServings}
          servings={state.servings}
          onChange={setServings}
        />
      ) : null}

      {hasIngredients ? (
        <IngredientChecklist
          ingredients={scaledIngredients}
          checkedIds={state.checkedIds}
          onToggle={toggleIngredient}
          onReset={resetChecklist}
          label={`Nguyên liệu cần chuẩn bị cho ${title}`}
        />
      ) : (
        <p className="text-body text-ink-muted">Chưa có thông tin nguyên liệu.</p>
      )}

      {hasSteps ? (
        <Button
          size="lg"
          onClick={startCooking}
          leftIcon={<Play className="size-5" aria-hidden="true" />}
          className="self-start"
        >
          Bắt đầu nấu
        </Button>
      ) : (
        <p className="text-body text-ink-muted">Chưa có các bước chế biến.</p>
      )}

      <CookingModeLayout
        open={modeOpen && hasSteps}
        title={title}
        steps={steps}
        currentIndex={state.stepIndex}
        onSelectStep={setStepIndex}
        onRequestExit={() => setConfirmExit(true)}
      />

      <CookingExitConfirmation
        open={confirmExit}
        onConfirm={handleConfirmExit}
        onCancel={() => setConfirmExit(false)}
      />
    </div>
  );
}
