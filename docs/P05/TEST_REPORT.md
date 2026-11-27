# P05 — TEST REPORT

> Báo cáo kiểm thử P05. Chỉ ghi kết quả **thực tế đã chạy**; phần chưa chạy ghi rõ.
> Môi trường: remote sandbox Linux, non-interactive, **không có trình duyệt headless**.
> Cập nhật: 2026-11-28.

---

## 1. Kết quả tổng hợp (đã chạy)

| Kiểm tra | Lệnh | Kết quả | Ghi chú |
| --- | --- | --- | --- |
| TypeScript | `pnpm typecheck` (`tsc --noEmit`) | ✅ **0 lỗi** | — |
| ESLint | `pnpm lint` (`eslint .`) | ✅ **0 lỗi / 0 cảnh báo** | — |
| Unit test | `pnpm test` (`vitest run`) | ✅ **60/60 pass** (11 file) | ~10.96s |
| Production build | `pnpm build` (`next build`) | ✅ **thành công**, 15 route | Next.js 16.4.6 (Turbopack), ~710ms compile |

> Cả 4 bước chạy trên cùng working tree; đều xanh. Không bỏ qua test lỗi để có build xanh giả tạo.

---

## 2. Chi tiết unit test (60 test / 11 file)

| File | Số test | Nội dung kiểm |
| --- | --- | --- |
| [tests/utils/cn.test.ts](../../tests/utils/cn.test.ts) | 5 | Ghép class, bỏ giá trị falsy, số `0`, mảng lồng, đầu vào rỗng |
| [tests/utils/format.test.ts](../../tests/utils/format.test.ts) | 7 | `formatMinutes`, `formatServings` (chuỗi tiếng Việt) |
| [tests/components/button.test.tsx](../../tests/components/button.test.tsx) | 6 | Render, `onClick`, `disabled`, `loading` (aria-busy + disable), `buttonVariants`, IconButton `aria-label` |
| [tests/components/badge-chip-card.test.tsx](../../tests/components/badge-chip-card.test.tsx) | 5 | Badge; Chip `aria-pressed` + `onRemove`; Card đổi thẻ `as` |
| [tests/components/form.test.tsx](../../tests/components/form.test.tsx) | 11 | FormField label `htmlFor`; `required`; lỗi (`aria-invalid` + `aria-describedby`); hint ẩn khi có lỗi; disabled lan truyền; Textarea; Select; Checkbox; RadioGroup; Switch |
| [tests/components/tabs.test.tsx](../../tests/components/tabs.test.tsx) | 5 | Tab mặc định; ArrowRight; End/Home; roving `tabIndex`; `aria-controls`/`aria-labelledby` |
| [tests/components/modal.test.tsx](../../tests/components/modal.test.tsx) | 4 | `role=dialog`/`aria-modal`/accessible name; đóng bằng Escape; nút X; ConfirmDialog `onConfirm`/`onCancel` |
| [tests/components/toast.test.tsx](../../tests/components/toast.test.tsx) | 4 | `role=status`; `role=alert` + action; đóng toast; `useToast` ném lỗi ngoài Provider |
| [tests/components/states.test.tsx](../../tests/components/states.test.tsx) | 3 | EmptyState; ErrorState `role=alert`; LoadingState `role=status` |
| [tests/components/navigation.test.tsx](../../tests/components/navigation.test.tsx) | 4 | Breadcrumb `aria-current` + rỗng; Pagination `aria-current` + ẩn khi 1 trang |
| [tests/components/recipe.test.tsx](../../tests/components/recipe.test.tsx) | 6 | IngredientList checkable; CookingStepCard `aria-pressed`; RecipeCard link + yêu thích; DifficultyBadge; ServingsBadge |
| **Tổng** | **60** | **11 file — tất cả pass** |

Cấu hình: [vitest.config.ts](../../vitest.config.ts) — `environment: jsdom`, `globals: true`, `include: ['tests/**/*.test.{ts,tsx}']`, `css: false`, setup [vitest.setup.ts](../../vitest.setup.ts), alias `@ → ./`.

---

## 3. Chi tiết build

```
✓ Compiled successfully in 710ms
✓ Generating static pages (16/16)
Route (app)
○ /                    ○ /_not-found        ○ /admin
○ /ban-quyen           ○ /bao-mat           ○ /cong-thuc
○ /dang-nhap           ○ /danh-muc          ○ /dev/components
○ /dieu-khoan          ○ /gioi-thieu        ○ /kien-thuc
○ /tai-khoan           ƒ /tim-kiem          ○ /yeu-thich
```

- 14 route static + 1 route dynamic (`/tim-kiem`) = **15 route** trong bảng.
- Không có lỗi/cảnh báo biên dịch; TypeScript trong build pass.
- `next/font/google` tải Baloo 2 + Nunito thành công (môi trường có proxy egress).

---

## 4. Kiểm tra import/dependency & route

| Hạng mục | Kết quả |
| --- | --- |
| Import sai/thiếu | ✅ Không — `tsc --noEmit` + build thành công |
| Barrel export (`index.ts` mỗi nhóm) | ✅ Tất cả type + component được export |
| Dependency ngoài stack | ✅ Không thêm framework UI nào; chỉ dùng `lucide-react`, `next`, `react`, Tailwind |
| Route hợp lệ | ✅ 15 route biên dịch; `/dev/components` tự `notFound()` ở production |
| Console error khi build | ✅ Không |

> **Chưa** kiểm console error **runtime** trên trình duyệt (không có trình duyệt trong môi trường).

---

## 5. Kiểm thử CHƯA chạy (ghi trung thực)

| Hạng mục | Trạng thái | Lý do |
| --- | --- | --- |
| Kiểm trình duyệt thật (responsive, focus, tràn ngang) | ❌ Chưa | Không có trình duyệt headless trong môi trường |
| Playwright/E2E | ❌ Chưa | Chưa cấu hình; chưa cần cho P05 |
| axe-core / Lighthouse | ❌ Chưa | Cần trình duyệt |
| Screen reader (NVDA/VoiceOver) | ❌ Chưa | Cần môi trường tương tác |
| Kiểm ảnh chụp (visual regression) | ❌ Chưa | Cần trình duyệt/rasterizer |
| Ảnh hưởng: các mục trên thuộc **B-P03-01** | — | Chuyển sang bước kiểm UI thật |

---

## 6. Cách tái lập

```bash
pnpm install --frozen-lockfile
pnpm typecheck   # 0 lỗi
pnpm lint        # 0 lỗi / 0 cảnh báo
pnpm test        # 60/60 pass
pnpm build       # 15 route, thành công
```
