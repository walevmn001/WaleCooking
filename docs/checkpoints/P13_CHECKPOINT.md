# P13 — CHECKPOINT: NEON POSTGRESQL PRODUCTION INTEGRATION

> Phase: **P13** · Sub-phase hiện tại: **P13.1** · Ngày: 2026-11-28
> Trạng thái: **ĐANG THỰC HIỆN**
> Branch: `trae/agent-VkDApw` · Mốc tiếp nối: `b3936be` (P12.7, `origin/main`)
> Phạm vi: tích hợp **Neon PostgreSQL thật**. **Không** triển khai R2/Auth.js; **không** đổi kiến trúc.

---

## 1. Mốc công việc (cập nhật theo từng sub-phase)

| Sub-phase | Nội dung | Trạng thái |
|---|---|---|
| P13.1.1 | Audit trạng thái thực tế | ✅ Hoàn thành — [P13.1_AUDIT.md](../P13/P13.1_AUDIT.md) · `eb0034c` |
| P13.1.2 | Neon configuration (`DATABASE_URL`/`DIRECT_URL`) | ✅ Hoàn thành — cấu hình đã đúng, không cần sửa; bổ sung test env (6/6 PASS) |
| P13.1.3 | Database connectivity | ✅ Hoàn thành (local PASS) · ⛔ Neon **BLOCKED** (thiếu credentials) — script `scripts/verify-db.ts` |
| P13.1.4 | Migration deployment | ⏳ Chờ |
| P13.1.5 | Integration verification | ⏳ Chờ |
| P13.1.6 | Documentation | ⏳ Chờ |

## 2. Git mốc đầu P13.1

- Branch: `trae/agent-VkDApw`
- HEAD = `origin/main` = `b3936be883051a0bff28efd3ad9084bb4259a8cd`
- Working tree: **sạch** trước khi bắt đầu.

## 3. Phát hiện chính từ audit (chi tiết ở P13.1_AUDIT.md)

| ID | Mức | Tóm tắt |
|---|---|---|
| P13-F01 | Cao | `DIRECT_URL` bắt buộc cho `prisma migrate deploy` (Neon) nhưng optional trong `env.ts` |
| P13-F02 | Trung bình | Neon pooler cần `?pgbouncer=true` |
| P13-F03 | Trung bình | Không có tự động hóa migration khi deploy |
| P13-F04 | Thấp | Chưa có test xác minh cờ `pgbouncer=true` |

## 4. Điều kiện môi trường

- Node `v24.1.0`, pnpm `10.5.2`, mạng npm ✅.
- PostgreSQL **16.15 local** ✅ (`127.0.0.1:5432`, `wale`/`wale_dev`/`wale_test`/`wale_e2e`).
- Chrome 150 @ CDP `127.0.0.1:9222` ✅.
- `DATABASE_URL`/`DIRECT_URL` **Neon** ❌ · `R2_*` ❌ · `AUTH_*` ❌ · quyền Vercel ❌.

## 5. Trạng thái dự kiến (PASS / FAIL / BLOCKED / PENDING)

| Hạng mục | Dự kiến |
|---|---|
| Audit (P13.1.1) | **PASS** |
| Neon configuration (P13.1.2) | **PASS** (kiểm cấu hình) |
| Neon connectivity (P13.1.3) | **BLOCKED** (không có credentials Neon trong sandbox) |
| Migration deployment (P13.1.4) | **BLOCKED** (không xác định DB đích Neon) |
| Integration verification (P13.1.5) | **PASS** (trên PostgreSQL local) |
| Documentation (P13.1.6) | **PASS** |

*Checkpoint này sẽ được cập nhật ở cuối P13.1 với kết quả cuối cùng.*
