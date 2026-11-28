"use client";

import { useState, type FormEvent } from "react";
import { Plus, Search, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Input } from "@/components/forms/input";
import { Spinner } from "@/components/ui/spinner";
import { IngredientChip } from "./ingredient-chip";
import { RecipeMatchCard } from "./recipe-match-card";
import { dedupeIngredients, type IngredientMatchResult } from "@/lib/kitchen/ingredient-match";
import { cn } from "@/lib/utils/cn";

type Status = "idle" | "loading" | "success" | "error";

const MAX_INGREDIENTS = 30;

/**
 * IngredientSearch — tìm công thức theo nguyên liệu người dùng đang có (P10.3/P10.4).
 *
 * - Chuẩn hoá + loại trùng đầu vào; KHÔNG đoán đồng nghĩa, KHÔNG tạo công thức giả.
 * - Gọi API công khai `/api/v1/kitchen/ingredient-match` (tận dụng lớp discovery P08).
 * - Trạng thái rỗng/lỗi/đang tải đều rõ ràng; kết quả kèm nguyên liệu đã có/còn thiếu.
 */
export function IngredientSearch({ className }: { className?: string }) {
  const [input, setInput] = useState("");
  const [ingredients, setIngredients] = useState<string[]>([]);
  const [status, setStatus] = useState<Status>("idle");
  const [results, setResults] = useState<IngredientMatchResult[]>([]);
  const [searched, setSearched] = useState<string[]>([]);

  const addIngredient = () => {
    const next = dedupeIngredients([...ingredients, input]);
    setIngredients(next.slice(0, MAX_INGREDIENTS));
    setInput("");
    resetResults();
  };

  const removeIngredient = (label: string) => {
    setIngredients((prev) => prev.filter((i) => i !== label));
    resetResults();
  };

  const clearAll = () => {
    setIngredients([]);
    resetResults();
  };

  const resetResults = () => {
    setStatus("idle");
    setResults([]);
    setSearched([]);
  };

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    addIngredient();
  };

  const search = async () => {
    if (ingredients.length === 0) return;
    setStatus("loading");
    try {
      const params = new URLSearchParams();
      params.set("q", ingredients.join(","));
      const response = await fetch(`/api/v1/kitchen/ingredient-match?${params.toString()}`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = (await response.json()) as { results?: IngredientMatchResult[] };
      setResults(Array.isArray(data.results) ? data.results : []);
      setSearched(ingredients);
      setStatus("success");
    } catch {
      setStatus("error");
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)}>
      <Card>
        <CardHeader>
          <CardTitle as="h2">Nguyên liệu bạn đang có</CardTitle>
        </CardHeader>
        <CardBody className="flex flex-col gap-4">
          <form className="flex flex-col gap-2 sm:flex-row sm:items-end" onSubmit={onSubmit}>
            <div className="flex flex-1 flex-col gap-1.5">
              <label htmlFor="ingredient-input" className="text-body-sm font-semibold text-ink">
                Thêm nguyên liệu
              </label>
              <Input
                id="ingredient-input"
                value={input}
                maxLength={80}
                placeholder="Ví dụ: Trứng, cà chua, hành lá…"
                onChange={(e) => setInput(e.target.value)}
              />
            </div>
            <Button
              type="submit"
              variant="outline"
              size="lg"
              disabled={input.trim() === "" || ingredients.length >= MAX_INGREDIENTS}
              leftIcon={<Plus className="size-5" aria-hidden="true" />}
            >
              Thêm
            </Button>
          </form>

          {ingredients.length > 0 ? (
            <div className="flex flex-col gap-3">
              <ul className="flex flex-wrap gap-2" aria-label="Nguyên liệu đã thêm">
                {ingredients.map((label) => (
                  <li key={label}>
                    <IngredientChip label={label} onRemove={() => removeIngredient(label)} />
                  </li>
                ))}
              </ul>
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  variant="primary"
                  size="lg"
                  onClick={search}
                  loading={status === "loading"}
                  leftIcon={<Search className="size-5" aria-hidden="true" />}
                >
                  Tìm công thức
                </Button>
                <Button
                  variant="ghost"
                  size="lg"
                  onClick={clearAll}
                  leftIcon={<Trash2 className="size-5" aria-hidden="true" />}
                >
                  Xoá hết
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-body-sm text-ink-muted">
              Thêm vài nguyên liệu để tìm công thức có thể nấu với những gì bạn đang có.
            </p>
          )}
        </CardBody>
      </Card>

      <section aria-live="polite" className="flex flex-col gap-4">
        {status === "loading" ? (
          <div className="flex items-center justify-center gap-3 py-8 text-body text-ink-muted">
            <Spinner size="md" label="Đang tìm công thức" />
            Đang tìm công thức phù hợp…
          </div>
        ) : status === "error" ? (
          <ErrorState
            title="Chưa tìm được công thức"
            description="Rất tiếc, chức năng tìm kiếm đang tạm thời không phản hồi. Vui lòng thử lại sau."
          />
        ) : status === "success" ? (
          results.length === 0 ? (
            <EmptyState
              title="Không tìm thấy công thức phù hợp"
              description="Chưa có công thức nào khớp với nguyên liệu bạn nhập. Hãy thử bỏ bớt điều kiện tìm kiếm hoặc thêm nguyên liệu khác."
            />
          ) : (
            <>
              <p className="text-body-sm text-ink-muted">
                Tìm thấy {results.length} công thức phù hợp với {searched.length} nguyên liệu.
              </p>
              <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {results.map((result) => (
                  <li key={result.candidate.slug}>
                    <RecipeMatchCard result={result} className="h-full" />
                  </li>
                ))}
              </ul>
            </>
          )
        ) : null}
      </section>
    </div>
  );
}
