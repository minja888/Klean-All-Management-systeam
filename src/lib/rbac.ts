// ---------------------------------------------------------------------------
// RBAC guards (server) — throw ApiError, caught by handle() in lib/api.ts
// ---------------------------------------------------------------------------
// The pure permission matrix + view/write helpers live in lib/access.ts so they
// can be shared with client components. This file adds the server-only guards.
// ---------------------------------------------------------------------------

import { ApiError, Forbidden, Unauthorized } from "@/lib/api";
import { canView, canWrite, isOwnDepartmentOnly, type Module } from "@/lib/access";
import type { Role } from "@/generated/prisma/enums";
import type { SessionUser } from "@/lib/auth";

export * from "@/lib/access";

/** Ensure a request is authenticated; returns the session user. */
export function requireUser(session: SessionUser | null): SessionUser {
  if (!session) throw Unauthorized();
  return session;
}

/** Ensure the user has one of the given roles. */
export function requireRole(session: SessionUser | null, roles: Role[]): SessionUser {
  const user = requireUser(session);
  if (!roles.includes(user.role)) throw Forbidden();
  return user;
}

/** Ensure the user can view a module. */
export function requireView(session: SessionUser | null, module: Module): SessionUser {
  const user = requireUser(session);
  if (!canView(user.role, module)) throw Forbidden();
  return user;
}

/** Ensure the user can write in a module. */
export function requireWrite(session: SessionUser | null, module: Module): SessionUser {
  const user = requireUser(session);
  if (!canWrite(user.role, module)) throw Forbidden();
  return user;
}

/**
 * Department isolation: WORKERS may only touch records in their own department.
 * ADMIN/MANAGER/ACCOUNTING pass through unrestricted.
 */
export function enforceDepartment(session: SessionUser, module: Module, recordDepartmentId: string | null): void {
  if (!isOwnDepartmentOnly(session.role, module)) return;
  if (!session.departmentId) {
    throw new ApiError("Your account is not assigned to a department.", 403);
  }
  if (recordDepartmentId !== session.departmentId) {
    throw Forbidden("This record belongs to another department.");
  }
}
