/**
 * Quy đổi đơn vị đo cho nấu ăn (P10.2) — logic THUẦN, tách khỏi UI.
 *
 * Nguyên tắc CHÍNH XÁC (bắt buộc):
 * - CHỈ quy đổi khi có HỆ SỐ XÁC ĐỊNH. Không suy diễn khối lượng ↔ thể tích (thiếu tỷ trọng).
 * - KHÔNG trộn các nhóm khác đại lượng (khối lượng ≠ thể tích ≠ nhiệt độ ≠ đếm).
 * - Đơn vị đếm (cái/quả/miếng/muỗng/chén…) KHÔNG quy đổi lẫn nhau vì không có khối lượng cố định.
 * - Nhiệt độ dùng ĐÚNG công thức chuyển đổi (°C ↔ °F).
 *
 * Nguồn hệ số (truy xuất được, cùng chuẩn với dữ liệu seed P06 `prisma/seed/data.ts`):
 * - Khối lượng (cơ sở g): kg=1000, mg=0.001, oz=28.349523125 (avoirdupois), lb=453.59237 (avoirdupois).
 * - Thể tích (cơ sở ml): l=1000; tsp/tbsp/fl oz/cup theo định nghĩa US customary:
 *   1 tsp = 4.92892159375 ml; 1 tbsp = 3 tsp = 14.78676478125 ml; 1 fl oz = 2 tbsp = 29.5735295625 ml;
 *   1 cup (US) = 8 fl oz = 236.5882365 ml. Thêm "metric cup" = 250 ml (tách biệt để không lẫn US/metric).
 */

export type UnitDimension = "mass" | "volume" | "temperature" | "count" | "custom";

export interface UnitDefinition {
  code: string;
  /** Nhãn tiếng Việt. */
  name: string;
  symbol: string;
  dimension: UnitDimension;
  /**
   * Hệ số quy về đơn vị cơ sở của nhóm (khối lượng → gam; thể tích → mililít).
   * `null` với nhiệt độ (dùng công thức) và đơn vị đếm/tùy biến (không quy đổi).
   */
  toBase: number | null;
  /** Ghi chú nguồn/định nghĩa hệ số (bắt buộc với mọi hệ số ≠ 1). */
  source?: string;
}

export const UNIT_DEFINITIONS: UnitDefinition[] = [
  // Khối lượng — cơ sở gam
  { code: "g", name: "gam", symbol: "g", dimension: "mass", toBase: 1 },
  { code: "kg", name: "kilôgam", symbol: "kg", dimension: "mass", toBase: 1000, source: "SI: 1 kg = 1000 g" },
  { code: "mg", name: "miligam", symbol: "mg", dimension: "mass", toBase: 0.001, source: "SI: 1000 mg = 1 g" },
  { code: "oz", name: "ao-xơ", symbol: "oz", dimension: "mass", toBase: 28.349523125, source: "Avoirdupois: 1 oz = 28.349523125 g" },
  { code: "lb", name: "pound", symbol: "lb", dimension: "mass", toBase: 453.59237, source: "Avoirdupois: 1 lb = 453.59237 g" },
  // Thể tích — cơ sở mililít
  { code: "ml", name: "mililít", symbol: "ml", dimension: "volume", toBase: 1 },
  { code: "l", name: "lít", symbol: "l", dimension: "volume", toBase: 1000, source: "SI: 1 l = 1000 ml" },
  { code: "tsp", name: "thìa cà phê", symbol: "tsp", dimension: "volume", toBase: 4.92892159375, source: "US customary: 1 tsp = 4.92892159375 ml" },
  { code: "tbsp", name: "thìa canh", symbol: "tbsp", dimension: "volume", toBase: 14.78676478125, source: "US customary: 1 tbsp = 3 tsp" },
  { code: "fl_oz", name: "ao-xơ chất lỏng", symbol: "fl oz", dimension: "volume", toBase: 29.5735295625, source: "US customary: 1 fl oz = 2 tbsp" },
  { code: "cup", name: "cốc (US)", symbol: "cup", dimension: "volume", toBase: 236.5882365, source: "US customary: 1 cup = 8 fl oz" },
  { code: "metric_cup", name: "cốc (metric)", symbol: "cốc", dimension: "volume", toBase: 250, source: "Metric: 1 cốc = 250 ml" },
  // Nhiệt độ — dùng công thức (không dùng hệ số)
  { code: "c", name: "độ C", symbol: "°C", dimension: "temperature", toBase: null },
  { code: "f", name: "độ F", symbol: "°F", dimension: "temperature", toBase: null },
  // Đếm — KHÔNG quy đổi lẫn nhau (chỉ giữ nguyên khi cùng đơn vị)
  { code: "piece", name: "cái", symbol: "cái", dimension: "count", toBase: null },
  { code: "clove", name: "tép", symbol: "tép", dimension: "count", toBase: null },
  { code: "slice", name: "lát", symbol: "lát", dimension: "count", toBase: null },
  { code: "bunch", name: "bó", symbol: "bó", dimension: "count", toBase: null },
  { code: "stalk", name: "cây", symbol: "cây", dimension: "count", toBase: null },
  { code: "sprig", name: "nhánh nhỏ", symbol: "nhánh", dimension: "count", toBase: null },
  { code: "can", name: "lon", symbol: "lon", dimension: "count", toBase: null },
  { code: "pack", name: "gói", symbol: "gói", dimension: "count", toBase: null },
  // Tùy biến — không quy đổi
  { code: "pinch", name: "nhúm", symbol: "nhúm", dimension: "custom", toBase: null },
  { code: "to_taste", name: "vừa đủ", symbol: "vừa đủ", dimension: "custom", toBase: null },
  { code: "as_needed", name: "tùy ý", symbol: "tùy ý", dimension: "custom", toBase: null },
];

