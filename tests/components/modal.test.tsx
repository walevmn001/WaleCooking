import { describe, it, expect, vi } from "vitest";
import { useState } from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { Modal } from "@/components/feedback/modal";
import { ConfirmDialog } from "@/components/feedback/confirm-dialog";

function ModalHarness({ onClose }: { onClose?: () => void }) {
  const [open, setOpen] = useState(true);
  return (
    <Modal
      open={open}
      onClose={() => {
        setOpen(false);
        onClose?.();
      }}
      title="Hộp thoại"
      description="Mô tả hộp thoại"
      footer={<button type="button">OK</button>}
    >
      <p>Nội dung bên trong</p>
    </Modal>
  );
}

describe("Modal", () => {
  it("render role=dialog với aria-modal và nhãn tiêu đề", () => {
    render(<ModalHarness />);
    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(dialog).toHaveAccessibleName("Hộp thoại");
  });

  it("đóng bằng phím Escape", () => {
    const onClose = vi.fn();
    render(<ModalHarness onClose={onClose} />);
    fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("đóng bằng nút X có nhãn", () => {
    render(<ModalHarness />);
    fireEvent.click(screen.getByRole("button", { name: "Đóng hộp thoại" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});

describe("ConfirmDialog", () => {
  it("gọi onConfirm / onCancel đúng", () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();
    render(
      <ConfirmDialog
        open
        title="Xoá công thức?"
        confirmLabel="Xoá"
        cancelLabel="Huỷ"
        onConfirm={onConfirm}
        onCancel={onCancel}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Xoá" }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole("button", { name: "Huỷ" }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
