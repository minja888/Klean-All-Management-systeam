// GET /api/materials/report?from=&to=
// Per-material totals for a period: quantity IN (purchased/received/recorded),
// quantity OUT (used/sold-out), waste, and the current stock level.
// WORKER sees only their own department's materials.
import { handle, ok } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { requireView } from "@/lib/rbac";
import { Role } from "@/generated/prisma/enums";

export const GET = handle(async (req) => {
  const session = await getSession();
  const user = requireView(session, "materials_inventory");

  const url = new URL(req.url);
  const fromParam = url.searchParams.get("from");
  const toParam = url.searchParams.get("to");
  const now = new Date();
  const from = fromParam ? new Date(fromParam) : new Date(now.getFullYear(), now.getMonth(), 1);
  const to = toParam ? new Date(toParam + "T23:59:59") : now;

  const where = user.role === Role.WORKER ? { departmentId: user.departmentId } : {};
  const materials = await prisma.material.findMany({
    where,
    select: { id: true, name: true, stockUnit: true, currentStock: true, reorderLevel: true },
    orderBy: { name: "asc" },
  });

  const movements = await prisma.stockMovement.groupBy({
    by: ["materialId", "type"],
    where: { materialId: { in: materials.map((m) => m.id) }, createdAt: { gte: from, lte: to } },
    _sum: { quantity: true },
  });

  const byMaterial = new Map<string, { in: number; out: number; waste: number }>();
  for (const mv of movements) {
    if (!mv.materialId) continue;
    const row = byMaterial.get(mv.materialId) ?? { in: 0, out: 0, waste: 0 };
    const qty = mv._sum.quantity ?? 0;
    if (mv.type === "IN") row.in += qty;
    else if (mv.type === "OUT") row.out += qty;
    else if (mv.type === "WASTE") row.waste += qty;
    byMaterial.set(mv.materialId, row);
  }

  const rows = materials.map((m) => {
    const mv = byMaterial.get(m.id) ?? { in: 0, out: 0, waste: 0 };
    return {
      id: m.id,
      name: m.name,
      stockUnit: m.stockUnit,
      quantityIn: mv.in,
      quantityOut: mv.out,
      waste: mv.waste,
      currentStock: m.currentStock,
      lowStock: m.currentStock <= m.reorderLevel,
    };
  });

  return ok({ from: from.toISOString(), to: to.toISOString(), rows });
});
