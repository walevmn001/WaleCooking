import type { NextRequest } from "next/server";

import { handle, jsonOk } from "@/lib/api/http";
import { recipeService } from "@/lib/services";

/**
 * `GET /api/v1/kitchen/ingredient-match` — tìm công thức theo nguyên liệu người dùng đang có (P10.3).
 *
 * Tham số (chấp nhận một trong hai, hoặc kết hợp):
 * - `q`: danh sách nguyên liệu phân tách bằng dấu phẩy (ví dụ `q=trứng,cà chua,hành lá`).
 * - `ingredient`: lặp lại nhiều lần (ví dụ `?ingredient=trứng&ingredient=cà chua`).
 *
 * CHỈ trả công thức công khai có trong dữ liệu; mỗi kết quả kèm nguyên liệu ĐÃ có, CÒN thiếu
 * và tỷ lệ khớp tính từ dữ liệu thực. Không tạo công thức mới, không dùng dịch vụ AI/trả phí.
 */
export async function GET(request: NextRequest): Promise<Response> {
  return handle(async () => {
    const params = request.nextUrl.searchParams;
    const fromQ = (params.get("q") ?? "")
      .split(",")
      .map((part) => part.trim())
      .filter(Boolean);
    const repeated = params.getAll("ingredient").map((part) => part.trim()).filter(Boolean);
    const ingredients = [...fromQ, ...repeated];

    const results = await recipeService.matchByIngredients(ingredients);
    return jsonOk({ ingredients, count: results.length, results });
  });
}
