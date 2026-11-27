/**
 * Siêu dữ liệu site — chỉ chứa thông tin đã có thật.
 * KHÔNG bịa địa chỉ, email, số điện thoại hay thông tin pháp lý.
 * Các trường liên hệ/pháp lý để trống và hiển thị có điều kiện ở Footer.
 */
export const siteConfig = {
  name: "WALE COOKING",
  shortName: "WALE",
  /** Khẩu hiệu/mô tả ngắn thương hiệu (theo định hướng P00). */
  description:
    "WALE COOKING — cẩm nang nấu ăn tiếng Việt: công thức rõ ràng, nguyên liệu dễ tìm, hướng dẫn từng bước cho người mới bắt đầu.",
  /** Ngôn ngữ mặc định + sẵn sàng i18n EN (P01). */
  defaultLocale: "vi",
  locales: ["vi", "en"] as const,
  /** Năm hiển thị copyright — lấy động để không lỗi thời. */
  get copyrightYear(): number {
    return new Date().getFullYear();
  },
  /**
   * Thông tin liên hệ: CHƯA có cấu hình chính thức.
   * Khi có thông tin thật (P0x), điền vào đây; Footer sẽ tự hiển thị.
   */
  contact: {
    email: null as string | null,
    phone: null as string | null,
    address: null as string | null,
  },
  /** Liên kết mạng xã hội — chưa cấu hình. */
  social: [] as { label: string; href: string }[],
} as const;

export type SiteConfig = typeof siteConfig;
