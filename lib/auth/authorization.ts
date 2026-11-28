import { ForbiddenError, UnauthorizedError } from "@/lib/errors/app-error";

/**
 * Ủy quyền tập trung theo RBAC (P02 — D-P02-03).
 *
 * - Vai trò lưu ở `users.role` (enum `app_role`): `user` < `editor` < `admin`.
 * - KHÔNG có bảng `user_roles`, KHÔNG có vai trò `moderator`.
 * - KHÔNG hardcode kiểm tra role rải rác: mọi nơi gọi `can()` / `requirePermission()`.
 * - `actor = null` nghĩa là khách (guest) — chỉ được đọc nội dung công khai.
 */

export const APP_ROLES = ["user", "editor", "admin"] as const;
export type Role = (typeof APP_ROLES)[number];

/** Người thực hiện thao tác. `null` = guest. */
export interface Actor {
  id: string;
  role: Role;
}

const ROLE_RANK: Record<Role, number> = { user: 1, editor: 2, admin: 3 };

export type Permission =
  | "favorite:manage"
  | "recipe:read:draft"
  | "recipe:create"
  | "recipe:update"
  | "recipe:archive"
  | "recipe:submit_review"
  | "recipe:publish"
  | "recipe:delete"
  | "media:upload"
  | "taxonomy:manage"
  | "user:manage"
  // Recipe Importer (P16 — I1). Chỉ admin theo P16.8 §3 (SECURITY §67).
  | "import:read"
  | "import:manage"
  | "import:approve"
  | "import:publish"
  | "source:manage";

const PERMISSIONS_BY_ROLE: Record<Role, readonly Permission[]> = {
  user: ["favorite:manage"],
  editor: [
    "favorite:manage",
    "recipe:read:draft",
    "recipe:create",
    "recipe:update",
    "recipe:archive",
    "recipe:submit_review",
    "recipe:publish",
    "media:upload",
  ],
  admin: [
    "favorite:manage",
    "recipe:read:draft",
    "recipe:create",
    "recipe:update",
    "recipe:archive",
    "recipe:submit_review",
    "recipe:publish",
    "recipe:delete",
    "media:upload",
    "taxonomy:manage",
    "user:manage",
    "import:read",
    "import:manage",
    "import:approve",
    "import:publish",
    "source:manage",
  ],
};

/** Actor có vai trò tối thiểu `minRole`? */
export function hasRole(actor: Actor | null, minRole: Role): boolean {
  if (!actor) return false;
  return ROLE_RANK[actor.role] >= ROLE_RANK[minRole];
}

/** Actor có permission cụ thể? */
export function can(actor: Actor | null, permission: Permission): boolean {
  if (!actor) return false;
  const granted = PERMISSIONS_BY_ROLE[actor.role];
  return granted.includes(permission);
}

/** Actor có TẤT CẢ permission? */
export function canAll(actor: Actor | null, permissions: readonly Permission[]): boolean {
  return permissions.every((permission) => can(actor, permission));
}

export function isGuest(actor: Actor | null): actor is null {
  return actor === null;
}

/**
 * Bắt buộc đăng nhập (ném 401 nếu guest) — dùng cho thao tác ghi.
 */
export function requireActor(actor: Actor | null): Actor {
  if (!actor) {
    throw new UnauthorizedError();
  }
  return actor;
}

/**
 * Bắt buộc có permission (ném 401 nếu chưa đăng nhập, 403 nếu thiếu quyền).
 */
export function requirePermission(actor: Actor | null, permission: Permission): Actor {
  const current = requireActor(actor);
  if (!can(current, permission)) {
    throw new ForbiddenError();
  }
  return current;
}
