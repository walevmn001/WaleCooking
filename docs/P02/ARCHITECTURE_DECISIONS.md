# P02 — ARCHITECTURE DECISIONS: WALE COOKING

> Nhật ký quyết định kỹ thuật của P02. Mỗi quyết định có **Bối cảnh — Quyết định — Lý do — Đánh đổi — Phương án thay thế**.
> Không thay đổi quyết định đã chốt ở P00/P01 (D1–D10). Liên quan: [SYSTEM_ARCHITECTURE.md](./SYSTEM_ARCHITECTURE.md) · [DECISIONS.md](../../DECISIONS.md).

| # | Quyết định | Trạng thái |
| --- | --- | --- |
| D-P02-01 | Phân lớp theo hướng Clean Architecture "nhẹ" (Ports & Adapters) | Đã chốt |
| D-P02-02 | Auth.js dùng **database session** (không JWT-only) | Đã chốt |
| D-P02-03 | RBAC bằng **cột `role`** trên `users` (không bảng `user_roles`) | Đã chốt |
| D-P02-04 | Taxonomy **tổng quát** (`taxonomy_types`/`taxonomy_terms`) cho trục phân loại | Đã chốt |
| D-P02-05 | Search MVP = **Postgres FTS + pg_trgm + unaccent** | Đã chốt |
| D-P02-06 | Media upload MVP = **server-proxy** (presigned là tùy chọn) | Đã chốt |
| D-P02-07 | Định lượng lưu **số + đơn vị** (`numeric` + `unit_id`); phân số là lớp hiển thị | Đã chốt |
| D-P02-08 | FK mặc định **RESTRICT**; CASCADE chỉ cho dữ liệu con thuộc sở hữu | Đã chốt |
| D-P02-09 | JSONB **chỉ** cho audit/snapshot/settings, không thay quan hệ cốt lõi | Đã chốt |
| D-P02-10 | Multi-tenant/branching qua **Neon branches** cho môi trường | Đã chốt |
| D-P02-11 | CMS MVP = **admin tự viết** trong Next.js; Payload là tùy chọn nâng cấp | Đã chốt (một phần mở) |

---

## D-P02-01 — Phân lớp theo hướng Clean Architecture "nhẹ"
**Bối cảnh:** Cần module hóa, tách UI/application/domain/infrastructure, không lock-in nhà cung cấp, nhưng **không** over-engineer.
**Quyết định:** 4 layer (Presentation/Application/Domain/Infrastructure) + **Ports & Adapters** chỉ ở các điểm cần thay thế (DB, Storage, Search, Mail). Không dựng DDD đầy đủ (aggregate/event bus) khi chưa cần.
**Lý do:** Đủ để thay Neon/R2/Auth.js; giữ MVP đơn giản (PC-10, PC-11).
**Đánh đổi:** Thêm một lớp interface (~ít code) đổi lấy khả năng thay thế + testability. Không đạt "purity" của Clean Architecture đầy đủ.
**Thay thế:** Không phân lớp (Next.js thuần) — nhanh hơn nhưng khó thay thế/test; hoặc DDD/esbuild đầy đủ — quá nặng.

## D-P02-02 — Auth.js dùng database session
**Quyết định:** Chiến lược **database session** (bảng `sessions`).
**Lý do:** Thu hồi phiên được; dữ liệu auth trong DB của mình (tránh lock-in, PC-11); phù hợp yêu cầu bảo mật (NFR-SEC).
**Đánh đổi:** Mỗi request cần truy vấn session (giảm nhẹ bằng index/cache); phải sao lưu bảng session.
**Thay thế:** JWT-only (stateless, rẻ hơn) — nhưng khó thu hồi; không chọn.

## D-P02-03 — RBAC bằng cột `role`
**Quyết định:** Cột `users.role` enum(`user`/`editor`/`admin`).
**Lý do:** Chỉ 3 vai trò, quan hệ 1–1 user–role → bảng `user_roles` là **thừa** (tránh tạo bảng chỉ để "trông chuyên nghiệp").
**Đánh đổi:** Chưa hỗ trợ đa vai trò/đa tổ chức. Nếu sau này cần → migrate sang `user_roles` (đường mở rõ ràng).
**Thay thế:** Bảng `user_roles` ngay từ đầu — không cần thiết ở MVP.

## D-P02-04 — Taxonomy tổng quát
**Quyết định:** `taxonomy_types` + `taxonomy_terms` (+ translations/aliases) cho 9 trục phân loại.
**Lý do:** Các trục chia sẻ cấu trúc (slug, icon, thứ tự, cha-con, i18n, bật/tắt) → tránh 9 bảng trùng; **vẫn độc lập** vì mỗi trục là một `taxonomy_type` (BR-04); mở rộng trục mới bằng dữ liệu (BR-15).
**Đánh đổi:** Truy vấn cần thêm điều kiện `taxonomy_type_id`; ràng buộc "đúng 1 cuisine/recipe" phải enforce ở application/partial index (không hoàn toàn bằng FK đơn).
**Thay thế:** 9+ bảng riêng (vd `food_types`, `cuisines`…) — rõ ràng hơn nhưng trùng lặp; hoặc một bảng `categories` chung — **bị cấm** (gộp trục).

