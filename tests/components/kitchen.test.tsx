import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { ReactNode } from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

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

import {
  IngredientChip,
  IngredientSearch,
  MissingIngredients,
  MultiTimer,
  RecipeMatchCard,
  TimerCard,
  TimerForm,
  UnitConverter,
} from "@/components/kitchen";
import { createTimer, startTimer, TIMER_STORAGE_KEY, type KitchenTimer } from "@/lib/kitchen/timers";
import type { IngredientMatchResult } from "@/lib/kitchen/ingredient-match";

const TIMER: KitchenTimer = createTimer("Luộc trứng", 480, "t1");

const MATCH_RESULT: IngredientMatchResult = {
  candidate: {
    slug: "pho-bo",
    title: "Phở bò",
    imageUrl: null,
    imageAlt: null,
    totalMinutes: 60,
    cookMinutes: 50,
    difficulty: "medium",
    baseServings: 2,
    ingredients: [],
  },
  matched: ["Trứng"],
  missing: ["Hành lá"],
  missingRequired: ["Hành lá"],
  userMatchedCount: 1,
  matchedCount: 1,
  missingCount: 1,
  totalIngredients: 2,
  coverage: 0.5,
  userCoverage: 1,
  completeRequired: false,
};

describe("P10 — TimerForm", () => {
  it("tạo đồng hồ với tổng thời lượng = phút*60 + giây", () => {
    const onAdd = vi.fn();
    render(<TimerForm onAdd={onAdd} />);
    fireEvent.change(screen.getByLabelText("Tên đồng hồ"), { target: { value: "Luộc trứng" } });
    fireEvent.change(screen.getByLabelText("Phút"), { target: { value: "8" } });
    fireEvent.change(screen.getByLabelText("Giây"), { target: { value: "0" } });
    fireEvent.click(screen.getByRole("button", { name: /Thêm đồng hồ/ }));
    expect(onAdd).toHaveBeenCalledWith("Luộc trứng", 480);
  });

  it("chặn thời lượng 0 giây bằng thông báo lỗi", () => {
    const onAdd = vi.fn();
    render(<TimerForm onAdd={onAdd} />);
    fireEvent.click(screen.getByRole("button", { name: /Thêm đồng hồ/ }));
    expect(onAdd).not.toHaveBeenCalled();
    expect(screen.getByRole("alert")).toHaveTextContent(/tối thiểu/i);
  });
});

describe("P10 — TimerCard", () => {
  it("trạng thái chờ: hiển thị thời lượng và nút Bắt đầu", () => {
    const onStart = vi.fn();
    render(
      <TimerCard
        timer={TIMER}
        now={Date.now()}
        onStart={onStart}
        onPause={() => {}}
        onReset={() => {}}
        onDelete={() => {}}
        onRename={() => {}}
      />,
    );
    expect(screen.getByText("08:00")).toBeInTheDocument();
    expect(screen.getByText("Chưa chạy")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Bắt đầu/ }));
    expect(onStart).toHaveBeenCalledWith("t1");
  });

  it("đang chạy: hiển thị nút Tạm dừng và tiến độ qua ARIA", () => {
    const running = startTimer(TIMER, Date.now());
    render(
      <TimerCard
        timer={running}
        now={Date.now()}
        onStart={() => {}}
        onPause={() => {}}
        onReset={() => {}}
        onDelete={() => {}}
        onRename={() => {}}
      />,
    );
    expect(screen.getByText("Đang chạy")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Tạm dừng/ })).toBeInTheDocument();
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuemax", "100");
  });

  it("gọi onDelete và onRename đúng id", () => {
    const onDelete = vi.fn();
    const onRename = vi.fn();
    render(
      <TimerCard
        timer={TIMER}
        now={Date.now()}
        onStart={() => {}}
        onPause={() => {}}
        onReset={() => {}}
        onDelete={onDelete}
        onRename={onRename}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /Xoá đồng hồ Luộc trứng/ }));
    expect(onDelete).toHaveBeenCalledWith("t1");
    fireEvent.click(screen.getByRole("button", { name: "Đổi tên đồng hồ" }));
    const input = screen.getByLabelText("Tên đồng hồ");
    fireEvent.change(input, { target: { value: "Hấp rau" } });
    fireEvent.click(screen.getByRole("button", { name: "Lưu tên đồng hồ" }));
    expect(onRename).toHaveBeenCalledWith("t1", "Hấp rau");
  });
});

