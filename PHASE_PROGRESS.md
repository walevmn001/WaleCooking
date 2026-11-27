# PHASE PROGRESS — WALE COOKING

> Theo dõi tiến độ theo phase. Mỗi phase chỉ triển khai đúng phạm vi của nó.
> Cập nhật: 2026-11-28.

| Phase | Tên | Phạm vi | Trạng thái |
| --- | --- | --- | --- |
| P00 | Khảo sát dự án, xác lập yêu cầu và checkpoint nền tảng | Khảo sát môi trường/repo, tài liệu định hướng sản phẩm, giao diện, đề xuất công nghệ | ✅ Hoàn thành |
| P00-FIX | Hoàn thiện phạm vi sản phẩm và đồng bộ thương hiệu | Đồng bộ tên WALE COOKING, bổ sung 20 nhóm chức năng, chuẩn hóa 7 trục phân loại, tài liệu trạng thái | ✅ Hoàn thành |
| P01 | PRD & Product Constitution | Bộ đặc tả sản phẩm: PRD, Constitution, personas, journeys, 20 nhóm chức năng, quy tắc nghiệp vụ, NFR, MVP scope, acceptance criteria | ✅ Hoàn thành |
| P02 | *(chưa xác định)* | Chờ yêu cầu tiếp theo | ⏳ Chưa bắt đầu |

## Sản phẩm bàn giao theo phase

### P00
- `docs/P00/00-khao-sat-moi-truong.md`
- `docs/P00/01-dinh-huong-san-pham.md` (bản đầu — đã được P00-FIX mở rộng)
- `docs/P00/02-dinh-huong-giao-dien.md`
- `docs/P00/03-de-xuat-cong-nghe.md`

### P00-FIX
- Cập nhật `docs/P00/01-dinh-huong-san-pham.md` (20 nhóm chức năng + 7 trục phân loại + brand)
- Cập nhật `docs/P00/02-dinh-huong-giao-dien.md` (tên phong cách)
- Cập nhật `docs/P00/00-khao-sat-moi-truong.md` (blockers/quyết định)
- Tạo `CURRENT_STATUS.md`, `PHASE_PROGRESS.md`, `DECISIONS.md`, `BLOCKERS.md`

### P01
- Tạo `docs/P01/PRD.md`
- Tạo `docs/P01/PRODUCT_CONSTITUTION.md`
- Tạo `docs/P01/USER_PERSONAS.md`
- Tạo `docs/P01/USER_JOURNEYS.md`
- Tạo `docs/P01/FUNCTIONAL_REQUIREMENTS.md`
- Tạo `docs/P01/BUSINESS_RULES.md`
- Tạo `docs/P01/NON_FUNCTIONAL_REQUIREMENTS.md`
- Tạo `docs/P01/MVP_SCOPE.md`
- Tạo `docs/P01/ACCEPTANCE_CRITERIA.md`
- Cập nhật `CURRENT_STATUS.md`, `PHASE_PROGRESS.md`, `DECISIONS.md`, `BLOCKERS.md`

## Ràng buộc xuyên suốt
- Chỉ dùng 1 agent, không tạo sub-agent.
- Không code website / không tạo database / không triển khai backend trong P00, P00-FIX & P01.
- Giữ nguyên kiến trúc đã chốt (stack lớp rời, gói miễn phí, phi thương mại, Pastel Mint).
- Chỉ commit file thuộc phạm vi phase; không push khi chưa xác nhận.
