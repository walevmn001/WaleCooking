import type { Page } from "@playwright/test";

import { expect, test } from "./fixtures";
import { E2E_ADMIN, E2E_EDITOR } from "./accounts";

/**
 * E2E — XÁC THỰC & ỦY QUYỀN QUA HTTP THẬT (P18, giải quyết B-P06-02).
 *
 * Khác với unit test guard, bộ này ĐĂNG NHẬP THẬT qua Auth.js (Credentials) rồi gọi HTTP
 * thật để xác minh: guest → 401/chuyển hướng, editor thiếu quyền admin → 403, admin → cho phép,
 * phiên giả mạo → bị từ chối, client tự thêm `role=admin` KHÔNG nâng quyền, public API không đổi.
 *
 * Yêu cầu môi trường: server production build trỏ CSDL E2E (đã `pnpm e2e:seed`) + Chrome CDP.
 */

const BASE_URL = process.env.E2E_BASE_URL ?? "http://127.0.0.1:3000";

/** Điền ổn định (tránh race với hydration) + trả về sau khi submit. */
async function fillStable(page: Page, label: string, value: string): Promise<void> {
  const input = page.getByLabel(label);
  await input.click();
  await input.fill(value);
  await expect(input).toHaveValue(value);
}

/** Đăng nhập qua UI thật (Credentials) và chờ vào được `/admin`. */
async function signInAs(page: Page, email: string, password: string): Promise<void> {
  await page.goto("/dang-nhap");
  await fillStable(page, "Email", email);
  await fillStable(page, "Mật khẩu", password);
  await page.getByRole("button", { name: "Đăng nhập" }).click();
  await expect(page).toHaveURL(/\/admin$/, { timeout: 15_000 });
}

test.describe("P18 — Admin (Credentials + JWT)", () => {
  test("admin đăng nhập hợp lệ và gọi admin API → 200", async ({ page }) => {
    await signInAs(page, E2E_ADMIN.email, E2E_ADMIN.password);

    // Cookie phiên được chia sẻ sang APIRequestContext của page.
    const res = await page.request.get("/api/v1/admin/recipes");
    expect(res.status()).toBe(200);

    const body = (await res.json()) as { items: unknown[] };
    expect(Array.isArray(body.items)).toBe(true);
  });

  test("admin vượt qua ủy quyền: POST taxonomy thiếu dữ liệu → 422 (KHÔNG phải 401/403)", async ({
    page,
  }) => {
    await signInAs(page, E2E_ADMIN.email, E2E_ADMIN.password);

    const res = await page.request.post("/api/v1/admin/taxonomy", { data: {} });
    // 422 = ValidationError ⇒ đã qua cửa ủy quyền (admin có taxonomy:manage).
    expect(res.status()).toBe(422);
  });
});

test.describe("P18 — Editor (đăng nhập được nhưng thiếu quyền admin)", () => {
  test("editor đọc danh sách công thức được (200) nhưng tạo taxonomy bị 403", async ({ page }) => {
    await signInAs(page, E2E_EDITOR.email, E2E_EDITOR.password);

    const read = await page.request.get("/api/v1/admin/recipes");
    expect(read.status()).toBe(200); // editor có recipe:read:draft

    const forbidden = await page.request.post("/api/v1/admin/taxonomy", { data: {} });
    expect(forbidden.status()).toBe(403); // editor KHÔNG có taxonomy:manage
  });

  test("client tự thêm role=admin trong body KHÔNG nâng quyền (vẫn 403)", async ({ page }) => {
    await signInAs(page, E2E_EDITOR.email, E2E_EDITOR.password);

    const res = await page.request.post("/api/v1/admin/taxonomy", {
      data: {
        role: "admin",
        actorRole: "admin",
        typeCode: "cuisine",
        slug: "e2e-tamper",
        name: "Giả mạo nâng quyền",
      },
    });
    // Vai trò lấy từ phiên đã ký; tham số client bị bỏ qua hoàn toàn.
    expect(res.status()).toBe(403);
  });
});

test.describe("P18 — Guest / sai mật khẩu / phiên không hợp lệ", () => {
  test("guest gọi admin API → 401", async ({ request }) => {
    const res = await request.get("/api/v1/admin/recipes");
    expect(res.status()).toBe(401);
    const body = (await res.json()) as { error?: { code?: string } };
    expect(body.error?.code).toBe("UNAUTHORIZED");
  });

  test("sai mật khẩu KHÔNG tạo được phiên (báo lỗi, vẫn ở trang đăng nhập)", async ({ page }) => {
    await page.goto("/dang-nhap");
    await fillStable(page, "Email", E2E_ADMIN.email);
    await fillStable(page, "Mật khẩu", "sai-mat-khau-hoan-toan");
    await page.getByRole("button", { name: "Đăng nhập" }).click();

    await expect(page.getByRole("alert")).toBeVisible();
    await expect(page).toHaveURL(/\/dang-nhap$/);

    // Không có phiên ⇒ admin API vẫn 401.
    const res = await page.request.get("/api/v1/admin/recipes");
    expect(res.status()).toBe(401);
  });

  test("cookie phiên giả mạo/không hợp lệ → bị từ chối (API 401, page chuyển hướng)", async ({
    context,
    page,
  }) => {
    await context.addCookies([
      { name: "authjs.session-token", value: "gia-mao-khong-hop-le", url: BASE_URL },
    ]);

    const res = await context.request.get("/api/v1/admin/recipes");
    expect(res.status()).toBe(401);

    await page.goto("/admin");
    await expect(page).toHaveURL(/\/dang-nhap$/);
  });
});

test.describe("P18 — Không ảnh hưởng API công khai", () => {
  test("guest vẫn gọi được API công khai (200)", async ({ request }) => {
    const res = await request.get("/api/v1/recipes");
    expect(res.status()).toBe(200);
    const body = (await res.json()) as { items: { slug: string }[] };
    expect(body.items.map((i) => i.slug)).toContain("e2e-canh-trung-ca-chua");
  });
});
