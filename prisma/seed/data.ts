/**
 * Dữ liệu seed hệ thống cho WALE COOKING (P06 §6).
 *
 * Nguyên tắc:
 * - CHỈ dữ liệu hệ thống / tham chiếu có tính chuẩn (đơn vị đo, taxonomy).
 * - KHÔNG chứa thông tin cá nhân thật.
 * - KHÔNG chứa công thức giả được coi là nội dung đã xuất bản.
 * - Mọi mục đều có khóa duy nhất (code / slug) để seed idempotent.
 *
 * Nguồn dữ liệu chuẩn:
 * - Đơn vị khối lượng/ thể tích SI; lb/oz theo định nghĩa avoirdupois (chính xác).
 * - 14 nhóm dị ứng phổ biến (EU FIC).
 */

// -----------------------------------------------------------------------------
// TAXONOMY
// -----------------------------------------------------------------------------

export interface TermSeed {
  slug: string;
  icon?: string;
  sortOrder?: number;
  /** Tên tiếng Việt (locale mặc định `vi`). */
  vi: string;
  /** Tên tiếng Anh (locale `en`). */
  en: string;
  /** Bí danh phục vụ tìm kiếm. */
  aliases?: string[];
  /** Term con (chỉ với trục phân cấp). */
  children?: TermSeed[];
}

export interface TaxonomyTypeSeed {
  code: string;
  isHierarchical?: boolean;
  isMultiSelect?: boolean;
  isRequired?: boolean;
  sortOrder: number;
  terms: TermSeed[];
}

