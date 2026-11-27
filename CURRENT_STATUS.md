# CURRENT STATUS — WALE COOKING

> Cập nhật: 2026-11-28 (P01).

## Tóm tắt
- **Sản phẩm:** WALE COOKING — website hướng dẫn nấu ăn (tiếng Việt, sẵn sàng i18n EN).
- **Phase hiện tại:** hoàn thành **P00**, **P00-FIX** và **P01**; **chưa bắt đầu P02.**
- **Đã hoàn thiện P00:** khảo sát thực tế + tài liệu định hướng + đề xuất công nghệ.
- **Đã hoàn thiện P00-FIX:** đồng bộ thương hiệu sang WALE COOKING, bổ sung đầy đủ 20 nhóm chức năng, chuẩn hóa 7 trục phân loại, cập nhật tài liệu trạng thái.
- **Đã hoàn thiện P01:** bộ đặc tả sản phẩm có thể triển khai — PRD, Product Constitution, personas, user journeys, đặc tả 20 nhóm chức năng, quy tắc nghiệp vụ, NFR đo lường được, phạm vi MVP và tiêu chí nghiệm thu.

## Git
| Mục | Giá trị |
| --- | --- |
| Branch hiện tại | `trae/agent-Xt3maf` |
| Remote | `origin` → `https://github.com/walevmn001/WaleCooking` |
| Commit P00 | `a7c3ee5` — docs(P00): khảo sát dự án, xác lập yêu cầu và checkpoint nền tảng |
| Commit P00-FIX | `59ca67a` — docs(P00-FIX): đồng bộ thương hiệu WALE COOKING và hoàn thiện phạm vi sản phẩm |
| Commit P01 | *(commit chứa tài liệu này — xem `git log -1`)* |
| Working tree | Sạch sau khi commit P01 |
| Push | **CHƯA push** (chờ xác nhận) |

## Kiến trúc đã chốt (không thay đổi)
- Stack lớp rời: **Next.js + Prisma + Neon PostgreSQL + Auth.js + Cloudflare R2**.
- Ưu tiên gói miễn phí. Dự án **phi thương mại**. Giao diện **WALE COOKING — Pastel Mint**.

## Sản phẩm bàn giao P01 (`docs/P01/`)
`PRD.md` · `PRODUCT_CONSTITUTION.md` · `USER_PERSONAS.md` · `USER_JOURNEYS.md` · `FUNCTIONAL_REQUIREMENTS.md` · `BUSINESS_RULES.md` · `NON_FUNCTIONAL_REQUIREMENTS.md` · `MVP_SCOPE.md` · `ACCEPTANCE_CRITERIA.md`

## Việc còn chờ xác minh
- **B5:** repo là shallow clone (ảnh hưởng thấp).
- **B6:** chưa có tài khoản/môi trường triển khai (Neon, R2, Vercel/Cloudflare…).
- **B7:** chưa có asset thật (mascot, bộ icon minh họa riêng).
- **B-P01-01:** quy trình phê duyệt taxonomy giữa `editor` và `admin` chưa chốt.
- **B-P01-02:** tương phản màu Pastel Mint/Soft Pink trên nền Cream cần xác minh WCAG 2.2 AA.
- **B-P01-03:** cơ chế xuất/xóa dữ liệu cá nhân của người dùng chưa chốt.
- Hạn mức gói miễn phí đã ghi theo thời điểm **11/2026** — cần kiểm tra lại trước khi deploy.

## Phase tiếp theo
- **P02** — *(chưa xác định phạm vi)*. Không tự triển khai; chờ yêu cầu tiếp theo.

## Tham chiếu
- [PHASE_PROGRESS.md](./PHASE_PROGRESS.md) · [DECISIONS.md](./DECISIONS.md) · [BLOCKERS.md](./BLOCKERS.md)
- Tài liệu P00: [docs/P00](./docs/P00/) · Tài liệu P01: [docs/P01](./docs/P01/)
