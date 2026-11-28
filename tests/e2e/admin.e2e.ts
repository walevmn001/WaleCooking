import { expect, test } from "./fixtures";

/**
 * E2E — KHU QUẢN TRỊ & RBAC (P12.4 §C, cập nhật P18).
 *
 * Auth.js ĐÃ được nối (P18, giải quyết B-P06-02): `getCurrentActor()` trả actor từ phiên
 * THẬT. Vì vậy khách (chưa đăng nhập) bị GUARD phía server CHUYỂN HƯỚNG về cổng đăng nhập
 * (`/dang-nhap`) — không lộ bất kỳ dữ liệu quản trị nào.
 *
 * Đăng nhập Admin/Editor thật + kiểm RBAC qua HTTP nằm ở `tests/e2e/auth.e2e.ts`.
 */

test.describe("Admin — kiểm soát truy cập (guest)", () => {
  test("khách chưa đăng nhập bị chuyển hướng khỏi trang quản lý công thức", async ({ page }) => {
    await page.goto("/admin/cong-thuc");

    await expect(page).toHaveURL(/\/dang-nhap$/);
    await expect(
      page.getByRole("heading", { level: 1, name: "Đăng nhập quản trị" }),
    ).toBeVisible();
    // KHÔNG được lộ danh sách công thức (kể cả fixture E2E) cho khách.
    await expect(page.getByText(/\(E2E\)/)).toHaveCount(0);
  });

  test("khách chưa đăng nhập bị chuyển hướng khỏi bảng điều khiển /admin", async ({ page }) => {
    await page.goto("/admin");

    await expect(page).toHaveURL(/\/dang-nhap$/);
  });
});

test.describe("Admin — cổng đăng nhập", () => {
  test("trang đăng nhập hiển thị biểu mẫu email + mật khẩu THẬT (không còn thông báo 'chưa cấu hình')", async ({
    page,
  }) => {
    await page.goto("/dang-nhap");

    await expect(
      page.getByRole("heading", { level: 1, name: "Đăng nhập quản trị" }),
    ).toBeVisible();
    await expect(page.getByLabel("Email")).toBeVisible();
    await expect(page.getByLabel("Mật khẩu")).toBeVisible();
    await expect(page.getByRole("button", { name: "Đăng nhập" })).toBeVisible();
    await expect(page.getByText(/chưa được cấu hình/)).toHaveCount(0);
  });
});
