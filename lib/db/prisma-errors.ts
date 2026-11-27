import { Prisma } from "@prisma/client";

import { ConflictError, NotFoundError, ValidationError } from "@/lib/errors/app-error";

/**
 * Ánh xạ lỗi Prisma sang lỗi ứng dụng an toàn (P06 §8).
 * Không để lộ chi tiết SQL/constraint ra ngoài.
 */
export function mapPrismaError(error: unknown): never {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case "P2002": {
        const target = (error.meta?.target as string[] | string | undefined) ?? "trường duy nhất";
        const fields = Array.isArray(target) ? target.join(", ") : target;
        throw new ConflictError(`Giá trị đã tồn tại (ràng buộc duy nhất: ${fields}).`);
      }
      case "P2003":
        throw new ConflictError("Thao tác vi phạm ràng buộc khóa ngoại (bản ghi đang được tham chiếu).");
      case "P2025":
        throw new NotFoundError();
      default:
        throw new ValidationError({ database: ["Thao tác dữ liệu không hợp lệ."] });
    }
  }
  throw error;
}
