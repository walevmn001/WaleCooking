# P11.8 — MANUAL VERIFICATION CHECKLIST (WALE COOKING)

> Phase: **P11 — Real-World Verification & UX Polish**
> Sandbox **không có trình duyệt/thiết bị thật** ⇒ các mục dưới đây là **External Verification Pending**.
> Tài liệu này là checklist để con người kiểm thủ công khi có browser/điện thoại — **không** giả lập kết quả.

---

## 0. Chuẩn bị môi trường

- [ ] `pnpm install` + `pnpm prisma generate`.
- [ ] Có PostgreSQL; đặt `DATABASE_URL` (+ `DIRECT_URL` nếu dùng Neon).
- [ ] `pnpm db:deploy` (hoặc `db:migrate`) + `pnpm db:seed`.
- [ ] (Tùy chọn) Tạo vài công thức **published** để kiểm luồng "có dữ liệu".
- [ ] `pnpm build` + `pnpm start` (hoặc `pnpm dev`).
- [ ] Đặt `NEXT_PUBLIC_SITE_URL` đúng domain để kiểm sitemap/canonical.

---

## 1. Responsive (6 viewport)

Với mỗi viewport, mở: Trang chủ · Danh sách công thức · Chi tiết công thức · Danh mục · Yêu thích · Cooking Mode · Công cụ nhà bếp · Trang quản trị.

- [ ] 320 × 568 (mobile nhỏ)
- [ ] 375 × 812 (mobile phổ biến)
- [ ] 430 × 932 (mobile lớn)
- [ ] 768 × 1024 (tablet)
- [ ] 1366 × 768 (desktop)
- [ ] 1920 × 1080 (desktop lớn)

Kiểm mỗi viewport:
- [ ] Không tràn ngang (không có scrollbar ngang).
- [ ] Text không tràn khỏi card/khung.
- [ ] Card thẳng hàng, khoảng cách đồng đều.
- [ ] Ảnh đúng tỷ lệ, không méo.
- [ ] Menu (desktop/tablet/mobile) thao tác được.
- [ ] Nút ≥ 44×44px (đặc biệt trên mobile).
- [ ] Nội dung không bị header/footer che.
- [ ] Dialog/Modal không vượt màn hình, đóng được.

---

## 2. Cooking Mode (trên điện thoại thật)

- [ ] Mở chế độ nấu từ trang chi tiết công thức.
- [ ] Chuyển bước tiếp theo / quay lại / chọn bước bất kỳ.
- [ ] Tiến độ hiển thị đúng khi đổi bước.
- [ ] Focus trap khi mở; `Esc` đóng kèm xác nhận.
- [ ] Điều hướng bằng bàn phím (nếu có keyboard).
- [ ] Nút kết thúc hoạt động.
- [ ] Tải lại trang → khôi phục phiên nấu (stepIndex/checklist).
- [ ] Công thức bị đổi/xóa → xử lý an toàn (404 hoặc bỏ state).
- [ ] Trên điện thoại: không tràn ngang, nút đủ lớn, chữ dễ đọc, nội dung bước dễ theo dõi.
- [ ] Đổi khẩu phần → định lượng cập nhật; tick checklist → tiến độ đúng.

---

## 3. Multi Timer (trên điện thoại thật)

- [ ] Tạo/nhiều timer, đặt tên, bắt đầu/tạm dừng/tiếp tục/reset/xóa.
- [ ] Hết giờ → cảnh báo (banner/âm thanh/rung/Notification) **một lần**.
- [ ] Không có âm thanh ngoài ý muốn khi vừa vào trang.
- [ ] Không xin quyền Notification ngay khi tải trang (chỉ khi bấm).
- [ ] Tải lại trang → khôi phục timer.
- [ ] **Chuyển sang app khác rồi quay lại** → thời gian còn lại đúng.
- [ ] **Khóa màn hình rồi mở lại** → thời gian còn lại đúng.
- [ ] Không có timer chạy trùng.

> ⚠️ Nếu chưa thử được bước "app khác" / "khóa màn hình", **ghi rõ CHƯA xác minh** — không tuyên bố timer nền hoàn hảo.

---

## 4. Trang quản trị (cần Auth.js + credentials)

- [ ] Truy cập `/admin*` khi chưa đăng nhập → bị từ chối (UI + API).
- [ ] Đăng nhập quản trị thành công.
- [ ] Xem danh sách / tạo / sửa công thức.
- [ ] Lưu nháp → xuất bản → lưu trữ.
- [ ] Quản lý danh mục (taxonomy).
- [ ] Upload ảnh (kiểm file sai loại → bị chặn).
- [ ] Đăng xuất.
- [ ] Xác minh API write trả **401/403** đúng theo vai trò (không chỉ ẩn UI).

---

## 5. SEO (công cụ ngoài)

- [ ] `/sitemap.xml` trả 200, URL đúng domain, **không** chứa draft/admin/api/dev.
- [ ] `/robots.txt` trả 200, disallow `/admin`,`/api/`,`/dev/`.
- [ ] Rich Results Test (Google) cho trang công thức: Recipe + BreadcrumbList hợp lệ, **không** rating giả.
- [ ] Canonical đúng; Open Graph hiển thị khi chia sẻ.
- [ ] URL không tồn tại trả **404** (không soft-404).

---

## 6. Accessibility (runtime)

- [ ] Keyboard: tab được tới mọi control; focus ring nhìn thấy.
- [ ] Screen reader (NVDA/VoiceOver): điều hướng heading/landmark, nút có tên.
- [ ] axe/Lighthouse: không lỗi nghiêm trọng.
- [ ] Zoom 200%: không mất nội dung, không tràn.
- [ ] Contrast (alpha/overlay) trên UI thật.
- [ ] `prefers-reduced-motion`: animation giảm.

---

## 7. Performance (runtime)

- [ ] Lighthouse (mobile + desktop): CWV mục tiêu.
- [ ] Kiểm bundle size, ảnh lazy-load dưới màn hình.
- [ ] Không có console/network error khi điều hướng chính.

---

## 8. Ghi nhận kết quả

Khi hoàn tất, cập nhật [BUG_FIX_REPORT.md](./BUG_FIX_REPORT.md) (lỗi mới nếu có) và đổi nhãn các mục
**External Verification Pending** → **Verified** kèm bằng chứng (ảnh/kết quả công cụ).
