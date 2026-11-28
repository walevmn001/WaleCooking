/**
 * Portion Scaling — logic THUẦN cho P09.3.
 *
 * Nguyên tắc (P09 §P09.3, §V.1):
 * - Công thức: `định lượng mới = định lượng gốc × số khẩu phần mới / số khẩu phần gốc`.
 * - CHỈ nhân SỐ, GIỮ NGUYÊN đơn vị. KHÔNG quy đổi khối lượng ↔ thể tích
 *   (không có tỷ trọng đáng tin cậy trong dữ liệu — xem `docs/P09/RECIPE_DATA_AUDIT.md` §4).
 * - Định lượng dạng chữ ("vừa đủ", "tuỳ ý"…) KHÔNG nhân — giữ nguyên.
 * - Không làm tròn gây sai lệch đáng kể: làm tròn tối đa 2 chữ số thập phân.
 *
 * Hàm thuần, không phụ thuộc React/DB → dùng chung server/client và dễ kiểm thử.
 */

import type { RecipeIngredient } from "@/components/recipe/types";

/** Giới hạn số khẩu phần cho phép (tránh giá trị vô lý). */
export const MIN_SERVINGS = 1;
export const MAX_SERVINGS = 100;

/**
 * Hệ số nhân theo khẩu phần. Trả `null` khi dữ liệu không hợp lệ
 * (khẩu phần gốc ≤ 0 hoặc không hữu hạn) → nơi gọi giữ nguyên định lượng gốc.
 */
export function servingFactor(baseServings: number, targetServings: number): number | null {
  if (!Number.isFinite(baseServings) || baseServings <= 0) return null;
  if (!Number.isFinite(targetServings) || targetServings <= 0) return null;
  return targetServings / baseServings;
}

/** Kẹp số khẩu phần vào khoảng hợp lệ, làm tròn về số nguyên ≥ 1. */
export function clampServings(value: number): number {
  if (!Number.isFinite(value)) return MIN_SERVINGS;
  return Math.min(MAX_SERVINGS, Math.max(MIN_SERVINGS, Math.round(value)));
}

/**
 * Phân tích số khẩu phần người dùng nhập. Chấp nhận:
 * - số nguyên / thập phân ("4", "4.5", "4,5");
 * - phân số ("1/2", "3/2").
 * Trả `null` nếu rỗng/không hợp lệ/≤ 0. Nơi gọi nên `clampServings` sau khi kiểm tra.
 */
export function parseServingsInput(raw: string): number | null {
  const text = raw.trim().replace(",", ".");
  if (!text) return null;

  const fraction = /^(\d+(?:\.\d+)?)\s*\/\s*(\d+(?:\.\d+)?)$/.exec(text);
  if (fraction) {
    const numerator = Number(fraction[1]);
    const denominator = Number(fraction[2]);
    if (!Number.isFinite(numerator) || !Number.isFinite(denominator) || denominator === 0) {
      return null;
    }
    const value = numerator / denominator;
    return value > 0 ? value : null;
  }

  if (!/^\d+(?:\.\d+)?$/.test(text)) return null;
  const value = Number(text);
  return Number.isFinite(value) && value > 0 ? value : null;
}

/**
 * Định dạng số định lượng đã nhân: tối đa 2 chữ số thập phân, bỏ số 0 thừa.
 * Tránh "-0". Trả "" nếu không hữu hạn (nơi gọi xử lý).
 */
export function formatScaledNumber(value: number): string {
  if (!Number.isFinite(value)) return "";
  const rounded = Math.round(value * 100) / 100;
  const safe = Object.is(rounded, -0) ? 0 : rounded;
  return String(Number(safe.toFixed(2)));
}

function toNumber(value: string | null | undefined): number | null {
  if (value == null || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function joinUnit(quantity: string, unit: string | null): string {
  return unit ? `${quantity} ${unit}` : quantity;
}

/**
 * Tính định lượng hiển thị SAU khi nhân theo hệ số `factor`.
 *
 * - `factor === 1` (hoặc không hợp lệ) → trả về định lượng gốc đã định dạng (`amount`),
 *   không làm tròn lại để tránh thay đổi ngoài ý muốn.
 * - `quantityType = "text"` → giữ nguyên chữ.
 * - `range` → nhân cả min và max.
 * - `decimal`/`fraction` → nhân số gốc, giữ nguyên đơn vị.
 */
export function scaleIngredientAmount(
  ingredient: RecipeIngredient,
  factor: number,
): string | undefined {
  const q = ingredient.quantityData;
  if (!q || !Number.isFinite(factor) || factor === 1) return ingredient.amount;

  const unit = q.unit ?? null;
  const text = q.text?.trim() || null;

  if (q.type === "text") return text ?? ingredient.amount;

  if (q.type === "range") {
    const min = toNumber(q.numeric);
    const max = toNumber(q.numericMax);
    if (min != null && max != null) {
      return joinUnit(`${formatScaledNumber(min * factor)}–${formatScaledNumber(max * factor)}`, unit);
    }
    if (min != null) return joinUnit(formatScaledNumber(min * factor), unit);
    return text ?? ingredient.amount;
  }

  const value = toNumber(q.numeric);
  if (value != null) return joinUnit(formatScaledNumber(value * factor), unit);
  return text ?? ingredient.amount;
}

/** Nhân toàn bộ danh sách nguyên liệu theo số khẩu phần mục tiêu. */
export function scaleIngredients(
  ingredients: RecipeIngredient[],
  baseServings: number,
  targetServings: number,
): RecipeIngredient[] {
  const factor = servingFactor(baseServings, targetServings);
  if (factor == null) return ingredients;
  return ingredients.map((ingredient) => ({
    ...ingredient,
    amount: scaleIngredientAmount(ingredient, factor),
  }));
}
