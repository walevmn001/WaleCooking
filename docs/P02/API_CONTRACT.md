# P02 — API CONTRACT: WALE COOKING

> Hợp đồng API ở mức **đặc tả** (chưa viết code endpoint). Base path đề xuất: `/api/v1`. Server Actions dùng cho mutation nội bộ; Route Handlers cho contract công khai/upload.
> Liên quan: [SYSTEM_ARCHITECTURE.md](./SYSTEM_ARCHITECTURE.md) §4 · [AUTHORIZATION_SECURITY.md](./AUTHORIZATION_SECURITY.md).

## 0. Quy ước chung

| Hạng mục | Quy ước |
| --- | --- |
| **Versioning** | Tiền tố `/api/v1`. Thay đổi phá vỡ tương thích → `/api/v2`. |
| **Định dạng** | `application/json` (UTF-8). Lỗi trả JSON có `code`, `message`, `details?`. |
| **Xác thực** | Session cookie (Auth.js). Endpoint public không yêu cầu. |
| **Phân quyền** | `Guest` / `User` / `Editor` / `Admin`. Kiểm tra **server-side**. |
| **Phân trang** | Cursor-based: `?limit=` (mặc định 20, max 100) + `?cursor=`. Trả `{ items, nextCursor, total? }`. |
| **Sắp xếp** | `?sort=` ∈ `newest`/`popular`/`az`/`relevance` (mặc định theo ngữ cảnh). |
| **Lọc** | Query param; phản ánh được vào URL (state chia sẻ được). |
| **Rate limit** | Điểm nhạy cảm (auth, search, upload, ghi dữ liệu) — xem §13. |
| **Validation** | Zod ở server; lỗi 422 với `details` theo trường. |
| **Idempotency** | Mutation quan trọng chấp nhận `Idempotency-Key` (tùy chọn) khi phù hợp. |
| **Mã lỗi chung** | 400 (sai định dạng), 401 (chưa xác thực), 403 (không đủ quyền), 404, 409 (xung đột), 422 (validate), 429 (rate limit), 500 (lỗi hệ thống). |

## 1. Authentication (`/api/v1/auth`)
| Method | Path | Actor | Auth | Request | Response | Lỗi |
| --- | --- | --- | --- | --- | --- | --- |
| POST | `/auth/register` | Guest | — | `{email, password, name}` | `201 {id}` | 409 (email tồn tại), 422 |
| POST | `/auth/login` | Guest | — | `{email, password}` | `200 {session}` | 401 (thông báo chung), 429 |
| POST | `/auth/logout` | User | Session | — | `204` | 401 |
| GET | `/auth/session` | Any | Optional | — | `200 {user?, role}` | — |
| POST | `/auth/forgot-password` | Guest | — | `{email}` | `202` (luôn 202, không lộ tồn tại) | 429 |
| POST | `/auth/reset-password` | Guest | Token | `{token, password}` | `204` | 400 |

> OAuth (Google/GitHub) qua Auth.js provider (giai đoạn sau). Thông báo đăng nhập sai **không** tiết lộ tài khoản có tồn tại (AC-FR16).

## 2. Recipes (`/api/v1/recipes`)
| Method | Path | Actor | Auth | Request | Response |
| --- | --- | --- | --- | --- | --- |
| GET | `/recipes` | Guest/User | — | `?page,filter,sort` | `200 {items, nextCursor}` (chỉ `published` — BR-13) |
| GET | `/recipes/{slug}` | Guest/User | — | — | `200 {recipe}` / 404 (BR-12 nếu archived → 410 hoặc redirect) |
| POST | `/recipes` | Editor/Admin | ✔ | body công thức (nháp) | `201 {id}` |
| PATCH | `/recipes/{id}` | Editor/Admin | ✔ | partial | `200` |
| POST | `/recipes/{id}/publish` | Editor/Admin | ✔ | — | `200 {status}` / 422 (thiếu trường bắt buộc — BR-01) |
| POST | `/recipes/{id}/archive` | Editor/Admin | ✔ | `{reason?}` | `200` |
| GET | `/recipes/{id}/versions` | Editor/Admin | ✔ | — | `200 {versions}` |
| DELETE | `/recipes/{id}` | Admin | ✔ | — | `204` / 409 (ràng buộc) |

