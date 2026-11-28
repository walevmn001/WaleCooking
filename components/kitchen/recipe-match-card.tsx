"use client";

import { Card, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "@/components/ui/link";
import { RecipeImage } from "@/components/recipe/recipe-image";
import { CookingTime, DifficultyBadge, ServingsBadge } from "@/components/recipe/recipe-meta";
import { MissingIngredients } from "./missing-ingredients";
import { cn } from "@/lib/utils/cn";
import type { IngredientMatchResult } from "@/lib/kitchen/ingredient-match";
import type { DifficultyLevel } from "@/components/recipe/types";

export interface RecipeMatchCardProps {
  result: IngredientMatchResult;
  className?: string;
}

/**
 * RecipeMatchCard — công thức gợi ý theo nguyên liệu người dùng đang có (P10.4). Hiển thị
 * rõ nguyên liệu ĐÃ có, CÒN thiếu và tỷ lệ khớp TÍNH TỪ DỮ LIỆU THỰC (không phóng đại).
 */
export function RecipeMatchCard({ result, className }: RecipeMatchCardProps) {
  const { candidate, matched, missing, missingRequired, matchedCount, totalIngredients } = result;
  const coveragePercent = totalIngredients > 0 ? Math.round((matchedCount / totalIngredients) * 100) : 0;

  return (
    <Card as="article" interactive className={cn("flex h-full flex-col overflow-hidden", className)}>
      <RecipeImage
        src={candidate.imageUrl}
        alt={candidate.imageAlt ?? candidate.title}
        ratio="4/3"
      />
      <CardBody className="flex flex-1 flex-col gap-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-h4 text-ink">
            <Link
              href={`/cong-thuc/${candidate.slug}`}
              appearance="unstyled"
              className="rounded-sm focus-visible:outline-none focus-visible:focus-ring after:absolute after:inset-0 after:content-['']"
            >
              {candidate.title}
            </Link>
          </h3>
          <Badge variant={missingRequired.length === 0 ? "success" : "info"} size="sm">
            Khớp {matchedCount}/{totalIngredients} · {coveragePercent}%
          </Badge>
        </div>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <CookingTime minutes={candidate.totalMinutes ?? candidate.cookMinutes ?? undefined} />
          <ServingsBadge servings={candidate.baseServings} />
          <DifficultyBadge level={(candidate.difficulty as DifficultyLevel | null) ?? undefined} />
        </div>

        {matched.length > 0 ? (
          <div className="flex flex-col gap-1.5">
            <p className="text-body-sm font-semibold text-ink">Nguyên liệu bạn đã có:</p>
            <ul className="flex flex-wrap gap-1.5">
              {matched.slice(0, 6).map((name) => (
                <li key={name}>
                  <Badge variant="success" size="sm">
                    {name}
                  </Badge>
                </li>
              ))}
              {matched.length > 6 ? (
                <li>
                  <Badge variant="neutral" size="sm">
                    +{matched.length - 6}
                  </Badge>
                </li>
              ) : null}
            </ul>
          </div>
        ) : null}

        <div className="mt-auto">
          <MissingIngredients missing={missing} missingRequired={missingRequired} />
        </div>
      </CardBody>
    </Card>
  );
}
