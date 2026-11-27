# P06 — REPOSITORY ARCHITECTURE

> Kiến trúc lớp truy cập dữ liệu & nghiệp vụ (Database → Repository → Service → API → UI).
> Cập nhật: 2026-11-28 (P06).

---

## 1. Phân lớp (theo P02 — D-P02-01)

```
UI (React/Next components)
        │  KHÔNG import Prisma, KHÔNG gọi DB trực tiếp
        ▼
API layer (Route Handlers / Server Actions)   ← P07
        │  gọi service, không chứa SQL
        ▼
Service layer (nghiệp vụ)                      ← lib/services
        │  authorization + validation + transaction
        ▼
Repository (ports + adapter Prisma)            ← lib/db/repositories
        │  chỉ Prisma; trả DTO, không trả model thô ra UI
        ▼
Prisma Client singleton                        ← lib/db/prisma.ts
        ▼
PostgreSQL (Neon)
```

**Quy tắc bắt buộc:**
- Component React **không** gọi Prisma trực tiếp (P06 §7).
- Repository **không** chứa logic nghiệp vụ; chỉ ánh xạ dữ liệu và truy vấn.
- Service **không** viết câu truy vấn Prisma thô; gọi qua repository interface.
- **Ports & Adapters** chỉ ở điểm cần thay thế (DB/Storage/Search/Mail) — không DDD đầy đủ.

---

## 2. Prisma client dùng chung

`lib/db/prisma.ts`:
- `import "server-only"` → chặn bundle vào client.
- Singleton qua `globalThis.__walePrisma` → **tránh nhiều `PrismaClient`** khi hot-reload ở dev.
- Log chỉ `warn`/`error` (không log query → hạn chế lộ dữ liệu).
- Gọi `serverEnv()` để xác thực biến môi trường trước khi khởi tạo.

---

## 3. Repository (ports + adapter)

`lib/db/repositories/index.ts` xuất cổng `repositories` đã gắn adapter Prisma:

```ts
export const repositories = {
  unit: new PrismaUnitRepository(prisma),
  taxonomy: new PrismaTaxonomyRepository(prisma),
  ingredient: new PrismaIngredientRepository(prisma),
};
```

| Port (interface) | Adapter (Prisma) | Trách nhiệm chính |
| --- | --- | --- |
| `UnitRepository` | `PrismaUnitRepository` | `list(locale)`, `findByCode`, `exists`, `listConversionsFrom` |
| `TaxonomyRepository` | `PrismaTaxonomyRepository` | `listTypes`, `findType`, `listTerms`, `findTerm`, `countTerms`, `createTerm`, `deleteTermById`, `findTermIdsBySlugs` |
| `IngredientRepository` | `PrismaIngredientRepository` | `list(options)`, `findBySlug`, `createWithTranslation`, `countAll` |

**DTO:** mỗi repository định nghĩa DTO riêng (`UnitDto`, `TaxonomyTermDto`, `IngredientDto`, …) để
tầng trên không phụ thuộc kiểu model Prisma. Các kiểu `*Input`, `*Options` cũng export từ interface.

**Điểm đáng chú ý:**
- `PrismaIngredientRepository.createWithTranslation` bọc trong `this.db.$transaction(async (tx) => …)`
  → tạo nguyên liệu + bản dịch **nguyên tử**.
- `list` dùng `$transaction([...])` cho truy vấn đếm + lấy dữ liệu cùng thời điểm.
- Repository **không** tự kiểm quyền — quyền do service quyết định.

---

## 4. Service layer

`lib/services/catalog.service.ts` — `CatalogService`:

| Phương thức | Quyền | Ghi chú |
| --- | --- | --- |
| `listUnits` / `listTaxonomyTypes` / `listTaxonomyTerms` / `listIngredients` | công khai (đọc) | dữ liệu tham chiếu công khai |
| `createTaxonomyTerm(actor, raw)` | `requirePermission(actor, "taxonomy:manage")` | validate + kiểm tra type tồn tại |
| `createIngredient(actor, raw)` | `requirePermission(actor, "taxonomy:manage")` | validate + kiểm tra category term |

Trình tự trong mỗi thao tác ghi: **authorize → validate (Zod) → kiểm quan hệ → thực thi → map lỗi
Prisma** (`mapPrismaError`). `constructor(deps = repositories)` cho phép tiêm phụ thuộc (test).

`export const catalogService = new CatalogService();`

---

## 5. Validation & lỗi

- `lib/validation/common.ts`: `formatZodIssues`, `parseInput<T>(schema, raw)` (ném `ValidationError`),
  `uuidSchema`, `slugSchema`, `localeSchema`, `paginationSchema`, `Paginated<T>`, `paginate`, `toOffset`.
- `lib/validation/catalog.ts`: `createTaxonomyTermSchema`, `createIngredientSchema`.
- `lib/errors/app-error.ts`: `AppError` + `ValidationError(422)`, `NotFoundError(404)`,
  `ForbiddenError(403)`, `UnauthorizedError(401)`, `ConflictError(409)`, `toErrorResponse()`.
- `lib/db/prisma-errors.ts`: `mapPrismaError` — `P2002`→`ConflictError` (kèm tên trường),
  `P2003`/`P2025`→`Conflict`/`NotFound`, còn lại→`ValidationError`. **Không** lộ SQL/stack.

---

## 6. Transaction & tính nhất quán

- Thao tác nhiều bảng liên quan (ví dụ `createWithTranslation`) → `$transaction` (interactive) để
  **toàn bộ thành công hoặc rollback**.
- Đọc nhiều truy vấn cần nhất quán → `$transaction([...])`.
- Không để trạng thái "cập nhật một nửa" (đặc biệt quan trọng ở P07 với recipe + ingredients + steps).

---

## 7. Vì sao chưa có repository Recipe ở P06

Repository P06 chỉ phục vụ **dữ liệu tham chiếu** (unit/taxonomy/ingredient) — đủ để chứng minh kiến
trúc và phục vụ seed/kiểm thử. Repository/Service cho **Recipe** được thêm ở **P07** theo đúng cùng
mẫu (port interface + adapter Prisma + service nghiệp vụ).

---

## 8. Tham chiếu mã nguồn

- [lib/db/prisma.ts](../../lib/db/prisma.ts)
- [lib/db/repositories/](../../lib/db/repositories/)
- [lib/services/catalog.service.ts](../../lib/services/catalog.service.ts)
- [lib/validation/common.ts](../../lib/validation/common.ts) · [catalog.ts](../../lib/validation/catalog.ts)
- [lib/errors/app-error.ts](../../lib/errors/app-error.ts) · [lib/db/prisma-errors.ts](../../lib/db/prisma-errors.ts)
