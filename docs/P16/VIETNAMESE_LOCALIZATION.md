# P16.3 — VIETNAMESE LOCALIZATION PIPELINE

> Phase **P16** (thiết kế) · Milestone **P16.3** · 1 AI Agent · Không triển khai code.
> Mục tiêu: đặc tả **quy trình Việt hoá công thức** (tên món, mô tả, nguyên liệu, hướng dẫn, thuật ngữ) **giữ nguyên dữ kiện**, lưu **song song bản gốc ↔ bản Việt hoá**, và **phát hiện lỗi dịch** trước khi admin duyệt.
> Nguyên tắc gốc: dịch **không được** đổi định lượng/nhiệt độ/thời gian, **không** thêm nguyên liệu/bước, **không** biến đổi dữ kiện dinh dưỡng. **Không auto-publish** chỉ vì đã dịch xong.
> Liên quan: [EXTRACTION_ENGINE.md](./EXTRACTION_ENGINE.md) · [DUPLICATE_DETECTION.md](./DUPLICATE_DETECTION.md) · [ADMIN_REVIEW_WORKFLOW.md](./ADMIN_REVIEW_WORKFLOW.md) · [DATABASE_DESIGN.md](./DATABASE_DESIGN.md).

---

## 1. Vị trí trong luồng

```
ExtractionResult (P16.2) ─▶ [LOCALIZE] ─▶ [VALIDATE DỮ KIỆN] ─▶ NEEDS_REVIEW (P16.6) ─▶ APPROVED ─▶ PUBLISHED
                              P16.3           P16.3                  (admin duyệt)
```

Localization **không** ghi vào bảng `recipes`/`recipe_translations` chính thức. Bản dịch được lưu ở **vùng nháp** (`RecipeTranslationDraft` — đề xuất P16.7), chỉ ghi chính thức qua `RecipeService.create()` sau khi admin duyệt.

---

## 2. Mục tiêu chất lượng dịch

| Hạng mục | Yêu cầu | Ghi chú |
|---|---|---|
| Tên món | Dịch **tự nhiên**, đúng ẩm thực Việt; có thể giữ tên gốc trong ngoặc khi cần | Ưu tiên độc giả Việt nhận diện được món |
| Mô tả | Dịch trọn nghĩa, văn phong gọn, hấp dẫn nhưng **trung thành** | Không thêm lời quảng cáo không có trong gốc |
| Nguyên liệu | **Việt hoá tên**; giữ tên gốc khi tên Việt chưa chuẩn/đa nghĩa | Không quy đổi định lượng |
| Hướng dẫn | Việt hoá câu chữ, **giữ nguyên trình tự & số bước** | Không gộp/tách/thêm bước |
| Thuật ngữ nấu ăn | Chuẩn hoá theo **glossary** (vd `fold`→`trộn nhẹ theo chiều`) | Glossary là nguồn duy nhất cho thuật ngữ |
| Dữ kiện số | **Bất biến**: định lượng, nhiệt độ, thời gian | Ví trị **so khớp cơ học** (không dịch) |
| Dinh dưỡng | **Không** biến đổi số liệu | Chỉ dịch nhãn (nếu có) |

---

## 3. Cấu trúc lưu song song (Original ↔ Localized)

Đây là **yêu cầu cốt lõi**: luôn giữ bản gốc cạnh bản Việt hoá để đối chiếu & phát hiện lỗi.

### 3.1 Trường hợp WALE hiện tại
- `Recipe` có `defaultLocale` (mặc định `"vi"`); `RecipeTranslation` (`@@unique[recipeId, locale]`) lưu `title/summary/description/seoTitle/seoDescription` **theo locale**; `RecipeStepTranslation` (`@@unique[stepId, locale]`) lưu `instruction/tip`.
- ➜ Schema hiện tại **biết** nội dung theo locale nhưng **không** có chỗ cho: bản gốc chưa dịch, trạng thái dịch, phiên bản dịch, metadata AI, kết quả validation, trạng thái review **ở cấp bản dịch**.

### 3.2 Đề xuất vùng nháp bản dịch (`RecipeTranslationDraft` — P16.7)

| Trường (đề xuất) | Kiểu | Mô tả |
|---|---|---|
| `id` | uuid | PK |
| `extractionId` | uuid | FK → `RecipeExtraction` (bản gốc thô, P16.2/P16.7) |
| `locale` | text | Đích (mặc định `vi`) |
| `originalContent` | jsonb | **Bản gốc**: title/description/ingredients/steps (nguyên văn nguồn) |
| `localizedContent` | jsonb | **Bản Việt hoá** tương ứng 1-1 |
| `translationStatus` | enum | `PENDING` · `IN_PROGRESS` · `DONE` · `FAILED` · `NEEDS_HUMAN` |
| `translationVersion` | int | Tăng mỗi lần dịch lại (audit) |
| `aiMetadata` | jsonb? | `{ provider, model, prompt_version, glossaryVersion, generatedAt }` (KHÔNG chứa key) |
| `validationResult` | jsonb? | Kết quả kiểm dữ kiện (§5) — danh sách lỗi/cảnh báo |
| `humanReviewStatus` | enum | `NOT_REVIEWED` · `IN_REVIEW` · `APPROVED` · `REJECTED` |
| `reviewedById` / `reviewedAt` | uuid? / timestamptz? | Ai duyệt, khi nào |
| `createdAt` / `updatedAt` | timestamptz | Audit |

