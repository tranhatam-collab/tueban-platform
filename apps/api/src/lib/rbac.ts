import { getCurrentUser, type SessionUser } from "./session";

export interface RbacEnv {
  DB: D1Database;
}

const ADMIN_ROLES = ["owner", "admin"];
const INSTRUCTOR_ROLES = ["owner", "admin", "instructor"];

export function hasRole(user: SessionUser, allowedRoles: string[]): boolean {
  return user.roles.some((r) => allowedRoles.includes(r));
}

export function requireAdmin(user: SessionUser): void {
  if (!hasRole(user, ADMIN_ROLES)) {
    throw new Error("FORBIDDEN: Requires owner or admin role");
  }
}

export function requireInstructor(user: SessionUser): void {
  if (!hasRole(user, INSTRUCTOR_ROLES)) {
    throw new Error("FORBIDDEN: Requires owner, admin, or instructor role");
  }
}
