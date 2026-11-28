"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Plus, Trash2 } from "lucide-react";

import { FormField } from "@/components/forms/form-field";
import { Input, Textarea } from "@/components/forms/input";
import { Select } from "@/components/forms/select";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardTitle } from "@/components/ui/card";
import { slugify } from "@/lib/presentation/slug";

interface ApiErrorBody {
  error?: { message?: string; details?: Record<string, string[]> };
}

export interface TaxonomyManagerTerm {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  parentSlug: string | null;
  sortOrder: number;
  isActive: boolean;
  recipeCount: number;
  childCount: number;
}

export interface TaxonomyManagerProps {
  typeCode: string;
  typeLabel: string;
  isHierarchical: boolean;
  terms: TaxonomyManagerTerm[];
}

interface FormState {
  name: string;
  slug: string;
  description: string;
  parentSlug: string;
  sortOrder: string;
  isActive: boolean;
}

const EMPTY_FORM: FormState = {
  name: "",
  slug: "",
  description: "",
  parentSlug: "",
  sortOrder: "",
  isActive: true,
};

/**
 * TaxonomyManager — quản trị danh mục (term) của một trục phân loại (P08 §P08.4).
 *
 * Giao diện client gọi REST API quản trị; SERVER kiểm tra quyền `taxonomy:manage` lại
 * khi nhận request. Xóa bị chặn ở server khi danh mục còn công thức/term con — khi đó
 * hiển thị thông báo và gợi ý lưu trữ.
 */
