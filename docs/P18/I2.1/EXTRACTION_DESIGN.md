# I2.1 — EXTRACTION DESIGN (Thiết kế trích xuất dữ liệu công thức)

> Phase **I2.1** (thiết kế, **KHÔNG triển khai**) · 1 AI Agent · không sub-agent.
> Mục tiêu: đặc tả cơ chế **trích xuất** (yêu cầu D) từ HTML nguồn → dữ liệu công thức có cấu trúc, có trạng thái từng trường, giữ tham chiếu nguồn thô.
> Nguồn: `docs/P16/EXTRACTION_ENGINE.md` (pipeline E1–E5, `FieldState`, interface, normalize nghiêm ngặt, lưu raw).
> Nguyên tắc: **không tự bịa dữ liệu thiếu**; **không quy đổi đơn vị**; **không thực thi JavaScript**; mỗi giá trị phải có **bằng chứng + bậc**.

---

## 1. Pipeline 5 bậc (E1–E5) — I2 chỉ triển khai E1

```
E1 JSON-LD (Schema.org Recipe)      ← I2 (MVP)  ── độ tin cậy cao nhất
E2 Microdata / RDFa                 ← I3 (dự phòng RD)
E3 Site adapter (theo domain)       ← I3        ── đọc extractorConfig
E4 Heuristic HTML (giới hạn)        ← I3        ── fallback có kiểm soát
E5 AI extraction                    ← I11       ── ngoài phạm vi
```
- **Nguyên tắc bậc:** chỉ dùng bậc thấp hơn khi bậc cao hơn **thiếu trường**; ghi lại bậc đã dùng (`tiersUsed`). Không "trộn" làm mất nguồn gốc.
- I2: chạy **duy nhất E1**; thiếu trường ⇒ để `MISSING` (không rơi xuống E2–E5 ở I2).

---

## 2. Chuẩn đầu vào (input)

- Chỉ nhận **HTML tĩnh** đã fetch qua SSRF guard (`FetchResult { finalUrl, status, contentType, html, fetchedAt }` — P16.2 §6).
- **Không** render headless; **không** chạy JS. JSON-LD/Microdata/OG đọc trực tiếp từ chuỗi HTML.
- Content-Type đã lọc ở tầng fetch (`text/html`, `application/xhtml+xml`).
- Sanitize trước khi lưu/hiển thị; **không** nội suy HTML thô.

---

## 3. Nguồn trích xuất & vai trò

### 3.1 JSON-LD Schema.org `Recipe` (E1 — nguồn chính)
- Quét `<script type="application/ld+json">`; parse an toàn (bọc try/catch; bỏ qua JSON lỗi).
- Hỗ trợ `@graph` (mảng/graph lồng) — tìm node có `@type` chứa `Recipe`.
- Trường Schema.org `Recipe` khai thác: `name`, `description`, `recipeIngredient`, `recipeInstructions` (string | `HowToStep[]` | `HowToSection[]`), `prepTime`, `cookTime`, `totalTime` (ISO-8601 duration), `recipeYield`, `recipeCategory`, `recipeCuisine`, `image`, `author`, `datePublished`, `url`/`mainEntityOfPage`, `nutrition`.
- `recipeInstructions` dạng lồng (`HowToSection`) phải **giữ thứ tự** và **không** đổi văn bản.

### 3.2 Microdata / RDFa (E2 — I3, dự phòng)
- Khi không có JSON-LD, đọc `itemscope/itemprop` (Microdata) hoặc `property` (RDFa).
- I2 **chưa** triển khai; ghi trong roadmap.

### 3.3 Open Graph (chỉ **metadata hỗ trợ** — không phải nguồn công thức)
- `og:title`, `og:description`, `og:image`, `og:url` — **chỉ** để phụ trợ hiển thị/so khớp, **không** coi là nguyên liệu/bước.
- Trạng thái của trường suy từ OG luôn đánh dấu rõ là "hỗ trợ" (không `CONFIRMED` cho trường công thức lõi). OG **không** thay thế JSON-LD.

### 3.4 HTML fallback có giới hạn (E4 — I3)
- Chỉ heuristic **hẹp**: `h1` (title), danh sách có ký hiệu định lượng (ingredient), danh sách bước có số thứ tự.
- **Giới hạn:** không suy diễn số liệu; không tách định lượng nếu không rõ; trường không chắc ⇒ `UNCERTAIN`/`MISSING`.
- I2 **chưa** triển khai.

### 3.5 AI extraction (E5 — I11, ngoài phạm vi)
- Không thuộc I2/I3; chỉ nhắc để pipeline có chỗ cắm.

---

## 4. Trạng thái từng trường (`FieldState`) & bằng chứng

Mỗi trường công thức là một **`ProvenancedField<T>`**:
```
ProvenancedField<T> = {
  value: T | null,
  state: "MISSING" | "UNREADABLE" | "CONFIRMED" | "DERIVED" | "CONFLICT",
  tier: "E1" | "E2" | "E3" | "E4" | "E5" | "support",
  evidence?: string,   // trích đoạn nguồn / pointer (JSON-LD path, selector)
}
```
| State | Nghĩa | Ví dụ |
|---|---|---|
| `MISSING` | Nguồn không có trường | không có `prepTime` |
| `UNREADABLE` | Có nhưng không parse được | `prepTime="một lúc"` |
| `CONFIRMED` | Trích trực tiếp từ E1, giá trị rõ | `name` từ JSON-LD |
| `DERIVED` | Suy ra **an toàn** từ dữ liệu có sẵn (không bịa) | tổng thời gian = prep+cook khi cả hai rõ |
| `CONFLICT` | Nhiều nguồn/bậc mâu thuẫn | JSON-LD vs Microdata khác nhau |

