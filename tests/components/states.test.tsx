import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

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

import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { LoadingState } from "@/components/ui/loading-state";

describe("EmptyState", () => {
  it("hiển thị tiêu đề, mô tả và hành động", () => {
    render(
      <EmptyState
        title="Chưa có dữ liệu"
        description="Thử lại sau."
        action={<button type="button">Tải lại</button>}
      />,
    );
    expect(screen.getByRole("heading", { name: "Chưa có dữ liệu" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Tải lại" })).toBeInTheDocument();
  });
});

describe("ErrorState", () => {
  it("có role=alert để screen reader đọc ngay", () => {
    render(<ErrorState title="Lỗi rồi" description="Không tải được" action={<button>Thử lại</button>} />);
    expect(screen.getByRole("alert")).toHaveTextContent("Lỗi rồi");
  });
});

describe("LoadingState", () => {
  it("có role=status và thông điệp tải", () => {
    render(<LoadingState message="Đang tải dữ liệu" />);
    expect(screen.getByRole("status")).toHaveTextContent("Đang tải dữ liệu");
  });
});
