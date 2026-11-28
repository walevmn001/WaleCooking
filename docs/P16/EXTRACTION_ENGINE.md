# P16.2 — RECIPE EXTRACTION ENGINE

> Phase **P16** (thiết kế) · Milestone **P16.2** · 1 AI Agent · Không triển khai code.
> Mục tiêu: đặc tả **pipeline trích xuất công thức** từ HTML/JSON-LD của một URL, với **ưu tiên tầng extractor**, **lưu raw**, và **truy vết nguồn gốc + độ tin cậy** cho từng trường.
> Nguyên tắc gốc: **KHÔNG suy diễn**, **KHÔNG tự tạo định lượng**, **KHÔNG tự chuyển đổi đơn vị**. Dữ liệu thiếu thì để thiếu.
> Liên quan: [SOURCE_DISCOVERY_STRATEGY.md](./SOURCE_DISCOVERY_STRATEGY.md) · [VIETNAMESE_LOCALIZATION.md](./VIETNAMESE_LOCALIZATION.md) · [DATABASE_DESIGN.md](./DATABASE_DESIGN.md) · [SECURITY_LEGAL_RESOURCE_LIMITS.md](./SECURITY_LEGAL_RESOURCE_LIMITS.md).

---

## 1. Vị trí trong luồng

```
URL Import (admin)  ─┐
                     ├─▶ [FETCH]  ─▶ [EXTRACT]  ─▶ [NORMALIZE]  ─▶ [RAW LƯU]  ─▶ chuyển P16.3 (dịch)
Auto Discovery      ─┘   P16.8       P16.2          P16.2          P16.7
```

Trích xuất là **bước đọc** — **không** ghi vào bảng `recipes`. Kết quả trích xuất được lưu vào vùng **staging/raw** (đề xuất `RecipeExtraction`, xem P16.7), chỉ trở thành công thức chính thức khi admin duyệt (P16.6) và gọi `RecipeService.create()` (điểm đến dữ liệu đã xác nhận ở P16.0 §9).

---

## 2. Pipeline trích xuất — thứ tự ưu tiên (bắt buộc)

Mỗi URL đi qua chuỗi **ưu tiên giảm dần**; tầng trên thành công thì **không** cần tầng dưới (trừ khi cần bổ sung trường).

| Bậc | Extractor | Nguồn dữ liệu | Độ tin cậy mặc định | Khi nào dùng |
|---|---|---|---|---|
| **E1** | **JSON-LD Schema.org `Recipe`** | `<script type="application/ld+json">` với `@type: Recipe` (có thể nằm trong `@graph`) | **Cao** (`source_confirmed`) | Mặc định — thử **trước tiên** |
| **E2** | **Metadata có cấu trúc** | `<meta property="og:*">`, microdata (`itemprop`), `twitter:*`, `<title>` | Trung bình (`derived_from_markup`) | Khi không có JSON-LD hoặc thiếu trường |
| **E3** | **HTML parser theo từng website** | Selector/CSS theo adapter của domain (config trong `ImportSource.extractor_config`) | Trung bình (`site_adapter`) | Khi E1/E2 thiếu; site đã có adapter |
| **E4** | **Fallback extractor** | Heuristic chung: `<h1>`→title, `<ul>/<li>` gần từ khoá "nguyên liệu/ingredients", `<ol>/<li>` gần "cách làm/instructions" | Thấp (`heuristic`) | Site chưa có adapter |
| **E5** | **AI-assisted extraction** | Mô hình ngôn ngữ đọc HTML sạch (đã sanitize) để điền trường còn thiếu | Thấp–Trung bình (`ai_assisted`) | Chỉ khi E1–E4 **không đủ**; **luôn** gắn cờ để admin xác minh |

> **Quy tắc:** kết quả mỗi bậc được **hợp nhất có kiểm soát** (bậc cao thắng bậc thấp cho cùng trường), **không** hợp nhất mù. Xung đột giữa các bậc → ghi cả hai và đánh dấu `conflict` cho admin.

