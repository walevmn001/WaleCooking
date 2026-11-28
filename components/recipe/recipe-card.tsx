"use client";

import type { ReactNode } from "react";
import { Heart } from "lucide-react";
import { Card, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { IconButton } from "@/components/ui/icon-button";
import { Link } from "@/components/ui/link";
import { cn } from "@/lib/utils/cn";
import { RecipeImage } from "./recipe-image";
import { CookingTime, DifficultyBadge, ServingsBadge } from "./recipe-meta";
import type { RecipeSummary } from "./types";

export interface RecipeCardProps {
  recipe: RecipeSummary;
  /** Đích liên kết tới trang chi tiết. */
  href: string;
  /** Trạng thái đã lưu (cho nút yêu thích). */
  isFavorite?: boolean;
  /** Nếu truyền, hiển thị nút lưu yêu thích (điều khiển từ ngoài). */
  onToggleFavorite?: (recipe: RecipeSummary) => void;
  /**
   * Nút yêu thích do nơi gọi cung cấp (vd `FavoriteButton` dùng Server Action).
   * Ưu tiên hơn `onToggleFavorite` khi cả hai cùng có.
   */
  favoriteSlot?: ReactNode;
  /** Ưu tiên tải ảnh (LCP). */
  priority?: boolean;
  className?: string;
}

/**
 * RecipeCard — thẻ công thức (ảnh 4:3 theo P03). Một liên kết chính bao toàn thẻ
 * (stretched link); nút yêu thích nằm trên lớp phủ và là control thật (`aria-pressed`).
 */
export function RecipeCard({
  recipe,
  href,
  isFavorite = false,
  onToggleFavorite,
  favoriteSlot,
  priority = false,
  className,
}: RecipeCardProps) {
  return (
    <Card as="article" interactive className={cn("group overflow-hidden", className)}>
      <RecipeImage
        src={recipe.imageUrl}
        alt={recipe.imageAlt ?? recipe.title}
        ratio="4/3"
        priority={priority}
      />
      <CardBody className="flex flex-col gap-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-h4 text-ink">
            <Link
              href={href}
              appearance="unstyled"
              className="rounded-sm focus-visible:outline-none focus-visible:focus-ring after:absolute after:inset-0 after:content-['']"
            >
              {recipe.title}
            </Link>
          </h3>
          {favoriteSlot ? (
            <div className="relative z-10 -mr-1">{favoriteSlot}</div>
          ) : onToggleFavorite ? (
            <IconButton
              size="sm"
              variant="ghost"
              aria-pressed={isFavorite}
              aria-label={isFavorite ? "Bỏ khỏi yêu thích" : "Lưu vào yêu thích"}
              onClick={() => onToggleFavorite(recipe)}
              className="relative z-10 -mr-1"
            >
              <Heart
                className={cn(
                  "size-5 transition-colors duration-fast",
                  isFavorite ? "fill-pink text-danger" : "text-ink-muted",
                )}
                aria-hidden="true"
              />
            </IconButton>
          ) : null}
        </div>

        {recipe.description ? (
          <p className="line-clamp-2 text-body-sm text-ink-muted">{recipe.description}</p>
        ) : null}

        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <CookingTime minutes={recipe.cookMinutes ?? recipe.totalMinutes} />
          <ServingsBadge servings={recipe.servings} />
          <DifficultyBadge level={recipe.difficulty} />
        </div>

        {recipe.tags && recipe.tags.length > 0 ? (
          <ul className="flex flex-wrap gap-1.5" aria-label="Thẻ">
            {recipe.tags.slice(0, 3).map((tag) => (
              <li key={tag}>
                <Badge variant="neutral" size="sm">
                  {tag}
                </Badge>
              </li>
            ))}
          </ul>
        ) : null}
      </CardBody>
    </Card>
  );
}
