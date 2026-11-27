import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Tabs } from "@/components/navigation/tabs";

const items = [
  { id: "a", label: "Tab A", content: <p>Nội dung A</p> },
  { id: "b", label: "Tab B", content: <p>Nội dung B</p> },
  { id: "c", label: "Tab C", content: <p>Nội dung C</p> },
];

describe("Tabs", () => {
  it("tab đầu được chọn mặc định và panel tương ứng hiển thị", () => {
    render(<Tabs items={items} aria-label="Nhóm tab" />);
    expect(screen.getByRole("tab", { name: "Tab A" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tabpanel")).toHaveTextContent("Nội dung A");
  });

  it("điều hướng bằng ArrowRight sang tab kế tiếp", () => {
    render(<Tabs items={items} aria-label="Nhóm tab" />);
    fireEvent.keyDown(screen.getByRole("tablist"), { key: "ArrowRight" });
    expect(screen.getByRole("tab", { name: "Tab B" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tabpanel")).toHaveTextContent("Nội dung B");
  });

  it("End chuyển tới tab cuối, Home về tab đầu", () => {
    render(<Tabs items={items} aria-label="Nhóm tab" />);
    fireEvent.keyDown(screen.getByRole("tablist"), { key: "End" });
    expect(screen.getByRole("tab", { name: "Tab C" })).toHaveAttribute("aria-selected", "true");
    fireEvent.keyDown(screen.getByRole("tablist"), { key: "Home" });
    expect(screen.getByRole("tab", { name: "Tab A" })).toHaveAttribute("aria-selected", "true");
  });

  it("tab đang chọn có tabIndex 0, còn lại -1", () => {
    render(<Tabs items={items} aria-label="Nhóm tab" />);
    expect(screen.getByRole("tab", { name: "Tab A" })).toHaveAttribute("tabindex", "0");
    expect(screen.getByRole("tab", { name: "Tab B" })).toHaveAttribute("tabindex", "-1");
  });

  it("aria-controls của tab trỏ tới id panel", () => {
    render(<Tabs items={items} aria-label="Nhóm tab" />);
    const tab = screen.getByRole("tab", { name: "Tab A" });
    const panel = screen.getByRole("tabpanel");
    expect(tab).toHaveAttribute("aria-controls", panel.id);
    expect(panel).toHaveAttribute("aria-labelledby", tab.id);
  });
});