### 2.1 Chi tiết E1 — JSON-LD
- Quét **tất cả** `<script type="application/ld+json">`; parse an toàn (try/catch từng khối — block hỏng không làm fail cả trang).
- Hỗ trợ: `Recipe` trực tiếp; mảng `@graph`; `@type` dạng mảng; `mainEntity`.
- Trường schema.org map sang trường WALE:
  - `name` → `originalTitle` (+ gợi ý `title`).
  - `description` → `description`.
  - `recipeIngredient[]` → nguyên liệu **thô** (mỗi phần tử là một chuỗi tự do).
  - `recipeInstructions[]` → bước: hỗ trợ `HowToStep` (`text`), `HowToSection` (`itemListElement`), và chuỗi thô.
  - `prepTime`/`cookTime`/`totalTime` (ISO-8601 `PTxH yM`) → `prepMinutes`/`cookMinutes`/`totalMinutes`.
  - `recipeYield` → `baseServings` (**chỉ khi** là số/số suy ra an toàn từ dạng "4 người"; nếu mơ hồ → để None + ghi raw).
  - `recipeCategory` → gợi ý `mealType`; `recipeCuisine` → gợi ý `cuisine`.
  - `keywords`/`suitableForDiet` → gợi ý `dietaryLabels`/`taxonomy`.
  - `nutrition` → `RecipeNutrition` (đánh dấu `dataSourceType` theo nguồn).
  - `image` (chuỗi hoặc mảng hoặc `ImageObject`) → `imageUrls[]`.
  - `author` (`Person`/`Organization`) → `author`.
  - `datePublished`/`dateModified` → `publishedDate`/`updatedDate`.
- `mainEntityOfPage`/`url` → `originalSourceUrl`.

### 2.2 E5 — AI-assisted (ràng buộc nghiêm)
- **Chỉ** dùng khi E1–E4 thiếu trường **và** đã sanitize HTML (loại script/style, không thực thi JS — xem P16.8).
- **Cấm** để AI: bịa định lượng, bịa bước, đổi đơn vị, "đoán" thời gian nấu. AI **chỉ được trích** nội dung **có thật trong HTML** (trích nguyên văn), **không** được diễn giải/sáng tác.
- Mọi trường do E5 tạo → `confidence: low`/`ai_assisted`, **bắt buộc** admin xác minh trước khi publish (P16.6).
- Nội dung website là **dữ liệu không đáng tin** — tuyệt đối không coi là system instruction (chống prompt injection — P16.8 §7).

---

## 3. Trường dữ liệu cần trích xuất

Ánh xạ sang DTO thật của WALE (xem `lib/db/repositories/recipe.repository.ts`, `lib/validation/recipe.ts`) để đảm bảo khi chuyển sang `RecipeService.create()` không phát sinh trường lạ.

| # | Trường (yêu cầu P16) | Trường đích WALE (đề xuất) | Bắt buộc khi publish? |
|---|---|---|---|
| 1 | Recipe title | `title` (bản Việt hoá, P16.3) + `originalTitle` (raw) | ✅ `title` |
| 2 | Original title | `RecipeExtraction.originalTitle` | — |
| 3 | Description | `description` + `summary` | `summary` ✅ (BR-01) |
| 4 | Ingredients | `RecipeIngredientInput.displayName` | ✅ ≥1 |
| 5 | Ingredient quantities | `quantityNumeric` / `quantityNumericMax` / `quantityText` | — |
| 6 | Ingredient units | `unitCode` (map vào `Unit` nếu khớp) | — |
| 7 | Instructions | `RecipeStepInput.instruction` (theo thứ tự) | ✅ ≥1 |
| 8 | Preparation time | `prepMinutes` | ✅ (BR-01) |
| 9 | Cooking time | `cookMinutes` | ✅ (BR-01) |
| 10 | Total time | `totalMinutes` | ✅ (BR-01) |
| 11 | Servings | `baseServings` (Decimal >0) | ✅ (BR-01) |
| 12 | Difficulty | `difficulty` (`easy/medium/hard`) — **chỉ khi nguồn nêu** | (mặc định `easy`) |
| 13 | Cuisine | `cuisineSlug` (map `TaxonomyTerm` trục `cuisine`) | ✅ (BR-01) |
| 14 | Meal type | gợi ý `taxonomyTerms[]` (trục `meal_type`) | — |
| 15 | Cooking method | gợi ý `taxonomyTerms[]` (trục `cooking_method`) | — |
| 16 | Dietary labels | gợi ý `taxonomyTerms[]` (trục `dietary`) | — |
| 17 | Nutrition | `RecipeNutrition[]` (basis + dưỡng chất + `dataSourceType`) | — (chỉ khi nguồn có) |
| 18 | Image URLs | `imageUrls[]` (raw) → `MediaAsset` nếu được phép (P16.8) | — |
| 19 | Author | `authorOrOrg` (`ContentSource`) | — |
| 20 | Original source URL | `ContentSource.url` / `RecipeExtraction.sourceUrl` | ✅ nguồn (BR-03) |
| 21 | Published/updated date | `RecipeExtraction.publishedDate`/`updatedDate` | — |

