import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ToastProvider, useToast } from "@/components/feedback/toast";

function ToastHarness() {
  const { toast } = useToast();
  return (
    <div>
      <button type="button" onClick={() => toast({ title: "Đã lưu", tone: "success" })}>
        Bắn success
      </button>
      <button
        type="button"
        onClick={() =>
          toast({
            title: "Có lỗi",
            description: "Không lưu được",
            tone: "error",
            action: { label: "Thử lại", onClick: () => {} },
          })
        }
      >
        Bắn error
      </button>
    </div>
  );
}

describe("Toast", () => {
  it("hiển thị toast sau khi gọi và có role=status", () => {
    render(
      <ToastProvider>
        <ToastHarness />
      </ToastProvider>,
    );
    fireEvent.click(screen.getByRole("button", { name: "Bắn success" }));
    expect(screen.getByText("Đã lưu")).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("Đã lưu");
  });

  it("toast lỗi dùng role=alert và có nút hành động", () => {
    render(
      <ToastProvider>
        <ToastHarness />
      </ToastProvider>,
    );
    fireEvent.click(screen.getByRole("button", { name: "Bắn error" }));
    expect(screen.getByRole("alert")).toHaveTextContent("Có lỗi");
    expect(screen.getByRole("button", { name: "Thử lại" })).toBeInTheDocument();
  });

  it("đóng toast bằng nút Đóng thông báo", () => {
    render(
      <ToastProvider>
        <ToastHarness />
      </ToastProvider>,
    );
    fireEvent.click(screen.getByRole("button", { name: "Bắn success" }));
    expect(screen.getByText("Đã lưu")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Đóng thông báo" }));
    expect(screen.queryByText("Đã lưu")).not.toBeInTheDocument();
  });

  it("useToast ném lỗi khi dùng ngoài ToastProvider", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => render(<ToastHarness />)).toThrow(/ToastProvider/);
    spy.mockRestore();
  });
});