export function TaxonomyManager({
  typeCode,
  typeLabel,
  isHierarchical,
  terms,
}: TaxonomyManagerProps) {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isEditing = editingId !== null;

  const parentOptions = useMemo(
    () =>
      terms
        .filter((term) => term.id !== editingId)
        .map((term) => ({ value: term.slug, label: term.name })),
    [terms, editingId],
  );

  function resetForm() {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setErrors({});
  }

  function startEdit(term: TaxonomyManagerTerm) {
    setEditingId(term.id);
    setForm({
      name: term.name,
      slug: term.slug,
      description: term.description ?? "",
      parentSlug: term.parentSlug ?? "",
      sortOrder: String(term.sortOrder),
      isActive: term.isActive,
    });
    setErrors({});
    setError(null);
    setMessage(null);
  }

  async function send(
    key: string,
    url: string,
    init: RequestInit,
    successMessage: string,
  ): Promise<boolean> {
    setBusy(key);
    setError(null);
    setMessage(null);
    try {
      const response = await fetch(url, init);
      const body = (await response.json().catch(() => null)) as ApiErrorBody | null;
      if (!response.ok) {
        if (body?.error?.details) setErrors(body.error.details);
        setError(body?.error?.message ?? "Thao tác không thành công.");
        return false;
      }
      setMessage(successMessage);
      router.refresh();
      return true;
    } catch {
      setError("Không kết nối được máy chủ. Vui lòng thử lại.");
      return false;
    } finally {
      setBusy(null);
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const clientErrors: Record<string, string[]> = {};
    if (!form.name.trim()) clientErrors.name = ["Vui lòng nhập tên danh mục."];
    if (!isEditing && !form.slug.trim()) clientErrors.slug = ["Vui lòng nhập slug."];
    if (Object.keys(clientErrors).length > 0) {
      setErrors(clientErrors);
      setError("Vui lòng kiểm tra lại các trường được đánh dấu.");
      return;
    }
    setErrors({});

    const sortOrder = form.sortOrder.trim() ? Number.parseInt(form.sortOrder, 10) : undefined;

    if (isEditing) {
      const ok = await send(
        "save",
        `/api/v1/admin/taxonomy/${editingId}`,
        {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            locale: "vi",
            name: form.name.trim(),
            description: form.description.trim() || null,
            parentSlug: form.parentSlug || null,
            sortOrder,
            isActive: form.isActive,
          }),
        },
        "Đã cập nhật danh mục.",
      );
      if (ok) resetForm();
      return;
    }

    const ok = await send(
      "save",
      "/api/v1/admin/taxonomy",
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          typeCode,
          locale: "vi",
          name: form.name.trim(),
          slug: form.slug.trim(),
          description: form.description.trim() || null,
          parentSlug: form.parentSlug || null,
          sortOrder,
        }),
      },
      "Đã tạo danh mục mới.",
    );
    if (ok) resetForm();
  }

  async function toggleActive(term: TaxonomyManagerTerm) {
    await send(
      `active-${term.id}`,
      `/api/v1/admin/taxonomy/${term.id}`,
      {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ locale: "vi", isActive: !term.isActive }),
      },
      term.isActive ? "Đã lưu trữ danh mục." : "Đã khôi phục danh mục.",
    );
  }

  async function remove(term: TaxonomyManagerTerm) {
    const confirmed = window.confirm(
      `Xóa danh mục "${term.name}"? Chỉ xóa được khi không còn công thức/danh mục con tham chiếu.`,
    );
    if (!confirmed) return;
    await send(
      `delete-${term.id}`,
      `/api/v1/admin/taxonomy/${term.id}`,
      { method: "DELETE" },
      "Đã xóa danh mục.",
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {error ? (
        <div
          role="alert"
          className="rounded-md border border-danger bg-chip-danger-bg px-4 py-3 text-body-sm font-semibold text-chip-danger-text"
        >
          {error}
        </div>
      ) : null}
      {message ? (
        <div
          role="status"
          className="rounded-md border border-success bg-chip-success-bg px-4 py-3 text-body-sm font-semibold text-chip-success-text"
        >
          {message}
        </div>
      ) : null}

      <Card>
        <CardBody className="flex flex-col gap-4">
          <div className="flex items-center justify-between gap-3">
            <CardTitle as="h2" className="text-h3">
              {isEditing ? "Sửa danh mục" : `Thêm danh mục vào ${typeLabel}`}
            </CardTitle>
            {isEditing ? (
              <Button variant="ghost" size="sm" onClick={resetForm} disabled={busy === "save"}>
                Hủy
              </Button>
            ) : null}
          </div>

          <form className="flex flex-col gap-4" onSubmit={handleSubmit} noValidate>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="Tên danh mục" required error={errors.name?.[0]}>
                <Input
                  value={form.name}
                  onChange={(e) => {
                    const value = e.target.value;
                    setForm((prev) => ({
                      ...prev,
                      name: value,
                      slug: isEditing ? prev.slug : slugify(value),
                    }));
                  }}
                  disabled={busy === "save"}
                />
              </FormField>

              <FormField
                label="Slug"
                required={!isEditing}
                hint={isEditing ? "Slug không đổi sau khi tạo." : "Dùng trong URL danh mục."}
                error={errors.slug?.[0]}
              >
                <Input
                  value={form.slug}
                  onChange={(e) => setForm((prev) => ({ ...prev, slug: e.target.value }))}
                  disabled={isEditing || busy === "save"}
                />
              </FormField>

              <FormField label="Mô tả" className="sm:col-span-2" error={errors.description?.[0]}>
                <Textarea
                  value={form.description}
                  rows={2}
                  onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                  disabled={busy === "save"}
                />
              </FormField>

              {isHierarchical ? (
                <FormField label="Danh mục cha" error={errors.parentSlug?.[0]}>
                  <Select
                    value={form.parentSlug}
                    onChange={(e) => setForm((prev) => ({ ...prev, parentSlug: e.target.value }))}
                    options={[{ value: "", label: "— Không có (danh mục gốc) —" }, ...parentOptions]}
                    disabled={busy === "save"}
                  />
                </FormField>
              ) : null}

              <FormField label="Thứ tự hiển thị" hint="Số nhỏ hiển thị trước.">
                <Input
                  type="number"
                  min={0}
                  value={form.sortOrder}
                  onChange={(e) => setForm((prev) => ({ ...prev, sortOrder: e.target.value }))}
                  disabled={busy === "save"}
                />
              </FormField>
            </div>

            {isEditing ? (
              <label className="flex items-center gap-2 text-body-sm text-ink">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => setForm((prev) => ({ ...prev, isActive: e.target.checked }))}
                  disabled={busy === "save"}
                />
                Đang hoạt động (hiển thị công khai)
              </label>
            ) : null}

            <div className="flex items-center gap-3">
              <Button
                type="submit"
                variant="primary"
                loading={busy === "save"}
                leftIcon={isEditing ? undefined : <Plus className="size-4" aria-hidden="true" />}
              >
                {isEditing ? "Cập nhật" : "Thêm danh mục"}
              </Button>
            </div>
          </form>
        </CardBody>
      </Card>

      <div className="overflow-x-auto rounded-lg border border-line-subtle bg-surface">
        <table className="w-full min-w-[40rem] border-collapse text-left">
          <caption className="sr-only">Danh sách danh mục của {typeLabel}</caption>
          <thead>
            <tr className="border-b border-line-subtle text-body-sm text-ink-muted">
              <th scope="col" className="px-4 py-3 font-semibold">
                Danh mục
              </th>
              <th scope="col" className="px-4 py-3 font-semibold">
                Danh mục cha
              </th>
              <th scope="col" className="px-4 py-3 font-semibold">
                Đang dùng
              </th>
              <th scope="col" className="px-4 py-3 font-semibold">
                Trạng thái
              </th>
              <th scope="col" className="px-4 py-3 font-semibold">
                <span className="sr-only">Hành động</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {terms.length === 0 ? (
              <tr>
                <td className="px-4 py-6 text-body text-ink-muted" colSpan={5}>
                  Chưa có danh mục nào. Hãy tạo danh mục đầu tiên.
                </td>
              </tr>
            ) : (
              terms.map((term) => (
                <tr key={term.id} className="border-b border-line-subtle last:border-b-0">
                  <td className="px-4 py-3">
                    <div className="flex flex-col">
                      <span className="text-body font-semibold text-ink">{term.name}</span>
                      <span className="text-caption text-ink-subtle">/{term.slug}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-body-sm text-ink-muted">{term.parentSlug ?? "—"}</td>
                  <td className="px-4 py-3 text-body-sm text-ink-muted">
                    {term.recipeCount} công thức
                    {term.childCount > 0 ? ` · ${term.childCount} danh mục con` : ""}
                  </td>
                  <td className="px-4 py-3 text-body-sm">
                    {term.isActive ? (
                      <span className="text-chip-success-text">Hoạt động</span>
                    ) : (
                      <span className="text-ink-muted">Đã lưu trữ</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap items-center justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => startEdit(term)}
                        disabled={busy !== null}
                        leftIcon={<Pencil className="size-4" aria-hidden="true" />}
                      >
                        Sửa
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleActive(term)}
                        loading={busy === `active-${term.id}`}
                        disabled={busy !== null && busy !== `active-${term.id}`}
                      >
                        {term.isActive ? "Lưu trữ" : "Khôi phục"}
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => remove(term)}
                        loading={busy === `delete-${term.id}`}
                        disabled={busy !== null && busy !== `delete-${term.id}`}
                        leftIcon={<Trash2 className="size-4" aria-hidden="true" />}
                      >
                        Xóa
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
