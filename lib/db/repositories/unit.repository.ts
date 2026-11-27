import type { UnitDimension } from "@prisma/client";

/** Đơn vị đo đã ánh xạ sang DTO gọn cho tầng trên. */
export interface UnitDto {
  id: string;
  code: string;
  dimension: UnitDimension;
  isBase: boolean;
  sortOrder: number;
  /** Tên theo locale (fallback về `code` nếu thiếu bản dịch). */
  name: string;
  symbol: string | null;
}

export interface UnitConversionDto {
  toUnitCode: string;
  factor: string;
}

export interface UnitRepository {
  list(locale: string): Promise<UnitDto[]>;
  findByCode(code: string, locale: string): Promise<UnitDto | null>;
  exists(code: string): Promise<boolean>;
  listConversionsFrom(fromCode: string): Promise<UnitConversionDto[]>;
}
