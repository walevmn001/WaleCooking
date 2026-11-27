/**
 * Sinh slug từ tiêu đề (P07 §16). Hàm THUẦN — dùng được ở client & server.
 *
 * Xử lý tiếng Việt: NFD tách dấu cho hầu hết ký tự; `đ/Đ` không bị tách nên xử lý riêng.
 */
export function slugify(input: string, maxLength = 200): string {
  const base = input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[đĐ]/g, "d")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return base.slice(0, maxLength).replace(/-+$/g, "");
}