> Trường 12–16 là **gợi ý phân loại**: chỉ **map** khi khớp `TaxonomyTerm` đã có; **không** tạo term mới tự động. Nếu không khớp → để `null`/không gán và ghi đề xuất cho admin.

---

## 4. Phân loại trạng thái dữ liệu từng trường (bắt buộc)

Mỗi trường trong kết quả trích xuất mang **một trong các trạng thái** sau — **phân biệt rõ** 3 khái niệm:

| Trạng thái | Ý nghĩa | Ví dụ |
|---|---|---|
| `MISSING` | Nguồn **không cung cấp** trường này | Trang không có `cookTime` |
| `UNREADABLE` | Có **dấu hiệu** nhưng **không đọc được/không parse được** | Có `<ul>` nguyên liệu nhưng HTML vỡ, hoặc JSON-LD sai cú pháp |
| `CONFIRMED` | Nguồn **xác nhận** (parse thành công, giá trị rõ ràng) | `totalTime: PT1H30M` → 90 phút |
| `DERIVED` | **Suy ra có cơ sở từ nguồn** nhưng không nêu trực tiếp (chỉ khi có quy tắc **tin cậy, đã định nghĩa**) | `recipeYield: "Khẩu phần 4"` → 4 |
| `CONFLICT` | Nhiều nguồn trong cùng trang **mâu thuẫn** | JSON-LD nói 30 phút, meta nói 45 phút |

**Quy tắc vàng:**
- `MISSING`/`UNREADABLE` → **KHÔNG** tự điền, **KHÔNG** đoán. Ghi trạng thái để admin biết.
- `DERIVED` **chỉ** áp dụng cho các chuyển đổi **đã định nghĩa & tin cậy** (vd ISO-8601 duration → phút; "4 servings"/"4 người" → 4). **Cấm** suy diễn định lượng nguyên liệu hay thời gian nấu.
- `CONFLICT` → giữ **tất cả** giá trị + nguồn; đẩy vào cảnh báo cho admin; **không** tự chọn.

---

## 5. Mô hình kết quả trích xuất (đề xuất — chưa tạo trong P16)

```ts
// ĐỀ XUẤT — không triển khai ở P16.

type FieldState = "MISSING" | "UNREADABLE" | "CONFIRMED" | "DERIVED" | "CONFLICT";
type ExtractionTier = "jsonld" | "metadata" | "site_adapter" | "heuristic" | "ai_assisted";

interface ProvenancedField<T> {
  value: T | null;
  state: FieldState;
  tier: ExtractionTier;
  /** Đoạn raw (đã cắt ngắn an toàn) làm bằng chứng. */
  evidence?: string;
  /** Nếu CONFLICT: các giá trị thay thế kèm nguồn. */
  alternatives?: { value: T; tier: ExtractionTier; evidence?: string }[];
}

interface ExtractedIngredient {
  rawText: string;              // nguyên văn dòng nguyên liệu
  displayName: string | null;   // đã tách (KHÔNG bịa)
  quantityNumeric: string | null;
  quantityNumericMax: string | null;
  quantityText: string | null;
  unitRaw: string | null;       // đơn vị nguyên văn (KHÔNG quy đổi)
}

interface ExtractedStep {
  rawText: string;
  order: number;
  sectionLabel?: string | null;
}

interface ExtractionResult {
  sourceUrl: string;            // URL gốc đã fetch (sau redirect)
  canonicalUrl: string | null;
  tiersUsed: ExtractionTier[];  // bậc nào đã chạy
  originalTitle: ProvenancedField<string>;
  description: ProvenancedField<string>;
  prepMinutes: ProvenancedField<number>;
  cookMinutes: ProvenancedField<number>;
  totalMinutes: ProvenancedField<number>;
  servings: ProvenancedField<string>;      // giữ chuỗi thập phân (Decimal)
  difficulty: ProvenancedField<"easy" | "medium" | "hard">;
  cuisine: ProvenancedField<string>;
  mealType: ProvenancedField<string[]>;
  cookingMethod: ProvenancedField<string[]>;
  dietaryLabels: ProvenancedField<string[]>;
  nutrition: ProvenancedField<Record<string, unknown>>;
  ingredients: ExtractedIngredient[];
  steps: ExtractedStep[];
  imageUrls: { url: string; alt?: string | null }[];
  author: ProvenancedField<string>;
  publishedDate: ProvenancedField<string>;
  updatedDate: ProvenancedField<string>;
  warnings: ExtractionWarning[];           // cảnh báo dữ liệu cho admin (P16.6)
  rawRef: string;                          // trỏ tới bản raw đã lưu (P16.7)
}
```

