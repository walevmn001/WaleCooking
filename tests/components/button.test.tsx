import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Button, buttonVariants } from "@/components/ui/button";
import { IconButton } from "@/components/ui/icon-button";

describe("Button", () => {
  it("render nhãn và mặc định là type=button", () => {
    render(<Button>Lưu</Button>);
    const btn = screen.getByRole("button", { name: "Lưu" });
    expect(btn).toBeInTheDocument();
    expect(btn).toHaveAttribute("type", "button");
  });

  it("gọi onClick khi bấm", () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Bấm</Button>);
    fireEvent.click(screen.getByRole("button"));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("disabled: không phát sự kiện click", () => {
    const onClick = vi.fn();
    render(
      <Button disabled onClick={onClick}>
        Khoá
      </Button>,
    );
    fireEvent.click(screen.getByRole("button"));
    expect(onClick).not.toHaveBeenCalled();
    expect(screen.getByRole("button")).toBeDisabled();
  });

  it("loading: đặt aria-busy và vô hiệu hoá", () => {
    render(<Button loading>Đang lưu</Button>);
    const btn = screen.getByRole("button");
    expect(btn).toHaveAttribute("aria-busy", "true");
    expect(btn).toBeDisabled();
    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  it("buttonVariants tạo class theo variant/size", () => {
    expect(buttonVariants({ variant: "danger", size: "lg" })).toContain("bg-danger");
    expect(buttonVariants({ variant: "primary", size: "sm" })).toContain("h-9");
  });
});

describe("IconButton", () => {
  it("có accessible name từ aria-label", () => {
    render(
      <IconButton aria-label="Đóng">
        <span aria-hidden="true">x</span>
      </IconButton>,
    );
    expect(screen.getByRole("button", { name: "Đóng" })).toBeInTheDocument();
  });
});
