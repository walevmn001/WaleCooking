import { Card } from "@/components/ui/card";
import { Link } from "@/components/ui/link";
import { RecipeImage } from "./recipe-image";
import { cn } from "@/lib/utils/cn";
import type { RecipeCategory } from "./types";

export interface CategoryCardProps {
  category: RecipeCategory;
  href: string;
  className?: string;
}

/**
 * CategoryCard — thẻ danh mục (ảnh + tên + số công thức). Một liên kết bao toàn thẻ.
 */
export function CategoryCard({ category, href, className }: CategoryCardProps) {
  return (
    <Card as="article" interactive className={cn("group overflow-hidden", className)}>
      <RecipeImage
        src={category.imageUrl}
        alt={category.name}
        ratio="16/9"
        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 280px"
      />
      <div className="flex items-center justify-between gap-2 p-4">
        <h3 className="text-h4 text-ink">
          <Link
            href={href}
            appearance="unstyled"
            className="rounded-sm focus-visible:outline-none focus-visible:focus-ring after:absolute after:inset-0 after:content-['']"
          >
            {category.name}
          </Link>
        </h3>
        {typeof category.recipeCount === "number" ? (
          <span className="shrink-0 text-body-sm text-ink-muted">
            {category.recipeCount} công thức
          </span>
        ) : null}
      </div>
    </Card>
  );
}
