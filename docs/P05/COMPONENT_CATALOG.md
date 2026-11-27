# P05 — COMPONENT CATALOG

> Danh mục toàn bộ component dùng chung của Phần A. Mọi component tuân thủ Design System **P03**
> ([design-tokens.json](../P03/tokens/design-tokens.json)) và dùng **Lucide** hoặc asset **P04**.
> Cập nhật: 2026-11-28.

Quy ước chung:
- Path import gốc: `@/components/ui`, `@/components/forms`, `@/components/navigation`, `@/components/feedback`, `@/components/recipe`.
- Mọi component có **TypeScript types rõ ràng**, **default props** hợp lý, **không** chứa business logic module và **không** tự gọi API.
- Component chỉ dùng tiếng Việt cho nhãn mặc định (sẵn sàng i18n EN ở phase sau).

---

## 1. Foundation (không phải component, nhưng là nền tảng)

| Hạng mục | File | Nội dung |
| --- | --- | --- |
| Design tokens → CSS vars | [styles/globals.css](../../styles/globals.css) | `@theme` map 1:1 token P03 (color/font/type scale/spacing/radius/shadow/easing/breakpoint/container/anim) |
| Non-utility tokens | [styles/globals.css](../../styles/globals.css) | `--z-*`, `--duration-*`, `--control-*`, `--touch-target-min`, `--icon-*`, `--focus-ring` |
| Utilities | [styles/globals.css](../../styles/globals.css) | `z-*`, `focus-ring`, `prose-width`, `.container-page`, `.skip-link` |
| Base/reset | [styles/globals.css](../../styles/globals.css) | font body/heading, `text-wrap`, `:focus-visible`, max-width ảnh, reduced-motion |
| Class util | [lib/utils/cn.ts](../../lib/utils/cn.ts) | Ghép class có điều kiện |
| Format util | [lib/utils/format.ts](../../lib/utils/format.ts) | `formatMinutes`, `formatServings` |
| Hook | [lib/hooks/use-outside-click.ts](../../lib/hooks/use-outside-click.ts) | Đóng popover/menu khi click ngoài |
| Cấu hình | [lib/constants/site.ts](../../lib/constants/site.ts), [lib/constants/navigation.ts](../../lib/constants/navigation.ts) | siteConfig, primaryNav/accountNav/footerNavGroups/footerPolicyLinks |

> Không tạo hệ thống token thứ hai. Mọi class màu/typography/radius/spacing dùng trực tiếp utility sinh từ `@theme`.

---

## 2. Basic components (`components/ui/`)

| Component | File | Variant | Size | State / ghi chú a11y |
| --- | --- | --- | --- | --- |
| **Button** | [button.tsx](../../components/ui/button.tsx) | `primary` `secondary` `outline` `ghost` `danger` `link` | `sm` `md` `lg` | `loading` (spinner + `aria-busy`, tự disable), `disabled`, `leftIcon`/`rightIcon`, `fullWidth`; export `buttonVariants()` |
| **IconButton** | [icon-button.tsx](../../components/ui/icon-button.tsx) | như Button (bỏ `link`) | `sm` `md` `lg` | **bắt buộc `aria-label`**; `loading`, `disabled` |
| **Link** | [link.tsx](../../components/ui/link.tsx) | appearance `inline` `nav` `button` `unstyled` | theo Button nếu `appearance="button"` | `external` → `target=_blank` + `rel=noopener noreferrer`; inline có gạch chân (không chỉ màu) |
| **Badge** | [badge.tsx](../../components/ui/badge.tsx) | `neutral` `brand` `success` `danger` `warning` `info` | `sm` `md` | Nhãn không tương tác; màu chip + chữ; `leftIcon` (aria-hidden) |
| **Chip** | [chip.tsx](../../components/ui/chip.tsx) | như Badge | — | `<button>` + `aria-pressed`; `selected` có ring + bold (không chỉ màu); `onRemove` + `removeLabel` |
| **Avatar** | [avatar.tsx](../../components/ui/avatar.tsx) | — | `sm` `md` `lg` `xl` | Ảnh (`next/image`) hoặc chữ cái đầu; `alt` = tên; chữ cái đầu `aria-hidden` + sr-only tên |
| **Card** | [card.tsx](../../components/ui/card.tsx) | `default` `elevated` `outline` `muted` | — | `interactive` (nâng nhẹ khi hover/focus-within); `as` đổi thẻ HTML; kèm `CardHeader/CardTitle/CardDescription/CardBody/CardFooter` |
| **Divider** | [divider.tsx](../../components/ui/divider.tsx) | — | — | `orientation`, `label`; `role="separator"` + `aria-orientation` |
| **Tooltip** | [tooltip.tsx](../../components/ui/tooltip.tsx) | — | — | `role="tooltip"`; mở khi hover/focus; `aria-describedby` chỉ gắn khi mở; Esc đóng |
| **Skeleton** | [skeleton.tsx](../../components/ui/skeleton.tsx) | shape `text` `radius` `circle` | — | `aria-hidden`; animate-pulse (tắt theo reduced-motion) |
| **Spinner** | [spinner.tsx](../../components/ui/spinner.tsx) | — | `sm` `md` `lg` | `role="status" aria-live="polite"` + nhãn sr-only (`label`) |
| **EmptyState** | [empty-state.tsx](../../components/ui/empty-state.tsx) | — | — | `title`/`description`/`action`/illustration P04; minh họa aria-hidden khi không có alt |
| **ErrorState** | [error-state.tsx](../../components/ui/error-state.tsx) | — | — | `role="alert"`; tiêu đề + mô tả chữ (không chỉ màu); illustration P04 |
| **LoadingState** | [loading-state.tsx](../../components/ui/loading-state.tsx) | — | — | `role="status" aria-live="polite"`; 1 vùng status (Spinner ẩn `aria-hidden`) để tránh trùng |

