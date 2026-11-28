import { expect, test } from "./fixtures";

/**
 * E2E — Luồng CÔNG KHAI (P12.4 §A).
 *
 * Dữ liệu fixture do `tests/e2e/seed-e2e.ts` tạo trong CSDL E2E riêng:
 *   - `e2e-canh-trung-ca-chua` (đã xuất bản, 4 khẩu phần, 3 nguyên liệu, 3 bước)
 *   - `e2e-pho-bo` (đã xuất bản, 2 khẩu phần)
 *   - `e2e-ban-nhap` (bản nháp — KHÔNG được hiển thị công khai)
 */

const SLUG = "e2e-canh-trung-ca-chua";
const TITLE = "Canh trứng cà chua (E2E)";
const OTHER_TITLE = "Phở bò (E2E)";

test.describe("Public — trang chủ dữ liệu thật (FR-01)", () => {
  test("hiển thị thương hiệu, ô tìm kiếm và điều hướng tới kho công thức", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByRole("heading", { level: 1, name: /WALE COOKING/i })).toBeVisible();
    await expect(
      page.getByRole("navigation", { name: "Điều hướng chính", exact: true }),
    ).toBeVisible();

    // Ô tìm kiếm trong hero (phạm vi `section` để không lẫn với ô tìm kiếm ở header).
    const hero = page.locator('section[aria-labelledby="hero-heading"]');
    await expect(hero.getByRole("searchbox")).toBeVisible();

    await page.getByRole("link", { name: "Khám phá thư viện" }).click();

    await expect(page).toHaveURL(/\/cong-thuc$/);
    await expect(page.getByRole("heading", { level: 1, name: "Công thức" })).toBeVisible();
  });

  test("hiển thị khối món mới với công thức đã xuất bản thật", async ({ page }) => {
    await page.goto("/");

    const newest = page.getByRole("region", { name: "Món mới" });
    await expect(newest.getByRole("heading", { name: TITLE })).toBeVisible();
    // Bản nháp KHÔNG được lên trang chủ.
    await expect(page.getByText("Món nháp (E2E)")).toHaveCount(0);
  });
});

test.describe("Public — danh sách công thức", () => {
  test("chỉ hiển thị công thức đã xuất bản kèm tổng số chính xác", async ({ page }) => {
    await page.goto("/cong-thuc");

    await expect(page.getByText("2 công thức", { exact: true })).toBeVisible();
    await expect(page.getByRole("heading", { name: TITLE })).toBeVisible();
    await expect(page.getByRole("heading", { name: OTHER_TITLE })).toBeVisible();
    // Bản nháp KHÔNG được xuất hiện.
    await expect(page.getByText("Món nháp (E2E)")).toHaveCount(0);
  });

  test("tìm kiếm bằng ô tìm kiếm lọc đúng kết quả", async ({ page }) => {
    await page.goto("/cong-thuc");

    const filters = page.getByRole("region", { name: "Tìm kiếm và lọc công thức" });
    await filters.getByRole("searchbox").fill("Canh");
    await filters.getByRole("button", { name: "Tìm", exact: true }).click();

    await expect(page).toHaveURL(/[?&]q=Canh/);
    await expect(page.getByText("1 công thức", { exact: true })).toBeVisible();
    await expect(page.getByRole("heading", { name: TITLE })).toBeVisible();
    await expect(page.getByRole("heading", { name: OTHER_TITLE })).toHaveCount(0);
  });

  test("từ khoá không khớp hiển thị trạng thái rỗng", async ({ page }) => {
    await page.goto("/cong-thuc?q=khong-co-mon-nao-nhu-vay");

    await expect(page.getByRole("heading", { name: "Không tìm thấy công thức" })).toBeVisible();
    await expect(page.getByRole("heading", { name: TITLE })).toHaveCount(0);
  });

  test("lọc theo loại món (Món chính) cập nhật URL và kết quả", async ({ page }) => {
    await page.goto("/cong-thuc");

    await page.getByLabel("Loại món").selectOption("main_dish");

    await expect(page).toHaveURL(/[?&]foodType=main_dish/);
    await expect(page.getByText("1 công thức", { exact: true })).toBeVisible();
    await expect(page.getByRole("heading", { name: TITLE })).toBeVisible();
    await expect(page.getByRole("heading", { name: OTHER_TITLE })).toHaveCount(0);
  });
});