- Ánh xạ yêu cầu D "extracted / missing / uncertain / failed":
  - **extracted** ⇔ `CONFIRMED` (và `DERIVED` khi có cơ sở),
  - **missing** ⇔ `MISSING`,
  - **uncertain** ⇔ `UNREADABLE`/`CONFLICT` (giá trị có nhưng chưa chắc),
  - **failed** ⇔ bậc E1 lỗi hoàn toàn (không có node Recipe) → ghi ở `warnings[]`/`tiersUsed`, item có thể vẫn `needs_review` nếu còn trường lõi, hoặc `failed` nếu không trích được gì.

**Không bao giờ** chuyển `MISSING`/`UNREADABLE` thành giá trị "đoán". `DERIVED` **chỉ** khi phép suy là xác định (ví dụ cộng thời gian đã có).

---

## 5. Chuẩn hoá (normalize) — nghiêm ngặt, có giới hạn

Chỉ cho phép các phép biến đổi **an toàn** (P16.2 §7):

| Trường | Chuẩn hoá được phép | Bị cấm |
|---|---|---|
| ingredients | trim, gộp khoảng trắng/Unicode, giữ **chuỗi thô**; tách số/đơn vị **chỉ** khi dấu hiệu rõ | đổi đơn vị; làm tròn; bịa `quantityNumeric`; tạo `Ingredient`/`Unit` mới |
| instructions | trim, giữ thứ tự, gộp khoảng trắng; giữ nguyên câu | viết lại/gộp bước; dịch (thuộc I4) |
| prepTime/cookTime/totalTime | ISO-8601 duration → phút | ước lượng khi nguồn không có |
| servings (`recipeYield`) | lấy số khi chuỗi rõ ("4", "4 người") | đoán khoảng khi mơ hồ ⇒ `UNCERTAIN` |
| cuisine/category | map → `TaxonomyTerm` **chỉ khi khớp term có sẵn** | tạo term mới tự động |
| image | giữ URL (I2 **không** tải) | tải/copy ảnh khi `do_not_copy` |

- `unitRaw` → `Unit.code` **chỉ khi** khớp bảng đơn vị hiện có; không khớp ⇒ giữ `unitRaw` + `UNCERTAIN`.
- Mọi bước chuẩn hoá ghi vào `warnings[]` nếu có mất mát/nhập nhằng.

---

## 6. Giữ tham chiếu nguồn thô (raw source reference)

- Raw HTML **không** nhồi vào Postgres: đẩy vào **object storage**, lưu `RecipeExtraction.rawContentRef` (ref/key). Xem `URL_IMPORT_FLOW.md` Q4.
- `RecipeExtraction.rawExtraction` (**JSON required** — D2) lưu: node JSON-LD gốc (đã cắt), danh sách trường + state + tier + evidence, `tiersUsed`.
- Bắt buộc: `sourceUrl`, `canonicalUrl?`, `contentHash` (unique — D5), `extractorVersion` (D3), `extractedAt` (D4), `httpStatus`, `warnings`.
- Tham chiếu cho phép **truy vết**: mỗi `ProvenancedField.evidence` trỏ tới vị trí trong nguồn để admin kiểm lại.

---

## 7. Hợp đồng interface (đề xuất — chưa code)

```ts
interface RecipeExtractor {
  readonly tier: "E1" | "E2" | "E3" | "E4" | "E5";
  canHandle(input: FetchResult): boolean;
  extract(input: FetchResult): Promise<ExtractionResult>;
}

interface ExtractionResult {
  fields: Record<string, ProvenancedField<unknown>>;
  tiersUsed: Array<"E1" | "E2" | "E3" | "E4" | "E5">;
  extractorVersion: string;
  warnings: string[];
  raw: unknown; // JSON an toàn để lưu rawExtraction
}
```
- I2 chỉ hiện thực `JsonLdRecipeExtractor` (E1). Engine điều phối nhiều extractor theo bậc (chỉ E1 ở I2).

---

## 8. Warnings (đề xuất tập chuẩn)

`JSONLD_NOT_FOUND`, `JSONLD_INVALID`, `MULTIPLE_RECIPE_NODES`, `FIELD_UNREADABLE:<field>`, `FIELD_CONFLICT:<field>`, `NO_INGREDIENTS`, `NO_INSTRUCTIONS`, `SOURCES_UNREGISTERED`, `CONTENT_POLICY_MANUAL_ONLY`, `IMAGE_POLICY_DO_NOT_COPY`.

---

## 9. Bất biến

1. Không bịa giá trị thiếu; `MISSING` giữ `null`.
2. Không đổi đơn vị / không làm tròn định lượng / không tạo Unit-Ingredient-Term mới.
3. Không chạy JS, không render; không nội suy HTML thô.
4. Mọi giá trị có `state` + `tier` + (khi có) `evidence`.
5. Raw HTML ở object storage; DB chỉ giữ JSON giới hạn + ref.
6. `rawExtraction`/`extractorVersion`/`extractedAt`/`contentHash` luôn được ghi (ràng buộc schema D2–D5).

---

## 10. Kết luận

- Thiết kế trích xuất tuân thủ pipeline 5 bậc P16; I2 = **E1 JSON-LD**; OG chỉ metadata hỗ trợ; Microdata/HTML fallback để I3.
- Trạng thái trường (`extracted/missing/uncertain/failed`) ánh xạ `FieldState`; luôn có bằng chứng + bậc.
- Không bịa, không quy đổi; giữ raw reference để kiểm tra.
