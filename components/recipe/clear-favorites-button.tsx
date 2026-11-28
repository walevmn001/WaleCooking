"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";

import { clearFavoritesAction } from "@/app/actions/favorites";
import { Button } from "@/components/ui/button";

export interface ClearFavoritesButtonProps {
  className?: string;
}

/** ClearFavoritesButton — xoá toàn bộ danh sách yêu thích (cookie). P07.1 §7.1.4. */
export function ClearFavoritesButton({ className }: ClearFavoritesButtonProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function clear() {
    startTransition(async () => {
      try {
        await clearFavoritesAction();
        router.refresh();
      } catch {
        // Bỏ qua: cookie sẽ được đọc lại ở lần tải tiếp theo.
      }
    });
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      loading={pending}
      onClick={clear}
      leftIcon={<Trash2 className="size-4" aria-hidden="true" />}
      className={className}
    >
      Xoá tất cả
    </Button>
  );
}