test.describe("Public — tìm kiếm công khai (FR-05)", () => {
  test("trang /tim-kiem thay PlaceholderPage: hiển thị tiêu đề và giao diện giới thiệu", async ({
    page,
  }) => {
    const response = await page.goto("/tim-kiem");
    expect(response?.status()).toBe(200);

    await expect(page.getByRole("heading", { level: 1, name: "Tìm kiếm" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Bắt đầu tìm kiếm" })).toBeVisible();
    await expect(page.getByRole("region", { name: "Tìm kiếm và lọc công thức" })).toBeVisible();
  });

  test("tìm từ trang chủ chuyển sang /tim-kiem kèm từ khoá và hiển thị kết quả thật", async ({
    page,
  }) => {
    await page.goto("/");

    const hero = page.locator('section[aria-labelledby="hero-heading"]');
    await hero.getByRole("searchbox").fill("Canh");
    await hero.getByRole("button", { name: "Tìm kiếm", exact: true }).click();

    await expect(page).toHaveURL(/\/tim-kiem\?q=Canh/);
    await expect(page.getByText("1 kết quả", { exact: true })).toBeVisible();
    await expect(page.getByRole("heading", { name: TITLE })).toBeVisible();
    await expect(page.getByRole("heading", { name: OTHER_TITLE })).toHaveCount(0);
  });

  test("bộ lọc trên /tim-kiem cập nhật URL và kết quả", async ({ page }) => {
    await page.goto("/tim-kiem");

    await page.getByLabel("Loại món").selectOption("main_dish");

    await expect(page).toHaveURL(/\/tim-kiem\?foodType=main_dish/);
    await expect(page.getByText("1 kết quả", { exact: true })).toBeVisible();
    await expect(page.getByRole("heading", { name: TITLE })).toBeVisible();
    await expect(page.getByRole("heading", { name: OTHER_TITLE })).toHaveCount(0);
  });

  test("từ khoá không khớp hiển thị trạng thái rỗng và xoá bộ lọc về /tim-kiem", async ({
    page,
  }) => {
    await page.goto("/tim-kiem?q=khong-co-mon-nao-nhu-vay");

    await expect(page.getByRole("heading", { name: "Không tìm thấy công thức" })).toBeVisible();
    await page.getByRole("link", { name: "Xoá bộ lọc" }).click();
    await expect(page).toHaveURL(/\/tim-kiem$/);
  });

  test("tham số URL không hợp lệ không gây lỗi server", async ({ page }) => {
    const response = await page.goto(
      "/tim-kiem?maxMinutes=999999&difficulty=xyz&foodType=%3F%3F%3F&page=abc&mealType=",
    );
    expect(response?.status()).toBe(200);
    await expect(page.getByRole("heading", { level: 1, name: "Tìm kiếm" })).toBeVisible();
  });

  test("điều hướng back/forward giữ nguyên trạng thái tìm kiếm", async ({ page }) => {
    await page.goto("/tim-kiem?q=Canh");
    await expect(page.getByRole("heading", { name: TITLE })).toBeVisible();

    await page.getByRole("heading", { name: TITLE }).getByRole("link").click();
    await expect(page).toHaveURL(new RegExp(`/cong-thuc/${SLUG}$`));

    await page.goBack();
    await expect(page).toHaveURL(/\/tim-kiem\?q=Canh/);
    await expect(page.getByRole("heading", { name: TITLE })).toBeVisible();
  });
});

test.describe("Public — chi tiết công thức", () => {
  test("hiển thị tiêu đề, nguyên liệu và các bước nấu", async ({ page }) => {
    const response = await page.goto(`/cong-thuc/${SLUG}`);
    expect(response?.status()).toBe(200);

    await expect(page.getByRole("heading", { level: 1, name: TITLE })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Nguyên liệu" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Các bước nấu" })).toBeVisible();

    // Nguyên liệu thật của fixture hiển thị kèm định lượng.
    await expect(page.getByText("Trứng gà", { exact: true }).first()).toBeVisible();
    await expect(page.getByText("300 g", { exact: true }).first()).toBeVisible();

    // Có điều khiển nấu ăn.
    await expect(page.getByRole("button", { name: "Bắt đầu nấu" })).toBeVisible();
  });

  test("công thức nháp trả về 404 (soft-404 → HTTP 404)", async ({ page }) => {
    const response = await page.goto("/cong-thuc/e2e-ban-nhap");
    expect(response?.status()).toBe(404);
    await expect(page.getByRole("heading", { name: "Không tìm thấy trang" })).toBeVisible();
  });

  test("slug không tồn tại trả về 404", async ({ page }) => {
    const response = await page.goto("/cong-thuc/khong-ton-tai-xyz-123");
    expect(response?.status()).toBe(404);
  });
});

test.describe("Public — yêu thích (cookie)", () => {
  test("lưu yêu thích trên trang chi tiết rồi xuất hiện ở trang Yêu thích", async ({ page }) => {
    await page.goto(`/cong-thuc/${SLUG}`);

    const favoriteButton = page.getByRole("button", { name: "Lưu vào yêu thích" });
    await favoriteButton.click();

    // Nút đổi trạng thái → xác nhận đã ghi cookie qua Server Action.
    await expect(page.getByRole("button", { name: "Đã lưu yêu thích" })).toBeVisible();

    await page.goto("/yeu-thich");
    await expect(page.getByRole("heading", { level: 1, name: "Yêu thích" })).toBeVisible();
    await expect(page.getByRole("heading", { name: TITLE })).toBeVisible();
  });
});

test.describe("Public — chia sẻ công thức", () => {
  test("nút Chia sẻ sao chép liên kết khi Web Share không khả dụng", async ({ page }) => {
    // Giả lập môi trường headless: không có `navigator.share`; ghi nhận URL qua clipboard.
    await page.addInitScript(() => {
      (window as unknown as { __copiedUrl: string | null }).__copiedUrl = null;
      Object.defineProperty(navigator, "share", { value: undefined, configurable: true });
      Object.defineProperty(navigator, "clipboard", {
        value: {
          writeText: async (text: string) => {
            (window as unknown as { __copiedUrl: string | null }).__copiedUrl = text;
          },
        },
        configurable: true,
      });
    });

    await page.goto(`/cong-thuc/${SLUG}`);
    await page.getByRole("button", { name: "Chia sẻ" }).click();

    await expect(page.getByRole("button", { name: "Đã sao chép liên kết" })).toBeVisible();
    const copied = await page.evaluate(
      () => (window as unknown as { __copiedUrl: string | null }).__copiedUrl,
    );
    expect(copied).toBeTruthy();
    expect(copied).toContain(`/cong-thuc/${SLUG}`);
  });
});