const UNIT_BY_CODE = new Map(UNIT_DEFINITIONS.map((unit) => [unit.code, unit]));

/** Giá trị tuyệt đối tối đa chấp nhận (chống tràn/sai số vô nghĩa). */
export const MAX_INPUT_VALUE = 1e12;

export function getUnit(code: string): UnitDefinition | null {
  return UNIT_BY_CODE.get(code) ?? null;
}

export function unitsByDimension(dimension: UnitDimension): UnitDefinition[] {
  return UNIT_DEFINITIONS.filter((unit) => unit.dimension === dimension);
}

/** Danh sách đơn vị có thể quy đổi TỚI (cùng nhóm, khác mã). Đếm/tùy biến → rỗng. */
export function convertibleTargets(fromCode: string): UnitDefinition[] {
  const from = getUnit(fromCode);
  if (!from || from.dimension === "count" || from.dimension === "custom") return [];
  return unitsByDimension(from.dimension).filter((unit) => unit.code !== from.code);
}

export type ConversionErrorCode =
  | "invalid_input"
  | "unknown_unit"
  | "incompatible"
  | "not_convertible";

export interface ConversionSuccess {
  ok: true;
  value: number;
  from: UnitDefinition;
  to: UnitDefinition;
}

export interface ConversionFailure {
  ok: false;
  code: ConversionErrorCode;
  message: string;
}

export type ConversionResult = ConversionSuccess | ConversionFailure;

/** Công thức nhiệt độ — °C ↔ °F. */
export function convertTemperature(value: number, from: "c" | "f", to: "c" | "f"): number {
  if (from === to) return value;
  return from === "c" ? (value * 9) / 5 + 32 : ((value - 32) * 5) / 9;
}

/**
 * Quy đổi `value` từ `fromCode` sang `toCode`.
 * Trả về kết quả có cấu trúc; KHÔNG ném lỗi. Mọi trường hợp không hợp lệ đều nêu rõ lý do.
 */
export function convertUnit(value: number, fromCode: string, toCode: string): ConversionResult {
  const from = getUnit(fromCode);
  const to = getUnit(toCode);
  if (!from || !to) {
    return { ok: false, code: "unknown_unit", message: "Đơn vị không xác định." };
  }
  if (!Number.isFinite(value)) {
    return { ok: false, code: "invalid_input", message: "Vui lòng nhập một số hợp lệ." };
  }
  if (Math.abs(value) > MAX_INPUT_VALUE) {
    return { ok: false, code: "invalid_input", message: "Giá trị quá lớn để quy đổi an toàn." };
  }
  if (from.dimension !== to.dimension) {
    return {
      ok: false,
      code: "incompatible",
      message: "Không thể quy đổi giữa hai nhóm đơn vị khác đại lượng.",
    };
  }

  // Nhiệt độ cho phép số âm (dùng công thức).
  if (from.dimension === "temperature") {
    if (from.code !== "c" && from.code !== "f") {
      return { ok: false, code: "not_convertible", message: "Đơn vị nhiệt độ không được hỗ trợ." };
    }
    const converted = convertTemperature(value, from.code as "c" | "f", to.code as "c" | "f");
    return { ok: true, value: converted, from, to };
  }

  // Khối lượng / thể tích / đếm / tùy biến: không cho số âm.
  if (value < 0) {
    return { ok: false, code: "invalid_input", message: "Giá trị không được là số âm." };
  }

  if (from.dimension === "count" || from.dimension === "custom") {
    if (from.code !== to.code) {
      return {
        ok: false,
        code: "not_convertible",
        message:
          "Không có hệ số quy đổi giữa các đơn vị đếm khác nhau (mỗi đơn vị không có khối lượng cố định).",
      };
    }
    return { ok: true, value, from, to };
  }

  // Khối lượng / thể tích: cần hệ số về đơn vị cơ sở.
  if (from.toBase == null || to.toBase == null) {
    return { ok: false, code: "not_convertible", message: "Không có hệ số quy đổi cho đơn vị này." };
  }
  return { ok: true, value: (value * from.toBase) / to.toBase, from, to };
}

/**
 * Phân tích chuỗi nhập thành số. Trả `null` nếu rỗng/không phải số.
 * Chấp nhận dấu phẩy thập phân (ví dụ "1,5" → 1.5).
 */
export function parseAmountInput(input: string): number | null {
  const trimmed = input.trim().replace(",", ".");
  if (trimmed === "") return null;
  const value = Number(trimmed);
  return Number.isFinite(value) ? value : null;
}

/** Định dạng số kết quả: bỏ nhiễu dấu phẩy động, tối đa 6 chữ số thập phân. */
export function formatConvertedValue(value: number): string {
  if (!Number.isFinite(value)) return "—";
  const rounded = Number(value.toFixed(6));
  return String(rounded);
}

/** Định dạng hiển thị "số + ký hiệu đơn vị". */
export function formatWithUnit(value: number, code: string): string {
  const unit = getUnit(code);
  return unit ? `${formatConvertedValue(value)} ${unit.symbol}` : formatConvertedValue(value);
}