---

## 3. Form components (`components/forms/`)

| Component | File | Props chính | A11y |
| --- | --- | --- | --- |
| **FormField** | [form-field.tsx](../../components/forms/form-field.tsx) | `id`, `label`, `hideLabel`, `hint`, `error`, `required`, `disabled`, `children` | Cung cấp context: tự nối `htmlFor`, `aria-describedby`, `aria-invalid`, `aria-required`; `data-invalid`/`data-disabled` |
| **FormLabel** | form-field.tsx | `required`, `srOnly` | Dấu `*` aria-hidden + sr-only "(bắt buộc)" |
| **FormError** | form-field.tsx | — | `role="alert"` + icon cảnh báo + chữ (không chỉ màu) |
| **FormHint** | form-field.tsx | — | Chữ phụ, ẩn khi có lỗi |
| **Input** | [input.tsx](../../components/forms/input.tsx) | `size`, `invalid`, (…HTML input) | Tự nối aria từ FormField; `invalid` → `aria-invalid` + viền danger |
| **Textarea** | input.tsx | `size`, `invalid`, `rows` (mặc định 4) | Như Input |
| **Select** | [select.tsx](../../components/forms/select.tsx) | `options`, `placeholder`, `size`, `invalid` | `<select>` gốc (bàn phím mặc định); icon ChevronDown aria-hidden |
| **Checkbox** | [checkbox.tsx](../../components/forms/checkbox.tsx) | `label`, `description`, `invalid` | `htmlFor`+`id`; lỗi `aria-describedby` |
| **Radio / RadioGroup** | [radio.tsx](../../components/forms/radio.tsx) | RadioGroup: `legend` (bắt buộc), `name`, `value`, `onValueChange`, `orientation` | `<fieldset>`+`<legend>`; `Radio` gắn `name` từ group |
| **Switch** | [switch.tsx](../../components/forms/switch.tsx) | `checked`, `onCheckedChange`, `label`, `description` | `role="switch"` + `aria-checked`; bàn phím Space/Enter; bắt buộc `aria-label` nếu không có `label` |
| **SearchInput** | [search-input.tsx](../../components/forms/search-input.tsx) | `size`, `label`, `clearable`, `onValueChange`, `onSearch` | `role="search"`; `aria-label`; nút xoá có `aria-label`; Enter → `onSearch` |

Yêu cầu đã đáp ứng: có label/accessible name; lỗi rõ ràng; trạng thái `disabled`/`focus`/`invalid`; hỗ trợ bàn phím; **không** truyền đạt lỗi chỉ bằng màu (luôn kèm icon + chữ + `role="alert"`).

---

