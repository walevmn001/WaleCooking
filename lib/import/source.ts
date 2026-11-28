/**
 * Hợp đồng nhận diện nguồn (Source Registry) — I2.1 `SOURCE_REGISTRY_DESIGN.md` §2–§4
 * và `URL_IMPORT_FLOW.md` bước 3.
 *
 * Nguyên tắc: nguồn chưa đánh giá ⇒ chính sách CHẶT NHẤT (`manual_only` + `do_not_copy`),
 * gắn cảnh báo; KHÔNG tự tạo `ImportSource`; KHÔNG tự tăng độ tin cậy.
 */

import type {
  ContentReusePolicy,
  ImageReusePolicy,
  ImportSourceStatus,
} from "@prisma/client";

/** Quyết định của luồng URL Import đối với một nguồn. */
export type SourceDecision = "allowed" | "allowed_with_warning" | "blocked";

/** Ảnh chụp chính sách hiệu lực áp cho nguồn (đã resolve default an toàn). */
export interface SourcePolicySnapshot {
  supportStatus: ImportSourceStatus;
  contentPolicy: ContentReusePolicy;
  imagePolicy: ImageReusePolicy;
}

/** Kết quả nhận diện nguồn từ một domain. */
export interface SourceIdentificationResult {
  /** Domain đã chuẩn hoá (eTLD+1) dùng để tra registry. */
  domain: string;
  /** Có `ImportSource` trong registry hay không. */
  registered: boolean;
  /** `ImportSource.id` khi đã đăng ký; `null` khi chưa. */
  sourceId: string | null;
  decision: SourceDecision;
  /** Chính sách hiệu lực (đã áp default an toàn khi chưa đăng ký). */
  policy: SourcePolicySnapshot;
  /** Cảnh báo mã chuẩn (SOURCES_UNREGISTERED, CONTENT_POLICY_MANUAL_ONLY, …). */
  warnings: readonly string[];
  /** Lý do AN TOÀN khi `decision === "blocked"` (không lộ chi tiết nội bộ). */
  blockReason?: string;
}
