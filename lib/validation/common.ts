import { z } from "zod";

import { ValidationError } from "@/lib/errors/app-error";

/**
 * Schema validation dùng chung (P06 §8).
 * Mọi dữ liệu từ client PHẢI đi qua các schema này ở phía server.
 */

/** Chuẩn hóa lỗi Zod thành `ValidationError` (details theo trường, an toàn cho client). */
export function formatZodIssues(error: z.ZodError): Record<string, string[]> {
  const details: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "(root)";
    (details[key] ??= []).push(issue.message);
  }
  return details;
}

/** Parse input; ném `ValidationError` nếu sai (thay vì ném `ZodError` thô). */
export function parseInput<T>(schema: z.ZodType<T>, data: unknown): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    throw new ValidationError(formatZodIssues(result.error));
  }
  return result.data;
}

export const uuidSchema = z.string().uuid();

export const slugSchema = z
  .string()
  .min(1)
  .max(200)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug chỉ gồm chữ thường, số và dấu gạch ngang.");

export const localeSchema = z.string().min(2).max(10).default("vi");

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export type Pagination = z.infer<typeof paginationSchema>;

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/** Bọc kết quả phân trang. */
export function paginate<T>(items: T[], total: number, pagination: Pagination): Paginated<T> {
  return {
    items,
    total,
    page: pagination.page,
    pageSize: pagination.pageSize,
    totalPages: Math.max(1, Math.ceil(total / pagination.pageSize)),
  };
}

/** Chuyển offset từ số trang. */
export function toOffset(pagination: Pagination): number {
  return (pagination.page - 1) * pagination.pageSize;
}