**Validation publish (BR-01/03):** đủ trường ở [Recipe schema A](../P01/FUNCTIONAL_REQUIREMENTS.md#a-trường-bắt-buộc-để-tạo-bản-nháp-hợp-lệ) + có nguồn nếu không phải nội dung gốc.

## 3. Ingredients (`/api/v1/ingredients`)
| Method | Path | Actor | Auth | Request | Response |
| --- | --- | --- | --- | --- | --- |
| GET | `/ingredients` | Guest/User | — | `?q,page` | `200 {items}` |
| GET | `/ingredients/{slug}` | Guest/User | — | — | `200 {ingredient}` |
| POST | `/ingredients` | Editor/Admin | ✔ | body | `201` |
| PATCH | `/ingredients/{id}` | Editor/Admin | ✔ | partial | `200` |
| POST | `/ingredients/{id}/substitutions` | Editor/Admin | ✔ | `{substituteId, ratio, quality}` | `201` |
| GET | `/ingredients/{id}/substitutions` | Guest/User | — | — | `200 {items}` |

## 4. Taxonomy (`/api/v1/taxonomy`)
| Method | Path | Actor | Auth | Request | Response |
| --- | --- | --- | --- | --- | --- |
| GET | `/taxonomy/types` | Guest/User | — | — | `200 {types}` (9 trục) |
| GET | `/taxonomy/{typeCode}/terms` | Guest/User | — | `?tree=true` | `200 {terms}` |
| POST | `/taxonomy/{typeCode}/terms` | Admin | ✔ | body | `201` (B-P01-01: `editor` chỉ **đề xuất**, chưa chốt) |
| PATCH | `/taxonomy/terms/{id}` | Admin | ✔ | `{name?, icon?, isActive?}` | `200` |
| POST | `/taxonomy/terms/{id}/deactivate` | Admin | ✔ | — | `200` (archive thay vì xóa nếu đang dùng) |

## 5. Search (`/api/v1/search`)
| Method | Path | Actor | Auth | Request | Response |
| --- | --- | --- | --- | --- | --- |
| GET | `/search?q=` | Guest/User | — | `q` (có/không dấu), `filters`, `sort`, `limit`, `cursor` | `200 {items, nextCursor, appliedConditions}` |
| GET | `/search/suggest?q=` | Guest/User | — | `q` | `200 {suggestions}` (autocomplete) |
| POST | `/search/by-ingredients` | Guest/User | — | `{ingredientIds[], mode:'any'|'all', onlyCookable?}` | `200 {items:[{recipe, matchedIngredients, missingIngredients, substitutions}]}` |

**Quy tắc:** truy vấn tự nhiên → điều kiện kiểm tra được; **không** trả kết quả ngoài điều kiện (SR-05, SR-08); không tạo công thức không tồn tại.

## 6. Favorites (`/api/v1/favorites`)
| Method | Path | Actor | Auth | Request | Response |
| --- | --- | --- | --- | --- | --- |
| GET | `/favorites` | User | ✔ | `?page` | `200 {items}` |
| PUT | `/favorites/{recipeId}` | User | ✔ | — | `200` (idempotent) |
| DELETE | `/favorites/{recipeId}` | User | ✔ | — | `204` |

## 7. Collections & Notes (`/api/v1/collections`)
| Method | Path | Actor | Auth | Request | Response |
| --- | --- | --- | --- | --- | --- |
| GET | `/collections` | User | ✔ | — | `200 {items}` |
| POST | `/collections` | User | ✔ | `{title, description?}` | `201` |
| POST | `/collections/{id}/recipes` | User | ✔ | `{recipeId, sortOrder?}` | `201` |
| DELETE | `/collections/{id}/recipes/{recipeId}` | User | ✔ | — | `204` |
| GET/PUT/DELETE | `/recipes/{recipeId}/note` | User | ✔ | `{content, rating?}` | `200`/`204` |

## 8. Cooking Sessions (`/api/v1/cooking-sessions`)
| Method | Path | Actor | Auth | Request | Response |
| --- | --- | --- | --- | --- | --- |
| POST | `/cooking-sessions` | User | ✔ | `{recipeId, servings?}` | `201 {id, currentStepId}` |
| PATCH | `/cooking-sessions/{id}` | User | ✔ | `{status?, currentStepId?}` | `200` |
| POST | `/cooking-sessions/{id}/steps/{stepId}/complete` | User | ✔ | — | `200` |
| GET | `/cooking-sessions/{id}` | User | ✔ | — | `200 {session, progress[]}` |

> Guest **không** gọi các endpoint này (không lưu tiến độ — BR-10/BR-11); guest vẫn dùng chế độ nấu phía client.

## 9. Meal Planner (`/api/v1/meal-plans`)
| Method | Path | Actor | Auth | Request | Response |
| --- | --- | --- | --- | --- | --- |
| GET | `/meal-plans` | User | ✔ | `?from,to` | `200 {items}` |
| POST | `/meal-plans` | User | ✔ | `{title, startDate, endDate?}` | `201` |
| POST | `/meal-plans/{id}/items` | User | ✔ | `{date, mealType, recipeId, servings}` | `201` |
| PATCH | `/meal-plans/items/{itemId}` | User | ✔ | `{servings?, mealType?}` | `200` |
| DELETE | `/meal-plans/items/{itemId}` | User | ✔ | — | `204` |

## 10. Shopping Lists (`/api/v1/shopping-lists`)
| Method | Path | Actor | Auth | Request | Response |
| --- | --- | --- | --- | --- | --- |
| POST | `/shopping-lists` | User | ✔ | `{sourceMealPlanId?}` hoặc `{recipeIds[]}` | `201 {id, items[]}` |
| GET | `/shopping-lists/{id}` | User | ✔ | — | `200 {list, items[]}` |
| PATCH | `/shopping-lists/{id}/items/{itemId}` | User | ✔ | `{quantity?, unitId?, isChecked?}` | `200` |
| POST | `/shopping-lists/{id}/items` | User | ✔ | `{displayName, quantity?, unitId?}` (thủ công) | `201` |

**Quy tắc gộp:** chỉ gộp khi đơn vị cùng chiều; nếu không → dòng riêng + note (BR-06/07).

## 11. CMS / Admin (`/api/v1/admin`)
| Method | Path | Actor | Auth | Request | Response |
| --- | --- | --- | --- | --- | --- |
| GET | `/admin/recipes?status=` | Editor/Admin | ✔ | `?status,page` | `200 {items}` |
| POST | `/admin/recipes/{id}/review` | Editor/Admin | ✔ | `{action, comment?}` | `200` (tạo `content_reviews`) |
| GET | `/admin/users` | Admin | ✔ | `?role,page` | `200 {items}` |
| PATCH | `/admin/users/{id}/role` | Admin | ✔ | `{role}` | `200` (audit) |
| GET | `/admin/audit-logs` | Admin | ✔ | `?entity,actor,page` | `200 {items}` |
| GET | `/admin/sources` | Editor/Admin | ✔ | `?status` | `200 {items}` |

## 12. Media Upload (`/api/v1/media`)
| Method | Path | Actor | Auth | Request | Response |
| --- | --- | --- | --- | --- | --- |
| POST | `/media/upload` | Editor/Admin | ✔ | `multipart/form-data` (file) | `201 {mediaAsset}` (xem [MEDIA_STORAGE.md](./MEDIA_STORAGE.md)) |
| POST | `/media/presign` | Editor/Admin | ✔ | `{filename, contentType, size}` | `200 {uploadUrl, key}` (phương án B — tùy chọn) |
| DELETE | `/media/{id}` | Editor/Admin | ✔ | — | `204` (soft-archive; chỉ khi không còn tham chiếu) |

**Validate upload:** MIME thật (magic bytes), size ≤ giới hạn, kích thước ảnh; từ chối file không hợp lệ.

## 13. Rate limit (đề xuất)

| Endpoint | Giới hạn (đề xuất) |
| --- | --- |
| `/auth/*` | 10 req/phút/IP |
| `/search`, `/search/suggest` | 60 req/phút/IP |
| `/media/upload` | 20 req/giờ/user |
| Mutation ghi dữ liệu | 120 req/phút/user |
| Còn lại | 300 req/phút/IP |

Triển khai ở middleware/adapter rate-limit (Upstash Redis ở giai đoạn sau, hoặc in-memory cho MVP) — **không** tin client.

## 14. Truy vết API ↔ FR

| Nhóm endpoint | FR |
| --- | --- |
| Auth | FR-16 |
| Recipes (đọc) | FR-02, FR-03 |
| Recipes (publish/CRUD) | FR-17, FR-18 |
| Ingredients | FR-03, FR-06 |
| Taxonomy | FR-04, FR-07 |
| Search | FR-05, FR-06, FR-07 |
| Favorites/Collections/Notes | FR-11 |
| Cooking Sessions | FR-09 |
| Meal Planner | FR-12 |
| Shopping Lists | FR-13 |
| Admin/Audit | FR-17, FR-20 |
| Media | FR-03, FR-17 |
| Nutrition (đọc) | FR-14 |
