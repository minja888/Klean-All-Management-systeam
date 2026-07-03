// /api/production-batches/[id] — get & delete a batch
import { handle, ok, NotFound, ApiError } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { requireView, requireWrite, enforceDepartment } from "@/lib/rbac";
import { writeAudit } from "@/lib/audit";

export const GET = handle(async (_req, ctx) => {
  const session = await getSession();
  const user = requireView(session, "production_bom");
  const { id } = await ctx.params;

  const batch = await prisma.productionBatch.findUnique({
    where: { id },
    include: {
      product: { select: { id: true, name: true, unit: true } },
      department: { select: { id: true, name: true } },
      usages: { include: { material: { select: { name: true, stockUnit: true } } } },
    },
  });
  if (!batch) throw NotFound("Batch not found");
  enforceDepartment(user, "production_bom", batch.departmentId);
  return ok(batch);
});

export const DELETE = handle(async (_req, ctx) => {
  const session = await getSession();
  const actor = requireWrite(session, "production_bom");
  const { id } = await ctx.params;

  const before = await prisma.productionBatch.findUnique({ where: { id } });
  if (!before) throw NotFound("Batch not found");
  enforceDepartment(actor, "production_bom", before.departmentId);
  // A completed batch already moved stock — deleting it would desync inventory.
  if (before.status === "COMPLETED") throw new ApiError("Cannot delete a completed batch.", 409);

  await prisma.productionBatch.delete({ where: { id } });
  await writeAudit({ action: "DELETE", entity: "ProductionBatch", entityId: id, user: actor, before });
  return ok({ deleted: true });
});
