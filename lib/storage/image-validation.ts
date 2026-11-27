import "server-only";

import { ValidationError } from "@/lib/errors/app-error";

/**
 * Kiểm tra tệp ảnh TRƯỚC khi lưu (P02 §MEDIA_STORAGE §7).
 *
 * Nguyên tắc:
 * - KHÔNG tin `Content-Type`/`filename` do client gửi; chỉ tin magic bytes.
 * - Chỉ chấp nhận các định dạng ảnh an toàn, phổ biến trên web.
 * - Giới hạn dung lượng để tránh lạm dụng.
 */

export const ALLOWED_IMAGE_MIME = ["image/jpeg", "image/png", "image/webp", "image/avif"] as const;
export type AllowedImageMime = (typeof ALLOWED_IMAGE_MIME)[number];

/** ≤ 8 MB/ảnh (P02 đề xuất). */
export const MAX_IMAGE_BYTES = 8 * 1024 * 1024;

/** Cạnh dài tối đa hợp lý (chỉ kiểm khi biết kích thước pixel). */
export const MAX_IMAGE_DIMENSION = 8192;

export interface ImageTypeInfo {
  mime: AllowedImageMime;
  ext: "jpg" | "png" | "webp" | "avif";
}

function startsWith(bytes: Uint8Array, signature: number[], offset = 0): boolean {
  if (bytes.length < offset + signature.length) return false;
  return signature.every((value, index) => bytes[offset + index] === value);
}

function ascii(bytes: Uint8Array, offset: number, length: number): string {
  let out = "";
  for (let i = 0; i < length; i += 1) {
    const byte = bytes[offset + i];
    if (byte === undefined) return out;
    out += String.fromCharCode(byte);
  }
  return out;
}

/**
 * Nhận diện định dạng bằng magic bytes. Trả `null` nếu không phải ảnh được phép.
 */
export function detectImageType(bytes: Uint8Array): ImageTypeInfo | null {
  // JPEG: FF D8 FF
  if (startsWith(bytes, [0xff, 0xd8, 0xff])) {
    return { mime: "image/jpeg", ext: "jpg" };
  }
  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (startsWith(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) {
    return { mime: "image/png", ext: "png" };
  }
  // WEBP: "RIFF" .... "WEBP"
  if (ascii(bytes, 0, 4) === "RIFF" && ascii(bytes, 8, 4) === "WEBP") {
    return { mime: "image/webp", ext: "webp" };
  }
  // AVIF: .... "ftyp" + brand "avif"/"avis"
  if (ascii(bytes, 4, 4) === "ftyp") {
    const brand = ascii(bytes, 8, 4);
    if (brand === "avif" || brand === "avis") {
      return { mime: "image/avif", ext: "avif" };
    }
  }
  return null;
}

/**
 * Kiểm tra một tệp ảnh từ client. Ném `ValidationError` (422) nếu không hợp lệ.
 * Trả về thông tin định dạng thật để dùng khi sinh khóa/tệp.
 */
export function validateImageFile(bytes: Uint8Array, field = "file"): ImageTypeInfo {
  if (bytes.length === 0) {
    throw new ValidationError({ [field]: ["Tệp rỗng."] });
  }
  if (bytes.length > MAX_IMAGE_BYTES) {
    throw new ValidationError({
      [field]: [`Ảnh vượt quá giới hạn ${Math.round(MAX_IMAGE_BYTES / (1024 * 1024))} MB.`],
    });
  }

  const type = detectImageType(bytes);
  if (!type) {
    throw new ValidationError({
      [field]: ["Định dạng ảnh không được hỗ trợ (chỉ nhận JPEG, PNG, WebP, AVIF)."],
    });
  }
  return type;
}

/**
 * Kiểm tra kích thước pixel nếu biết (từ tiêu đề ảnh). Trả `true` nếu hợp lệ.
 */
export function isWithinDimensionLimit(width: number, height: number): boolean {
  return width > 0 && height > 0 && width <= MAX_IMAGE_DIMENSION && height <= MAX_IMAGE_DIMENSION;
}

/**
 * Chuyển tên gợi ý thành "slug an toàn" (chữ thường, số, gạch ngang). KHÔNG dùng
 * trực tiếp làm khóa lưu trữ — khóa do server sinh — nhưng dùng cho phần mô tả.
 */
export function toSafeSlugSegment(name: string, maxLength = 60): string {
  const base = name
    .replace(/\.[a-zA-Z0-9]+$/, "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return base.slice(0, maxLength) || "image";
}
