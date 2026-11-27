import { describe, it, expect, vi } from "vitest";
import type { ReactNode } from "react";
import { render, screen } from "@testing-library/react";

vi.mock("next/link", () => ({
  default: (props: Record<string, unknown>) => {
    const { children, href, prefetch, replace, scroll, shallow, passHref, legacyBehavior, ...rest } =
      props;
    void prefetch;
    void replace;
    void scroll;
    void shallow;
    void passHref;
    void legacyBehavior;
    return (
      <a href={typeof href === "string" ? href : "#"} {...rest}>
        {children as ReactNode}
      </a>
    );
  },
}));

import { Breadcrumb } from "@/components/navigation/breadcrumb";
import { Pagination } from "@/components/navigation/pagination";

describe("Breadcrumb", () => {
  it("mục cuối có aria-current=page và không phải link", () => {
    render(
      <Breadcrumb
        items={[{ label: "Trang chủ", href: "/" }, { label: "Công thức", href: "/cong-thuc" }, { label: "Phở bò" }]}
      />,
    );
    const current = screen.getByText("Phở bò");
    expect(current).toHaveAttribute("aria-current", "page");
    expect(current.tagName).toBe("SPAN");
    expect(screen.getByRole("navigation", { name: "Đường dẫn" })).toBeInTheDocument();
  });

  it("trả về null khi không có mục", () => {
    const { container } = render(<Breadcrumb items={[]} />);
    expect(container).toBeEmptyDOMElement();
  });
});

describe("Pagination", () => {
  it("trang hiện tại có aria-current=page", () => {
    render(<Pagination page={2} totalPages={5} hrefFor={(p) => `/list?page=${p}`} />);
    expect(screen.getByRole("link", { name: "Trang 2" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "Trang 3" })).toHaveAttribute("href", "/list?page=3");
  });

  it("ẩn khi chỉ có 1 trang", () => {
    const { container } = render(<Pagination page={1} totalPages={1} hrefFor={(p) => `?p=${p}`} />);
    expect(container).toBeEmptyDOMElement();
  });
});
