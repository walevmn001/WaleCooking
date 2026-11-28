/**
 * Schema Zod cho hợp đồng API Import — I2.1 `API_AUTH_DESIGN.md` §8.
 *
 * NGUYÊN TẮC: chỉ nhận đúng field cần thiết (chống mass assignment).
 * KHÔNG nhận `createdById`, `status`, `role`, `recipeId`, `attempts`… từ client.
 */

import { z } from "zod";

/** Trần độ dài URL (I2.1 §8). */
export const MAX_URL_LENGTH = 2048;
/** Trần số item mỗi job (dùng khi tạo job ở phase sau). */
export const MAX_JOB_ITEMS = 500;
/** Trần độ dài ghi chú. */
export const MAX_NOTES_LENGTH = 2000;

/** Body thêm 1 URL để import (MVP: đúng 1 URL). */
export const submitUrlImportSchema = z.object({
  url: z.string().min(1).max(MAX_URL_LENGTH),
});

/** Body duyệt item (approve/reject/request changes). KHÔNG chứa trạng thái publish. */
export const importReviewSchema = z.object({
  decision: z.enum(["approved", "rejected", "changes_requested"]),
  notes: z.string().max(MAX_NOTES_LENGTH).optional(),
});

export type SubmitUrlImportInput = z.infer<typeof submitUrlImportSchema>;
export type ImportReviewInput = z.infer<typeof importReviewSchema>;
