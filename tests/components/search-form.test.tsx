import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

const push = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, refresh: vi.fn() }),
}));

import { SearchForm } from "@/components/forms/search-form";

beforeEach(() => {
  push.mockClear();
});

describe("P15.2 — SearchForm (ô tìm kiếm trang chủ)", () => {
  it("submit từ khoá → điều hướng sang /tim-kiem?q=...", () => {
    render(<SearchForm />);
    fireEvent.change(screen.getByLabelText("Tìm kiếm công thức"), {
      target: { value: "phở bò" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Tìm kiếm" }));
    expect(push).toHaveBeenCalledWith("/tim-kiem?q=ph%E1%BB%9F%20b%C3%B2");
  });

  it("Enter trong ô tìm kiếm cũng kích hoạt điều hướng", () => {
    render(<SearchForm />);
    const input = screen.getByLabelText("Tìm kiếm công thức");
    fireEvent.change(input, { target: { value: "pho" } });
    fireEvent.submit(input.closest("form") as HTMLFormElement);
    expect(push).toHaveBeenCalledWith("/tim-kiem?q=pho");
  });

  it("submit rỗng → về trang /tim-kiem (không có tham số q)", () => {
    render(<SearchForm />);
    fireEvent.click(screen.getByRole("button", { name: "Tìm kiếm" }));
    expect(push).toHaveBeenCalledWith("/tim-kiem");
  });

  it("đổ sẵn giá trị khởi tạo từ URL", () => {
    render(<SearchForm defaultValue="bánh mì" />);
    expect(screen.getByLabelText("Tìm kiếm công thức")).toHaveValue("bánh mì");
  });
});
