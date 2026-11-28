import { expect, test } from "./fixtures";
import type { Locator } from "@playwright/test";

/**
 * E2E — Công cụ nhà bếp (P12.4 §B: Multi Timer, Unit Converter, Ingredient-based search).
 *
 * Mỗi kiểm thử xác minh KẾT QUẢ TÍNH TOÁN/HÀNH VI thực tế, không chỉ tải trang.
 *
 * Lưu ý: các công cụ này là Client Component. Nếu nhập liệu TRƯỚC khi React hydrate,
 * giá trị có thể bị đặt lại về giá trị state ban đầu. `fillStable` chờ hydrate xong
 * (nhập lại nếu bị xoá) để kiểm thử không chập chờn.
 */
async function fillStable(locator: Locator, value: string): Promise<void> {
  await expect(async () => {
    await locator.fill(value);
    await expect(locator).toHaveValue(value);
  }).toPass({ timeout: 10_000 });
}

test.describe("Công cụ — Quy đổi đơn vị (Unit Converter)", () => {
  test("quy đổi khối lượng g → kg chính xác", async ({ page }) => {
    await page.goto("/cong-cu/quy-doi-don-vi");
    await expect(
      page.getByRole("heading", { level: 1, name: "Quy đổi đơn vị" }),
    ).toBeVisible();

    // Mặc định nhóm Khối lượng: g → kg. 1000 g = 1 kg.
    await fillStable(page.getByLabel("Giá trị"), "1000");
    await expect(page.getByText("1 kg", { exact: true })).toBeVisible();
  });

  test("quy đổi nhiệt độ dùng công thức °C ↔ °F", async ({ page }) => {
    await page.goto("/cong-cu/quy-doi-don-vi");

    await page
      .getByRole("group", { name: "Nhóm đơn vị" })
      .getByRole("button", { name: "Nhiệt độ", exact: true })
      .click();

    // Mặc định nhóm Nhiệt độ: °C → °F. 100 °C = 212 °F.
    await fillStable(page.getByLabel("Giá trị"), "100");
    await expect(page.getByText("212 °F", { exact: true })).toBeVisible();
  });
});

test.describe("Công cụ — Tìm công thức theo nguyên liệu", () => {
  test("nhập nguyên liệu đang có và tìm ra công thức khớp thực tế", async ({ page }) => {
    await page.goto("/cong-cu/tim-theo-nguyen-lieu");

    const input = page.getByLabel("Thêm nguyên liệu");
    const addButton = page.getByRole("button", { name: "Thêm", exact: true });

    await fillStable(input, "Trứng");
    await addButton.click();
    await expect(page.getByText("Trứng", { exact: true })).toBeVisible();

    await fillStable(input, "Cà chua");
    await addButton.click();

    await page.getByRole("button", { name: "Tìm công thức" }).click();

    // Kết quả tính từ dữ liệu thật: khớp 2 nguyên liệu → có công thức E2E.
    await expect(
      page.getByText(/Tìm thấy \d+ công thức phù hợp với 2 nguyên liệu/),
    ).toBeVisible();
    await expect(page.getByRole("heading", { name: "Canh trứng cà chua (E2E)" })).toBeVisible();
  });
});

test.describe("Công cụ — Đồng hồ đếm ngược (Multi Timer)", () => {
  test("tạo đồng hồ mới và điều khiển được trạng thái", async ({ page }) => {
    await page.goto("/cong-cu/do-ng-ho");

    await expect(page.getByText("Chưa có đồng hồ nào")).toBeVisible();

    await fillStable(page.getByLabel("Tên đồng hồ"), "Luộc trứng");
    await fillStable(page.getByLabel("Phút"), "1");
    await fillStable(page.getByLabel("Giây"), "30");
    await page.getByRole("button", { name: "Thêm đồng hồ" }).click();

    // Card đồng hồ xuất hiện với tên + thời lượng 01:30 + trạng thái "Chưa chạy".
    await expect(page.getByRole("heading", { name: "Luộc trứng" })).toBeVisible();
    await expect(page.getByText("01:30")).toBeVisible();
    await expect(page.getByText("Chưa chạy")).toBeVisible();

    // Bắt đầu → trạng thái đổi sang "Đang chạy".
    await page.getByRole("button", { name: "Bắt đầu" }).click();
    await expect(page.getByText("Đang chạy")).toBeVisible();

    // Đặt lại → về trạng thái ban đầu và thời lượng gốc.
    await page.getByRole("button", { name: "Đặt lại" }).click();
    await expect(page.getByText("Chưa chạy")).toBeVisible();
    await expect(page.getByText("01:30")).toBeVisible();
  });

  test("chặn thời lượng không hợp lệ (dưới 1 giây)", async ({ page }) => {
    await page.goto("/cong-cu/do-ng-ho");

    await fillStable(page.getByLabel("Tên đồng hồ"), "Không hợp lệ");
    await page.getByRole("button", { name: "Thêm đồng hồ" }).click();

    await expect(page.getByText("Thời lượng tối thiểu là 1 giây.")).toBeVisible();
    // Không tạo đồng hồ rác.
    await expect(page.getByText("Chưa có đồng hồ nào")).toBeVisible();
  });
});
