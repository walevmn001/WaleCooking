import Image from "next/image";
import { cn } from "@/lib/utils/cn";

export type RecipeImageRatio = "4/3" | "1/1" | "16/9";

const ratioMap: Record<RecipeImageRatio, string> = {
  "4/3": "aspect-[4/3]",
  "1/1": "aspect-square",
  "16/9": "aspect-video",
};

export interface RecipeImageProps {
  src?: string | null;
  /** Bắt buộc — mô tả ảnh. Nếu ảnh trang trí, dùng `decorative` để alt="". */
  alt: string;
  ratio?: RecipeImageRatio;
  /** Ảnh ưu tiên tải (LCP) — chỉ dùng cho ảnh đầu trang. */
  priority?: boolean;
  sizes?: string;
  className?: string;
}

/**
 * RecipeImage — khung ảnh công thức (mặc định tỉ lệ 4:3 theo P03).
 * Khi thiếu ảnh, hiển thị minh họa mascot từ P04 thay vì ảnh vỡ.
 */
export function RecipeImage({
  src,
  alt,
  ratio = "4/3",
  priority = false,
  sizes = "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 320px",
  className,
}: RecipeImageProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-lg bg-surface-muted",
        ratioMap[ratio],
        className,
      )}
    >
      {src ? (
        <Image
          src={src}
          alt={alt}
          fill
          sizes={sizes}
          priority={priority}
          className="object-cover"
        />
      ) : (
        <div className="flex size-full items-center justify-center p-6">
          <Image
            src="/assets/mascot/mascot-holding-recipe.svg"
            alt=""
            aria-hidden="true"
            width={120}
            height={120}
            unoptimized
            className="size-24 opacity-80"
          />
        </div>
      )}
    </div>
  );
}