## 4. Navigation & feedback components

### 4.1 Navigation (`components/navigation/`)

| Component | File | Props | A11y |
| --- | --- | --- | --- |
| **Breadcrumb** | [breadcrumb.tsx](../../components/navigation/breadcrumb.tsx) | `items: {label, href?}[]` | `aria-label="Đường dẫn"`; mục cuối `aria-current="page"`; rỗng → `null` |
| **Tabs** | [tabs.tsx](../../components/navigation/tabs.tsx) | `items: TabItem[]`, `defaultTabId`, `tabId`, `onTabChange` | `role=tablist/tab/tabpanel`; bàn phím ← → Home End; `aria-selected`, `aria-controls`, `aria-labelledby`, roving `tabIndex` |
| **Pagination** | [pagination.tsx](../../components/navigation/pagination.tsx) | `page`, `totalPages`, `hrefFor`, `siblingCount` | `aria-label="Phân trang"`; `aria-current="page"`; nút trước/sau có `aria-label` + `aria-disabled`; ẩn khi ≤1 trang |
| **Dropdown** | [dropdown.tsx](../../components/navigation/dropdown.tsx) | `trigger`, `items`, `label`, `align` | `role="menu"/menuitem`; bàn phím ↑ ↓ Home End Esc Tab; đóng khi click ngoài; trả focus về trigger; `aria-haspopup`/`aria-expanded` |

### 4.2 Feedback (`components/feedback/`)

| Component | File | Props | A11y |
| --- | --- | --- | --- |
| **Modal** | [modal.tsx](../../components/feedback/modal.tsx) | `open`, `onClose`, `title`, `description`, `footer`, `size` (`sm`/`md`/`lg`), `closeOnOverlay`, `showClose` | `role="dialog" aria-modal`; focus trap; Esc đóng; khoá cuộn nền; trả focus; `aria-labelledby`/`aria-describedby`; portal ra `body` |
| **ConfirmDialog** | [confirm-dialog.tsx](../../components/feedback/confirm-dialog.tsx) | `open`, `title`, `description`, `confirmLabel`, `cancelLabel`, `tone` (`default`/`danger`), `loading`, `onConfirm`, `onCancel` | Dựng trên Modal; nút xác nhận là hành động chính |
| **ToastProvider / useToast** | [toast.tsx](../../components/feedback/toast.tsx) | `toast({title, description, tone, duration, action})`, `dismiss(id)` | Vùng `aria-live="polite"`; `role="status"` (info/success/warning) hoặc `role="alert"` (error); nút đóng có `aria-label`; `useToast` ném lỗi khi dùng ngoài Provider |

---

## 5. Cooking-specific components (`components/recipe/`)

Kiểu dữ liệu trình bày ở [types.ts](../../components/recipe/types.ts) — **không phải** entity Prisma; việc map domain → kiểu này thuộc module Recipe (P06+).

