import { Link } from "@/components/ui/link";
import { cn } from "@/lib/utils/cn";
import { RecipeImage } from "./recipe-image";
import { CookingTime, DifficultyBadge } from "./recipe-meta";
import type { RecipeSummary } from "./types";

export interface RecipeCardCompactProps {
  recipe: RecipeSummary;
  href: string;
  className?: string;
}

/**
 * RecipeCardCompact — thẻ công thức gọn (ảnh nhỏ bên trái) cho danh sách/tìm kiếm.
 */
export function RecipeCardCompact({ recipe, href, className }: RecipeCardCompactProps) {
  return (
    <Link
      href={href}
      appearance="unstyled"
      className={cn(
        "flex items-center gap-3 rounded-lg p-2 transition-colors duration-fast hover:bg-surface-muted focus-visible:outline-none focus-visible:focus-ring",
        className,
      )}
    >
      <RecipeImage
        src={recipe.imageUrl}
        alt={recipe.imageAlt ?? recipe.title}
        ratio="1/1"
        className="w-20 shrink-0"
        sizes="80px"
      />
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="line-clamp-2 text-body font-semibold text-ink">{recipe.title}</span>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <CookingTime minutes={recipe.cookMinutes ?? recipe.totalMinutes} />
          <DifficultyBadge level={recipe.difficulty} />
        </div>
      </div>
    </Link>
  );
}
