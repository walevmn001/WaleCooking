import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "@/components/ui/link";
import { FormField, Select } from "@/components/forms";
import type { SelectOption } from "@/components/forms";
import { cn } from "@/lib/utils/cn";

export interface RecipeFilterValues {
  q?: string;
  foodType?: string;
  cuisine?: string;
  difficulty?: string;
  sort?: string;
}

export interface RecipeFiltersProps {
  action?: string;
  values?: RecipeFilterValues;
  foodTypeOptions?: SelectOption[];
  cuisineOptions?: SelectOption[];
  className?: string;
}

const DIFFICULTY_OPTIONS: SelectOption[] = [
  { value: "easy", label: "Dễ" },
  { value: "medium", label: "Trung bình" },
  { value: "hard", label: "Khó" },
];

const SORT_OPTIONS: SelectOption[] = [
  { value: "newest", label: "Mới nhất" },
  { value: "az", label: "Tên A → Z" },
  { value: "popular", label: "Phổ biến" },
];

/**
 * RecipeFilters — bộ lọc công khai dạng `<form method="get">` (hoạt động không cần JS,
 * trạng thái lọc phản ánh vào URL — P02 API contract §0).
 */
export function RecipeFilters({
  action = "/cong-thuc",
  values = {},
  foodTypeOptions = [],
  cuisineOptions = [],
  className,
}: RecipeFiltersProps) {
  return (
    <form
      action={action}
      method="get"
      role="search"
      aria-label="Lọc công thức"
      className={cn("flex flex-col gap-4 rounded-lg border border-line-subtle bg-surface p-4", className)}
    >
      <div className="flex flex-col gap-2">
        <label htmlFor="recipe-search" className="text-label text-ink">
          Tìm kiếm
        </label>
        <div className="relative">
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-muted"
          />
          <input
            id="recipe-search"
            type="search"
            name="q"
            defaultValue={values.q ?? ""}
            placeholder="Tên công thức…"
            className="h-11 w-full rounded-md border border-line-strong bg-surface pl-9 pr-3 text-body text-ink placeholder:text-ink-subtle focus-visible:outline-none focus-visible:focus-ring"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <FormField label="Loại món">
          <Select name="foodType" defaultValue={values.foodType ?? ""} options={foodTypeOptions} placeholder="Tất cả" />
        </FormField>
        <FormField label="Xuất xứ">
          <Select name="cuisine" defaultValue={values.cuisine ?? ""} options={cuisineOptions} placeholder="Tất cả" />
        </FormField>
        <FormField label="Độ khó">
          <Select name="difficulty" defaultValue={values.difficulty ?? ""} options={DIFFICULTY_OPTIONS} placeholder="Tất cả" />
        </FormField>
        <FormField label="Sắp xếp">
          <Select name="sort" defaultValue={values.sort ?? "newest"} options={SORT_OPTIONS} />
        </FormField>
      </div>

      <div className="flex items-center gap-3">
        <Button type="submit" variant="primary" size="md">
          Áp dụng
        </Button>
        <Link href={action} appearance="inline">
          Xoá lọc
        </Link>
      </div>
    </form>
  );
}
