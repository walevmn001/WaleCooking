"use client";

import { useState } from "react";
import { Check, Link as LinkIcon, Share2 } from "lucide-react";

import { Button } from "@/components/ui/button";

export interface ShareRecipeButtonProps {
  /** Tiêu đề công thức (dùng cho Web Share API). */
  title: string;
  /** Đường dẫn tương đối; mặc định lấy `window.location.href`. */
  path?: string;
  className?: string;
}

/**
 * ShareRecipeButton — chia sẻ liên kết công thức (P08 §P08.5).
 *
 * Ưu tiên Web Share API (`navigator.share`); nếu không hỗ trợ thì sao chép liên kết
 * vào clipboard. Chỉ dùng API trình duyệt, không gọi dịch vụ ngoài.
 */
export function ShareRecipeButton({ title, path, className }: ShareRecipeButtonProps) {
  const [copied, setCopied] = useState(false);

  async function share() {
    const url = path
      ? new URL(path, window.location.origin).toString()
      : window.location.href;

    if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
      try {
        await navigator.share({ title, url });
        return;
      } catch {
        // Người dùng huỷ hoặc lỗi → thử sao chép.
      }
    }

    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Không sao chép được (thiếu quyền) → không hiển thị phản hồi sai.
    }
  }

  return (
    <Button
      variant="outline"
      onClick={share}
      leftIcon={
        copied ? (
          <Check className="size-5" aria-hidden="true" />
        ) : typeof navigator !== "undefined" && "share" in navigator ? (
          <Share2 className="size-5" aria-hidden="true" />
        ) : (
          <LinkIcon className="size-5" aria-hidden="true" />
        )
      }
      className={className}
    >
      {copied ? "Đã sao chép liên kết" : "Chia sẻ"}
    </Button>
  );
}
