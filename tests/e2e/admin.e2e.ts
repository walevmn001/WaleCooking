import { expect, test } from "./fixtures";

/**
 * E2E — KHU QUẢN TRỊ & RBAC (P12.4 §C).
 *
 * Trạng thái thực tế: Auth.js CHƯA được nối (`lib/auth/session.ts` luôn trả actor `null`),
 * nên mọi khách truy cập đều KHÔNG có quyền biên tập. Vì vậy bộ kiểm thử dưới đây xác minh
 * ĐÚNG hành vi an toàn hiện có:
 *   - Khách bị chặn khỏi khu quản trị (không lộ dữ liệu).
 *   - Trang đăng nhập không hiển thị biểu mẫu giả gây hiểu lầm.
 *
 * Việc đăng nhập Admin thật + kiểm tra RBAC Editor/Admin chỉ có thể chạy khi Auth.js được
 * cấu hình — xem `docs/P12/E2E_TEST_REPORT.md` (đánh dấu BLOCKED, không đánh dấu PASS).
 */

test.describe("Admin — kiểm soát truy cập (guest)", () => {
  test("khách chưa đăng nhập bị chặn khỏi trang quản lý công thức", async ({ page }) => {
    await page.goto("/admin/cong-thuc");

    await expect(page.getByText("Yêu cầu quyền truy cập")).toBeVisible();
    await expect(page.getByRole("heading", { level: 1, name: "Quản lý công thức" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Đăng nhập" })).toBeVisible();
    // KHÔNG được lộ danh sách công thức (kể cả fixture E2E) cho khách.
    await expect(page.getByText(/\(E2E\)/)).toHaveCount(0);
  });

  test("khách chưa đăng nhập bị chặn khỏi trang tạo công thức", async ({ page }) => {
    await page.goto("/admin/cong-thuc/moi");

    await expect(page.getByText("Yêu cầu quyền truy cập")).toBeVisible();
  });
});

test.describe("Admin — cổng đăng nhập", () => {
  test("trang đăng nhập nêu rõ chưa cấu hình và KHÔNG có biểu mẫu giả", async ({ page }) => {
    await page.goto("/dang-nhap");

    await expect(
      page.getByRole("heading", { level: 1, name: "Đăng nhập quản trị" }),
    ).toBeVisible();
    await expect(page.getByText(/chưa được cấu hình/)).toBeVisible();
    // Không có ô nhập email/mật khẩu giả.
    await expect(page.getByRole("textbox")).toHaveCount(0);
  });
});