> Đây là **hợp đồng dữ liệu** giữa Extractor và tầng review/localization; P16.7 sẽ chuyển thành entity `RecipeExtraction` (JSONB) + quan hệ.

---

## 6. Interface Extractor — kiến trúc adapter (bắt buộc)

Thiết kế để **thêm website mới = thêm 1 adapter**, **không** sửa engine. Áp dụng đúng pattern Ports/Adapters đang dùng trong repo (như `StoragePort`/`getStorage()`).

```ts
// ĐỀ XUẤT — không triển khai ở P16.

interface FetchResult {
  finalUrl: string;        // sau redirect
  status: number;
  contentType: string;
  html: string;            // đã giới hạn kích thước (P16.8)
  fetchedAt: Date;
}

interface RecipeExtractor {
  /** ID duy nhất của adapter (vd "jsonld", "site:example.com", "heuristic", "ai"). */
  readonly id: string;
  /** Bậc ưu tiên (số nhỏ chạy trước) — engine xếp theo bậc. */
  readonly tier: ExtractionTier;
  /** Adapter có xử lý được nguồn này không (vd theo domain/selector). */
  canHandle(ctx: { url: string; domain: string; html: string }): boolean;
  /** Trích xuất (partial — engine hợp nhất với các bậc khác). */
  extract(ctx: { url: string; domain: string; html: string }): Promise<Partial<ExtractionResult>>;
}

interface ExtractionEngine {
  /** Chọn & chạy tập adapter phù hợp theo bậc ưu tiên; hợp nhất có kiểm soát. */
  run(fetch: FetchResult, opts: { adapters?: RecipeExtractor[] }): Promise<ExtractionResult>;
}
```

**Nguyên tắc adapter:**
1. **Registry adapter**: `jsonld` (E1), `metadata` (E2), `heuristic` (E4), `ai` (E5) luôn có; `site:<domain>` (E3) nạp động theo `ImportSource.extractor_config`.
2. Adapter **chỉ đọc** — không gọi mạng, không ghi DB (nhận `html` đã fetch).
3. Adapter **không** throw làm chết pipeline: lỗi trong 1 adapter → ghi `UNREADABLE`/`warnings`, engine tiếp tục bậc khác.
4. Thêm site mới: viết `site:newsite.com` (selector phần nguyên liệu/bước/thời gian) + khai báo trong `ImportSource.extractor_config` → engine tự chọn khi `canHandle` đúng.
5. Adapter theo site **ưu tiên cao hơn heuristic** nhưng **không** ghi đè giá trị `CONFIRMED` từ JSON-LD (không xung đột).

---

## 7. Chuẩn hoá giá trị (Normalize) — giới hạn nghiêm ngặt

Chỉ cho phép các chuẩn hoá **an toàn, không suy diễn**:

| Việc được phép | Việc **BỊ CẤM** |
|---|---|
| ISO-8601 duration → phút (`PT1H30M`→90) | Ước lượng thời gian nấu khi nguồn không nêu |
| Trim/gộp khoảng trắng, chuẩn hoá Unicode | Đổi `"1 cup"`→`"240 ml"` (không có bảng quy đổi tin cậy) |
| Chuẩn hoá URL (bỏ tracking, giữ canonical) | Đổi đơn vị, đổi hệ đo, làm tròn định lượng |
| Tách số/đơn vị **khi dấu hiệu rõ ràng** (`"200 g"`→200 + `g`) | Bịa `quantityNumeric` khi nguyên liệu ghi `"vừa đủ"` → `quantityText` |
| Map `unitRaw`→`Unit.code` **chỉ khi khớp chính xác/từ đồng nghĩa đã duyệt** | Tự tạo `Unit`/`Ingredient` mới |
| Map cuisine/category→`TaxonomyTerm` **chỉ khi khớp term có sẵn** | Tạo term phân loại tự động |