export const taxonomyTypes: TaxonomyTypeSeed[] = [
  {
    code: "food_type",
    isMultiSelect: false,
    isRequired: true,
    sortOrder: 10,
    terms: [
      { slug: "main_dish", vi: "Món chính", en: "Main dish", sortOrder: 10, aliases: ["món chính"] },
      { slug: "side_dish", vi: "Món phụ", en: "Side dish", sortOrder: 20 },
      { slug: "appetizer", vi: "Khai vị", en: "Appetizer", sortOrder: 30 },
      { slug: "soup", vi: "Canh / Súp", en: "Soup", sortOrder: 40, aliases: ["canh", "súp"] },
      { slug: "salad", vi: "Gỏi / Salad", en: "Salad", sortOrder: 50, aliases: ["gỏi", "nộm"] },
      { slug: "dessert", vi: "Tráng miệng", en: "Dessert", sortOrder: 60, aliases: ["món ngọt"] },
      { slug: "beverage", vi: "Đồ uống", en: "Beverage", sortOrder: 70, aliases: ["thức uống"] },
      { slug: "sauce", vi: "Nước chấm / Sốt", en: "Sauce", sortOrder: 80, aliases: ["sốt", "nước chấm"] },
      { slug: "breakfast", vi: "Món ăn sáng", en: "Breakfast", sortOrder: 90 },
      { slug: "snack", vi: "Ăn vặt", en: "Snack", sortOrder: 100 },
    ],
  },
  {
    code: "cuisine",
    isMultiSelect: false,
    sortOrder: 20,
    terms: [
      { slug: "vietnamese", vi: "Việt Nam", en: "Vietnamese", sortOrder: 10, aliases: ["việt"] },
      { slug: "asian", vi: "Châu Á", en: "Asian", sortOrder: 20 },
      { slug: "western", vi: "Phương Tây", en: "Western", sortOrder: 30 },
      { slug: "fusion", vi: "Fusion", en: "Fusion", sortOrder: 40 },
    ],
  },
  {
    code: "country",
    isHierarchical: true,
    sortOrder: 30,
    terms: [
      { slug: "vietnam", vi: "Việt Nam", en: "Vietnam", sortOrder: 10, aliases: ["vn"] },
      { slug: "thailand", vi: "Thái Lan", en: "Thailand", sortOrder: 20 },
      { slug: "japan", vi: "Nhật Bản", en: "Japan", sortOrder: 30 },
      { slug: "korea", vi: "Hàn Quốc", en: "South Korea", sortOrder: 40 },
      { slug: "china", vi: "Trung Quốc", en: "China", sortOrder: 50 },
      { slug: "france", vi: "Pháp", en: "France", sortOrder: 60 },
      { slug: "italy", vi: "Ý", en: "Italy", sortOrder: 70 },
      { slug: "usa", vi: "Hoa Kỳ", en: "United States", sortOrder: 80 },
    ],
  },
  {
    code: "region",
    isHierarchical: true,
    sortOrder: 40,
    terms: [
      { slug: "northern_vietnam", vi: "Miền Bắc", en: "Northern Vietnam", sortOrder: 10, aliases: ["miền bắc"] },
      { slug: "central_vietnam", vi: "Miền Trung", en: "Central Vietnam", sortOrder: 20, aliases: ["miền trung"] },
      { slug: "southern_vietnam", vi: "Miền Nam", en: "Southern Vietnam", sortOrder: 30, aliases: ["miền nam"] },
    ],
  },
  {
    code: "ingredient_category",
    isHierarchical: true,
    sortOrder: 50,
    terms: [
      { slug: "vegetable", vi: "Rau củ", en: "Vegetable", sortOrder: 10 },
      { slug: "fruit", vi: "Trái cây", en: "Fruit", sortOrder: 20 },
      { slug: "meat", vi: "Thịt", en: "Meat", sortOrder: 30 },
      { slug: "poultry", vi: "Gia cầm", en: "Poultry", sortOrder: 40 },
      { slug: "seafood", vi: "Hải sản", en: "Seafood", sortOrder: 50 },
      { slug: "egg", vi: "Trứng", en: "Egg", sortOrder: 60 },
      { slug: "dairy", vi: "Sữa & chế phẩm", en: "Dairy", sortOrder: 70 },
      { slug: "grain", vi: "Ngũ cốc", en: "Grain", sortOrder: 80 },
      { slug: "legume", vi: "Đậu & họ đậu", en: "Legume", sortOrder: 90 },
      { slug: "herb_spice", vi: "Rau thơm & gia vị", en: "Herb & spice", sortOrder: 100 },
      { slug: "seasoning", vi: "Gia vị nêm", en: "Seasoning", sortOrder: 110 },
      { slug: "sauce", vi: "Nước sốt", en: "Sauce", sortOrder: 120 },
      { slug: "oil_fat", vi: "Dầu & chất béo", en: "Oil & fat", sortOrder: 130 },
      { slug: "sugar_sweetener", vi: "Đường & chất tạo ngọt", en: "Sugar & sweetener", sortOrder: 140 },
      { slug: "nut_seed", vi: "Hạt", en: "Nut & seed", sortOrder: 150 },
      { slug: "beverage", vi: "Đồ uống", en: "Beverage", sortOrder: 160 },
      { slug: "other", vi: "Khác", en: "Other", sortOrder: 999 },
    ],
  },
  {
    code: "cooking_method",
    isMultiSelect: true,
    sortOrder: 60,
    terms: [
      { slug: "stir_fry", vi: "Xào", en: "Stir-fry", sortOrder: 10 },
      { slug: "boil", vi: "Luộc", en: "Boil", sortOrder: 20 },
      { slug: "steam", vi: "Hấp", en: "Steam", sortOrder: 30 },
      { slug: "grill", vi: "Nướng vỉ", en: "Grill", sortOrder: 40 },
      { slug: "bake", vi: "Nướng lò", en: "Bake", sortOrder: 50 },
      { slug: "roast", vi: "Quay", en: "Roast", sortOrder: 60 },
      { slug: "pan_fry", vi: "Chiên áp chảo", en: "Pan-fry", sortOrder: 70 },
      { slug: "deep_fry", vi: "Chiên ngập dầu", en: "Deep-fry", sortOrder: 80 },
      { slug: "simmer", vi: "Ninh nhỏ lửa", en: "Simmer", sortOrder: 90 },
      { slug: "stew", vi: "Hầm", en: "Stew", sortOrder: 100 },
      { slug: "braise", vi: "Kho", en: "Braise", sortOrder: 110 },
      { slug: "marinate", vi: "Ướp", en: "Marinate", sortOrder: 120 },
      { slug: "mix", vi: "Trộn", en: "Mix", sortOrder: 130 },
      { slug: "raw", vi: "Ăn sống", en: "Raw", sortOrder: 140 },
    ],
  },
  {
    code: "meal_type",
    isMultiSelect: true,
    sortOrder: 70,
    terms: [
      { slug: "breakfast", vi: "Bữa sáng", en: "Breakfast", sortOrder: 10 },
      { slug: "lunch", vi: "Bữa trưa", en: "Lunch", sortOrder: 20 },
      { slug: "dinner", vi: "Bữa tối", en: "Dinner", sortOrder: 30 },
      { slug: "snack", vi: "Bữa phụ", en: "Snack", sortOrder: 40 },
      { slug: "dessert", vi: "Tráng miệng", en: "Dessert", sortOrder: 50 },
    ],
  },
  {
    code: "dietary_preference",
    isMultiSelect: true,
    sortOrder: 80,
    terms: [
      { slug: "vegetarian", vi: "Ăn chay", en: "Vegetarian", sortOrder: 10, aliases: ["chay"] },
      { slug: "vegan", vi: "Thuần chay", en: "Vegan", sortOrder: 20 },
      { slug: "gluten_free", vi: "Không gluten", en: "Gluten-free", sortOrder: 30 },
      { slug: "dairy_free", vi: "Không sữa", en: "Dairy-free", sortOrder: 40 },
      { slug: "low_carb", vi: "Ít tinh bột", en: "Low-carb", sortOrder: 50 },
      { slug: "low_sodium", vi: "Ít muối", en: "Low-sodium", sortOrder: 60 },
      { slug: "high_protein", vi: "Giàu đạm", en: "High-protein", sortOrder: 70 },
      { slug: "pescatarian", vi: "Ăn hải sản", en: "Pescatarian", sortOrder: 80 },
    ],
  },
  {
    code: "allergen",
    isMultiSelect: true,
    sortOrder: 90,
    terms: [
      { slug: "gluten", vi: "Gluten (lúa mì)", en: "Gluten", sortOrder: 10, aliases: ["lúa mì", "bột mì"] },
      { slug: "crustacean", vi: "Giáp xác (tôm, cua)", en: "Crustaceans", sortOrder: 20, aliases: ["tôm", "cua"] },
      { slug: "egg", vi: "Trứng", en: "Egg", sortOrder: 30 },
      { slug: "fish", vi: "Cá", en: "Fish", sortOrder: 40 },
      { slug: "peanut", vi: "Đậu phộng", en: "Peanut", sortOrder: 50, aliases: ["lạc"] },
      { slug: "soy", vi: "Đậu nành", en: "Soybean", sortOrder: 60, aliases: ["đậu tương"] },
      { slug: "milk", vi: "Sữa", en: "Milk", sortOrder: 70 },
      { slug: "tree_nut", vi: "Hạt cây (hạnh nhân, óc chó)", en: "Tree nuts", sortOrder: 80 },
      { slug: "celery", vi: "Cần tây", en: "Celery", sortOrder: 90 },
      { slug: "mustard", vi: "Mù tạt", en: "Mustard", sortOrder: 100 },
      { slug: "sesame", vi: "Vừng (mè)", en: "Sesame", sortOrder: 110, aliases: ["mè"] },
      { slug: "sulphite", vi: "Sunfit", en: "Sulphites", sortOrder: 120 },
      { slug: "lupin", vi: "Đậu lupin", en: "Lupin", sortOrder: 130 },
      { slug: "mollusc", vi: "Thân mềm (nghêu, sò, mực)", en: "Molluscs", sortOrder: 140, aliases: ["nghêu", "sò", "mực"] },
    ],
  },
];

