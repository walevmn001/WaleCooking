import { Card } from "@/components/ui/card";
import { Link } from "@/components/ui/link";
import { cn } from "@/lib/utils/cn";

export interface CategoryTileProps {
  name: string;
  href: string;
  /** Mô tả ngắn (nếu danh mục có). Không bịa mô tả. */
  description?: string | null;
  /** Số công thức công khai thuộc danh mục (nếu biết). */
  recipeCount?: number;
  className?: string;
}

/**
 * CategoryTile — thẻ danh mục dạng văn bản (P08 §P08.3).
 *
 * KHÁC `CategoryCard` (P05, dành cho danh mục CÓ ảnh đại diện), term phân loại hiện
 * chưa có cột ảnh (ADR-P07_1-02) nên dùng thẻ chữ để KHÔNG bịa/minh hoạ sai dữ liệu.
 * Một liên kết bao toàn thẻ (vùng bấm lớn, thân thiện mobile).
 */
export function CategoryTile({
  name,
  href,
  description,
  recipeCount,
  className,
}: CategoryTileProps) {
  return (
    <Card as="article" interactive className={cn("group h-full", className)}>
      <div className="flex h-full flex-col gap-2 p-4 sm:p-5">
        <h3 className="text-h4 text-ink">
          <Link
            href={href}
            appearance="unstyled"
            className="rounded-sm focus-visible:outline-none focus-visible:focus-ring after:absolute after:inset-0 after:content-['']"
          >
            {name}
          </Link>
        </h3>
        {description ? (
          <p className="text-body-sm text-ink-muted">{description}</p>
        ) : null}
        {typeof recipeCount === "number" ? (
          <span className="mt-auto text-caption text-ink-subtle">
            {recipeCount} công thức
          </span>
        ) : null}
      </div>
    </Card>
  );
}
