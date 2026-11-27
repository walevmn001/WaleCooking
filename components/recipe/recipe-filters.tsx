"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { X } from "lucide-react";

import { SearchInput } from "@/components/forms/search-input";
import { Select } from "@/components/forms/select";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";
import {
  buildRecipeListHref,
  type RecipeListParams,
} from "@/lib/presentation/recipe-links";

export interface FilterOption {
  value: string;
  label: string;
}

export interface RecipeFiltersProps {
  foodTypes: FilterOption[];
  cuisines: FilterOption[];
  /** Giá trị lọc hiện tại (từ URL). */
  params: RecipeListParams;
  className?: string;
}

const DIFFICULTY_OPTIONS: FilterOption[] = [
  { value: "easy", label: "Dễ" },
  { value: "medium", label: "Trung bình" },
  { value: "hard", label: "Khó" },
];

const SORT_OPTIONS: FilterOption[] = [
  { value: "newest", label: "Mới nhất" },
  { value: "az", label: "Tên A–Z" },
  { value: "popular", label: "Phổ biến" },
];

/**
 * RecipeFilters — thanh tìm kiếm & lọc cho danh sách công thức (P07 §16).
 *
 * Điều hướng phía client (đẩy truy vấn lên URL) để Server Component tải lại dữ liệu.
 * Mọi thao tác đổi bộ lọc đều đưa về trang 1.
 */
export function RecipeFilters({ foodTypes, cuisines, params, className }: RecipeFiltersProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const [q, setQ] = useState(params.q ?? "");
  const [foodType, setFoodType] = useState(params.foodType ?? "");
  const [cuisine, setCuisine] = useState(params.cuisine ?? "");
  const [difficulty, setDifficulty] = useState(params.difficulty ?? "");
  const [sort, setSort] = useState(params.sort ?? "newest");

  const hasFilters = Boolean(
    params.q || params.foodType || params.cuisine || params.difficulty || (params.sort && params.sort !== "newest"),
  );

  function go(overrides: Partial<RecipeListParams>) {
    const merged: RecipeListParams = {
      q: q.trim() || undefined,
      foodType: foodType || undefined,
      cuisine: cuisine || undefined,
      difficulty: difficulty || undefined,
      sort: sort !== "newest" ? sort : undefined,
      ...overrides,
    };
    startTransition(() => router.push(buildRecipeListHref(merged)));
  }

  function reset() {
    setQ("");
    setFoodType("");
    setCuisine("");
    setDifficulty("");
    setSort("newest");
    startTransition(() => router.push("/cong-thuc"));
  }

  return (
    <section aria-label="Tìm kiếm và lọc công thức" className={cn("flex flex-col gap-4", className)}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <SearchInput
          value={q}
          onValueChange={setQ}
          onSearch={(value) => go({ q: value.trim() || undefined, page: undefined })}
          className="sm:flex-1"
          disabled={pending}
        />
        <Button
          variant="primary"
          onClick={() => go({ q: q.trim() || undefined, page: undefined })}
          loading={pending}
        >
          Tìm
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <label className="flex flex-col gap-1.5">
          <span className="text-label text-ink">Loại món</span>
          <Select
            value={foodType}
            onChange={(e) => {
              const value = e.target.value;
              setFoodType(value);
              go({ foodType: value || undefined, page: undefined });
            }}
            options={[{ value: "", label: "Tất cả" }, ...foodTypes]}
            disabled={pending}
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-label text-ink">Xuất xứ</span>
          <Select
            value={cuisine}
            onChange={(e) => {
              const value = e.target.value;
              setCuisine(value);
              go({ cuisine: value || undefined, page: undefined });
            }}
            options={[{ value: "", label: "Tất cả" }, ...cuisines]}
            disabled={pending}
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-label text-ink">Độ khó</span>
          <Select
            value={difficulty}
            onChange={(e) => {
              const value = e.target.value;
              setDifficulty(value);
              go({ difficulty: value || undefined, page: undefined });
            }}
            options={[{ value: "", label: "Tất cả" }, ...DIFFICULTY_OPTIONS]}
            disabled={pending}
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-label text-ink">Sắp xếp</span>
          <Select
            value={sort}
            onChange={(e) => {
              const value = e.target.value;
              setSort(value);
              go({ sort: value, page: undefined });
            }}
            options={SORT_OPTIONS}
            disabled={pending}
          />
        </label>
      </div>

      {hasFilters ? (
        <div>
          <Button variant="ghost" size="sm" onClick={reset} leftIcon={<X className="size-4" aria-hidden="true" />}>
            Xoá bộ lọc
          </Button>
        </div>
      ) : null}
    </section>
  );
}
