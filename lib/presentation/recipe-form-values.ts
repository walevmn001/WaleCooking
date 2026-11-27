import type { IngredientFormRow, RecipeFormValues, StepFormRow } from "@/components/admin/recipe-form";
import type { RecipeDetailDto } from "@/lib/db/repositories/recipe.repository";

/**
 * Ánh xạ DTO chi tiết công thức → giá trị khởi tạo cho `RecipeForm` (P07 §16).
 *
 * Hàm THUẦN, chỉ dùng `import type` → chạy được ở server component mà không kéo
 * bundle client. KHÔNG suy diễn/bịa số liệu: giá trị nào thiếu thì để trống.
 */
export function toRecipeFormValues(detail: RecipeDetailDto): RecipeFormValues {
  const ingredients: IngredientFormRow[] = detail.ingredients.map((ing, index) => ({
    key: `i-${index}`,
    displayName: ing.displayName,
    quantityType: ing.quantityType,
    quantityNumeric: ing.quantityNumeric ?? "",
    quantityNumericMax: ing.quantityNumericMax ?? "",
    quantityText: ing.quantityText ?? "",
    unitCode: ing.unitCode ?? "",
    isRequired: ing.isRequired,
    preparationNote: ing.preparationNote ?? "",
    groupLabel: ing.groupLabel ?? "",
  }));

  const steps: StepFormRow[] = detail.steps.map((step, index) => {
    const timer = step.timers[0];
    return {
      key: `s-${index}`,
      instruction: step.instruction,
      tip: step.tip ?? "",
      durationMinutes:
        timer?.durationSeconds != null && timer.durationSeconds > 0
          ? String(Math.round(timer.durationSeconds / 60))
          : "",
      temperatureC: timer?.temperatureC ?? "",
      temperatureNote: timer?.temperatureNote ?? "",
    };
  });

  return {
    slug: detail.slug,
    title: detail.title,
    summary: detail.summary ?? "",
    description: detail.description ?? "",
    foodTypeSlug: detail.foodTypeSlug ?? "",
    cuisineSlug: detail.cuisineSlug ?? "",
    difficulty: detail.difficulty,
    prepMinutes: detail.prepMinutes != null ? String(detail.prepMinutes) : "",
    cookMinutes: detail.cookMinutes != null ? String(detail.cookMinutes) : "",
    totalMinutes: detail.totalMinutes != null ? String(detail.totalMinutes) : "",
    baseServings: String(detail.baseServings),
    allergenSlugs: detail.allergens.map((allergen) => allergen.slug),
    ingredients,
    steps,
  };
}