// -----------------------------------------------------------------------------
// UNITS
// -----------------------------------------------------------------------------

export interface UnitSeed {
  code: string;
  dimension: "mass" | "volume" | "count" | "custom";
  isBase?: boolean;
  sortOrder: number;
  vi: string;
  en: string;
  viSymbol?: string;
  enSymbol?: string;
}

export const units: UnitSeed[] = [
  // Khối lượng (base: g)
  { code: "g", dimension: "mass", isBase: true, sortOrder: 10, vi: "gam", en: "gram", viSymbol: "g", enSymbol: "g" },
  { code: "kg", dimension: "mass", sortOrder: 20, vi: "kilôgam", en: "kilogram", viSymbol: "kg", enSymbol: "kg" },
  { code: "mg", dimension: "mass", sortOrder: 30, vi: "miligam", en: "milligram", viSymbol: "mg", enSymbol: "mg" },
  { code: "oz", dimension: "mass", sortOrder: 40, vi: "ao-xơ", en: "ounce", viSymbol: "oz", enSymbol: "oz" },
  { code: "lb", dimension: "mass", sortOrder: 50, vi: "pound", en: "pound", viSymbol: "lb", enSymbol: "lb" },
  // Thể tích (base: ml)
  { code: "ml", dimension: "volume", isBase: true, sortOrder: 60, vi: "mililít", en: "millilitre", viSymbol: "ml", enSymbol: "ml" },
  { code: "l", dimension: "volume", sortOrder: 70, vi: "lít", en: "litre", viSymbol: "l", enSymbol: "l" },
  { code: "tsp", dimension: "volume", sortOrder: 80, vi: "thìa cà phê", en: "teaspoon", viSymbol: "tsp", enSymbol: "tsp" },
  { code: "tbsp", dimension: "volume", sortOrder: 90, vi: "thìa canh", en: "tablespoon", viSymbol: "tbsp", enSymbol: "tbsp" },
  { code: "cup", dimension: "volume", sortOrder: 100, vi: "cốc", en: "cup", viSymbol: "cup", enSymbol: "cup" },
  { code: "fl_oz", dimension: "volume", sortOrder: 110, vi: "ao-xơ chất lỏng", en: "fluid ounce", viSymbol: "fl oz", enSymbol: "fl oz" },
  // Đếm (base: piece)
  { code: "piece", dimension: "count", isBase: true, sortOrder: 120, vi: "cái", en: "piece", viSymbol: "cái", enSymbol: "pc" },
  { code: "clove", dimension: "count", sortOrder: 130, vi: "tép", en: "clove", viSymbol: "tép", enSymbol: "clove" },
  { code: "slice", dimension: "count", sortOrder: 140, vi: "lát", en: "slice", viSymbol: "lát", enSymbol: "slice" },
  { code: "bunch", dimension: "count", sortOrder: 150, vi: "bó", en: "bunch", viSymbol: "bó", enSymbol: "bunch" },
  { code: "stalk", dimension: "count", sortOrder: 160, vi: "cây", en: "stalk", viSymbol: "cây", enSymbol: "stalk" },
  { code: "sprig", dimension: "count", sortOrder: 170, vi: "nhánh nhỏ", en: "sprig", viSymbol: "nhánh", enSymbol: "sprig" },
  { code: "can", dimension: "count", sortOrder: 180, vi: "lon", en: "can", viSymbol: "lon", enSymbol: "can" },
  { code: "pack", dimension: "count", sortOrder: 190, vi: "gói", en: "pack", viSymbol: "gói", enSymbol: "pack" },
  // Tùy biến (không quy đổi)
  { code: "pinch", dimension: "custom", sortOrder: 200, vi: "nhúm", en: "pinch", viSymbol: "nhúm", enSymbol: "pinch" },
  { code: "to_taste", dimension: "custom", sortOrder: 210, vi: "vừa đủ", en: "to taste" },
  { code: "as_needed", dimension: "custom", sortOrder: 220, vi: "tùy ý", en: "as needed" },
];

