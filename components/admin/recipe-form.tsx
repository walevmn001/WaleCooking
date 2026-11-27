"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";

import { Checkbox } from "@/components/forms/checkbox";
import { FormField } from "@/components/forms/form-field";
import { Input, Textarea } from "@/components/forms/input";
import { Select } from "@/components/forms/select";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardTitle } from "@/components/ui/card";
import { RecipeImage } from "@/components/recipe/recipe-image";
import { DifficultyBadge, ServingsBadge } from "@/components/recipe/recipe-meta";
import { slugify } from "@/lib/presentation/slug";
import { cn } from "@/lib/utils/cn";

export type QuantityType = "decimal" | "fraction" | "range" | "text";
export type Difficulty = "easy" | "medium" | "hard";

export interface IngredientFormRow {
  key: string;
  displayName: string;
  quantityType: QuantityType;
  quantityNumeric: string;
  quantityNumericMax: string;
  quantityText: string;
  unitCode: string;
  isRequired: boolean;
  preparationNote: string;
  groupLabel: string;
}

export interface StepFormRow {
  key: string;
  instruction: string;
  tip: string;
  durationMinutes: string;
  temperatureC: string;
  temperatureNote: string;
}

export interface RecipeFormValues {
  slug: string;
  title: string;
  summary: string;
  description: string;
  foodTypeSlug: string;
  cuisineSlug: string;
  difficulty: Difficulty;
  prepMinutes: string;
  cookMinutes: string;
  totalMinutes: string;
  baseServings: string;
  allergenSlugs: string[];
  ingredients: IngredientFormRow[];
  steps: StepFormRow[];
}

export interface RecipeFormOption {
  value: string;
  label: string;
}

export interface RecipeFormProps {
  mode: "create" | "edit";
  units: RecipeFormOption[];
  foodTypes: RecipeFormOption[];
  cuisines: RecipeFormOption[];
  allergens: RecipeFormOption[];
  /** Bắt buộc ở chế độ `edit`. */
  recipeId?: string;
  initialValues?: RecipeFormValues;
}

const QUANTITY_TYPE_OPTIONS: RecipeFormOption[] = [
  { value: "decimal", label: "Số (thập phân)" },
  { value: "fraction", label: "Phân số" },
  { value: "range", label: "Khoảng (min–max)" },
  { value: "text", label: "Văn bản (vừa đủ, tùy ý…)" },
];

const DIFFICULTY_OPTIONS: RecipeFormOption[] = [
  { value: "easy", label: "Dễ" },
  { value: "medium", label: "Trung bình" },
  { value: "hard", label: "Khó" },
];

const SERVINGS_REGEX = /^\d{1,4}(\.\d{1,2})?$/;
const QUANTITY_REGEX = /^\d{1,7}(\.\d{1,3})?$/;

function emptyIngredientRow(key: string): IngredientFormRow {
  return {
    key,
    displayName: "",
    quantityType: "decimal",
    quantityNumeric: "",
    quantityNumericMax: "",
    quantityText: "",
    unitCode: "",
    isRequired: true,
    preparationNote: "",
    groupLabel: "",
  };
}

function emptyStepRow(key: string): StepFormRow {
  return {
    key,
    instruction: "",
    tip: "",
    durationMinutes: "",
    temperatureC: "",
    temperatureNote: "",
  };
}

export function createDefaultValues(): RecipeFormValues {
  return {
    slug: "",
    title: "",
    summary: "",
    description: "",
    foodTypeSlug: "",
    cuisineSlug: "",
    difficulty: "easy",
    prepMinutes: "",
    cookMinutes: "",
    totalMinutes: "",
    baseServings: "1",
    allergenSlugs: [],
    ingredients: [emptyIngredientRow("i-0")],
    steps: [emptyStepRow("s-0")],
  };
}

interface ApiErrorBody {
  error?: { code?: string; message?: string; details?: Record<string, string[]> };
}

