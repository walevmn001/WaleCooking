import { expect, test } from "./fixtures";

/**
 * E2E — RESPONSIVE & UX verification (P12.5).
 *
 * Kiểm tra ở 4 viewport bắt buộc: 375×812, 390×844 (mobile), 768×1024 (tablet),
 * 1440×900 (desktop). Mỗi kiểm thử xác minh HÀNH VI THỰC TẾ:
 *   - Không tràn ngang (horizontal overflow) trên các trang chính.
 *   - Header/nav đúng biến thể theo breakpoint (menu ngăn kéo ở mobile).
 *   - Không có lỗi JavaScript/console, không có request lỗi (>=400) khi tải trang.
 *   - Điều hướng bàn phím: Tab di chuyển focus và focus có dấu hiệu hiển thị.
 *
 * Dữ liệu: DB E2E riêng đã seed (`pnpm e2e:seed`). Server production build @ baseURL.
 */

const VIEWPORTS = [
  { name: "mobile-375", width: 375, height: 812, isMobile: true },
  { name: "mobile-390", width: 390, height: 844, isMobile: true },
  { name: "tablet-768", width: 768, height: 1024, isMobile: false },
  { name: "desktop-1440", width: 1440, height: 900, isMobile: false },
] as const;

const PAGES = [
  { path: "/", label: "Trang chủ" },
  { path: "/tim-kiem", label: "Tìm kiếm (chưa nhập)" },
  { path: "/tim-kiem?q=Canh", label: "Tìm kiếm (có kết quả)" },
  { path: "/cong-thuc", label: "Danh sách công thức" },
  { path: "/cong-thuc/e2e-canh-trung-ca-chua", label: "Chi tiết công thức" },
  { path: "/cong-cu/quy-doi-don-vi", label: "Quy đổi đơn vị" },
  { path: "/cong-cu/do-ng-ho", label: "Đồng hồ đếm ngược" },
  { path: "/admin/cong-thuc", label: "Quản trị công thức" },
  { path: "/dang-nhap", label: "Đăng nhập" },
] as const;

for (const vp of VIEWPORTS) {
  test.describe(`Responsive ${vp.name} (${vp.width}×${vp.height})`, () => {
    test.use({ viewport: { width: vp.width, height: vp.height } });

    test("không tràn ngang trên tất cả trang chính", async ({ page }) => {
      const overflow: string[] = [];
      for (const p of PAGES) {
        await page.goto(p.path);
        await page.waitForLoadState("load");
        const { scrollWidth, innerWidth } = await page.evaluate(() => ({
          scrollWidth: document.documentElement.scrollWidth,
          innerWidth: window.innerWidth,
        }));
        if (scrollWidth > innerWidth + 1) {
          overflow.push(`${p.label} (${p.path}): scrollWidth=${scrollWidth} > innerWidth=${innerWidth}`);
        }
      }
      expect(overflow, `Tràn ngang phát hiện: ${overflow.join(" | ")}`).toEqual([]);
    });

    test("header hiển thị và nav đúng biến thể theo breakpoint", async ({ page }) => {
      await page.goto("/");
      await expect(page.getByRole("banner")).toBeVisible();

      const menuButton = page.getByRole("button", { name: "Mở menu" });
      const desktopNav = page.getByRole("navigation", { name: "Điều hướng chính", exact: true });

      if (vp.isMobile) {
        // Mobile: có nút mở menu, KHÔNG hiện nav desktop.
        await expect(menuButton).toBeVisible();
        await expect(desktopNav).toBeHidden();
      } else if (vp.width >= 1024) {
        // Desktop (lg): nav đầy đủ hiển thị, nút menu ẩn.
        await expect(desktopNav).toBeVisible();
        await expect(menuButton).toBeHidden();
      } else {
        // Tablet (768): vẫn dùng menu ngăn kéo (lg mới hiện nav đầy đủ).
        await expect(menuButton).toBeVisible();
        await expect(desktopNav).toBeHidden();
      }
    });

    test("không có lỗi console/JS và không có request lỗi khi tải các trang chính", async ({
      page,
    }) => {
      const errors: string[] = [];
      const failedResponses: string[] = [];
      page.on("console", (msg) => {
        if (msg.type() === "error") errors.push(`[console.error] ${msg.text()}`);
      });
      page.on("pageerror", (err) => errors.push(`[pageerror] ${err.message}`));
      page.on("requestfailed", (req) => {
        const errorText = req.failure()?.errorText ?? "";
        // Bỏ qua prefetch RSC bị huỷ khi điều hướng (`?_rsc=` + net::ERR_ABORTED) — hành vi bình thường.
        const isAbortedPrefetch = errorText.includes("ERR_ABORTED");
        if (!isAbortedPrefetch) {
          failedResponses.push(
            `[requestfailed] ${req.method()} ${req.url()} — ${errorText}`,
          );
        }
      });
      page.on("response", (res) => {
        const status = res.status();
        // Bỏ qua favicon (không phải tài nguyên trang chính).
        if (status >= 400 && !res.url().includes("favicon")) {
          failedResponses.push(`[HTTP ${status}] ${res.request().method()} ${res.url()}`);
        }
      });

      for (const p of PAGES) {
        await page.goto(p.path);
        await page.waitForLoadState("load");
      }

      expect(errors, `Lỗi phía client: ${errors.join(" | ")}`).toEqual([]);
      expect(failedResponses, `Request lỗi: ${failedResponses.join(" | ")}`).toEqual([]);
    });
  });
}

