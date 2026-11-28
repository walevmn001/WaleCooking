/**
 * Cấu hình taxonomy dùng cho KHÁM PHÁ công thức (P08.1).
 *
 * Đây là metadata thiết kế (nhãn hiển thị, đoạn URL, cách lọc công thức), KHÔNG phải
 * dữ liệu. Danh sách term thực tế đến từ database (`taxonomy_types`/`taxonomy_terms`).
 * Nhờ vậy taxonomy linh hoạt: thêm/sửa term trong quản trị không cần sửa frontend;
 * chỉ khi thêm một TRỤC phân loại mới mới cần khai báo ở đây.
 *
 * Tham chiếu: P08 §P08.1 (danh mục chính/con, nhóm món, loại bữa ăn, nguyên liệu chính,
 * phương pháp chế biến, đặc điểm món ăn).
 */

/** Cách công thức liên kết với term của trục này. */
export type RecipeFilterKind = "direct" | "ingredient_category";

export interface DiscoveryTaxonomy {
  /** `taxonomy_types.code` trong database. */
  code: string;
  /** Đoạn URL dùng cho trang danh mục (`/danh-muc/{segment}`). */
  segment: string;
  /** Nhãn hiển thị (tiếng Việt). */
  label: string;
  /** Mô tả ngắn cho trang danh mục (SEO/UX). */
  description: string;
  /** true = trục có danh mục cha/con. */
  isHierarchical: boolean;
  /** Cách lọc công thức theo term. */
  filterKind: RecipeFilterKind;
}

/** Các trục phân loại hiển thị ở khu vực khám phá (thứ tự hiển thị theo mảng). */
export const DISCOVERY_TAXONOMIES: readonly DiscoveryTaxonomy[] = [
  {
    code: "food_type",
    segment: "nhom-mon",
    label: "Nhóm món ăn",
    description: "Phân loại theo vai trò món trong bữa ăn: món chính, khai vị, tráng miệng, đồ uống…",
    isHierarchical: false,
    filterKind: "direct",
  },
  {
    code: "cuisine",
    segment: "am-thuc",
    label: "Ẩm thực",
    description: "Khám phá công thức theo nền ẩm thực: Việt Nam, châu Á, phương Tây, fusion…",
    isHierarchical: false,
    filterKind: "direct",
  },
  {
    code: "meal_type",
    segment: "bua-an",
    label: "Bữa ăn",
    description: "Gợi ý món theo bữa: ăn sáng, ăn trưa, ăn tối, bữa phụ, tráng miệng.",
    isHierarchical: false,
    filterKind: "direct",
  },
  {
    code: "cooking_method",
    segment: "phuong-phap",
    label: "Phương pháp chế biến",
    description: "Lọc theo cách nấu: xào, luộc, hấp, nướng, chiên, kho, hầm…",
    isHierarchical: false,
    filterKind: "direct",
  },
  {
    code: "dietary_preference",
    segment: "dac-diem",
    label: "Đặc điểm món ăn",
    description: "Món chay, thuần chay, không gluten, ít tinh bột, giàu đạm…",
    isHierarchical: false,
    filterKind: "direct",
  },
  {
    code: "ingredient_category",
    segment: "nguyen-lieu",
    label: "Nguyên liệu chính",
    description: "Tìm món theo nguyên liệu chính: thịt, hải sản, rau củ, ngũ cốc…",
    isHierarchical: true,
    filterKind: "ingredient_category",
  },
];

const BY_CODE = new Map(DISCOVERY_TAXONOMIES.map((t) => [t.code, t]));
const BY_SEGMENT = new Map(DISCOVERY_TAXONOMIES.map((t) => [t.segment, t]));

/** Tra cứu trục khám phá theo `code`. */
export function getDiscoveryTaxonomyByCode(code: string): DiscoveryTaxonomy | undefined {
  return BY_CODE.get(code);
}

/** Tra cứu trục khám phá theo đoạn URL. */
export function getDiscoveryTaxonomyBySegment(segment: string): DiscoveryTaxonomy | undefined {
  return BY_SEGMENT.get(segment);
}

/** Trục này có nằm trong khu vực khám phá công khai? */
export function isDiscoveryTaxonomy(code: string): boolean {
  return BY_CODE.has(code);
}
