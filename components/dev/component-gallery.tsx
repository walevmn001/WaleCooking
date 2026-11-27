"use client";

/**
 * ComponentGallery — trang kiểm tra component + Application Shell (P05 §5).
 * CHỈ dùng ở môi trường phát triển (route /dev/components trả 404 ở production).
 * Toàn bộ nội dung công thức dùng MOCK data ([MOCK]) — KHÔNG phải nội dung thật.
 */

import { useState, type ReactNode } from "react";
import {
  AlertTriangle,
  Bell,
  Heart,
  Info,
  Plus,
  Search,
  Settings,
  Trash2,
} from "lucide-react";

import {
  Avatar,
  Badge,
  Button,
  Card,
  CardBody,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Chip,
  Divider,
  EmptyState,
  ErrorState,
  IconButton,
  Link,
  LoadingState,
  Skeleton,
  Spinner,
  Tooltip,
} from "@/components/ui";

import {
  Checkbox,
  FormField,
  Input,
  Radio,
  RadioGroup,
  SearchInput,
  Select,
  Switch,
  Textarea,
} from "@/components/forms";

import { Breadcrumb, Dropdown, Pagination, Tabs } from "@/components/navigation";
import { ConfirmDialog, Modal, useToast } from "@/components/feedback";
import { Container, SiteFooter, SiteHeader } from "@/components/layout";

import {
  AllergenBadges,
  CategoryCard,
  CookingStepCard,
  CookingTime,
  DifficultyBadge,
  IngredientList,
  NutritionSummary,
  PreparationTime,
  RecipeCard,
  RecipeCardCompact,
  RecipeImage,
  ServingsBadge,
} from "@/components/recipe";

import {
  MOCK_ALLERGENS,
  MOCK_CATEGORIES,
  MOCK_INGREDIENTS,
  MOCK_NUTRITION,
  MOCK_RECIPES,
  MOCK_STEPS,
} from "@/lib/mock/recipes";

function Section({
  id,
  title,
  description,
  children,
}: {
  id: string;
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h2 id={`${id}-title`} className="text-h2 text-ink">
          {title}
        </h2>
        {description ? <p className="text-body-sm text-ink-muted">{description}</p> : null}
      </div>
      {children}
    </section>
  );
}

function Row({ children }: { children: ReactNode }) {
  return <div className="flex flex-wrap items-center gap-3">{children}</div>;
}

const TOKEN_SWATCHES: { name: string; className: string }[] = [
  { name: "brand.cream", className: "bg-brand-cream" },
  { name: "brand.mint", className: "bg-brand-mint" },
  { name: "brand.mintDark", className: "bg-brand-mint-dark" },
  { name: "brand.pink", className: "bg-brand-pink" },
  { name: "brand.beige", className: "bg-brand-beige" },
  { name: "brand.brown", className: "bg-brand-brown" },
  { name: "primary", className: "bg-primary" },
  { name: "secondary", className: "bg-secondary" },
  { name: "success", className: "bg-success" },
  { name: "warning", className: "bg-warning" },
  { name: "danger", className: "bg-danger" },
  { name: "info", className: "bg-info" },
];

