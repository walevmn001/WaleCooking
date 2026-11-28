/**
 * Cấu trúc điều hướng chính (P05 §4.3).
 * Nhóm chức năng theo PRD/P01. Mỗi mục trỏ tới route đã có hoặc route placeholder
 * (đánh dấu `placeholder: true` — trang tương ứng hiển thị rõ "sẽ triển khai ở phase sau").
 */
export interface NavItem {
  label: string;
  href: string;
  /** Mô tả ngắn dùng cho aria-label phụ khi cần. */
  description?: string;
  /** true = route placeholder, chưa có chức năng thật. */
  placeholder: boolean;
}

/** Điều hướng chính trên Header (desktop + mobile drawer). */
export const primaryNav: NavItem[] = [
  { label: "Trang chủ", href: "/", placeholder: false },
  { label: "Công thức", href: "/cong-thuc", description: "Kho công thức nấu ăn", placeholder: false },
  { label: "Danh mục", href: "/danh-muc", description: "Phân loại theo món, vùng miền, phương pháp", placeholder: false },
  { label: "Kiến thức nấu ăn", href: "/kien-thuc", description: "Bài viết, mẹo và hướng dẫn", placeholder: true },
  { label: "Yêu thích", href: "/yeu-thich", description: "Công thức đã lưu", placeholder: false },
];

/**
 * Liên kết ở Footer — nhóm điều hướng.
 *
 * Lưu ý (P07.1): sản phẩm KHÔNG có tài khoản khách → không còn mục "Tài khoản của tôi".
 * Footer chỉ giữ lối vào **quản trị** (`/dang-nhap`).
 */
export const footerNavGroups: { title: string; items: NavItem[] }[] = [
  {
    title: "Khám phá",
    items: [
      { label: "Công thức", href: "/cong-thuc", placeholder: false },
      { label: "Danh mục", href: "/danh-muc", placeholder: false },
      { label: "Kiến thức nấu ăn", href: "/kien-thuc", placeholder: true },
      { label: "Yêu thích", href: "/yeu-thich", placeholder: false },
    ],
  },
  {
    title: "Quản trị",
    items: [
      { label: "Đăng nhập quản trị", href: "/dang-nhap", placeholder: true },
    ],
  },
  {
    title: "Về WALE COOKING",
    items: [
      { label: "Giới thiệu", href: "/gioi-thieu", placeholder: true },
    ],
  },
];

/**
 * Liên kết chính sách ở Footer.
 * Nội dung pháp lý thật CHƯA có → chỉ liệt kê mục sẽ có, đánh dấu placeholder.
 */
export const footerPolicyLinks: NavItem[] = [
  { label: "Điều khoản sử dụng", href: "/dieu-khoan", placeholder: true },
  { label: "Chính sách bảo mật", href: "/bao-mat", placeholder: true },
  { label: "Chính sách bản quyền nội dung", href: "/ban-quyen", placeholder: true },
];
