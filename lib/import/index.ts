/**
 * Contract Foundation cho URL Import (I2.2).
 *
 * Chỉ gồm kiểu dữ liệu, cổng (ports) và schema validate — KHÔNG chứa implementation.
 * Barrel tiện import: `import { … } from "@/lib/import"`.
 */

export type {
  FieldState,
  FieldTier,
  FieldCategory,
  FieldCategoryValue,
  ProvenancedField,
} from "./field-state";
export { toFieldCategory } from "./field-state";

export type {
  UrlRejectionReason,
  NormalizedUrlInfo,
  UrlValidationResult,
} from "./url";

export type {
  SourceDecision,
  SourcePolicySnapshot,
  SourceIdentificationResult,
} from "./source";

export type {
  SafeFetchRequest,
  FetchResult,
  SafeFetchFailureReason,
  SafeFetchResult,
} from "./fetch";

export type {
  ExtractionWarningCode,
  ExtractionResult,
  ExtractionOutcome,
} from "./extraction";

export type {
  SubmitUrlImportRequest,
  ImportItemResult,
  ImportJobResult,
  AdminImportFieldPreview,
  AdminImportItemPreview,
  ImportReviewDecision,
  ImportReviewRequest,
} from "./job";

export type { ImportErrorCode, ImportFieldErrors, ImportErrorResponse } from "./errors";

export type { UrlValidator, SafeFetcher, SourceRegistry, RecipeExtractor } from "./ports";

export {
  MAX_URL_LENGTH,
  MAX_JOB_ITEMS,
  MAX_NOTES_LENGTH,
  submitUrlImportSchema,
  importReviewSchema,
} from "./validation";
export type { SubmitUrlImportInput, ImportReviewInput } from "./validation";

export { buildImportIdempotencyKey } from "./idempotency";
