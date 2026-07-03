// GET /api/dashboard — aggregated KPIs (period-aware)
// Operational KPIs for everyone; financial figures for ADMIN/ACCOUNTING only.
import { handle, ok } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { requireUser } from "@/lib/rbac";
import { canView } from "@/lib/access";
import { toNumber } from "@/lib/money";
import { computeProfit, periodBounds } from "@/lib/profit";

export const GET = handle(async () => {
  const session = await getSession();
  const user = requireUser(session);
  const showFinancials = canView(user.role, "profit_dashboard");

  const { now, monthStart, yearStart } = periodBounds();

  // Operational (everyone) --------------------------------------------------
  const materials = await prisma.material.findMany({ select: { name: true, currentStock: true, reorderLevel: true, stockUnit: true, costPrice: true } });
  const lowStock = materials.filter((m) => m.currentStock <= m.reorderLevel);
  const stockValue = materials.reduce((s, m) => s + m.currentStock * toNumber(m.costPrice), 0);

  const producedAgg = await prisma.productionBatch.aggregate({
    _sum: { quantityProduced: true },
    where: { status: "COMPLETED", completedAt: { gte: monthStart } },
  });

  const base = {
    lowStockCount: lowStock.length,
    lowStock: lowStock.slice(0, 8).map((m) => ({ name: m.name, currentStock: m.currentStock, reorderLevel: m.reorderLevel, stockUnit: m.stockUnit })),
    productionOutput: producedAgg._sum.quantityProduced ?? 0,
    stockValue,
    showFinancials,
  };

  if (!showFinancials) return ok(base);

  // Financial (ADMIN / ACCOUNTING) -----------------------------------------
  const salesAgg = await prisma.sale.aggregate({ _sum: { totalAmount: true }, where: { saleDate: { gte: monthStart } } });
  const purchasesAgg = await prisma.purchaseOrder.aggregate({ _sum: { totalAmount: true }, where: { orderDate: { gte: monthStart } } });

  const pos = await prisma.purchaseOrder.findMany({ where: { status: { not: "CANCELLED" } }, select: { totalAmount: true, amountPaid: true } });
  const supplierCredit = pos.reduce((s, p) => s + (toNumber(p.totalAmount) - toNumber(p.amountPaid)), 0);

  const sales = await prisma.sale.findMany({ select: { totalAmount: true, amountPaid: true } });
  const customerDebt = sales.reduce((s, x) => s + (toNumber(x.totalAmount) - toNumber(x.amountPaid)), 0);

  const profitMonth = await computeProfit(monthStart, now);
  const profitYTD = await computeProfit(yearStart, now);

  return ok({
    ...base,
    salesThisMonth: toNumber(salesAgg._sum.totalAmount),
    purchasesThisMonth: toNumber(purchasesAgg._sum.totalAmount),
    supplierCredit,
    customerDebt,
    netProfitMonth: profitMonth.netProfit,
    netProfitYTD: profitYTD.netProfit,
  });
});
