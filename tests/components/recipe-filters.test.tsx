import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

const push = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, refresh: vi.fn() }),
}));

import { RecipeFilters, type FilterOption } from "@/components/recipe/recipe-filters";

const foodTypes: FilterOption[] = [{ value: "mon-nuoc", label: "Món nước" }];
const cuisines: FilterOption[] = [{ value: "viet-nam", label: "Việt Nam" }];

beforeEach(() => {
  push.mockClear();
});

describe("P07 — RecipeFilters", () => {
  it("đổi bộ lọc độ khó thì điều hướng URL đã dựng (bỏ giá trị mặc định)", () => {
    render(<RecipeFilters foodTypes={foodTypes} cuisines={cuisines} params={{}} />);
    fireEvent.change(screen.getByLabelText("Độ khó"), { target: { value: "hard" } });
    expect(push).toHaveBeenCalledWith("/cong-thuc?difficulty=hard");
  });

  it("gửi tìm kiếm bằng nút Tìm", () => {
    render(<RecipeFilters foodTypes={foodTypes} cuisines={cuisines} params={{}} />);
    fireEvent.change(screen.getByLabelText("Tìm kiếm"), { target: { value: "pho" } });
    fireEvent.click(screen.getByRole("button", { name: "Tìm" }));
    expect(push).toHaveBeenCalledWith("/cong-thuc?q=pho");
  });

  it("chỉ hiện nút Xoá bộ lọc khi có bộ lọc đang áp dụng", () => {
    const { rerender } = render(<RecipeFilters foodTypes={foodTypes} cuisines={cuisines} params={{}} />);
    expect(screen.queryByRole("button", { name: "Xoá bộ lọc" })).not.toBeInTheDocument();

    rerender(<RecipeFilters foodTypes={foodTypes} cuisines={cuisines} params={{ foodType: "mon-nuoc" }} />);
    const resetBtn = screen.getByRole("button", { name: "Xoá bộ lọc" });
    fireEvent.click(resetBtn);
    expect(push).toHaveBeenCalledWith("/cong-thuc");
  });

  it("chọn loại món và xuất xứ kết hợp đúng tham số", () => {
    render(
      <RecipeFilters foodTypes={foodTypes} cuisines={cuisines} params={{ cuisine: "viet-nam" }} />,
    );
    fireEvent.change(screen.getByLabelText("Loại món"), { target: { value: "mon-nuoc" } });
    expect(push).toHaveBeenCalledWith("/cong-thuc?foodType=mon-nuoc&cuisine=viet-nam");
  });
});
