// /api/departments/[id] — update & delete a department (ADMIN only)
import { z } from "zod";
import { handle, ok, ApiError, NotFound } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { requireRole } from "@/lib/rbac";
import { writeAudit } from "@/lib/audit";
import { Role } from "@/generated/prisma/enums";

const schema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().nullish(),
});

export const PUT = handle(async (req, ctx) => {
  const session = await getSession();
  const actor = requireRole(session, [Role.ADMIN]);
  const { id } = await ctx.params;

  const before = await prisma.department.findUnique({ where: { id } });
  if (!before) throw NotFound("Department not found");

  const input = schema.parse(await req.json().catch(() => ({})));
  if (input.name && input.name !== before.name) {
    const clash = await prisma.department.findUnique({ where: { name: input.name } });
    if (clash) throw new ApiError("A department with this name already exists.", 409);
  }

  const department = await prisma.department.update({
    where: { id },
    data: { name: input.name, description: input.description === undefined ? undefined : input.description },
  });
  await writeAudit({ action: "UPDATE", entity: "Department", entityId: id, user: actor, before, after: department });
  return ok(department);
});

export const DELETE = handle(async (_req, ctx) => {
  const session = await getSession();
  const actor = requireRole(session, [Role.ADMIN]);
  const { id } = await ctx.params;

  const before = await prisma.department.findUnique({ where: { id } });
  if (!before) throw NotFound("Department not found");

  // Related users/materials/etc. have their departmentId set to null (see schema).
  await prisma.department.delete({ where: { id } });
  await writeAudit({ action: "DELETE", entity: "Department", entityId: id, user: actor, before });
  return ok({ deleted: true });
});
