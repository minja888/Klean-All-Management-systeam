// /api/materials/[id]/movements — stock movement history for a material
import { handle, ok } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { requireView } from "@/lib/rbac";

export const GET = handle(async (_req, ctx) => {
  const session = await getSession();
  requireView(session, "materials_inventory");
  const { id } = await ctx.params;
  const movements = await prisma.stockMovement.findMany({
    where: { materialId: id },
    orderBy: { createdAt: "desc" },
    take: 200,
  });
  return ok(movements);
});
