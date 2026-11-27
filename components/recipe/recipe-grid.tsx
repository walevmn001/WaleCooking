import { cn } from "@/lib/utils/cn";
import { RecipeCard } from "./recipe-card";
import type { RecipeSummary } from "./types";

export interface RecipeGridProps {
  recipes: RecipeSummary[];
  /** Sinh href tới trang chi tiết cho mỗi công thức. */
  hrefFor: (recipe: RecipeSummary) => string;
  className?: string;
}

/**
 * RecipeGrid — lưới thẻ công thức (grid 1 → 2 → 3 cột theo P03).
 * Component trình bày thuần: nhận dữ liệu đã ánh xạ, không truy cập dữ liệu.
 */
export function RecipeGrid({ recipes, hrefFor, className }: RecipeGridProps) {
  return (
    <ul className={cn("grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3", className)}>
      {recipes.map((recipe, index) => (
        <li key={recipe.id}>
          <RecipeCard recipe={recipe} href={hrefFor(recipe)} priority={index === 0} />
        </li>
      ))}
    </ul>
  );
}
