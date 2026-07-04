// /api/capital/[id] — delete a capital entry (corrections)
import { handle, ok, NotFound } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { requireWrite } from "@/lib/rbac";
import { writeAudit } from "@/lib/audit";

export const DELETE = handle(async (_req, ctx) => {
  const session = await getSession();
  const actor = requireWrite(session, "payments_accounting");
  const { id } = await ctx.params;

  const before = await prisma.capitalEntry.findUnique({ where: { id } });
  if (!before) throw NotFound("Entry not found");

  await prisma.capitalEntry.delete({ where: { id } });
  await writeAudit({ action: "DELETE", entity: "CapitalEntry", entityId: id, user: actor, before });
  return ok({ deleted: true });
});