## D-P02-05 — Search MVP bằng Postgres
**Quyết định:** Postgres FTS (`tsvector`) + `pg_trgm` + `unaccent`.
**Lý do:** $0, không thêm hạ tầng, nhất quán dữ liệu, đủ quy mô (~10.000 công thức); đánh giá trước khi thêm dịch vụ ngoài (theo yêu cầu).
**Đánh đổi:** Tiếng Việt không có từ điển stemming sẵn (dùng `simple` + unaccent + trigram); ranking kém linh hoạt hơn engine chuyên dụng.
**Thay thế:** Meilisearch/Typesense **khi có số liệu cho thấy cần** (adapter sẵn sàng).

## D-P02-06 — Media upload server-proxy
**Quyết định:** MVP upload qua Route Handler (server-proxy).
**Lý do:** Ảnh do editor/admin tải (tần suất thấp); validate tập trung; đơn giản.
**Đánh đổi:** Tốn băng thông server; cần giới hạn body.
**Thay thế:** Presigned URL (đã thiết kế, bật khi cần).

## D-P02-07 — Biểu diễn định lượng
**Quyết định:** Lưu `quantity_numeric` (`numeric(10,3)`) + `unit_id` + `quantity_type` (`decimal/fraction/range/text`); **phân số là lớp hiển thị**; `is_scalable=false` cho "để nếm/một nhúm".
**Lý do:** Chính xác số học; hỗ trợ phân số/thập phân/khoảng/text; giữ đơn vị gốc khi không quy đổi (BR-06/07).
**Đánh đổi:** Hiển thị phân số cần lớp định dạng theo locale.
**Thay thế:** Lưu chuỗi hiển thị — không tính toán được; không chọn.

## D-P02-08 — FK RESTRICT mặc định
**Quyết định:** `ON DELETE RESTRICT` mặc định; `CASCADE` chỉ cho dữ liệu con thuộc sở hữu (steps, translations, favorites, progress…).
**Lý do:** Không để công thức `published` mất dữ liệu do xóa taxonomy/nguyên liệu; không cascade bừa bãi (yêu cầu §6).
**Đánh đổi:** Xóa taxonomy term đang dùng bị chặn → phải archive/deactivate (đúng mong muốn).

## D-P02-09 — Giới hạn JSONB
**Quyết định:** JSONB chỉ cho `audit_logs.before/after`, `recipe_versions.snapshot`, `user_preferences.settings`.
**Lý do:** Dữ liệu này không cần ràng buộc/truy vấn quan hệ; dữ liệu cốt lõi dùng quan hệ thật (yêu cầu §6).
**Đánh đổi:** Không linh hoạt bằng schema-less cho các trường phụ — chấp nhận được.

## D-P02-10 — Neon branches cho môi trường
**Quyết định:** Dùng Neon branching cho local/test/preview.
**Lý do:** Tách môi trường rẻ, copy-on-write; phù hợp gói miễn phí (NFR-FREE).
**Đánh đổi:** Phụ thuộc tính năng Neon (nhưng Postgres chuẩn vẫn di động — PC-11).
**Thay thế:** Nhiều DB riêng / Postgres local.

## D-P02-11 — CMS MVP tự viết
**Quyết định:** Admin tự viết trong Next.js cho MVP; Payload CMS 3 là **tùy chọn nâng cấp**.
**Lý do:** Kiểm soát cao, ít phụ thuộc; tránh thêm độ phức tạp ban đầu (P00 §4.8).
**Đánh đổi:** Tốn công xây UI admin; đổi lại đơn giản & đúng nghiệp vụ.
**Trạng thái:** **Một phần mở** — có thể chốt Payload ở P03+; ghi vào DECISIONS/BLOCKERS.

---

## Đối chiếu ràng buộc P02 (tự nghiệm thu)

| Yêu cầu prompt §2 | Đáp ứng |
| --- | --- |
| Module hóa, tách UI/app/domain/infra | [SYSTEM_ARCHITECTURE.md](./SYSTEM_ARCHITECTURE.md) §3 |
| Business logic không phụ thuộc nhà cung cấp | Ports & Adapters (D-P02-01) |
| Thay Neon/R2/Auth.js qua adapter | StoragePort/SearchPort/Repository + Auth.js (D-P02-01, MEDIA §12) |
| Không abstraction quá mức | Chỉ adapter ở điểm cần thay thế (D-P02-01) |
| MVP đơn giản, mở rộng rõ | D-P02-03/05/11 |

## Điểm chưa thể chốt (ghi BLOCKERS)
- **O2:** hosting cụ thể (Vercel Hobby vs Cloudflare) — chờ xác nhận.
- **O3:** dịch vụ monitoring/logging cụ thể + hạn mức free.
- **B-P01-01:** quy trình phê duyệt taxonomy `editor`/`admin` (chưa chốt → API taxonomy POST tạm chỉ Admin).
- **O7:** vai trò `moderator` — chưa thêm.
- Cơ chế sao lưu bổ sung PITR + export — chờ chốt (NFR-BACKUP).
- CMS (tự viết vs Payload) — D-P02-11 một phần mở.
