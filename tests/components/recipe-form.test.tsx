import { describe, it, expect, vi, beforeEach } from "vitest";
import type { ReactNode } from "react";
import { render, screen, fireEvent } from "@testing-library/react";

const push = vi.fn();
const refresh = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, refresh }),
}));

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
    const { children, href, ...rest } = props;
    return (
      <a href={typeof href === "string" ? href : "#"} {...rest}>
        {children as ReactNode}
      </a>
    );
  },
}));

import { RecipeForm, createDefaultValues, type RecipeFormOption } from "@/components/admin/recipe-form";

const units: RecipeFormOption[] = [{ value: "g", label: "gam (g)" }];
const foodTypes: RecipeFormOption[] = [{ value: "mon-nuoc", label: "Món nước" }];
const cuisines: RecipeFormOption[] = [{ value: "viet-nam", label: "Việt Nam" }];
const allergens: RecipeFormOption[] = [{ value: "gluten", label: "Gluten" }];

beforeEach(() => {
  push.mockClear();
  refresh.mockClear();
  vi.stubGlobal("fetch", vi.fn());
});

describe("P07 — RecipeForm (create)", () => {
  it("hiển thị các nhóm trường và nút lưu ở chế độ tạo", () => {
    render(
      <RecipeForm mode="create" units={units} foodTypes={foodTypes} cuisines={cuisines} allergens={allergens} />,
    );
    expect(screen.getByText("Thông tin chung")).toBeInTheDocument();
    expect(screen.getByText("Nguyên liệu")).toBeInTheDocument();
    expect(screen.getByText("Các bước nấu")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Tạo công thức (bản nháp)" })).toBeInTheDocument();
  });

  it("chặn gửi khi thiếu tên/slug (kiểm tra phía client)", async () => {
    render(
      <RecipeForm mode="create" units={units} foodTypes={foodTypes} cuisines={cuisines} allergens={allergens} />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Tạo công thức (bản nháp)" }));

    expect(await screen.findByText("Vui lòng kiểm tra lại các trường được đánh dấu.")).toBeInTheDocument();
    expect(screen.getByText("Cần có tên công thức.")).toBeInTheDocument();
    expect(screen.getByText("Cần có slug (định danh URL).")).toBeInTheDocument();
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("thêm và xoá dòng nguyên liệu", () => {
    render(
      <RecipeForm mode="create" units={units} foodTypes={foodTypes} cuisines={cuisines} allergens={allergens} />,
    );
    expect(screen.getAllByLabelText(/Tên nguyên liệu/)).toHaveLength(1);

    fireEvent.click(screen.getByRole("button", { name: "Thêm nguyên liệu" }));
    expect(screen.getAllByLabelText(/Tên nguyên liệu/)).toHaveLength(2);

    fireEvent.click(screen.getAllByRole("button", { name: "Xoá" })[0]);
    expect(screen.getAllByLabelText(/Tên nguyên liệu/)).toHaveLength(1);
  });

  it("thêm dòng bước nấu", () => {
    render(
      <RecipeForm mode="create" units={units} foodTypes={foodTypes} cuisines={cuisines} allergens={allergens} />,
    );
    expect(screen.getAllByLabelText(/Nội dung bước/)).toHaveLength(1);
    fireEvent.click(screen.getByRole("button", { name: "Thêm bước" }));
    expect(screen.getAllByLabelText(/Nội dung bước/)).toHaveLength(2);
    expect(screen.getByText("Bước 2")).toBeInTheDocument();
  });

  it("hiện/ẩn khối xem trước", () => {
    render(
      <RecipeForm mode="create" units={units} foodTypes={foodTypes} cuisines={cuisines} allergens={allergens} />,
    );
    expect(screen.queryByText("Xem trước", { selector: "h2" })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Xem trước" }));
    expect(screen.getByText("Xem trước", { selector: "h2" })).toBeInTheDocument();
    expect(screen.getByText("1 nguyên liệu · 1 bước")).toBeInTheDocument();
  });
});

describe("P07 — RecipeForm (edit)", () => {
  it("slug bị vô hiệu hoá và nút lưu là 'Lưu thay đổi'", () => {
    render(
      <RecipeForm
        mode="edit"
        recipeId="r1"
        units={units}
        foodTypes={foodTypes}
        cuisines={cuisines}
        allergens={allergens}
        initialValues={{ ...createDefaultValues(), slug: "pho-bo", title: "Phở bò" }}
      />,
    );
    const slugInput = screen.getByLabelText(/Slug/) as HTMLInputElement;
    expect(slugInput).toBeDisabled();
    expect(slugInput.value).toBe("pho-bo");
    expect(screen.getByRole("button", { name: "Lưu thay đổi" })).toBeInTheDocument();
  });
});
