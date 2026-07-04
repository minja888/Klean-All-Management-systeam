// /api/users/[id] — update & delete a user (ADMIN only)
import { z } from "zod";
import { handle, ok, ApiError, NotFound } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { getSession, hashPassword } from "@/lib/auth";
import { requireRole } from "@/lib/rbac";
import { writeAudit } from "@/lib/audit";
import { Role } from "@/generated/prisma/enums";

const publicUser = {
  id: true,
  name: true,
  email: true,
  role: true,
  position: true,
  mustChangePassword: true,
  isActive: true,
  departmentId: true,
  department: { select: { id: true, name: true } },
  createdAt: true,
} as const;

const updateSchema = z
  .object({
    name: z.string().min(1).optional(),
    email: z.email().optional(),
    password: z.string().min(6).optional(),
    role: z.enum(["ADMIN", "MANAGER", "ACCOUNTING", "WORKER"]).optional(),
    position: z.string().nullish(),
    departmentId: z.string().nullish(),
    isActive: z.boolean().optional(),
  })
  .refine((d) => d.role !== "WORKER" || d.departmentId !== null, {
    message: "Workers must belong to a department",
    path: ["departmentId"],
  });

export const PUT = handle(async (req, ctx) => {
  const session = await getSession();
  const actor = requireRole(session, [Role.ADMIN]);
  const { id } = await ctx.params;

  const before = await prisma.user.findUnique({ where: { id }, select: publicUser });
  if (!before) throw NotFound("User not found");

  const input = updateSchema.parse(await req.json().catch(() => ({})));

  // If the email is changing, make sure it is not taken by someone else.
  if (input.email) {
    const email = input.email.toLowerCase();
    const clash = await prisma.user.findUnique({ where: { email } });
    if (clash && clash.id !== id) throw new ApiError("A user with this email already exists.", 409);
  }

  const user = await prisma.user.update({
    where: { id },
    data: {
      name: input.name,
      email: input.email?.toLowerCase(),
      role: input.role,
      position: input.position === undefined ? undefined : input.position,
      departmentId: input.departmentId === undefined ? undefined : input.departmentId,
      isActive: input.isActive,
      // Admin resetting someone's password -> they must set their own next login.
      ...(input.password ? { passwordHash: await hashPassword(input.password), mustChangePassword: true } : {}),
    },
    select: publicUser,
  });

  await writeAudit({ action: "UPDATE", entity: "User", entityId: id, user: actor, before, after: user });
  return ok(user);
});

export const DELETE = handle(async (_req, ctx) => {
  const session = await getSession();
  const actor = requireRole(session, [Role.ADMIN]);
  const { id } = await ctx.params;

  // Guard: an admin cannot delete their own account (avoids locking yourself out).
  if (actor.sub === id) throw new ApiError("You cannot delete your own account.", 400);

  const before = await prisma.user.findUnique({ where: { id }, select: publicUser });
  if (!before) throw NotFound("User not found");

  await prisma.user.delete({ where: { id } });
  await writeAudit({ action: "DELETE", entity: "User", entityId: id, user: actor, before });
  return ok({ deleted: true });
});
