"use client";

import { ConfirmDialog } from "@/components/feedback/confirm-dialog";

export interface CookingExitConfirmationProps {
  open: boolean;
  /** Xác nhận kết thúc chế độ nấu. */
  onConfirm: () => void;
  /** Ở lại tiếp tục nấu. */
  onCancel: () => void;
}

/**
 * CookingExitConfirmation — xác nhận trước khi rời chế độ nấu (P09.2).
 * Dựng trên `ConfirmDialog` (P05) để không tạo trùng chức năng.
 */
export function CookingExitConfirmation({
  open,
  onConfirm,
  onCancel,
}: CookingExitConfirmationProps) {
  return (
    <ConfirmDialog
      open={open}
      title="Kết thúc chế độ nấu?"
      description="Tiến độ các bước đã xem được lưu trên thiết bị này. Bạn có thể mở lại và tiếp tục bất cứ lúc nào."
      confirmLabel="Kết thúc"
      cancelLabel="Tiếp tục nấu"
      onConfirm={onConfirm}
      onCancel={onCancel}
    />
  );
}