/** Quy đổi chỉ giữa các đơn vị CÙNG chiều. Hệ số lấy theo định nghĩa chuẩn. */
export interface UnitConversionSeed {
  from: string;
  to: string;
  factor: string;
  note: string;
}

export const unitConversions: UnitConversionSeed[] = [
  { from: "kg", to: "g", factor: "1000", note: "SI: 1 kg = 1000 g" },
  { from: "mg", to: "g", factor: "0.001", note: "SI: 1000 mg = 1 g" },
  { from: "lb", to: "g", factor: "453.59237", note: "Avoirdupois: 1 lb = 453.59237 g (định nghĩa chính xác)" },
  { from: "oz", to: "g", factor: "28.349523125", note: "Avoirdupois: 1 oz = 28.349523125 g (định nghĩa chính xác)" },
  { from: "l", to: "ml", factor: "1000", note: "SI: 1 l = 1000 ml" },
];

// -----------------------------------------------------------------------------
// EQUIPMENT (thiết bị cơ bản)
// -----------------------------------------------------------------------------

export interface EquipmentSeed {
  slug: string;
  vi: string;
  en: string;
  icon?: string;
}

export const equipment: EquipmentSeed[] = [
  { slug: "wok", vi: "Chảo wok", en: "Wok" },
  { slug: "frying_pan", vi: "Chảo chiên", en: "Frying pan" },
  { slug: "pot", vi: "Nồi", en: "Pot" },
  { slug: "steamer", vi: "Nồi hấp", en: "Steamer" },
  { slug: "oven", vi: "Lò nướng", en: "Oven" },
  { slug: "blender", vi: "Máy xay", en: "Blender" },
  { slug: "knife", vi: "Dao", en: "Knife" },
  { slug: "cutting_board", vi: "Thớt", en: "Cutting board" },
  { slug: "rice_cooker", vi: "Nồi cơm điện", en: "Rice cooker" },
  { slug: "colander", vi: "Rổ rá", en: "Colander" },
];

// -----------------------------------------------------------------------------
// INGREDIENT (dữ liệu nền — CHỈ tên/định danh, không định lượng, không công thức)
// -----------------------------------------------------------------------------

