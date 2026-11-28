/**
 * Tài khoản FIXTURE cho E2E (P18).
 *
 * CHỈ dùng cho CSDL E2E CỤC BỘ (tên có tiền tố `e2e-`, domain `.invalid`).
 * KHÔNG phải credentials production/thật; KHÔNG dùng cho bất kỳ môi trường thật nào.
 * Mật khẩu ở đây là dữ liệu kiểm thử, không phải bí mật của hệ thống.
 */
export const E2E_ADMIN = {
  email: "e2e-admin@wale.invalid",
  password: "e2e-Admin-Pass-2026",
  name: "Quản trị viên E2E",
} as const;

export const E2E_EDITOR = {
  email: "e2e-editor@wale.invalid",
  password: "e2e-Editor-Pass-2026",
  name: "Biên tập viên E2E",
} as const;