| Component | File | Props | Ghi chú |
| --- | --- | --- | --- |
| **RecipeImage** | [recipe-image.tsx](../../components/recipe/recipe-image.tsx) | `src`, `alt`, `ratio` (`4/3`/`1/1`/`16/9`), `priority`, `sizes` | Thiếu ảnh → minh họa mascot P04 (`mascot-holding-recipe.svg`) thay vì ảnh vỡ |
| **RecipeCard** | [recipe-card.tsx](../../components/recipe/recipe-card.tsx) | `recipe`, `href`, `isFavorite`, `onToggleFavorite`, `priority` | 1 liên kết chính bao thẻ (stretched link); nút yêu thích `aria-pressed` |
| **RecipeCardCompact** | [recipe-card-compact.tsx](../../components/recipe/recipe-card-compact.tsx) | `recipe`, `href` | Ảnh 1:1 nhỏ bên trái; cho danh sách/tìm kiếm |
| **IngredientRow** | [ingredient-row.tsx](../../components/recipe/ingredient-row.tsx) | `ingredient`, `checkable`, `checked`, `onCheckedChange` | `<li>`; nhãn checkbox chính là tên nguyên liệu; "Tuỳ chọn" badge |
| **IngredientList** | ingredient-row.tsx | `ingredients`, `checkable`, `checkedIds`, `onCheckedChange`, `aria-label` | `<ul>`; nhãn mặc định "Nguyên liệu" |
| **CookingStepCard** | [cooking-step-card.tsx](../../components/recipe/cooking-step-card.tsx) | `step`, `done`, `onToggleDone` | `<li>` trong `<ol>`; `aria-pressed`; hoàn thành biểu thị bằng ✓ + chữ (không chỉ màu) |
| **CookingTime** | [recipe-meta.tsx](../../components/recipe/recipe-meta.tsx) | `minutes` | sr-only "Thời gian nấu:" + `formatMinutes` |
| **PreparationTime** | recipe-meta.tsx | `minutes` | sr-only "Thời gian chuẩn bị:" |
| **ServingsBadge** | recipe-meta.tsx | `servings` | Badge + icon người |
| **DifficultyBadge** | recipe-meta.tsx | `level` (`easy`/`medium`/`hard`) | Luôn kèm chữ ("Độ khó: Dễ/Trung bình/Khó"); trả `null` nếu không có level |
| **CategoryCard** | [category-card.tsx](../../components/recipe/category-card.tsx) | `category`, `href` | Ảnh 16:9 + tên + số công thức; liên kết bao thẻ |
| **NutritionSummary** | [nutrition-summary.tsx](../../components/recipe/nutrition-summary.tsx) | `title`, `facts`, `note`, `emptyLabel` | `<dl>`; rỗng → thông báo trung tính (không bịa số liệu) |
| **AllergenBadges** | [allergen-badges.tsx](../../components/recipe/allergen-badges.tsx) | `allergens`, `emptyLabel`, `label`, `hideLabel` | Cảnh báo dạng badge (chữ + icon); rỗng → thông báo trung tính; không suy diễn |

---

## 6. Layout components (`components/layout/`)

| Component | File | Props | Ghi chú |
| --- | --- | --- | --- |
| **Container** | [container.tsx](../../components/layout/container.tsx) | `size` (`narrow`/`default`/`wide`/`full`) | Padding ngang 16/24/32 theo P03; dùng chung cho page |
| **SiteLogo** | [site-logo.tsx](../../components/layout/site-logo.tsx) | `variant` (`full`/`compact`) | Asset P04 (`logo-primary.svg`/`logo-mark.svg`); liên kết về `/`; `aria-label` |
| **SiteHeader** | [site-header.tsx](../../components/layout/site-header.tsx) | `className` | Sticky, cao 4rem; logo + nav + search + yêu thích + tài khoản + mobile menu |
| **PrimaryNav** | [primary-nav.tsx](../../components/layout/primary-nav.tsx) | `items`, `className`, `onNavigate` | `aria-current="page"`; mục placeholder có chấm + title |
| **MobileMenu** | [mobile-menu.tsx](../../components/layout/mobile-menu.tsx) | `open`, `onClose`, `items` | Drawer portal; `role="dialog" aria-modal`; focus trap; Esc; khoá cuộn; trả focus |
| **SiteFooter** | [site-footer.tsx](../../components/layout/site-footer.tsx) | — | Logo + mô tả + nhóm liên kết + policy + copyright động; **chỉ hiện "Liên hệ" nếu có cấu hình thật** |
| **PlaceholderPage** | [placeholder-page.tsx](../../components/layout/placeholder-page.tsx) | `title`, `description`, `phase`, `icon` | Nội dung route chưa triển khai; nói rõ "Chưa triển khai" |

---

## 7. Dev component gallery

| Thành phần | File | Ghi chú |
| --- | --- | --- |
| **ComponentGallery** | [components/dev/component-gallery.tsx](../../components/dev/component-gallery.tsx) | Trang kiểm tra client-only, dùng mock data có nhãn `[MOCK]` |
| Route dev-only | [app/dev/components/page.tsx](../../app/dev/components/page.tsx) | `notFound()` ở production |
| Mock data | [lib/mock/recipes.ts](../../lib/mock/recipes.ts) | **CHỈ** dùng cho dev/test/story; không dùng production |

---

## 8. Điều chưa có (ngoài phạm vi P05)

- Chưa có story/storybook riêng (P05 dùng trang `/dev/components` thay thế).
- Chưa có component đặc thù module (search filters, pagination có state server…) — thuộc P06+.
- Chưa có component nào gọi API hay truy cập dữ liệu thật.
