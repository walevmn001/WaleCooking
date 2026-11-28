"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";
import { SearchInput } from "./search-input";
import type { FieldSize } from "./input";

export interface SearchFormProps {
  /** Đích điều hướng khi submit (mặc định trang tìm kiếm công khai). */
  basePath?: string;
  /** Nhãn ẩn cho screen reader. */
  label?: string;
  placeholder?: string;
  /** Giá trị khởi tạo (đổ sẵn từ URL khi mở lại). */
  defaultValue?: string;
  size?: FieldSize;
  className?: string;
}

/**
 * SearchForm — ô tìm kiếm + nút gửi, điều hướng CLIENT sang trang tìm kiếm.
 *
 * Tái sử dụng `SearchInput` và `Button` (P05); CHỈ dựng URL tìm kiếm và điều hướng —
 * KHÔNG tự xây search engine. Submit khi bỏ trống sẽ về trang tìm kiếm không tham số `q`.
 */
export function SearchForm({
  basePath = "/tim-kiem",
  label = "Tìm kiếm công thức",
  placeholder = "Nhập tên món, nguyên liệu…",
  defaultValue,
  size = "lg",
  className,
}: SearchFormProps) {
  const router = useRouter();
  const [value, setValue] = useState(defaultValue ?? "");
  const [pending, startTransition] = useTransition();

  function submit(next: string) {
    const q = next.trim();
    startTransition(() =>
      router.push(q ? `${basePath}?q=${encodeURIComponent(q)}` : basePath),
    );
  }

  return (
    <div className={cn("flex flex-col gap-2 sm:flex-row sm:items-stretch", className)}>
      <SearchInput
        value={value}
        onValueChange={setValue}
        onSearch={submit}
        label={label}
        placeholder={placeholder}
        size={size}
        disabled={pending}
        className="sm:flex-1"
      />
      <Button
        type="button"
        onClick={() => submit(value)}
        disabled={pending}
        size={size === "lg" ? "lg" : "md"}
      >
        Tìm kiếm
      </Button>
    </div>
  );
}