> **Nguyên tắc lưu song song:** mỗi phần tử trong `localizedContent` **phải** ánh xạ tới một phần tử `originalContent` (cùng index/khóa) → máy **kiểm tra cặp** được. Không có bản Việt hoá nào tồn tại mà thiếu đối chiếu gốc.

### 3.3 Ghi chính thức khi publish (qua `RecipeService.create()`)
- `Recipe.defaultLocale = "vi"`; `RecipeTranslation(locale="vi")` = nội dung Việt hoá đã duyệt; `RecipeStepTranslation(locale="vi")` cho từng bước.
- **Giữ bản gốc**: lưu vào `RecipeExtraction` (raw) + (đề xuất) `RecipeTranslationDraft.originalContent`; có thể bổ sung `RecipeTranslation` cho locale gốc trong tương lai (i18n) nhưng **P16 không đổi schema**.
- `ContentSource` + `RecipeSource` ghi `url/authorOrOrg/license` (BR-03).

---

## 4. Quy trình Việt hoá (7 bước)

1. **Chuẩn bị đầu vào**: nhận `ExtractionResult` (đã có bản gốc + trạng thái trường). Nếu nguồn là tiếng Việt sẵn → đánh dấu `LOCALE_SOURCE=vi`, **không** dịch, chỉ chuẩn hoá nhẹ.
2. **Nhận diện đơn vị dịch (translation units)**: tách thành các đơn vị: title, description, mỗi nguyên liệu, mỗi bước, nhãn phân loại. Mỗi đơn vị giữ **con trỏ tới bản gốc**.
3. **Bảo vệ dữ kiện (placeholdering)**: **trích & khóa** mọi token số/đơn vị/nhiệt độ/thời gian thành **placeholder bất biến** (vd `⟦Q1⟧`, `⟦T1⟧`) trước khi dịch; sau dịch **khôi phục nguyên văn**. Đây là cơ chế chống "dịch làm biến dạng số".
4. **Dịch theo glossary**: áp **glossary thuật ngữ nấu ăn** (bảng thuật ngữ Anh→Việt đã duyệt) + giữ tên nguyên liệu gốc khi cần.
5. **Kiểm cặp gốc↔dịch** (§5): so số lượng/đơn vị/nhiệt độ/thời gian; so số bước; phát hiện thêm/bớt nội dung.
6. **Chấm điểm + gắn cảnh báo**: kết quả → `validationResult`; nếu có lỗi cứng → `NEEDS_HUMAN`.
7. **Đẩy sang review**: `translationStatus=DONE` + `humanReviewStatus=NOT_REVIEWED` → item vào **NEEDS_REVIEW** (P16.6). **Không** tự chuyển PUBLISHED.

---

## 5. Cơ chế phát hiện lỗi dịch (bắt buộc)

Bộ kiểm chạy **sau khi dịch**, so **cặp** original↔localized. Mỗi phát hiện là một `TranslationIssue`.

| # | Loại lỗi | Cách phát hiện (cơ học, ưu tiên không phụ thuộc AI) | Mức |
|---|---|---|---|
| I1 | **Sai tên nguyên liệu** | Số lượng dòng nguyên liệu khác nhau; hoặc đối chiếu tên gốc ↔ glossary/danh mục `Ingredient` (trigram); tên bị bỏ/đổi nghĩa | **Cứng** (chặn duyệt tự động) |
| I2 | **Sai số lượng** | Tập token số ở gốc ≠ ở bản dịch (sau khi khôi phục placeholder) | **Cứng** |
| I3 | **Sai đơn vị** | Tập token đơn vị gốc ↔ bản dịch lệch (hoặc đơn vị bị quy đổi trái phép) | **Cứng** |
| I4 | **Sai nhiệt độ** | Token nhiệt độ (vd `180°C`, `350°F`) gốc ↔ bản dịch lệch | **Cứng** |
| I5 | **Sai thời gian** | Token thời gian (`20 phút`, `1 giờ`) gốc ↔ bản dịch lệch | **Cứng** |
| I6 | **Bỏ sót bước** | Số bước gốc ≠ số bước bản dịch; hoặc bước rỗng/dịch rỗng | **Cứng** |
| I7 | **Thêm nội dung không có trong gốc** | Độ dài bản dịch vượt ngưỡng so với gốc bất thường; hoặc phát hiện cụm nguyên liệu/bước không map được về gốc | **Cứng/Mềm** |
| I8 | **Thuật ngữ chưa chuẩn hoá** | Thuật ngữ ngoài glossary | Mềm (cảnh báo) |
| I9 | **Tên riêng bị dịch sai** | Tên món/thương hiệu bị dịch nghĩa | Mềm (cảnh báo) |