/**
 * RecipeForm — biểu mẫu tạo/sửa công thức (P07 §16).
 *
 * - Kiểm tra dữ liệu phía client để phản hồi nhanh; SERVER vẫn là nơi kiểm tra cuối cùng.
 * - Gửi JSON tới API (`POST /api/v1/recipes` hoặc `PATCH /api/v1/recipes/{id}`).
 * - Hiển thị lỗi xác thực theo trường do server trả về (`error.details`).
 */
export function RecipeForm({
  mode,
  units,
  foodTypes,
  cuisines,
  allergens,
  recipeId,
  initialValues,
}: RecipeFormProps) {
  const router = useRouter();
  const [values, setValues] = useState<RecipeFormValues>(initialValues ?? createDefaultValues());
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const keyCounter = useRef(1000);

  const makeKey = (prefix: string) => `${prefix}-${keyCounter.current++}`;

  function update<K extends keyof RecipeFormValues>(field: K, value: RecipeFormValues[K]) {
    setValues((prev) => ({ ...prev, [field]: value }));
  }

  function updateIngredient(index: number, patch: Partial<IngredientFormRow>) {
    setValues((prev) => ({
      ...prev,
      ingredients: prev.ingredients.map((row, i) => (i === index ? { ...row, ...patch } : row)),
    }));
  }

  function updateStep(index: number, patch: Partial<StepFormRow>) {
    setValues((prev) => ({
      ...prev,
      steps: prev.steps.map((row, i) => (i === index ? { ...row, ...patch } : row)),
    }));
  }

  const preview = useMemo(
    () => ({
      title: values.title.trim() || "Tên công thức",
      summary: values.summary.trim(),
      difficulty: values.difficulty,
      servings: Number(values.baseServings) || undefined,
    }),
    [values.title, values.summary, values.difficulty, values.baseServings],
  );

  function validate(): Record<string, string[]> {
    const next: Record<string, string[]> = {};

    if (!values.title.trim()) next.title = ["Cần có tên công thức."];
    if (mode === "create" && !values.slug.trim()) {
      next.slug = ["Cần có slug (định danh URL)."];
    } else if (values.slug && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(values.slug)) {
      next.slug = ["Slug chỉ gồm chữ thường, số và dấu gạch ngang."];
    }
    if (!SERVINGS_REGEX.test(values.baseServings)) {
      next.baseServings = ["Số khẩu phần không hợp lệ (ví dụ: 2 hoặc 2.5)."];
    }

    values.ingredients.forEach((row, index) => {
      if (!row.displayName.trim()) {
        next[`ingredients.${index}.displayName`] = ["Cần có tên nguyên liệu."];
      }
      if (row.quantityType === "text") {
        if (!row.quantityText.trim()) {
          next[`ingredients.${index}.quantityText`] = ["Nhập định lượng dạng văn bản."];
        }
      } else if (row.quantityType === "range") {
        if (!QUANTITY_REGEX.test(row.quantityNumeric) || !QUANTITY_REGEX.test(row.quantityNumericMax)) {
          next[`ingredients.${index}.quantityNumeric`] = ["Cần giá trị nhỏ nhất và lớn nhất hợp lệ."];
        }
      } else if (!QUANTITY_REGEX.test(row.quantityNumeric)) {
        next[`ingredients.${index}.quantityNumeric`] = ["Cần số lượng hợp lệ."];
      }
    });

    values.steps.forEach((row, index) => {
      if (!row.instruction.trim()) {
        next[`steps.${index}.instruction`] = ["Cần nội dung cho bước này."];
      }
    });

    return next;
  }

  function toIngredientInput(row: IngredientFormRow, index: number) {
    const base: Record<string, unknown> = {
      displayName: row.displayName.trim(),
      quantityType: row.quantityType,
      isRequired: row.isRequired,
      sortOrder: index,
    };
    if (row.unitCode) base.unitCode = row.unitCode;
    if (row.preparationNote.trim()) base.preparationNote = row.preparationNote.trim();
    if (row.groupLabel.trim()) base.groupLabel = row.groupLabel.trim();

    if (row.quantityType === "text") {
      base.quantityText = row.quantityText.trim();
    } else if (row.quantityType === "range") {
      base.quantityNumeric = row.quantityNumeric.trim();
      base.quantityNumericMax = row.quantityNumericMax.trim();
    } else {
      base.quantityNumeric = row.quantityNumeric.trim();
    }
    return base;
  }

  function toStepInput(row: StepFormRow, index: number) {
    const base: Record<string, unknown> = {
      instruction: row.instruction.trim(),
      sortOrder: index,
    };
    if (row.tip.trim()) base.tip = row.tip.trim();
    if (row.durationMinutes.trim()) {
      const minutes = Number(row.durationMinutes);
      if (Number.isFinite(minutes) && minutes >= 0) base.durationSeconds = Math.round(minutes * 60);
    }
    if (row.temperatureC.trim()) base.temperatureC = row.temperatureC.trim();
    if (row.temperatureNote.trim()) base.temperatureNote = row.temperatureNote.trim();
    return base;
  }

  function buildPayload(): Record<string, unknown> {
    const payload: Record<string, unknown> = {
      title: values.title.trim(),
      summary: values.summary.trim() || undefined,
      description: values.description.trim() || undefined,
      foodTypeSlug: values.foodTypeSlug || undefined,
      cuisineSlug: values.cuisineSlug || undefined,
      difficulty: values.difficulty,
      baseServings: values.baseServings.trim(),
      ingredients: values.ingredients.map(toIngredientInput),
      steps: values.steps.map(toStepInput),
      allergenSlugs: values.allergenSlugs.length > 0 ? values.allergenSlugs : undefined,
    };

    if (values.prepMinutes.trim()) payload.prepMinutes = Number(values.prepMinutes);
    if (values.cookMinutes.trim()) payload.cookMinutes = Number(values.cookMinutes);
    if (values.totalMinutes.trim()) payload.totalMinutes = Number(values.totalMinutes);

    if (mode === "create") {
      payload.slug = values.slug.trim();
      payload.locale = "vi";
    }
    return payload;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    setSuccessMessage(null);

    const clientErrors = validate();
    if (Object.keys(clientErrors).length > 0) {
      setErrors(clientErrors);
      setFormError("Vui lòng kiểm tra lại các trường được đánh dấu.");
      return;
    }
    setErrors({});
    setSubmitting(true);

    const url = mode === "create" ? "/api/v1/recipes" : `/api/v1/recipes/${recipeId}`;
    const method = mode === "create" ? "POST" : "PATCH";

    try {
      const response = await fetch(url, {
        method,
        headers: { "content-type": "application/json" },
        body: JSON.stringify(buildPayload()),
      });
      const body = (await response.json().catch(() => null)) as
        | (ApiErrorBody & { recipe?: { id: string } })
        | null;

      if (!response.ok) {
        const details = body?.error?.details;
        if (details) setErrors(details);
        setFormError(body?.error?.message ?? "Không lưu được công thức.");
        return;
      }

      if (mode === "create" && body?.recipe?.id) {
        router.push(`/admin/cong-thuc/${body.recipe.id}/sua`);
        return;
      }
      setSuccessMessage("Đã lưu thay đổi công thức.");
      router.refresh();
    } catch {
      setFormError("Không kết nối được máy chủ. Vui lòng thử lại.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="flex flex-col gap-8" onSubmit={handleSubmit} noValidate>
      {formError ? (
        <div role="alert" className="rounded-md border border-danger bg-chip-danger-bg px-4 py-3 text-body-sm font-semibold text-chip-danger-text">
          {formError}
        </div>
      ) : null}
      {successMessage ? (
        <div role="status" className="rounded-md border border-success bg-chip-success-bg px-4 py-3 text-body-sm font-semibold text-chip-success-text">
          {successMessage}
        </div>
      ) : null}

      <Card>
        <CardBody className="flex flex-col gap-5">
          <CardTitle as="h2" className="text-h3">
            Thông tin chung
          </CardTitle>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              label="Tên công thức"
              required
              error={errors.title?.[0]}
              className="sm:col-span-2"
            >
              <Input
                value={values.title}
                onChange={(e) => update("title", e.target.value)}
                placeholder="Ví dụ: Phở bò Hà Nội"
                invalid={Boolean(errors.title)}
              />
            </FormField>

            <FormField
              label="Slug (định danh URL)"
              required={mode === "create"}
              error={errors.slug?.[0]}
              hint={mode === "edit" ? "Slug không thể thay đổi sau khi tạo." : "Chỉ chữ thường, số và gạch ngang."}
            >
              <Input
                value={values.slug}
                onChange={(e) => update("slug", e.target.value)}
                onBlur={() => {
                  if (mode === "create" && !values.slug && values.title) {
                    update("slug", slugify(values.title));
                  }
                }}
                disabled={mode === "edit"}
                placeholder="pho-bo-ha-noi"
                invalid={Boolean(errors.slug)}
              />
            </FormField>

            <FormField label="Số khẩu phần" required error={errors.baseServings?.[0]}>
              <Input
                value={values.baseServings}
                onChange={(e) => update("baseServings", e.target.value)}
                inputMode="decimal"
                placeholder="2"
                invalid={Boolean(errors.baseServings)}
              />
            </FormField>

            <FormField label="Loại món">
              <Select
                value={values.foodTypeSlug}
                onChange={(e) => update("foodTypeSlug", e.target.value)}
                options={[{ value: "", label: "— Chọn loại món —" }, ...foodTypes]}
              />
            </FormField>

            <FormField label="Xuất xứ (ẩm thực)">
              <Select
                value={values.cuisineSlug}
                onChange={(e) => update("cuisineSlug", e.target.value)}
                options={[{ value: "", label: "— Chọn xuất xứ —" }, ...cuisines]}
              />
            </FormField>

            <FormField label="Độ khó">
              <Select
                value={values.difficulty}
                onChange={(e) => update("difficulty", e.target.value as Difficulty)}
                options={DIFFICULTY_OPTIONS}
              />
            </FormField>

            <FormField label="Thời gian chuẩn bị (phút)">
              <Input
                value={values.prepMinutes}
                onChange={(e) => update("prepMinutes", e.target.value)}
                inputMode="numeric"
                placeholder="15"
              />
            </FormField>

            <FormField label="Thời gian nấu (phút)">
              <Input
                value={values.cookMinutes}
                onChange={(e) => update("cookMinutes", e.target.value)}
                inputMode="numeric"
                placeholder="30"
              />
            </FormField>

            <FormField label="Tổng thời gian (phút)">
              <Input
                value={values.totalMinutes}
                onChange={(e) => update("totalMinutes", e.target.value)}
                inputMode="numeric"
                placeholder="45"
              />
            </FormField>

            <FormField label="Mô tả ngắn" className="sm:col-span-2">
              <Textarea
                rows={2}
                value={values.summary}
                onChange={(e) => update("summary", e.target.value)}
                placeholder="Tóm tắt ngắn gọn về món ăn."
                maxLength={500}
              />
            </FormField>

            <FormField label="Mô tả / giới thiệu" className="sm:col-span-2">
              <Textarea
                rows={4}
                value={values.description}
                onChange={(e) => update("description", e.target.value)}
                placeholder="Giới thiệu chi tiết, bối cảnh, mẹo tổng quát."
                maxLength={5000}
              />
            </FormField>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardBody className="flex flex-col gap-4">
          <div className="flex items-center justify-between gap-3">
            <CardTitle as="h2" className="text-h3">
              Nguyên liệu
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Plus className="size-4" aria-hidden="true" />}
              onClick={() =>
                setValues((prev) => ({
                  ...prev,
                  ingredients: [...prev.ingredients, emptyIngredientRow(makeKey("i"))],
                }))
              }
            >
              Thêm nguyên liệu
            </Button>
          </div>

          <ul className="flex flex-col gap-4">
            {values.ingredients.map((row, index) => (
              <li key={row.key} className="rounded-md border border-line-subtle p-3">
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  <FormField label="Tên nguyên liệu" required error={errors[`ingredients.${index}.displayName`]?.[0]}>
                    <Input
                      value={row.displayName}
                      onChange={(e) => updateIngredient(index, { displayName: e.target.value })}
                      placeholder="Thịt bò"
                      invalid={Boolean(errors[`ingredients.${index}.displayName`])}
                    />
                  </FormField>

                  <FormField label="Kiểu định lượng">
                    <Select
                      value={row.quantityType}
                      onChange={(e) =>
                        updateIngredient(index, { quantityType: e.target.value as QuantityType })
                      }
                      options={QUANTITY_TYPE_OPTIONS}
                    />
                  </FormField>

                  <FormField label="Đơn vị">
                    <Select
                      value={row.unitCode}
                      onChange={(e) => updateIngredient(index, { unitCode: e.target.value })}
                      options={[{ value: "", label: "— Không đơn vị —" }, ...units]}
                    />
                  </FormField>

                  {row.quantityType === "text" ? (
                    <FormField label="Định lượng (văn bản)" error={errors[`ingredients.${index}.quantityText`]?.[0]}>
                      <Input
                        value={row.quantityText}
                        onChange={(e) => updateIngredient(index, { quantityText: e.target.value })}
                        placeholder="vừa đủ"
                        invalid={Boolean(errors[`ingredients.${index}.quantityText`])}
                      />
                    </FormField>
                  ) : (
                    <>
                      <FormField
                        label={row.quantityType === "range" ? "Số lượng nhỏ nhất" : "Số lượng"}
                        error={errors[`ingredients.${index}.quantityNumeric`]?.[0]}
                      >
                        <Input
                          value={row.quantityNumeric}
                          onChange={(e) => updateIngredient(index, { quantityNumeric: e.target.value })}
                          inputMode="decimal"
                          placeholder="200"
                          invalid={Boolean(errors[`ingredients.${index}.quantityNumeric`])}
                        />
                      </FormField>
                      {row.quantityType === "range" ? (
                        <FormField label="Số lượng lớn nhất">
                          <Input
                            value={row.quantityNumericMax}
                            onChange={(e) => updateIngredient(index, { quantityNumericMax: e.target.value })}
                            inputMode="decimal"
                            placeholder="250"
                          />
                        </FormField>
                      ) : null}
                    </>
                  )}

                  <FormField label="Mô tả sơ chế">
                    <Input
                      value={row.preparationNote}
                      onChange={(e) => updateIngredient(index, { preparationNote: e.target.value })}
                      placeholder="Thái lát mỏng"
                    />
                  </FormField>

                  <FormField label="Nhóm nguyên liệu">
                    <Input
                      value={row.groupLabel}
                      onChange={(e) => updateIngredient(index, { groupLabel: e.target.value })}
                      placeholder="Phần nước dùng"
                    />
                  </FormField>
                </div>

                <div className="mt-3 flex items-center justify-between">
                  <Checkbox
                    checked={row.isRequired}
                    onChange={(e) => updateIngredient(index, { isRequired: e.target.checked })}
                    label="Nguyên liệu bắt buộc"
                  />
                  {values.ingredients.length > 1 ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      leftIcon={<Trash2 className="size-4" aria-hidden="true" />}
                      onClick={() =>
                        setValues((prev) => ({
                          ...prev,
                          ingredients: prev.ingredients.filter((_, i) => i !== index),
                        }))
                      }
                    >
                      Xoá
                    </Button>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        </CardBody>
      </Card>

      <Card>
        <CardBody className="flex flex-col gap-4">
          <div className="flex items-center justify-between gap-3">
            <CardTitle as="h2" className="text-h3">
              Các bước nấu
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Plus className="size-4" aria-hidden="true" />}
              onClick={() =>
                setValues((prev) => ({ ...prev, steps: [...prev.steps, emptyStepRow(makeKey("s"))] }))
              }
            >
              Thêm bước
            </Button>
          </div>

          <ol className="flex flex-col gap-4">
            {values.steps.map((row, index) => (
              <li key={row.key} className="rounded-md border border-line-subtle p-3">
                <div className="mb-2 text-body-sm font-semibold text-ink">Bước {index + 1}</div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <FormField
                    label="Nội dung bước"
                    required
                    error={errors[`steps.${index}.instruction`]?.[0]}
                    className="sm:col-span-2"
                  >
                    <Textarea
                      rows={2}
                      value={row.instruction}
                      onChange={(e) => updateStep(index, { instruction: e.target.value })}
                      placeholder="Mô tả thao tác của bước này."
                      invalid={Boolean(errors[`steps.${index}.instruction`])}
                    />
                  </FormField>

                  <FormField label="Thời gian (phút)">
                    <Input
                      value={row.durationMinutes}
                      onChange={(e) => updateStep(index, { durationMinutes: e.target.value })}
                      inputMode="decimal"
                      placeholder="5"
                    />
                  </FormField>

                  <FormField label="Nhiệt độ (°C)">
                    <Input
                      value={row.temperatureC}
                      onChange={(e) => updateStep(index, { temperatureC: e.target.value })}
                      inputMode="decimal"
                      placeholder="180"
                    />
                  </FormField>

                  <FormField label="Ghi chú nhiệt độ">
                    <Input
                      value={row.temperatureNote}
                      onChange={(e) => updateStep(index, { temperatureNote: e.target.value })}
                      placeholder="Lửa vừa"
                    />
                  </FormField>

                  <FormField label="Mẹo cho bước này">
                    <Input
                      value={row.tip}
                      onChange={(e) => updateStep(index, { tip: e.target.value })}
                      placeholder="Mẹo nhỏ (tuỳ chọn)"
                    />
                  </FormField>
                </div>

                {values.steps.length > 1 ? (
                  <div className="mt-3 flex justify-end">
                    <Button
                      variant="ghost"
                      size="sm"
                      leftIcon={<Trash2 className="size-4" aria-hidden="true" />}
                      onClick={() =>
                        setValues((prev) => ({
                          ...prev,
                          steps: prev.steps.filter((_, i) => i !== index),
                        }))
                      }
                    >
                      Xoá bước
                    </Button>
                  </div>
                ) : null}
              </li>
            ))}
          </ol>
        </CardBody>
      </Card>

      {allergens.length > 0 ? (
        <Card>
          <CardBody className="flex flex-col gap-4">
            <CardTitle as="h2" className="text-h3">
              Chất gây dị ứng
            </CardTitle>
            <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {allergens.map((allergen) => (
                <li key={allergen.value}>
                  <Checkbox
                    checked={values.allergenSlugs.includes(allergen.value)}
                    onChange={(e) =>
                      update(
                        "allergenSlugs",
                        e.target.checked
                          ? [...values.allergenSlugs, allergen.value]
                          : values.allergenSlugs.filter((slug) => slug !== allergen.value),
                      )
                    }
                    label={allergen.label}
                  />
                </li>
              ))}
            </ul>
          </CardBody>
        </Card>
      ) : null}

      {showPreview ? (
        <Card variant="muted">
          <CardBody className="flex flex-col gap-3">
            <CardTitle as="h2" className="text-h3">
              Xem trước
            </CardTitle>
            <div className="max-w-sm">
              <RecipeImage src={null} alt={preview.title} ratio="4/3" />
            </div>
            <div className="flex flex-col gap-2">
              <h3 className="text-h4 text-ink">{preview.title}</h3>
              {preview.summary ? (
                <p className="text-body-sm text-ink-muted">{preview.summary}</p>
              ) : null}
              <div className="flex flex-wrap items-center gap-2">
                <ServingsBadge servings={preview.servings} />
                <DifficultyBadge level={preview.difficulty} />
              </div>
              <p className="text-caption text-ink-subtle">
                {values.ingredients.length} nguyên liệu · {values.steps.length} bước
              </p>
            </div>
          </CardBody>
        </Card>
      ) : null}

      <div className={cn("flex flex-wrap items-center gap-3")}>
        <Button type="submit" variant="primary" loading={submitting}>
          {mode === "create" ? "Tạo công thức (bản nháp)" : "Lưu thay đổi"}
        </Button>
        <Button type="button" variant="outline" onClick={() => setShowPreview((prev) => !prev)}>
          {showPreview ? "Ẩn xem trước" : "Xem trước"}
        </Button>
      </div>
    </form>
  );
}
