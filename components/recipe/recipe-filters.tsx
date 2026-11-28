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
  RECIPE_LIST_BASE,
  type RecipeListParams,
} from "@/lib/presentation/recipe-links";

export interface FilterOption {
  value: string;
  label: string;
}

export interface RecipeFiltersProps {
  foodTypes: FilterOption[];
  cuisines: FilterOption[];
  /** Trục khám phá (P08 §P08.2) — tùy chọn, bỏ trống thì ẩn ô lọc tương ứng. */
  mealTypes?: FilterOption[];
  cookingMethods?: FilterOption[];
  /** Đặc điểm món (dietary_preference) — tùy chọn, bỏ trống thì ẩn ô lọc. */
  dietaryPreferences?: FilterOption[];
  /** Giá trị lọc hiện tại (từ URL). */
  params: RecipeListParams;
  /** Đường dẫn cơ sở khi điều hướng (mặc định `/cong-thuc`; trang tìm kiếm dùng `/tim-kiem`). */
  basePath?: string;
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

const MAX_MINUTES_OPTIONS: FilterOption[] = [
  { value: "", label: "Tất cả" },
  { value: "15", label: "≤ 15 phút" },
  { value: "30", label: "≤ 30 phút" },
  { value: "60", label: "≤ 1 giờ" },
  { value: "120", label: "≤ 2 giờ" },
];

/**
 * RecipeFilters — thanh tìm kiếm & lọc cho danh sách công thức (P07 §16).
 *
 * Điều hướng phía client (đẩy truy vấn lên URL) để Server Component tải lại dữ liệu.
 * Mọi thao tác đổi bộ lọc đều đưa về trang 1.
 */
export function RecipeFilters({
  foodTypes,
  cuisines,
  mealTypes,
  cookingMethods,
  dietaryPreferences,
  params,
  basePath = RECIPE_LIST_BASE,
  className,
}: RecipeFiltersProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const [q, setQ] = useState(params.q ?? "");
  const [foodType, setFoodType] = useState(params.foodType ?? "");
  const [cuisine, setCuisine] = useState(params.cuisine ?? "");
  const [mealType, setMealType] = useState(params.mealType ?? "");
  const [cookingMethod, setCookingMethod] = useState(params.cookingMethod ?? "");
  const [dietary, setDietary] = useState(params.dietary ?? "");
  const [maxMinutes, setMaxMinutes] = useState(params.maxMinutes ? String(params.maxMinutes) : "");
  const [difficulty, setDifficulty] = useState(params.difficulty ?? "");
  const [sort, setSort] = useState(params.sort ?? "newest");

  const hasFilters = Boolean(
    params.q ||
      params.foodType ||
      params.cuisine ||
      params.mealType ||
      params.cookingMethod ||
      params.dietary ||
      params.maxMinutes ||
      params.difficulty ||
      (params.sort && params.sort !== "newest"),
  );

  function go(overrides: Partial<RecipeListParams>) {
    const merged: RecipeListParams = {
      q: q.trim() || undefined,
      foodType: foodType || undefined,
      cuisine: cuisine || undefined,
      mealType: mealType || undefined,
      cookingMethod: cookingMethod || undefined,
      dietary: dietary || undefined,
      maxMinutes: maxMinutes ? Number.parseInt(maxMinutes, 10) : undefined,
      difficulty: difficulty || undefined,
      sort: sort !== "newest" ? sort : undefined,
      ...overrides,
    };
    startTransition(() => router.push(buildRecipeListHref(merged, {}, basePath)));
  }

  function reset() {
    setQ("");
    setFoodType("");
    setCuisine("");
    setMealType("");
    setCookingMethod("");
    setDietary("");
    setMaxMinutes("");
    setDifficulty("");
    setSort("newest");
    startTransition(() => router.push(basePath));
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

        {mealTypes && mealTypes.length > 0 ? (
          <label className="flex flex-col gap-1.5">
            <span className="text-label text-ink">Bữa ăn</span>
            <Select
              value={mealType}
              onChange={(e) => {
                const value = e.target.value;
                setMealType(value);
                go({ mealType: value || undefined, page: undefined });
              }}
              options={[{ value: "", label: "Tất cả" }, ...mealTypes]}
              disabled={pending}
            />
          </label>
        ) : null}

        {cookingMethods && cookingMethods.length > 0 ? (
          <label className="flex flex-col gap-1.5">
            <span className="text-label text-ink">Phương pháp</span>
            <Select
              value={cookingMethod}
              onChange={(e) => {
                const value = e.target.value;
                setCookingMethod(value);
                go({ cookingMethod: value || undefined, page: undefined });
              }}
              options={[{ value: "", label: "Tất cả" }, ...cookingMethods]}
              disabled={pending}
            />
          </label>
        ) : null}

        {dietaryPreferences && dietaryPreferences.length > 0 ? (
          <label className="flex flex-col gap-1.5">
            <span className="text-label text-ink">Đặc điểm món</span>
            <Select
              value={dietary}
              onChange={(e) => {
                const value = e.target.value;
                setDietary(value);
                go({ dietary: value || undefined, page: undefined });
              }}
              options={[{ value: "", label: "Tất cả" }, ...dietaryPreferences]}
              disabled={pending}
            />
          </label>
        ) : null}

        <label className="flex flex-col gap-1.5">
          <span className="text-label text-ink">Thời gian nấu</span>
          <Select
            value={maxMinutes}
            onChange={(e) => {
              const value = e.target.value;
              setMaxMinutes(value);
              go({
                maxMinutes: value ? Number.parseInt(value, 10) : undefined,
                page: undefined,
              });
            }}
            options={MAX_MINUTES_OPTIONS}
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
