"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Heart } from "lucide-react";

import { toggleFavoriteAction } from "@/app/actions/favorites";
import { Button } from "@/components/ui/button";
import { IconButton } from "@/components/ui/icon-button";
import { cn } from "@/lib/utils/cn";

export interface FavoriteButtonProps {
  /** Slug công thức (định danh lưu trong cookie). */
  slug: string;
  /** Trạng thái ban đầu đọc từ cookie (server). */
  initialFavorite: boolean;
  /** `icon` cho thẻ công thức; `button` (kèm nhãn) cho trang chi tiết. */
  variant?: "icon" | "button";
  className?: string;
}

/**
 * FavoriteButton — nút lưu/bỏ yêu thích (P07.1 §7.1.4, P08 §P08.5).
 *
 * Cookie yêu thích là HttpOnly → thao tác đi qua Server Action. UI cập nhật lạc quan
 * (optimistic) và hoàn tác nếu action thất bại. Không yêu cầu đăng nhập.
 */
export function FavoriteButton({
  slug,
  initialFavorite,
  variant = "icon",
  className,
}: FavoriteButtonProps) {
  const router = useRouter();
  const [favorite, setFavorite] = useState(initialFavorite);
  const [pending, startTransition] = useTransition();

  const label = favorite ? "Bỏ khỏi yêu thích" : "Lưu vào yêu thích";

  function toggle() {
    const next = !favorite;
    setFavorite(next);
    startTransition(async () => {
      try {
        const result = await toggleFavoriteAction(slug, next);
        if (!result.ok) {
          setFavorite(!next);
          return;
        }
        setFavorite(result.items.includes(slug));
        router.refresh();
      } catch {
        setFavorite(!next);
      }
    });
  }

  if (variant === "button") {
    return (
      <Button
        variant={favorite ? "primary" : "outline"}
        loading={pending}
        aria-pressed={favorite}
        onClick={toggle}
        leftIcon={
          <Heart
            className={cn("size-5", favorite && "fill-current")}
            aria-hidden="true"
          />
        }
        className={className}
      >
        {favorite ? "Đã lưu yêu thích" : "Lưu vào yêu thích"}
      </Button>
    );
  }

  return (
    <IconButton
      size="sm"
      variant="ghost"
      aria-pressed={favorite}
      aria-label={label}
      onClick={toggle}
      className={className}
    >
      <Heart
        className={cn(
          "size-5 transition-colors duration-fast",
          favorite ? "fill-pink text-danger" : "text-ink-muted",
        )}
        aria-hidden="true"
      />
    </IconButton>
  );
}
