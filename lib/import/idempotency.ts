/**
 * Khoá chống trùng item (idempotencyKey) — I2.1 `URL_IMPORT_FLOW.md` bước 2.
 *
 * `idempotencyKey = hash(jobId + normalizedUrl)`; kết hợp unique `(jobId, idempotencyKey)`
 * ở schema I1 để chặn cùng một URL được thêm hai lần trong một job.
 *
 * Hàm THUẦN (deterministic) để kiểm thử và để tái tạo khoá khi cần.
 */

import { createHash } from "node:crypto";

/** Sinh khoá idempotency ổn định cho một cặp (jobId, normalizedUrl). */
export function buildImportIdempotencyKey(jobId: string, normalizedUrl: string): string {
  return createHash("sha256").update(`${jobId}::${normalizedUrl}`).digest("hex");
}
