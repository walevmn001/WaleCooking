"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import type { RecipeStatus } from "@prisma/client";

export interface RecipeStatusActionsProps {
  recipeId: string;
  status: RecipeStatus;
  canSubmitReview: boolean;
  canPublish: boolean;
  canArchive: boolean;
  canDelete: boolean;
}

interface ApiErrorBody {
  error?: { message?: string; details?: Record<string, string[]> };
}

/**
 * RecipeStatusActions — hành động chuyển trạng thái công thức (P07 §13).
 *
 * Chỉ hiển thị hành động khi actor có quyền tương ứng. Server VẪN kiểm tra quyền lại
 * khi nhận request — đây chỉ là lớp giao diện.
 */
export function RecipeStatusActions({
  recipeId,
  status,
  canSubmitReview,
  canPublish,
  canArchive,
  canDelete,
}: RecipeStatusActionsProps) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function run(action: string, url: string, init: RequestInit, successMessage: string) {
    setBusy(action);
    setError(null);
    setMessage(null);
    try {
      const response = await fetch(url, init);
      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as ApiErrorBody | null;
        setError(body?.error?.message ?? "Thao tác không thành công.");
        return;
      }
      setMessage(successMessage);
      router.refresh();
    } catch {
      setError("Không kết nối được máy chủ. Vui lòng thử lại.");
    } finally {
      setBusy(null);
    }
  }

  const jsonInit = (method: string, body?: unknown): RequestInit => ({
    method,
    headers: { "content-type": "application/json" },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });

  const isPublished = status === "published";
  const isArchived = status === "archived";

  return (
    <div className="flex flex-col gap-3">
      {error ? (
        <p role="alert" className="text-body-sm font-semibold text-danger">
          {error}
        </p>
      ) : null}
      {message ? (
        <p role="status" className="text-body-sm font-semibold text-ink">
          {message}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center gap-2">
        {canSubmitReview && status === "draft" ? (
          <Button
            variant="outline"
            size="sm"
            loading={busy === "submit"}
            onClick={() =>
              run(
                "submit",
                `/api/v1/recipes/${recipeId}/submit-review`,
                jsonInit("POST"),
                "Đã gửi công thức để duyệt.",
              )
            }
          >
            Gửi duyệt
          </Button>
        ) : null}

        {canPublish && !isPublished && !isArchived ? (
          <Button
            variant="primary"
            size="sm"
            loading={busy === "publish"}
            onClick={() =>
              run(
                "publish",
                `/api/v1/recipes/${recipeId}/publish`,
                jsonInit("POST", { reason: "Xuất bản từ trang quản trị" }),
                "Đã xuất bản công thức.",
              )
            }
          >
            Xuất bản
          </Button>
        ) : null}

        {canArchive && !isArchived ? (
          <Button
            variant="outline"
            size="sm"
            loading={busy === "archive"}
            onClick={() =>
              run(
                "archive",
                `/api/v1/recipes/${recipeId}/archive`,
                jsonInit("POST", { reason: "Lưu trữ từ trang quản trị" }),
                "Đã lưu trữ công thức.",
              )
            }
          >
            Lưu trữ
          </Button>
        ) : null}

        {canDelete ? (
          <Button
            variant="danger"
            size="sm"
            loading={busy === "delete"}
            onClick={() =>
              run("delete", `/api/v1/recipes/${recipeId}`, { method: "DELETE" }, "Đã xóa công thức.")
            }
          >
            Xóa
          </Button>
        ) : null}
      </div>
    </div>
  );
}
