import { describe, it, expect, vi } from "vitest";
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

import { IngredientList } from "@/components/recipe/ingredient-row";
import { CookingStepCard } from "@/components/recipe/cooking-step-card";
import { DifficultyBadge, ServingsBadge } from "@/components/recipe/recipe-meta";
import { RecipeCard } from "@/components/recipe/recipe-card";
import type { RecipeSummary } from "@/components/recipe/types";

const recipe: RecipeSummary = {
  id: "r1",
  slug: "pho-bo",
  title: "[MOCK] Phở bò",
  cookMinutes: 90,
  servings: 4,
  difficulty: "medium",
};

describe("IngredientList", () => {
  it("chế độ checkable: nhãn checkbox là tên nguyên liệu", () => {
    render(
      <IngredientList
        ingredients={[{ id: "i1", name: "Bánh phở", amount: "400 g" }]}
        checkable
        checkedIds={[]}
        onCheckedChange={() => {}}
      />,
    );
    expect(screen.getByRole("checkbox", { name: /Bánh phở/ })).toBeInTheDocument();
    expect(screen.getByText("400 g")).toBeInTheDocument();
  });
});

describe("CookingStepCard", () => {
  it("nút đánh dấu hoàn thành có aria-pressed và gọi callback", () => {
    const onToggleDone = vi.fn();
    render(
      <ol>
        <CookingStepCard
          step={{ id: "s1", order: 1, instruction: "Đun nước dùng." }}
          done={false}
          onToggleDone={onToggleDone}
        />
      </ol>,
    );
    const btn = screen.getByRole("button", { name: /Đánh dấu bước 1/ });
    expect(btn).toHaveAttribute("aria-pressed", "false");
    fireEvent.click(btn);
    expect(onToggleDone).toHaveBeenCalledWith(true);
  });
});

describe("RecipeCard", () => {
  it("tiêu đề là link tới trang chi tiết", () => {
    render(<RecipeCard recipe={recipe} href="/cong-thuc/pho-bo" />);
    expect(screen.getByRole("link", { name: "[MOCK] Phở bò" })).toHaveAttribute(
      "href",
      "/cong-thuc/pho-bo",
    );
  });

  it("nút yêu thích có aria-pressed đúng và gọi callback", () => {
    const onToggleFavorite = vi.fn();
    render(
      <RecipeCard
        recipe={recipe}
        href="/cong-thuc/pho-bo"
        isFavorite
        onToggleFavorite={onToggleFavorite}
      />,
    );
    const favBtn = screen.getByRole("button", { name: "Bỏ khỏi yêu thích" });
    expect(favBtn).toHaveAttribute("aria-pressed", "true");
    fireEvent.click(favBtn);
    expect(onToggleFavorite).toHaveBeenCalledWith(recipe);
  });
});

describe("recipe meta badges", () => {
  it("DifficultyBadge luôn kèm chữ độ khó", () => {
    render(<DifficultyBadge level="hard" />);
    expect(screen.getByText(/Độ khó: Khó/)).toBeInTheDocument();
  });

  it("ServingsBadge hiển thị số khẩu phần", () => {
    render(<ServingsBadge servings={4} />);
    expect(screen.getByText("4 khẩu phần")).toBeInTheDocument();
  });
});
