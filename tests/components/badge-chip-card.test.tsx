import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Badge } from "@/components/ui/badge";
import { Chip } from "@/components/ui/chip";
import { Card, CardTitle } from "@/components/ui/card";

describe("Badge", () => {
  it("render nội dung và không phải control tương tác", () => {
    render(<Badge variant="success">Thành công</Badge>);
    const badge = screen.getByText("Thành công");
    expect(badge).toBeInTheDocument();
    expect(badge.tagName).toBe("SPAN");
  });

  it("chấp nhận leftIcon (ẩn với screen reader)", () => {
    render(<Badge leftIcon={<span data-testid="icon">i</span>}>Có icon</Badge>);
    expect(screen.getByTestId("icon").parentElement).toHaveAttribute("aria-hidden", "true");
  });
});

describe("Chip", () => {
  it("là button với aria-pressed theo prop selected", () => {
    const { rerender } = render(<Chip selected={false}>Lọc</Chip>);
    expect(screen.getByRole("button", { name: "Lọc" })).toHaveAttribute("aria-pressed", "false");
    rerender(<Chip selected>Lọc</Chip>);
    expect(screen.getByRole("button", { name: "Lọc" })).toHaveAttribute("aria-pressed", "true");
  });

  it("onRemove hiển thị nút xoá có nhãn", () => {
    const onRemove = vi.fn();
    render(
      <Chip onRemove={onRemove} removeLabel="Bỏ lọc">
        Đang chọn
      </Chip>,
    );
    fireEvent.click(screen.getByRole("button", { name: "Bỏ lọc" }));
    expect(onRemove).toHaveBeenCalledTimes(1);
  });
});

describe("Card", () => {
  it("đổi thẻ HTML qua prop `as`", () => {
    render(
      <Card as="article" data-testid="card">
        <CardTitle as="h2">Tiêu đề</CardTitle>
      </Card>,
    );
    expect(screen.getByTestId("card").tagName).toBe("ARTICLE");
    expect(screen.getByRole("heading", { level: 2, name: "Tiêu đề" })).toBeInTheDocument();
  });
});
