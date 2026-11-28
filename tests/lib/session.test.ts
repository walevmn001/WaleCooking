import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Unit test — cầu nối phiên → actor (P18 §P18.3).
 *
 * Xác minh `getCurrentActor()` CHỈ trả actor khi phiên có id + vai trò HỢP LỆ
 * (nằm trong `APP_ROLES`). Vai trò lạ/thiếu, hoặc session null → coi là KHÁCH (null).
 * Vai trò lấy từ token đã ký (phiên đã xác thực), KHÔNG từ request body/client.
 */

const { authMock } = vi.hoisted(() => ({ authMock: vi.fn() }));

vi.mock("@/auth", () => ({ auth: authMock }));

import { getCurrentActor, getCurrentRole } from "@/lib/auth/session";

beforeEach(() => {
  authMock.mockReset();
});

describe("getCurrentActor — cầu nối phiên → actor", () => {
  it("trả null khi chưa đăng nhập (auth() → null)", async () => {
    authMock.mockResolvedValue(null);
    expect(await getCurrentActor()).toBeNull();
  });

  it("trả null khi session thiếu id", async () => {
    authMock.mockResolvedValue({ user: { role: "admin" } });
    expect(await getCurrentActor()).toBeNull();
  });

  it("trả null khi vai trò không hợp lệ (ngoài APP_ROLES) hoặc thiếu", async () => {
    authMock.mockResolvedValue({ user: { id: "u1", role: "superadmin" } });
    expect(await getCurrentActor()).toBeNull();

    authMock.mockResolvedValue({ user: { id: "u1" } });
    expect(await getCurrentActor()).toBeNull();
  });

  it("trả actor hợp lệ với id + vai trò từ phiên đã xác thực", async () => {
    authMock.mockResolvedValue({ user: { id: "admin-1", role: "admin" } });
    expect(await getCurrentActor()).toEqual({ id: "admin-1", role: "admin" });
    expect(await getCurrentRole()).toBe("admin");
  });

  it("editor cũng được coi là actor hợp lệ", async () => {
    authMock.mockResolvedValue({ user: { id: "editor-1", role: "editor" } });
    expect(await getCurrentActor()).toEqual({ id: "editor-1", role: "editor" });
  });

  it("getCurrentRole trả null cho guest", async () => {
    authMock.mockResolvedValue(null);
    expect(await getCurrentRole()).toBeNull();
  });
});