test.describe("Mobile — menu ngăn kéo", () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test("mở menu, chứa điều hướng và đóng bằng Esc", async ({ page }) => {
    await page.goto("/");

    await page.getByRole("button", { name: "Mở menu" }).click();
    const menu = page.getByRole("dialog", { name: "Menu điều hướng" });
    await expect(menu).toBeVisible();
    await expect(menu.getByRole("navigation", { name: "Điều hướng chính (di động)" })).toBeVisible();

    await page.keyboard.press("Escape");
    await expect(menu).toHaveCount(0);
  });
});

test.describe("Bàn phím — điều hướng & focus", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("Tab di chuyển focus và phần tử focus có dấu hiệu hiển thị", async ({ page }) => {
    await page.goto("/");

    const before = await page.evaluate(() => document.activeElement?.tagName ?? "BODY");
    expect(before).toBe("BODY");

    await page.keyboard.press("Tab");
    const focused = await page.evaluate(() => {
      const el = document.activeElement as HTMLElement | null;
      if (!el) return null;
      const style = window.getComputedStyle(el);
      return {
        tag: el.tagName,
        outlineStyle: style.outlineStyle,
        outlineWidth: style.outlineWidth,
        boxShadow: style.boxShadow,
      };
    });

    expect(focused).not.toBeNull();
    expect(focused!.tag).not.toBe("BODY");
    // `focus-visible` đặt outline và/hoặc box-shadow → phải có dấu hiệu hiển thị.
    const hasVisibleFocus =
      (focused!.outlineStyle !== "none" && focused!.outlineWidth !== "0px") ||
      (focused!.boxShadow !== "none" && focused!.boxShadow !== "");
    expect(hasVisibleFocus, `Focus không có dấu hiệu hiển thị: ${JSON.stringify(focused)}`).toBe(true);
  });
});

test.describe("Trợ năng — trang chủ & tìm kiếm (P15.4)", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("trang chủ có đúng một h1 và các khối dùng heading ngữ nghĩa", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
    await expect(page.getByRole("heading", { level: 1, name: /WALE COOKING/i })).toBeVisible();
    // Khối "Món mới" là một vùng có tên (region) với heading riêng.
    await expect(page.getByRole("region", { name: "Món mới" })).toBeVisible();
    await expect(page.getByRole("region", { name: "Công cụ nhà bếp" })).toBeVisible();
  });

  test("trang tìm kiếm có đúng một h1, nhãn lọc và số kết quả qua aria-live", async ({ page }) => {
    await page.goto("/tim-kiem?q=Canh");

    await expect(page.getByRole("heading", { level: 1, name: "Tìm kiếm" })).toHaveCount(1);

    const filters = page.getByRole("region", { name: "Tìm kiếm và lọc công thức" });
    await expect(filters.getByRole("searchbox")).toHaveAttribute("aria-label", /./);
    await expect(page.getByLabel("Loại món")).toBeVisible();
    await expect(page.getByLabel("Sắp xếp")).toBeVisible();

    // Số kết quả đếm THẬT được công bố cho screen reader (không phải số giả).
    await expect(
      page.locator('section[aria-labelledby="search-results-heading"] [aria-live="polite"]'),
    ).toContainText("1 kết quả");
  });

  test("bàn phím tới được ô tìm kiếm trên /tim-kiem và focus hiển thị", async ({ page }) => {
    await page.goto("/tim-kiem");

    const searchbox = page
      .getByRole("region", { name: "Tìm kiếm và lọc công thức" })
      .getByRole("searchbox");

    let reached = false;
    for (let i = 0; i < 25 && !reached; i += 1) {
      await page.keyboard.press("Tab");
      reached = await searchbox.evaluate((el) => el === document.activeElement);
    }
    expect(reached, "Không thể tới ô tìm kiếm bằng phím Tab").toBe(true);

    const focused = await searchbox.evaluate((el) => {
      const style = window.getComputedStyle(el);
      return {
        outlineStyle: style.outlineStyle,
        outlineWidth: style.outlineWidth,
        boxShadow: style.boxShadow,
      };
    });
    const hasVisibleFocus =
      (focused.outlineStyle !== "none" && focused.outlineWidth !== "0px") ||
      (focused.boxShadow !== "none" && focused.boxShadow !== "");
    expect(hasVisibleFocus, `Ô tìm kiếm thiếu dấu hiệu focus: ${JSON.stringify(focused)}`).toBe(
      true,
    );
  });
});