describe("P10 — MultiTimer", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("thêm nhiều đồng hồ và chạy đồng thời (độc lập)", () => {
    render(<MultiTimer />);
    const add = (label: string, minutes: string) => {
      fireEvent.change(screen.getByLabelText("Tên đồng hồ"), { target: { value: label } });
      fireEvent.change(screen.getByLabelText("Phút"), { target: { value: minutes } });
      fireEvent.click(screen.getByRole("button", { name: /Thêm đồng hồ/ }));
    };
    add("Luộc trứng", "8");
    add("Hấp rau", "10");

    expect(screen.getByText("Luộc trứng")).toBeInTheDocument();
    expect(screen.getByText("Hấp rau")).toBeInTheDocument();

    const startButtons = screen.getAllByRole("button", { name: /Bắt đầu/ });
    expect(startButtons).toHaveLength(2);
    fireEvent.click(startButtons[0]);
    fireEvent.click(startButtons[1]);
    expect(screen.getAllByText("Đang chạy")).toHaveLength(2);
  });

  it("tạm dừng một đồng hồ không ảnh hưởng đồng hồ còn lại", () => {
    render(<MultiTimer />);
    fireEvent.change(screen.getByLabelText("Tên đồng hồ"), { target: { value: "A" } });
    fireEvent.change(screen.getByLabelText("Phút"), { target: { value: "5" } });
    fireEvent.click(screen.getByRole("button", { name: /Thêm đồng hồ/ }));
    fireEvent.change(screen.getByLabelText("Tên đồng hồ"), { target: { value: "B" } });
    fireEvent.change(screen.getByLabelText("Phút"), { target: { value: "5" } });
    fireEvent.click(screen.getByRole("button", { name: /Thêm đồng hồ/ }));

    const startButtons = screen.getAllByRole("button", { name: /Bắt đầu/ });
    fireEvent.click(startButtons[0]);
    fireEvent.click(startButtons[1]);

    fireEvent.click(screen.getAllByRole("button", { name: /Tạm dừng/ })[0]);
    // Đồng hồ vừa tạm dừng hiển thị nút "Tiếp tục"; đồng hồ còn lại vẫn chạy.
    expect(screen.getByRole("button", { name: /Tiếp tục/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Tạm dừng/ })).toBeInTheDocument();
    expect(screen.getByText("Đang chạy")).toBeInTheDocument();
  });

  it("khôi phục đồng hồ đã lưu khi mount", () => {
    window.localStorage.setItem(
      TIMER_STORAGE_KEY,
      JSON.stringify({ v: 1, timers: [createTimer("Nướng bánh", 1500, "saved")] }),
    );
    render(<MultiTimer />);
    expect(screen.getByText("Nướng bánh")).toBeInTheDocument();
  });

  it("trạng thái rỗng hiển thị gợi ý tạo đồng hồ", () => {
    render(<MultiTimer />);
    expect(screen.getByText(/Chưa có đồng hồ nào/)).toBeInTheDocument();
  });
});

describe("P10 — UnitConverter", () => {
  it("quy đổi trong cùng nhóm (g → kg)", () => {
    render(<UnitConverter />);
    fireEvent.change(screen.getByLabelText("Giá trị"), { target: { value: "1000" } });
    expect(screen.getByText("1 kg")).toBeInTheDocument();
  });

  it("nhập không phải số → báo lỗi", () => {
    render(<UnitConverter />);
    fireEvent.change(screen.getByLabelText("Giá trị"), { target: { value: "abc" } });
    expect(screen.getByText(/nhập một số hợp lệ/i)).toBeInTheDocument();
  });
});

describe("P10 — IngredientChip & MissingIngredients", () => {
  it("IngredientChip gọi onRemove khi bấm nút xoá", () => {
    const onRemove = vi.fn();
    render(<IngredientChip label="Trứng" onRemove={onRemove} />);
    fireEvent.click(screen.getByRole("button", { name: /Xoá nguyên liệu Trứng/ }));
    expect(onRemove).toHaveBeenCalled();
  });

  it("MissingIngredients tách riêng nhóm bắt buộc", () => {
    render(<MissingIngredients missing={["Hành lá", "Nước mắm"]} missingRequired={["Nước mắm"]} />);
    expect(screen.getByText(/Còn thiếu 2 nguyên liệu \(1 bắt buộc\)/)).toBeInTheDocument();
    expect(screen.getByText("Nước mắm · bắt buộc")).toBeInTheDocument();
  });

  it("MissingIngredients khi đủ nguyên liệu hiển thị thông báo tích cực", () => {
    render(<MissingIngredients missing={[]} missingRequired={[]} />);
    expect(screen.getByText(/Đã có đủ mọi nguyên liệu/)).toBeInTheDocument();
  });
});

describe("P10 — RecipeMatchCard", () => {
  it("hiển thị tỷ lệ khớp, nguyên liệu đã có và còn thiếu", () => {
    render(<RecipeMatchCard result={MATCH_RESULT} />);
    expect(screen.getByRole("link", { name: "Phở bò" })).toHaveAttribute("href", "/cong-thuc/pho-bo");
    expect(screen.getByText("Khớp 1/2 · 50%")).toBeInTheDocument();
    expect(screen.getByText("Trứng")).toBeInTheDocument();
    expect(screen.getByText(/Còn thiếu 1 nguyên liệu/)).toBeInTheDocument();
  });
});

describe("P10 — IngredientSearch (tích hợp API)", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("thêm nguyên liệu, gọi API và hiển thị kết quả", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue({ ok: true, json: async () => ({ results: [MATCH_RESULT] }) });
    vi.stubGlobal("fetch", fetchMock);

    render(<IngredientSearch />);
    fireEvent.change(screen.getByLabelText("Thêm nguyên liệu"), { target: { value: "Trứng" } });
    fireEvent.click(screen.getByRole("button", { name: /^Thêm$/ }));
    expect(screen.getByRole("button", { name: /Xoá nguyên liệu Trứng/ })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Tìm công thức/ }));
    await waitFor(() => expect(screen.getByText("Phở bò")).toBeInTheDocument());
    expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining("/api/v1/kitchen/ingredient-match?"));
    expect(screen.getByText(/Tìm thấy 1 công thức/)).toBeInTheDocument();
  });

  it("lỗi mạng → hiển thị trạng thái lỗi", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network")));
    render(<IngredientSearch />);
    fireEvent.change(screen.getByLabelText("Thêm nguyên liệu"), { target: { value: "Trứng" } });
    fireEvent.click(screen.getByRole("button", { name: /^Thêm$/ }));
    fireEvent.click(screen.getByRole("button", { name: /Tìm công thức/ }));
    await waitFor(() => expect(screen.getByRole("alert")).toBeInTheDocument());
  });
});
