# P00 — Khảo sát môi trường & Repository

> Tài liệu này ghi lại **kết quả kiểm tra thực tế** trước khi tạo/sửa bất kỳ file nào.
> Mọi kết luận dưới đây dựa trên output lệnh thực thi trong sandbox.

## 1. Thư mục làm việc

| Mục | Giá trị |
| --- | --- |
| Working directory | `/workspace` |
| Nội dung hiện có | `README.md` + thư mục `.git` |
| File được Git theo dõi | Chỉ `README.md` |
| Nội dung `README.md` | `# WaleCooking` (1 dòng) |

Kết luận: **Dự án đang bắt đầu từ đầu (greenfield).** Chưa có mã nguồn, tài liệu, cấu hình hay dependency nào.

## 2. Repository Git

| Mục | Giá trị |
| --- | --- |
| Là git repo | Có (`git rev-parse --is-inside-work-tree` → `true`) |
| Loại clone | **Shallow clone** (tồn tại `.git/shallow`) |
| Branch hiện tại | `trae/agent-Xt3maf` |
| Branch khác | `main` (local), `origin/main`, `origin/HEAD → origin/main` |
| Remote | `origin` → `https://github.com/walevmn001/WaleCooking` (fetch + push) |
| Upstream của branch hiện tại | **Chưa thiết lập** (không có `branch.trae/agent-Xt3maf.merge`) |

## 3. Trạng thái working tree

| Mục | Giá trị |
| --- | --- |
| `git status` | `On branch trae/agent-Xt3maf` — **nothing to commit, working tree clean** |
| Thay đổi chưa commit | **Không có** |
| Stash | **Không có** (`git stash list` rỗng) |
| Nguy cơ ghi đè dữ liệu | **Không** — không có nội dung có sẵn ngoài `README.md` |

## 4. Lịch sử commit

| Mục | Giá trị |
| --- | --- |
| Tổng số commit (trong shallow) | 1 |
| Commit gần nhất | `657e20c` — `Initial commit` |
| Tác giả | `walevmn001 <155431213+walevmn001@users.noreply.github.com>` |
| Thời gian | Fri Nov 27 22:49:21 2026 +0700 |
| Nội dung | `README.md | 1 +` |

## 5. Công nghệ hiện có

**Không có.** Không tồn tại `package.json`, `tsconfig.json`, lockfile, `Dockerfile`, CI workflow, hay bất kỳ file cấu hình framework nào.

## 6. Tooling khả dụng trong môi trường sandbox

| Tool | Phiên bản | Ghi chú |
| --- | --- | --- |
| Node.js | `v24.1.0` | Hỗ trợ tốt cho Next.js/React hiện đại |
| npm | `11.4.2` | |
| pnpm | `10.5.2` | Khuyến nghị dùng cho monorepo/perf |
| yarn | `4.18.1` | |
| bun | `1.2.14` | |
| Python | `3.14.8` | |
| pip | `26.2.1` | |
| Go | `1.25.1` | |
| Docker | **Không có** (`command not found`) | Ảnh hưởng phương án self-host local |
| Git | `2.43.0` | |

Kết luận: Bộ tool Node/TS sẵn sàng cho stack JS/TS. **Không thể chạy Docker** trong sandbox này → tránh giả định local compose/container cho P01+.

---

## 7. Blockers & điểm cần xác nhận

Các mục dưới đây **chưa đủ thông tin để kết luận chắc chắn** — ghi nhận thay vì tự suy đoán.

| # | Blocker | Ảnh hưởng | Đề xuất xử lý |
| --- | --- | --- | --- |
| B1 | **Prompt P00 bị cắt ngắn** ở mục 6 ("4. Phân loại…"). Danh sách phạm vi sản phẩm tổng thể chưa đầy đủ (thiếu các mục tiếp theo, và có thể thiếu cả mục 7+). | Tài liệu phạm vi sản phẩm ([01-dinh-huong-san-pham.md](./01-dinh-huong-san-pham.md)) chỉ có thể ghi nhận phần đã cung cấp + phần đề xuất, chờ xác nhận. | Cần bạn gửi phần còn lại của P00 để hoàn thiện đúng phạm vi. |
| B2 | ~~Chưa rõ dự án có tính thương mại hay không.~~ | Ảnh hưởng lựa chọn hosting: Vercel **Hobby cấm dùng cho mục đích thương mại**. | **ĐÃ GIẢI QUYẾT** → phi thương mại (xem mục 8). |
| B3 | **Tên brand không khớp:** repo là `WaleCooking`, sản phẩm là `CUTE COOKBOOK`. | Ảnh hưởng tên miền, tên app, tiêu đề SEO. | Xác nhận: giữ repo `WaleCooking` + brand `CUTE COOKBOOK`, hay thống nhất sau? |
| B4 | ~~Chưa rõ P00 có được phép tạo commit checkpoint và push lên remote hay không.~~ | Quy tắc nêu "không push khi chưa xác nhận". | **ĐÃ GIẢI QUYẾT** → commit local, không push (xem mục 8). |
| B5 | **Repo là shallow clone** → không truy xuất được toàn bộ lịch sử/refs. | Không ảnh hưởng P00 (mới có 1 commit). | Nếu cần full history về sau, cân nhắc `git fetch --unshallow`. |
| B6 | **Chưa có môi trường triển khai / tài khoản dịch vụ nào được xác nhận** (Vercel, Supabase, Neon, R2…). | Không thể "triển khai" trong P00 — đúng với yêu cầu phase. | Chỉ đề xuất; cài đặt/triển khai để dành cho phase sau khi có xác nhận. |

## 8. Quyết định đã chốt tại P00

| # | Nội dung | Quyết định | Trạng thái blocker |
| --- | --- | --- | --- |
| D1 | Mục đích dự án | **Cá nhân / phi thương mại** | **B2 — đã giải quyết** (Vercel Hobby hợp lệ) |
| D2 | Kiến trúc backend/DB | **Stack lớp rời**: Next.js + Prisma + Neon (Postgres) + Auth.js + Cloudflare R2 | Đã chốt |
| D3 | Checkpoint P00 | **Commit local** trên branch hiện tại, **KHÔNG push** remote | **B4 — đã giải quyết** |

> Blocker **B1** (prompt bị cắt ở mục 6) và **B3** (tên brand repo vs sản phẩm) vẫn **cần xác nhận**.

## 9. Nguyên tắc thực thi đã tuân thủ trong P00

- ✔ Chỉ dùng **1 agent duy nhất**, không tạo sub-agent.
- ✔ Khảo sát thực tế trước khi tạo file.
- ✔ **Không** ghi đè/xóa nội dung có sẵn (`README.md` giữ nguyên).
- ✔ **Không** tạo repository mới, **không** push remote.
- ✔ Chỉ ghi tài liệu định hướng — **không** cài đặt hay triển khai hệ thống.
