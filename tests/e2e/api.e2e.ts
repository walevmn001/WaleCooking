import { expect, test } from "./fixtures";

/**
 * E2E — API (P12.4 §D). Dùng `request` fixture (APIRequestContext, áp dụng `baseURL`).
 *
 * Kiểm tra mã trạng thái + hình dạng dữ liệu THỰC, không chỉ "gọi được".
 * Lưu ý: Auth.js chưa nối → mọi endpoint cần quyền trả 401 (hành vi an toàn đúng).
 */

test.describe("API — công khai", () => {
  test("GET /api/v1/recipes: chỉ trả công thức đã xuất bản", async ({ request }) => {
    const res = await request.get("/api/v1/recipes");
    expect(res.status()).toBe(200);

    const body = (await res.json()) as {
      items: { slug: string }[];
      total: number;
      page: number;
      pageSize: number;
    };
    expect(Array.isArray(body.items)).toBe(true);
    expect(body.total).toBeGreaterThanOrEqual(2);

    const slugs = body.items.map((item) => item.slug);
    expect(slugs).toContain("e2e-canh-trung-ca-chua");
    // Bản nháp KHÔNG được trả về API công khai.
    expect(slugs).not.toContain("e2e-ban-nhap");
  });

  test("GET /api/v1/recipes: tham số phân trang sai → 422", async ({ request }) => {
    const res = await request.get("/api/v1/recipes?page=abc");
    expect(res.status()).toBe(422);
    const body = (await res.json()) as { error?: { code?: string } };
    expect(body.error?.code).toBeTruthy();
  });

  test("GET /api/v1/kitchen/ingredient-match: trả công thức khớp thực tế", async ({
    request,
  }) => {
    const res = await request.get("/api/v1/kitchen/ingredient-match", {
      params: { q: "Trứng,Cà chua" },
    });
    expect(res.status()).toBe(200);

    const body = (await res.json()) as {
      count: number;
      results: { candidate: { slug: string } }[];
    };
    expect(body.count).toBeGreaterThanOrEqual(1);
    const slugs = body.results.map((r) => r.candidate.slug);
    expect(slugs).toContain("e2e-canh-trung-ca-chua");
  });

  test("GET /api/v1/media/file/<không tồn tại> → 404", async ({ request }) => {
    const res = await request.get("/api/v1/media/file/nope/khong-ton-tai.png");
    expect(res.status()).toBe(404);
  });
});

test.describe("API — quản trị yêu cầu xác thực", () => {
  test("GET /api/v1/admin/recipes khi chưa đăng nhập → 401", async ({ request }) => {
    const res = await request.get("/api/v1/admin/recipes");
    expect(res.status()).toBe(401);
  });

  test("POST /api/v1/recipes khi chưa đăng nhập → 401", async ({ request }) => {
    const res = await request.post("/api/v1/recipes", { data: { title: "Không được tạo" } });
    expect(res.status()).toBe(401);
  });

  test("POST /api/v1/media thiếu tệp → 422 (validate trước khi xác thực)", async ({
    request,
  }) => {
    const res = await request.post("/api/v1/media");
    expect(res.status()).toBe(422);
  });
});
