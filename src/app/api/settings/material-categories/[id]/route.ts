// /api/settings/material-categories/[id] — update & delete (ADMIN only)
import { z } from "zod";
import { handle, ok, ApiError, NotFound } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { requireRole } from "@/lib/rbac";
import { writeAudit } from "@/lib/audit";
import { Role } from "@/generated/prisma/enums";

const schema = z.object({ name: z.string().min(1, "Name is required") });

export const PUT = handle(async (req, ctx) => {
  const session = await getSession();
  const actor = requireRole(session, [Role.ADMIN]);
  const { id } = await ctx.params;

  const before = await prisma.materialCategory.findUnique({ where: { id } });
  if (!before) throw NotFound("Category not found");

  const { name } = schema.parse(await req.json().catch(() => ({})));
  if (name !== before.name) {
    const clash = await prisma.materialCategory.findUnique({ where: { name } });
    if (clash) throw new ApiError("This category already exists.", 409);
  }

  const row = await prisma.materialCategory.update({ where: { id }, data: { name } });
  await writeAudit({ action: "UPDATE", entity: "MaterialCategory", entityId: id, user: actor, before, after: row });
  return ok(row);
});

export const DELETE = handle(async (_req, ctx) => {
  const session = await getSession();
  const actor = requireRole(session, [Role.ADMIN]);
  const { id } = await ctx.params;

  const before = await prisma.materialCategory.findUnique({
    where: { id },
    include: { _count: { select: { materials: true } } },
  });
  if (!before) throw NotFound("Category not found");
  // Materials reference the category with onDelete: Restrict, so block deletion
  // while it is still in use (clearer than a raw database error).
  if (before._count.materials > 0) {
    throw new ApiError("Cannot delete: materials still use this category.", 409);
  }

  await prisma.materialCategory.delete({ where: { id } });
  await writeAudit({ action: "DELETE", entity: "MaterialCategory", entityId: id, user: actor, before });
  return ok({ deleted: true });
});