**Quy tắc:**
- Lỗi **Cứng** (I1–I7) → **chặn** chuyển trạng thái "sẵn sàng duyệt tự động"; bắt buộc admin sửa/xác nhận.
- Lỗi **Mềm** (I8–I9) → hiển thị cảnh báo, không chặn.
- Việc kiểm **ưu tiên cơ học** (token/đếm/khớp) — **không** phụ thuộc AI để giảm sai số; AI chỉ dùng để **gợi ý** (không có quyền quyết định).

---

## 6. Glossary & chuẩn hoá thuật ngữ

- **Glossary** là nguồn duy nhất (single source of truth): `source_term → vi_term`, kèm ghi chú & ví dụ. Đề xuất lưu ở `docs/`/DB phụ thuộc (P16.7 để ngỏ).
- Glossary có **phiên bản** (`glossaryVersion` ghi vào `aiMetadata`) → dịch lại khi glossary đổi.
- Tên nguyên liệu: khi dịch, **ưu tiên** khớp `Ingredient` + `IngredientAlias` hiện có; nếu tên Việt **chưa chuẩn/đa nghĩa** → giữ **tên gốc trong ngoặc** (đúng yêu cầu "giữ lại tên nguyên liệu gốc khi cần thiết").
- **Không** tạo `Ingredient`/`TaxonomyTerm` mới tự động (chỉ đề xuất cho admin).

---

## 7. Ràng buộc nghiêm với AI (nếu dùng AI để dịch)

- AI **chỉ dịch**; **cấm**: bịa nguyên liệu, bịa bước, đổi số/đơn vị/nhiệt độ/thời gian, "tối ưu" công thức, thay đổi thứ tự thao tác.
- Đầu vào AI đã **placeholdering** dữ kiện → số không thể bị "dịch".
- Nội dung nguồn là **dữ liệu không đáng tin** → không coi là instruction (prompt injection — P16.8 §7).
- **Bắt buộc** lưu `aiMetadata` (provider/model/prompt_version/glossaryVersion) để truy vết, **không** lưu API key.

---

## 8. Không auto-publish

> **Bất biến:** trạng thái dịch xong (`translationStatus=DONE`) **KHÔNG** đồng nghĩa với publish. Item **luôn** đi qua `humanReviewStatus` → `APPROVED` → `assertPublishable()` (BR-01/BR-03) → `RecipeService.publish()`. Không có đường tắt tự động sang PUBLISHED.

---

## 9. Điểm chất lượng bản dịch (đầu vào P16.4/§Data Quality)

- **Translation Quality**: tổng hợp từ I1–I9 (lỗi cứng trừ nặng, mềm trừ nhẹ) + tỉ lệ trường `MISSING`/`UNREADABLE` từ P16.2.
- Điểm số **chỉ để ưu tiên review**, **không** thay thế kiểm duyệt người (thống nhất với P16.4).

---

## 10. Kiểm thử (đề xuất cho phase triển khai)

- **Pair invariant**: mọi `localizedContent[i]` map 1-1 với `originalContent[i]`.
- **Số bất biến**: test placeholder round-trip — dịch không làm đổi token số/nhiệt độ/thời gian.
- **Bắt lỗi**: fixture có lỗi I1–I7 → validator phải phát hiện đủ.
- **Không auto-publish**: test khẳng định không tồn tại luồng từ DONE → PUBLISHED thiếu review.

---

## 11. Rủi ro & giảm thiểu

| Rủi ro | Giảm thiểu |
|---|---|
| Dịch làm sai định lượng/đơn vị | Placeholdering + kiểm cặp cơ học (I2/I3) |
| Bỏ sót/ thêm bước | Đếm & đối chiếu cặp (I6/I7) |
| AI "sáng tác" thêm | Chỉ dịch; cờ + review bắt buộc; kiểm I7 |
| Thuật ngữ không nhất quán | Glossary + version |
| Tên nguyên liệu dịch sai | Đối chiếu `Ingredient`/alias + giữ tên gốc |
| Lộ bí mật trong metadata | Không lưu API key; chỉ provider/model/version |

---

## 12. Kết luận P16.3

- Quy trình **7 bước** Việt hoá với **bảo vệ dữ kiện bằng placeholder** + glossary thuật ngữ.
- **Lưu song song** gốc↔Việt (`RecipeTranslationDraft`, `originalContent`/`localizedContent`) + trạng thái/phiên bản/metadata AI/validation/review.
- **9 loại lỗi** (I1–I9) phát hiện qua **kiểm cặp cơ học**, lỗi cứng chặn duyệt tự động.
- **Không auto-publish** — bắt buộc admin duyệt (P16.6). Đầu ra liên kết P16.2 (bản gốc), P16.4 (điểm chất lượng), P16.7 (entity draft).
