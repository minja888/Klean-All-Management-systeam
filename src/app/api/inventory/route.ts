// /api/inventory — current stock levels + low-stock flags + stock value
import { handle, ok } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { requireView } from "@/lib/rbac";
import { toNumber } from "@/lib/money";
import { Role } from "@/generated/prisma/enums";

export const GET = handle(async () => {
  const session = await getSession();
  const user = requireView(session, "materials_inventory");
  const where = user.role === Role.WORKER ? { departmentId: user.departmentId } : {};

  const materials = await prisma.material.findMany({
    where,
    include: { category: { select: { name: true } } },
    orderBy: { name: "asc" },
  });

  const items = materials.map((m) => {
    const value = m.currentStock * toNumber(m.costPrice);
    return {
      id: m.id,
      name: m.name,
      category: m.category?.name ?? "",
      stockUnit: m.stockUnit,
      currentStock: m.currentStock,
      reorderLevel: m.reorderLevel,
      costPrice: toNumber(m.costPrice),
      value,
      lowStock: m.currentStock <= m.reorderLevel,
    };
  });

  const totalValue = items.reduce((sum, i) => sum + i.value, 0);
  const lowStockCount = items.filter((i) => i.lowStock).length;

  return ok({ items, totalValue, lowStockCount });
});
