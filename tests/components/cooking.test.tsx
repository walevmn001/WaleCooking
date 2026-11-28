import { describe, it, expect, vi, beforeEach } from "vitest";
import type { ReactNode } from "react";
import { render, screen, fireEvent } from "@testing-library/react";

vi.mock("next/image", () => ({
  default: (props: Record<string, unknown>) => {
    const { src, alt, fill, priority, unoptimized, sizes, ...rest } = props;
    void fill;
    void priority;
    void unoptimized;
    void sizes;
    return <img src={typeof src === "string" ? src : ""} alt={String(alt ?? "")} {...rest} />;
  },
}));

vi.mock("next/link", () => ({
  default: (props: Record<string, unknown>) => {
    const { children, href, prefetch, replace, scroll, ...rest } = props;
    void prefetch;
    void replace;
    void scroll;
    return (
      <a href={typeof href === "string" ? href : "#"} {...rest}>
        {children as ReactNode}
      </a>
    );
  },
}));

import { CookingExperience } from "@/components/cooking/cooking-experience";
import { CookingProgress } from "@/components/cooking/cooking-progress";
import { IngredientChecklist } from "@/components/cooking/ingredient-checklist";
import { PortionSelector } from "@/components/cooking/portion-selector";
import type { RecipeIngredient, RecipeStep } from "@/components/recipe/types";

const ingredients: RecipeIngredient[] = [
  {
    id: "i1",
    name: "Bột mì",
    amount: "200 g",
    quantityData: { type: "decimal", numeric: "200", numericMax: null, text: null, unit: "g" },
  },
  {
    id: "i2",
    name: "Muối",
    amount: "vừa đủ",
    quantityData: { type: "text", numeric: null, numericMax: null, text: "vừa đủ", unit: null },
  },
];

const steps: RecipeStep[] = [
  { id: "s1", order: 1, instruction: "Trộn bột với nước." },
  { id: "s2", order: 2, instruction: "Nhào bột cho mịn." },
];

describe("P09 — CookingProgress", () => {
  it("hiển thị số bước và thuộc tính ARIA của thanh tiến độ", () => {
    render(<CookingProgress current={2} total={4} />);
    expect(screen.getByText("Bước 2/4")).toBeInTheDocument();
    const bar = screen.getByRole("progressbar");
    expect(bar).toHaveAttribute("aria-valuenow", "2");
    expect(bar).toHaveAttribute("aria-valuemax", "4");
  });

  it("kẹp giá trị ngoài khoảng", () => {
    render(<CookingProgress current={9} total={3} />);
    expect(screen.getByText("Bước 3/3")).toBeInTheDocument();
  });
});

describe("P09 — PortionSelector", () => {
  it("nút tăng/giảm gọi onChange với giá trị kẹp", () => {
    const onChange = vi.fn();
    render(<PortionSelector baseServings={2} servings={2} onChange={onChange} />);
    fireEvent.click(screen.getByRole("button", { name: "Tăng khẩu phần" }));
    expect(onChange).toHaveBeenCalledWith(3);
    fireEvent.click(screen.getByRole("button", { name: "Giảm khẩu phần" }));
    expect(onChange).toHaveBeenCalledWith(1);
  });

  it("nút khôi phục về khẩu phần gốc", () => {
    const onChange = vi.fn();
    render(<PortionSelector baseServings={2} servings={5} onChange={onChange} />);
    fireEvent.click(screen.getByRole("button", { name: /Khôi phục/ }));
    expect(onChange).toHaveBeenCalledWith(2);
  });

  it("nút khôi phục bị vô hiệu hoá khi đang ở khẩu phần gốc", () => {
    render(<PortionSelector baseServings={2} servings={2} onChange={() => {}} />);
    expect(screen.getByRole("button", { name: /Khôi phục/ })).toBeDisabled();
  });

  it("nhập trực tiếp số hợp lệ → onChange", () => {
    const onChange = vi.fn();
    render(<PortionSelector baseServings={2} servings={2} onChange={onChange} />);
    const input = screen.getByRole("spinbutton");
    fireEvent.change(input, { target: { value: "999" } });
    fireEvent.blur(input);
    expect(onChange).toHaveBeenCalledWith(100); // kẹp trần
  });
});

describe("P09 — IngredientChecklist", () => {
  it("hiển thị tiến độ dạng chữ và gọi onToggle khi tick", () => {
    const onToggle = vi.fn();
    render(
      <IngredientChecklist
        ingredients={ingredients}
        checkedIds={[]}
        onToggle={onToggle}
        onReset={() => {}}
      />,
    );
    expect(screen.getByText(/Đã chuẩn bị/)).toHaveTextContent("0/2");
    fireEvent.click(screen.getByRole("checkbox", { name: /Bột mì/ }));
    expect(onToggle).toHaveBeenCalledWith("i1", true);
  });

  it("nút bỏ đánh dấu bị vô hiệu hoá khi chưa tick gì", () => {
    render(
      <IngredientChecklist
        ingredients={ingredients}
        checkedIds={[]}
        onToggle={() => {}}
        onReset={() => {}}
      />,
    );
    expect(screen.getByRole("button", { name: /Bỏ đánh dấu/ })).toBeDisabled();
  });
});

describe("P09 — CookingExperience (tích hợp)", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  function renderExperience() {
    return render(
      <CookingExperience
        slug="mon-thu"
        title="Món thử"
        baseServings={2}
        ingredients={ingredients}
        steps={steps}
      />,
    );
  }

  it("đổi khẩu phần → định lượng nguyên liệu cập nhật theo tỷ lệ", () => {
    renderExperience();
    expect(screen.getByText("200 g")).toBeInTheDocument();
    const input = screen.getByRole("spinbutton");
    fireEvent.change(input, { target: { value: "4" } });
    fireEvent.blur(input);
    expect(screen.getByText("400 g")).toBeInTheDocument();
  });

  it("mở chế độ nấu và chuyển bước", () => {
    renderExperience();
    fireEvent.click(screen.getByRole("button", { name: /Bắt đầu nấu/ }));
    const dialog = screen.getByRole("dialog", { name: /Chế độ nấu: Món thử/ });
    expect(dialog).toBeInTheDocument();
    expect(screen.getByText("Bước 1/2")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Bước tiếp theo/ }));
    expect(screen.getByText("Bước 2/2")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Hoàn tất/ })).toBeInTheDocument();
  });

  it("đánh dấu nguyên liệu và lưu vào localStorage", () => {
    renderExperience();
    fireEvent.click(screen.getByRole("checkbox", { name: /Bột mì/ }));
    expect(screen.getByText(/Đã chuẩn bị/)).toHaveTextContent("1/2");
    const raw = window.localStorage.getItem("wale_cooking_v1:mon-thu");
    expect(raw).toContain("i1");
  });
});