- Đơn vị: nếu **không** khớp `Unit` nào → giữ **nguyên văn** ở `unitRaw`/`quantityText` (hiển thị cho admin), **không** gán `unitCode`.
- Nguyên liệu: nếu có thể khớp `Ingredient` (tên/alias, `pg_trgm`) thì để **đề xuất** khớp; **không** tự liên kết cứng nếu độ tin cậy thấp.
- Thời gian: nếu chỉ có `totalTime` mà thiếu `prep`/`cook` → **không** chia đoán (BR-01 yêu cầu cả ba → cảnh báo cho admin).

---

## 8. Lưu raw extraction (bắt buộc)

- **Luôn** lưu bản trích xuất thô + HTML nguồn (đã giới hạn/sanitize) vào vùng staging để **kiểm tra lại** & tái xử lý khi đổi thuật toán.
- Đề xuất: `RecipeExtraction` giữ `rawHtmlRef`/`rawExtraction` (JSONB) + `engineVersion` + `extractedAt`. **Không** lưu nguyên HTML vào bảng `recipes`.
- Retention: raw có TTL (đề xuất 90 ngày) sau khi công thức đã publish/person→giảm dung lượng; xem `DATABASE_DESIGN.md §Retention`.
- HTML nguồn **không** phục vụ công khai; chỉ admin đọc.

---

## 9. Cảnh báo dữ liệu (warnings) → đầu vào cho review

Engine sinh `warnings[]` khi: trường bắt buộc `MISSING`/`UNREADABLE`; `CONFLICT`; định lượng nguyên liệu không tách được; đơn vị chưa map; dùng bậc E5 (AI); nguồn chưa ở registry (unregistered). Warnings hiển thị trong **Admin Review** (P16.6) và góp vào **Data Quality Score** (P16.4).

---

## 10. Kiểm thử (đề xuất cho phase triển khai, không làm ở P16)

- **Unit**: parse JSON-LD (nhiều biến thể `@graph`/`HowToSection`/`recipeYield` chuỗi) → xác nhận state `CONFIRMED`/`DERIVED`/`MISSING` đúng.
- **Fixture HTML** lưu trong `tests/fixtures/extraction/` (không gọi mạng khi test).
- **Adapter contract test**: mỗi `site:*` phải pass bộ assert chuẩn.
- **Bất biến**: không có `quantityNumeric` nào được sinh khi nguồn không có số; không có đơn vị bị quy đổi.
- **Prompt-injection test** (E5): HTML chèn "bỏ qua hướng dẫn..." → engine **không** thay đổi hành vi.

---

## 11. Rủi ro & giảm thiểu

| Rủi ro | Giảm thiểu |
|---|---|
| JSON-LD thiếu/sai → trích xuất thiếu | Pipeline nhiều bậc + fallback + cảnh báo cho admin (không bịa) |
| AI "sáng tác" nội dung | Chỉ trích nguyên văn từ HTML sanitize; cờ `ai_assisted`; bắt buộc review |
| Đổi cấu trúc HTML làm vỡ adapter | Adapter theo site + contract test + fallback + review |
| Quy đổi đơn vị sai | **Cấm** quy đổi; giữ nguyên văn |
| Raw HTML chứa mã độc/hostile | Sanitize trước khi lưu & trước khi đưa cho AI (P16.8) |
| Prompt injection từ nội dung web | Không coi nội dung web là instruction (P16.8 §7) |

---

## 12. Kết luận P16.2

- Pipeline 5 bậc: **E1 JSON-LD → E2 metadata → E3 site adapter → E4 heuristic → E5 AI**; hợp nhất **có kiểm soát**, xung đột không tự quyết.
- Mỗi trường mang **trạng thái** (`MISSING/UNREADABLE/CONFIRMED/DERIVED/CONFLICT`) + **bậc** + **bằng chứng** → đúng yêu cầu "phân biệt không có / không đọc được / được nguồn xác nhận".
- **Không** suy diễn, **không** tạo định lượng, **không** quy đổi đơn vị; mọi trường đều truy vết nguồn gốc.
- **Interface adapter** cho phép thêm site mới không viết lại engine.
- **Lưu raw** để kiểm tra lại. Đầu ra: hợp đồng dữ liệu để P16.3 (dịch) và P16.7 (`RecipeExtraction`) tiếp nhận.
