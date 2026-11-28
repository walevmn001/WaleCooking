/**
 * Cổng (ports) cho URL Import — tách business logic khỏi HTTP client và tách
 * SSRF guard khỏi extraction (I2.1 `IMPLEMENTATION_PLAN.md`, `SSRF_SECURITY_DESIGN.md`).
 *
 * Tất cả đều là INTERFACE + dependency injection để kiểm thử. I2.2 **không** tạo
 * implementation nào (adapter thật / spike thuộc I2.3).
 */

import type { FetchResult, SafeFetchRequest, SafeFetchResult } from "./fetch";
import type { ExtractionResult } from "./extraction";
import type { SourceIdentificationResult } from "./source";
import type { UrlValidationResult } from "./url";

/**
 * Kiểm tra + chuẩn hoá URL (thuần, không mạng) — SSRF lớp L1/L5/L7.
 * PHẢI từ chối an toàn (fail-closed) mọi URL không đạt policy.
 */
export interface UrlValidator {
  validate(url: string): UrlValidationResult;
}

/**
 * Tải nội dung qua guard SSRF: resolve DNS → kiểm MỌI IP → pin IP → kết nối đúng IP đó
 * → theo redirect ≤ giới hạn, kiểm lại MỖI hop (lớp L4/L6/L8).
 */
export interface SafeFetcher {
  fetch(request: SafeFetchRequest): Promise<SafeFetchResult>;
}

/**
 * Nhận diện nguồn theo domain và trả chính sách hiệu lực (Source Registry).
 * Domain chưa đăng ký ⇒ chính sách chặt nhất + cảnh báo (không tự tạo nguồn).
 */
export interface SourceRegistry {
  resolve(domain: string): Promise<SourceIdentificationResult>;
}

/**
 * Bộ trích xuất theo bậc pipeline E1–E5 (I2 chỉ dùng E1).
 * `canHandle` để engine chọn extractor; `extract` trả trường có nguồn gốc.
 */
export interface RecipeExtractor {
  readonly tier: "E1" | "E2" | "E3" | "E4" | "E5";
  canHandle(input: FetchResult): boolean;
  extract(input: FetchResult): Promise<ExtractionResult>;
}
