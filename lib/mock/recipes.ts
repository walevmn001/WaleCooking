/**
 * MOCK DATA — CHỈ DÙNG CHO TRANG KIỂM TRA COMPONENT (dev-only) VÀ STORY/TEST.
 * KHÔNG phải nội dung thật; KHÔNG dùng trong production.
 * Nội dung công thức thật sẽ đến từ module Recipe (P06+) qua tầng dữ liệu.
 */
import type {
  Allergen,
  NutritionFact,
  RecipeCategory,
  RecipeIngredient,
  RecipeStep,
  RecipeSummary,
} from "@/components/recipe/types";

export const MOCK_RECIPES: RecipeSummary[] = [
  {
    id: "mock-1",
    slug: "pho-bo",
    title: "[MOCK] Phở bò Hà Nội",
    description:
      "Dữ liệu minh hoạ để kiểm tra component — không phải công thức thật.",
    imageUrl: null,
    prepMinutes: 30,
    cookMinutes: 180,
    servings: 4,
    difficulty: "hard",
    tags: ["Món nước", "Việt Nam"],
  },
  {
    id: "mock-2",
    slug: "salad-tron",
    title: "[MOCK] Salad trộn rau củ",
    description: "Dữ liệu minh hoạ — kiểm tra thẻ công thức dạng gọn.",
    imageUrl: null,
    prepMinutes: 10,
    cookMinutes: 5,
    servings: 2,
    difficulty: "easy",
    tags: ["Healthy"],
  },
];

export const MOCK_INGREDIENTS: RecipeIngredient[] = [
  { id: "i1", name: "[MOCK] Bánh phở", amount: "400 g" },
  { id: "i2", name: "[MOCK] Thịt bò", amount: "300 g", note: "thái mỏng" },
  { id: "i3", name: "[MOCK] Hành lá", amount: "1 bó", optional: true },
];

export const MOCK_STEPS: RecipeStep[] = [
  { id: "s1", order: 1, instruction: "[MOCK] Đun sôi nước dùng trong 2 giờ.", durationMinutes: 120 },
  {
    id: "s2",
    order: 2,
    instruction: "[MOCK] Trần bánh phở, xếp thịt bò lên trên.",
    durationMinutes: 5,
    tip: "Dữ liệu minh hoạ, không phải hướng dẫn thật.",
  },
];

export const MOCK_CATEGORIES: RecipeCategory[] = [
  { id: "c1", slug: "mon-nuoc", name: "[MOCK] Món nước", imageUrl: null, recipeCount: 24 },
  { id: "c2", slug: "mon-xao", name: "[MOCK] Món xào", imageUrl: null, recipeCount: 18 },
];

export const MOCK_NUTRITION: NutritionFact[] = [
  { label: "Năng lượng", value: "≈ 420 kcal" },
  { label: "Đạm", value: "≈ 28 g" },
  { label: "Chất béo", value: "≈ 12 g" },
];

export const MOCK_ALLERGENS: Allergen[] = [
  { id: "a1", label: "[MOCK] Đậu phộng" },
  { id: "a2", label: "[MOCK] Hải sản" },
];