export interface IngredientSeed {
  slug: string;
  vi: string;
  en: string;
  /** slug term trong trục `ingredient_category`. */
  category: string;
  isCommon?: boolean;
}

export const ingredients: IngredientSeed[] = [
  { slug: "rice", vi: "Gạo", en: "Rice", category: "grain", isCommon: true },
  { slug: "rice-noodle", vi: "Bún", en: "Rice vermicelli", category: "grain", isCommon: true },
  { slug: "pho-noodle", vi: "Bánh phở", en: "Flat rice noodle", category: "grain" },
  { slug: "wheat-flour", vi: "Bột mì", en: "Wheat flour", category: "grain" },
  { slug: "pork", vi: "Thịt heo", en: "Pork", category: "meat", isCommon: true },
  { slug: "beef", vi: "Thịt bò", en: "Beef", category: "meat", isCommon: true },
  { slug: "chicken", vi: "Thịt gà", en: "Chicken", category: "poultry", isCommon: true },
  { slug: "duck", vi: "Thịt vịt", en: "Duck", category: "poultry" },
  { slug: "shrimp", vi: "Tôm", en: "Shrimp", category: "seafood", isCommon: true },
  { slug: "fish-sauce", vi: "Nước mắm", en: "Fish sauce", category: "seasoning", isCommon: true },
  { slug: "soy-sauce", vi: "Nước tương", en: "Soy sauce", category: "seasoning", isCommon: true },
  { slug: "sugar", vi: "Đường", en: "Sugar", category: "sugar_sweetener", isCommon: true },
  { slug: "salt", vi: "Muối", en: "Salt", category: "seasoning", isCommon: true },
  { slug: "black-pepper", vi: "Tiêu đen", en: "Black pepper", category: "herb_spice", isCommon: true },
  { slug: "garlic", vi: "Tỏi", en: "Garlic", category: "herb_spice", isCommon: true },
  { slug: "shallot", vi: "Hành tím", en: "Shallot", category: "herb_spice", isCommon: true },
  { slug: "scallion", vi: "Hành lá", en: "Scallion", category: "vegetable", isCommon: true },
  { slug: "cilantro", vi: "Ngò rí", en: "Cilantro", category: "herb_spice", isCommon: true },
  { slug: "lemon-grass", vi: "Sả", en: "Lemongrass", category: "herb_spice" },
  { slug: "ginger", vi: "Gừng", en: "Ginger", category: "herb_spice" },
  { slug: "chili", vi: "Ớt", en: "Chili", category: "vegetable" },
  { slug: "lime", vi: "Chanh", en: "Lime", category: "fruit" },
  { slug: "tomato", vi: "Cà chua", en: "Tomato", category: "vegetable", isCommon: true },
  { slug: "onion", vi: "Hành tây", en: "Onion", category: "vegetable", isCommon: true },
  { slug: "carrot", vi: "Cà rốt", en: "Carrot", category: "vegetable" },
  { slug: "potato", vi: "Khoai tây", en: "Potato", category: "vegetable" },
  { slug: "cabbage", vi: "Bắp cải", en: "Cabbage", category: "vegetable" },
  { slug: "morning-glory", vi: "Rau muống", en: "Water spinach", category: "vegetable" },
  { slug: "tofu", vi: "Đậu hũ", en: "Tofu", category: "legume", isCommon: true },
  { slug: "egg", vi: "Trứng gà", en: "Chicken egg", category: "egg", isCommon: true },
  { slug: "cooking-oil", vi: "Dầu ăn", en: "Cooking oil", category: "oil_fat", isCommon: true },
  { slug: "coconut-milk", vi: "Nước cốt dừa", en: "Coconut milk", category: "beverage" },
  { slug: "peanut", vi: "Đậu phộng", en: "Peanut", category: "nut_seed" },
  { slug: "sesame", vi: "Vừng", en: "Sesame", category: "nut_seed" },
  { slug: "rice-paper", vi: "Bánh tráng", en: "Rice paper", category: "grain" },
  { slug: "vermicelli", vi: "Miến", en: "Glass noodle", category: "grain" },
  { slug: "mushroom", vi: "Nấm", en: "Mushroom", category: "vegetable" },
  { slug: "green-bean", vi: "Đậu que", en: "Green bean", category: "vegetable" },
  { slug: "bitter-melon", vi: "Khổ qua", en: "Bitter melon", category: "vegetable" },
  { slug: "fish", vi: "Cá", en: "Fish", category: "seafood" },
];