export function ComponentGallery() {
  const { toast } = useToast();

  const [modalOpen, setModalOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [switchOn, setSwitchOn] = useState(true);
  const [chipSelected, setChipSelected] = useState(true);
  const [favoriteIds, setFavoriteIds] = useState<string[]>([MOCK_RECIPES[0]!.id]);
  const [checkedIngredients, setCheckedIngredients] = useState<string[]>([
    MOCK_INGREDIENTS[0]!.id,
  ]);
  const [doneSteps, setDoneSteps] = useState<string[]>([]);

  return (
    <div className="bg-background">
      <Container size="wide" className="flex flex-col gap-12 py-8 sm:py-12">
        <header className="flex flex-col gap-2">
          <Badge variant="brand">Dev-only</Badge>
          <h1 className="text-display text-ink">Kiểm tra component &amp; Application Shell</h1>
          <p className="max-w-2xl text-body text-ink-muted">
            Trang này CHỈ tồn tại ở môi trường phát triển (production trả 404). Nội dung công
            thức là dữ liệu giả <code className="text-ink">[MOCK]</code> — không phải nội dung
            thật.
          </p>
        </header>

        {/* 3.1 Foundation */}
        <Section
          id="tokens"
          title="Foundation — Design tokens (P03)"
          description="Màu thương hiệu và semantic tái sử dụng từ design-tokens.json P03 (không tạo hệ thống token thứ hai)."
        >
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
            {TOKEN_SWATCHES.map((t) => (
              <div
                key={t.name}
                className="flex flex-col gap-2 rounded-md border border-line-subtle bg-surface p-2"
              >
                <span className={`h-12 w-full rounded-sm border border-line-subtle ${t.className}`} />
                <span className="text-caption text-ink-muted">{t.name}</span>
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-2 rounded-lg border border-line-subtle bg-surface p-4">
            <p className="text-display text-ink">Display · Baloo 2</p>
            <p className="text-h1 text-ink">Heading 1</p>
            <p className="text-h2 text-ink">Heading 2</p>
            <p className="text-h3 text-ink">Heading 3</p>
            <p className="text-body-lg text-ink">Body large — Nunito</p>
            <p className="text-body text-ink-muted">Body — văn bản thường</p>
            <p className="text-body-sm text-ink-muted">Body small</p>
            <p className="text-caption text-ink-subtle">Caption</p>
          </div>
        </Section>

        {/* 3.2 Basic components */}
        <Section id="basic" title="Basic components">
          <div className="flex flex-col gap-4 rounded-lg border border-line-subtle bg-surface p-4">
            <p className="text-label text-ink">Button — variants</p>
            <Row>
              <Button variant="primary">Primary</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="outline">Outline</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="danger">Danger</Button>
              <Button variant="link">Link</Button>
            </Row>

            <p className="text-label text-ink">Button — sizes / states</p>
            <Row>
              <Button size="sm">Small</Button>
              <Button size="md">Medium</Button>
              <Button size="lg">Large</Button>
              <Button disabled>Disabled</Button>
              <Button loading>Đang xử lý</Button>
              <Button leftIcon={<Plus className="size-4" aria-hidden="true" />}>Thêm</Button>
              <Button rightIcon={<Search className="size-4" aria-hidden="true" />}>Tìm</Button>
            </Row>

            <p className="text-label text-ink">IconButton</p>
            <Row>
              <IconButton aria-label="Thêm" size="sm">
                <Plus className="size-4" aria-hidden="true" />
              </IconButton>
              <IconButton aria-label="Thông báo" size="md" variant="outline">
                <Bell className="size-5" aria-hidden="true" />
              </IconButton>
              <IconButton aria-label="Cài đặt" size="lg" variant="secondary">
                <Settings className="size-5" aria-hidden="true" />
              </IconButton>
              <IconButton aria-label="Đang tải" loading />
            </Row>

            <p className="text-label text-ink">Link</p>
            <Row>
              <Link href="/cong-thuc">Liên kết inline</Link>
              <Link href="/cong-thuc" appearance="nav">
                Liên kết nav
              </Link>
              <Link href="/cong-thuc" appearance="button" variant="outline">
                Liên kết dạng nút
              </Link>
              <Link href="https://example.com" external>
                Liên kết ngoài
              </Link>
            </Row>

            <p className="text-label text-ink">Badge / Chip</p>
            <Row>
              <Badge variant="neutral">Neutral</Badge>
              <Badge variant="brand">Brand</Badge>
              <Badge variant="success">Success</Badge>
              <Badge variant="warning" leftIcon={<AlertTriangle className="size-3.5" aria-hidden="true" />}>
                Warning
              </Badge>
              <Badge variant="danger">Danger</Badge>
              <Badge variant="info">Info</Badge>
              <Badge variant="neutral" size="sm">
                Small
              </Badge>
            </Row>
            <Row>
              <Chip
                selected={chipSelected}
                onClick={() => setChipSelected((v) => !v)}
                leftIcon={<Heart className="size-3.5" aria-hidden="true" />}
              >
                {chipSelected ? "Đang chọn" : "Chưa chọn"}
              </Chip>
              <Chip variant="brand">Món nước</Chip>
              <Chip variant="success" onRemove={() => toast({ title: "Đã bỏ chip", tone: "info" })}>
                Có thể xoá
              </Chip>
              <Chip disabled>Chip khoá</Chip>
            </Row>

            <p className="text-label text-ink">Avatar / Divider / Tooltip</p>
            <Row>
              <Avatar name="Nguyễn Văn A" size="sm" />
              <Avatar name="WALE Cook" size="md" />
              <Avatar name="Trần Thị B" size="lg" />
              <Avatar name="Chef" size="xl" />
              <Tooltip label="Gợi ý khi hover/focus">
                <IconButton aria-label="Thông tin">
                  <Info className="size-5" aria-hidden="true" />
                </IconButton>
              </Tooltip>
            </Row>
            <Divider />
            <Divider label="hoặc" />

            <p className="text-label text-ink">Skeleton / Spinner</p>
            <div className="flex flex-col gap-2">
              <Skeleton className="h-4 w-2/3" shape="text" />
              <Skeleton className="h-4 w-1/2" shape="text" />
              <Row>
                <Skeleton className="size-12" shape="circle" />
                <Spinner size="sm" />
                <Spinner size="md" />
                <Spinner size="lg" />
              </Row>
            </div>
          </div>
        </Section>

        {/* 3.3 Form components */}
        <Section id="forms" title="Form components" description="Trạng thái: mặc định, có gợi ý, lỗi (chữ + icon), disabled.">
          <div className="grid gap-6 rounded-lg border border-line-subtle bg-surface p-4 md:grid-cols-2">
            <FormField label="Tiêu đề công thức" hint="Ví dụ: Phở bò Hà Nội" required>
              <Input placeholder="Nhập tiêu đề" />
            </FormField>

            <FormField
              label="Email"
              error="Email không đúng định dạng."
              required
            >
              <Input type="email" defaultValue="sai-dinh-dang" />
            </FormField>

            <FormField label="Trường bị vô hiệu hoá" disabled>
              <Input disabled defaultValue="Không thể chỉnh sửa" />
            </FormField>

            <FormField label="Khẩu phần" hint="Số người ăn">
              <Select
                placeholder="Chọn số khẩu phần"
                options={[
                  { value: "2", label: "2 người" },
                  { value: "4", label: "4 người" },
                  { value: "6", label: "6 người" },
                ]}
              />
            </FormField>

            <FormField label="Mô tả ngắn" className="md:col-span-2">
              <Textarea rows={3} placeholder="Mô tả ngắn về món ăn…" />
            </FormField>

            <FormField label="Nhãn chứa lỗi" error="Vui lòng chọn một mục." className="md:col-span-2">
              <Input aria-describedby={undefined} defaultValue="" />
            </FormField>

            <div className="flex flex-col gap-4 md:col-span-2">
              <p className="text-label text-ink">Checkbox / Switch</p>
              <Checkbox label="Đánh dấu là món chay" description="Bỏ qua nguyên liệu thịt." />
              <Checkbox label="Đã đồng ý điều khoản" disabled />
              <Checkbox label="Checkbox lỗi" invalid />
              <Switch
                checked={switchOn}
                onCheckedChange={setSwitchOn}
                label="Bật chế độ đi chợ"
                description="Tự động tạo danh sách nguyên liệu."
              />
            </div>

            <RadioGroup legend="Độ khó" name="difficulty" className="md:col-span-2">
              <Radio name="difficulty" value="easy" label="Dễ" />
              <Radio name="difficulty" value="medium" label="Trung bình" defaultChecked />
              <Radio name="difficulty" value="hard" label="Khó" />
              <Radio name="difficulty" value="disabled" label="Không chọn được" disabled />
            </RadioGroup>

            <div className="flex flex-col gap-2 md:col-span-2">
              <p className="text-label text-ink">SearchInput</p>
              <SearchInput
                label="Tìm kiếm (gallery)"
                onSearch={(v) =>
                  toast({ title: "Tìm kiếm", description: v || "(trống)", tone: "info" })
                }
              />
            </div>
          </div>
        </Section>

        {/* 3.4 Navigation và feedback */}
        <Section id="navigation" title="Navigation">
          <div className="flex flex-col gap-6 rounded-lg border border-line-subtle bg-surface p-4">
            <Breadcrumb
              items={[
                { label: "Trang chủ", href: "/" },
                { label: "Công thức", href: "/cong-thuc" },
                { label: "Phở bò" },
              ]}
            />

            <Tabs
              aria-label="Tab minh hoạ"
              items={[
                { id: "overview", label: "Tổng quan", content: <p className="text-body text-ink-muted">Nội dung tab Tổng quan.</p> },
                { id: "ingredients", label: "Nguyên liệu", content: <p className="text-body text-ink-muted">Nội dung tab Nguyên liệu.</p> },
                { id: "steps", label: "Cách làm", content: <p className="text-body text-ink-muted">Nội dung tab Cách làm.</p> },
                { id: "disabled", label: "Khoá", content: null, disabled: true },
              ]}
            />

            <Pagination page={3} totalPages={12} hrefFor={(p) => `/cong-thuc?page=${p}`} />

            <Row>
              <Dropdown
                label="Tuỳ chọn"
                trigger={<Button variant="outline">Mở dropdown</Button>}
                items={[
                  { label: "Chỉnh sửa", icon: <Settings className="size-4" aria-hidden="true" /> },
                  { label: "Yêu thích", icon: <Heart className="size-4" aria-hidden="true" /> },
                  { label: "Xoá", icon: <Trash2 className="size-4" aria-hidden="true" />, danger: true },
                  { label: "Không khả dụng", disabled: true },
                ]}
              />
              <Dropdown
                label="Tuỳ chọn (căn phải)"
                align="end"
                trigger={<IconButton aria-label="Tuỳ chọn khác"><Settings className="size-5" aria-hidden="true" /></IconButton>}
                items={[{ label: "Hành động A" }, { label: "Hành động B" }]}
              />
            </Row>
          </div>
        </Section>

        <Section id="feedback" title="Feedback — Modal / Dialog / Toast / Loading / Empty / Error">
          <div className="flex flex-col gap-6 rounded-lg border border-line-subtle bg-surface p-4">
            <Row>
              <Button onClick={() => setModalOpen(true)}>Mở Modal</Button>
              <Button variant="danger" onClick={() => setConfirmOpen(true)}>
                Mở Confirmation (danger)
              </Button>
              <Button
                variant="outline"
                onClick={() => toast({ title: "Thông báo", description: "Toast info tự ẩn sau 5s.", tone: "info" })}
              >
                Toast info
              </Button>
              <Button
                variant="outline"
                onClick={() => toast({ title: "Thành công", tone: "success" })}
              >
                Toast success
              </Button>
              <Button
                variant="outline"
                onClick={() => toast({ title: "Cảnh báo", description: "Kiểm tra lại nguyên liệu.", tone: "warning" })}
              >
                Toast warning
              </Button>
              <Button
                variant="outline"
                onClick={() =>
                  toast({
                    title: "Lỗi",
                    description: "Toast lỗi không tự ẩn; có nút hành động.",
                    tone: "error",
                    action: { label: "Thử lại", onClick: () => {} },
                  })
                }
              >
                Toast error
              </Button>
            </Row>

            <div className="grid gap-4 lg:grid-cols-3">
              <LoadingState message="Đang tải nội dung…" />
              <EmptyState
                title="Chưa có công thức nào"
                description="Hãy lưu công thức hoặc thử lại tìm kiếm khác."
                action={<Button variant="outline">Khám phá công thức</Button>}
              />
              <ErrorState
                description="Không tải được danh sách. Vui lòng thử lại."
                action={<Button variant="outline">Thử lại</Button>}
              />
            </div>
          </div>
        </Section>

        {/* 3.5 Cooking-specific */}
        <Section id="recipe" title="Cooking-specific components (dữ liệu MOCK)">
          <div className="flex flex-col gap-6">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <RecipeCard
                recipe={MOCK_RECIPES[0]!}
                href={`/cong-thuc/${MOCK_RECIPES[0]!.slug}`}
                isFavorite={favoriteIds.includes(MOCK_RECIPES[0]!.id)}
                onToggleFavorite={(r) =>
                  setFavoriteIds((prev) =>
                    prev.includes(r.id) ? prev.filter((id) => id !== r.id) : [...prev, r.id],
                  )
                }
              />
              <div className="flex flex-col gap-3 rounded-lg border border-line-subtle bg-surface p-4">
                <p className="text-label text-ink">RecipeCardCompact</p>
                {MOCK_RECIPES.map((r) => (
                  <RecipeCardCompact key={r.id} recipe={r} href={`/cong-thuc/${r.slug}`} />
                ))}
              </div>
              <div className="flex flex-col gap-3 rounded-lg border border-line-subtle bg-surface p-4">
                <p className="text-label text-ink">RecipeImage (thiếu ảnh → mascot)</p>
                <RecipeImage src={null} alt="[MOCK] Ảnh minh hoạ" ratio="4/3" />
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle as="h3">Nguyên liệu</CardTitle>
                  <CardDescription>IngredientList — tick được (đi chợ).</CardDescription>
                </CardHeader>
                <CardBody>
                  <IngredientList
                    ingredients={MOCK_INGREDIENTS}
                    checkable
                    checkedIds={checkedIngredients}
                    onCheckedChange={(id, checked) =>
                      setCheckedIngredients((prev) =>
                        checked ? [...prev, id] : prev.filter((x) => x !== id),
                      )
                    }
                  />
                </CardBody>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle as="h3">Các bước nấu</CardTitle>
                  <CardDescription>CookingStepCard — đánh dấu hoàn thành.</CardDescription>
                </CardHeader>
                <CardBody>
                  <ol className="flex flex-col gap-3">
                    {MOCK_STEPS.map((step) => (
                      <CookingStepCard
                        key={step.id}
                        step={step}
                        done={doneSteps.includes(step.id)}
                        onToggleDone={(done) =>
                          setDoneSteps((prev) =>
                            done ? [...prev, step.id] : prev.filter((x) => x !== step.id),
                          )
                        }
                      />
                    ))}
                  </ol>
                </CardBody>
              </Card>
            </div>

            <div className="grid gap-4 lg:grid-cols-3">
              <div className="flex flex-col gap-3 rounded-lg border border-line-subtle bg-surface p-4">
                <p className="text-label text-ink">CookingTime / PreparationTime / Badges</p>
                <Row>
                  <CookingTime minutes={180} />
                  <PreparationTime minutes={30} />
                </Row>
                <Row>
                  <ServingsBadge servings={4} />
                  <DifficultyBadge level="easy" />
                  <DifficultyBadge level="medium" />
                  <DifficultyBadge level="hard" />
                </Row>
              </div>

              <NutritionSummary
                facts={MOCK_NUTRITION}
                note="Số liệu [MOCK] chỉ để kiểm tra hiển thị."
              />
              <div className="flex flex-col gap-3">
                <AllergenBadges allergens={MOCK_ALLERGENS} />
                <AllergenBadges allergens={[]} />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {MOCK_CATEGORIES.map((c) => (
                <CategoryCard key={c.id} category={c} href={`/danh-muc/${c.slug}`} />
              ))}
              <Card variant="outline">
                <CardHeader>
                  <CardTitle as="h3">NutritionSummary rỗng</CardTitle>
                  <CardDescription>Trạng thái không có dữ liệu.</CardDescription>
                </CardHeader>
                <CardBody>
                  <NutritionSummary facts={[]} />
                </CardBody>
              </Card>
            </div>
          </div>
        </Section>

        {/* 4 — Application Shell */}
        <Section
          id="shell"
          title="Application Shell — Header &amp; Footer"
          description="Thay đổi kích thước cửa sổ (mobile / tablet / desktop) để kiểm tra responsive. Header dùng vị trí sticky theo thiết kế."
        >
          <div className="overflow-hidden rounded-lg border border-line-strong">
            <SiteHeader />
            <div className="flex flex-col gap-3 bg-background p-6">
              <p className="text-body text-ink">
                Vùng nội dung mẫu bên dưới Header. Trên desktop hiển thị đầy đủ nav + ô tìm
                kiếm; trên mobile thu gọn thành nút menu.
              </p>
              <Button variant="outline" className="self-start">
                Nội dung trang
              </Button>
            </div>
            <SiteFooter />
          </div>
        </Section>

        <Section id="cards" title="Card variants">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader>
                <CardTitle as="h3">Default</CardTitle>
                <CardDescription>Card mặc định.</CardDescription>
              </CardHeader>
              <CardBody className="text-body-sm text-ink-muted">Nội dung thẻ.</CardBody>
              <CardFooter>
                <Button size="sm">Hành động</Button>
              </CardFooter>
            </Card>
            <Card variant="elevated">
              <CardBody className="text-body-sm text-ink-muted">Card elevated (shadow lớn).</CardBody>
            </Card>
            <Card variant="outline">
              <CardBody className="text-body-sm text-ink-muted">Card outline.</CardBody>
            </Card>
            <Card variant="muted">
              <CardBody className="text-body-sm text-ink-muted">Card muted.</CardBody>
            </Card>
          </div>
        </Section>
      </Container>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Hộp thoại minh hoạ"
        description="Đóng bằng phím Escape, click overlay, hoặc nút đóng."
        size="md"
        footer={
          <>
            <Button variant="outline" onClick={() => setModalOpen(false)}>
              Huỷ
            </Button>
            <Button onClick={() => setModalOpen(false)}>Đồng ý</Button>
          </>
        }
      >
        <p className="text-body text-ink-muted">
          Focus được giữ trong hộp thoại; khi đóng, focus trở về phần tử đã mở nó.
        </p>
      </Modal>

      <ConfirmDialog
        open={confirmOpen}
        tone="danger"
        title="Xoá công thức?"
        description="Hành động này không thể hoàn tác."
        confirmLabel="Xoá"
        onConfirm={() => {
          setConfirmOpen(false);
          toast({ title: "Đã xoá (minh hoạ)", tone: "success" });
        }}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
}
