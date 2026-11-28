import { expect, test } from "./fixtures";

/**
 * E2E — Luồng NẤU ĂN (P12.4 §B).
 *
 * Fixture: `e2e-canh-trung-ca-chua` (đã xuất bản, 4 khẩu phần gốc; nguyên liệu
 * Trứng gà 3 cái · Cà chua 300 g · Hành lá 20 g; 3 bước nấu).
 *
 * Mỗi kiểm thử xác minh HÀNH VI THỰC TẾ (định lượng đổi theo khẩu phần, tiến độ
 * checklist, điều hướng bước nấu) — không chỉ kiểm tra trang tải được.
 */

const SLUG = "e2e-canh-trung-ca-chua";
const TITLE = "Canh trứng cà chua (E2E)";

test.describe("Cooking — chọn khẩu phần (Portion Scaling)", () => {
  test("tăng khẩu phần cập nhật lại định lượng nguyên liệu", async ({ page }) => {
    await page.goto(`/cong-thuc/${SLUG}`);

    // Gốc 4 khẩu phần → Cà chua 300 g.
    await expect(page.getByText("300 g", { exact: true })).toBeVisible();
    await expect(page.getByText("375 g", { exact: true })).toHaveCount(0);

    await page.getByRole("button", { name: "Tăng khẩu phần" }).click();

    // Hệ số 5/4 = 1,25 → 300 g × 1,25 = 375 g (định lượng được nhân THẬT).
    await expect(page.getByText("375 g", { exact: true })).toBeVisible();
    await expect(page.getByText("300 g", { exact: true })).toHaveCount(0);

    // Thông báo trợ năng phản ánh số khẩu phần đang chọn.
    await expect(page.getByRole("status").filter({ hasText: "Đang chọn" })).toContainText(
      "Đang chọn 5 khẩu phần",
    );

    // Khôi phục về số khẩu phần gốc → định lượng trở lại 300 g.
    await page.getByRole("button", { name: "Khôi phục" }).click();
    await expect(page.getByText("300 g", { exact: true })).toBeVisible();
  });
});

test.describe("Cooking — checklist nguyên liệu (Ingredient Checklist)", () => {
  test("tick nguyên liệu cập nhật tiến độ và trạng thái đủ nguyên liệu", async ({ page }) => {
    await page.goto(`/cong-thuc/${SLUG}`);

    const progress = page.getByRole("status").filter({ hasText: "Đã chuẩn bị" });

    await expect(page.getByRole("checkbox")).toHaveCount(3);
    await expect(progress).toContainText("0/3");

    await page.getByRole("checkbox", { name: "Trứng gà" }).check();
    await expect(progress).toContainText("1/3");

    await page.getByRole("checkbox", { name: "Cà chua" }).check();
    await page.getByRole("checkbox", { name: "Hành lá" }).check();
    await expect(progress).toContainText("3/3");
    await expect(page.getByText("Đã đủ nguyên liệu")).toBeVisible();

    // Bỏ đánh dấu → tiến độ trở về 0.
    await page.getByRole("button", { name: "Bỏ đánh dấu" }).click();
    await expect(progress).toContainText("0/3");
  });
});

test.describe("Cooking — chế độ nấu (Cooking Mode)", () => {
  test("mở chế độ nấu, điều hướng từng bước và kết thúc có xác nhận", async ({ page }) => {
    await page.goto(`/cong-thuc/${SLUG}`);
    await page.getByRole("button", { name: "Bắt đầu nấu" }).click();

    const dialog = page.getByRole("dialog", { name: `Chế độ nấu: ${TITLE}` });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole("heading", { name: "Bước 1" })).toBeVisible();
    await expect(
      dialog.getByText("Đập trứng ra bát, đánh tan cùng chút muối."),
    ).toBeVisible();
    // Bước đầu tiên → không thể lùi.
    await expect(dialog.getByRole("button", { name: "Bước trước" })).toBeDisabled();

    await dialog.getByRole("button", { name: "Bước tiếp theo" }).click();
    await expect(dialog.getByRole("heading", { name: "Bước 2" })).toBeVisible();
    await expect(dialog.getByRole("button", { name: "Bước trước" })).toBeEnabled();

    await dialog.getByRole("button", { name: "Bước tiếp theo" }).click();
    await expect(dialog.getByRole("heading", { name: "Bước 3" })).toBeVisible();
    // Bước cuối → nút "Hoàn tất" thay cho "Bước tiếp theo".
    await expect(dialog.getByRole("button", { name: "Hoàn tất" })).toBeVisible();

    // Kết thúc → phải xác nhận trước khi rời chế độ nấu.
    await dialog.getByRole("button", { name: "Kết thúc chế độ nấu" }).click();
    const confirm = page.getByRole("dialog", { name: "Kết thúc chế độ nấu?" });
    await expect(confirm).toBeVisible();
    await confirm.getByRole("button", { name: "Kết thúc", exact: true }).click();

    await expect(dialog).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Bắt đầu nấu" })).toBeVisible();
  });
});
