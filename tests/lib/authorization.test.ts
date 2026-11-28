import { describe, expect, it } from "vitest";

import {
  can,
  canAll,
  hasRole,
  isGuest,
  requireActor,
  requirePermission,
  type Actor,
  type Permission,
} from "@/lib/auth/authorization";
import { ForbiddenError, UnauthorizedError } from "@/lib/errors/app-error";

const guest = null;
const user: Actor = { id: "u1", role: "user" };
const editor: Actor = { id: "e1", role: "editor" };
const admin: Actor = { id: "a1", role: "admin" };

describe("authorization (RBAC tập trung)", () => {
  it("phân cấp vai trò guest < user < editor < admin", () => {
    expect(hasRole(guest, "user")).toBe(false);
    expect(hasRole(user, "user")).toBe(true);
    expect(hasRole(user, "editor")).toBe(false);
    expect(hasRole(editor, "editor")).toBe(true);
    expect(hasRole(admin, "admin")).toBe(true);
  });

  it("guest không có bất kỳ permission nào", () => {
    expect(can(guest, "recipe:create")).toBe(false);
    expect(can(guest, "favorite:manage")).toBe(false);
    expect(isGuest(guest)).toBe(true);
  });

  it("user chỉ quản lý được yêu thích, KHÔNG tạo công thức", () => {
    expect(can(user, "favorite:manage")).toBe(true);
    expect(can(user, "recipe:create")).toBe(false);
    expect(can(user, "recipe:publish")).toBe(false);
  });

  it("editor tạo/sửa/publish công thức nhưng không quản taxonomy", () => {
    expect(can(editor, "recipe:create")).toBe(true);
    expect(can(editor, "recipe:update")).toBe(true);
    expect(can(editor, "recipe:publish")).toBe(true);
    expect(can(editor, "media:upload")).toBe(true);
    expect(can(editor, "taxonomy:manage")).toBe(false);
    expect(can(editor, "recipe:delete")).toBe(false);
  });

  it("admin có toàn quyền", () => {
    expect(canAll(admin, ["recipe:delete", "taxonomy:manage", "user:manage"])).toBe(true);
  });

  it("permission importer (P16 — I1) chỉ admin được cấp", () => {
    const importer: Permission[] = [
      "import:read",
      "import:manage",
      "import:approve",
      "import:publish",
      "source:manage",
    ];
    expect(canAll(admin, importer)).toBe(true);
    // guest / user / editor KHÔNG có quyền importer (mặc định an toàn: admin-only).
    for (const permission of importer) {
      expect(can(guest, permission)).toBe(false);
      expect(can(user, permission)).toBe(false);
      expect(can(editor, permission)).toBe(false);
    }
  });
});

describe("authorization — importer guard", () => {
  it("requirePermission chặn guest/user/editor và cho phép admin", () => {
    expect(() => requirePermission(guest, "import:manage")).toThrow(UnauthorizedError);
    expect(() => requirePermission(user, "import:manage")).toThrow(ForbiddenError);
    expect(() => requirePermission(editor, "import:manage")).toThrow(ForbiddenError);
    expect(requirePermission(admin, "import:manage")).toBe(admin);
  });

  it("guest bị chặn mọi thao tác importer", () => {
    expect(() => requirePermission(guest, "import:read")).toThrow(UnauthorizedError);
    expect(() => requirePermission(guest, "import:approve")).toThrow(UnauthorizedError);
    expect(() => requirePermission(guest, "import:publish")).toThrow(UnauthorizedError);
    expect(() => requirePermission(guest, "source:manage")).toThrow(UnauthorizedError);
  });
});

describe("authorization — guard", () => {
  it("requireActor ném UnauthorizedError khi guest", () => {
    expect(() => requireActor(guest)).toThrow(UnauthorizedError);
    expect(requireActor(editor)).toBe(editor);
  });

  it("requirePermission ném UnauthorizedError (guest) và ForbiddenError (thiếu quyền)", () => {
    expect(() => requirePermission(guest, "recipe:create")).toThrow(UnauthorizedError);
    expect(() => requirePermission(user, "recipe:create")).toThrow(ForbiddenError);
    expect(requirePermission(editor, "recipe:create")).toBe(editor);
  });
});
