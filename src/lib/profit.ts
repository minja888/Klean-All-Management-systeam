// ---------------------------------------------------------------------------
// Profit engine (spec §7) — pure aggregation over a date range
// ---------------------------------------------------------------------------
//   Revenue        = SUM(Sale.totalAmount in period)
//   COGS           = SUM(ProductionUsage.quantityUsed * Material.costPrice in period)
//   Gross Profit   = Revenue - COGS
//   Operating Cost = SUM(Expense.amount in period) + SUM(PayrollRun.totalNet in period)
//   Net Profit     = Gross Profit - Operating Cost
// Payroll is counted ONCE here (never also as a manual expense).
// ---------------------------------------------------------------------------

import { prisma } from "@/lib/prisma";
import { toNumber } from "@/lib/money";

export interface ProfitResult {
  from: string;
  to: string;
  revenue: number;
  cogs: number;
  grossProfit: number;
  expenses: number;
  payroll: number;
  operatingCost: number;
  netProfit: number;
}

export async function computeProfit(from: Date, to: Date): Promise<ProfitResult> {
  // Revenue
  const revenueAgg = await prisma.sale.aggregate({
    _sum: { totalAmount: true },
    where: { saleDate: { gte: from, lte: to } },
  });
  const revenue = toNumber(revenueAgg._sum.totalAmount);

  // COGS — materials consumed by production in the period.
  const usages = await prisma.productionUsage.findMany({
    where: { createdAt: { gte: from, lte: to } },
    include: { material: { select: { costPrice: true } } },
  });
  const cogs = usages.reduce((sum, u) => sum + u.quantityUsed * toNumber(u.material.costPrice), 0);

  // Operating cost part 1 — expenses.
  const expenseAgg = await prisma.expense.aggregate({
    _sum: { amount: true },
    where: { expenseDate: { gte: from, lte: to } },
  });
  const expenses = toNumber(expenseAgg._sum.amount);

  // Operating cost part 2 — payroll (approved or paid runs whose month falls in range).
  const runs = await prisma.payrollRun.findMany({
    where: { status: { in: ["APPROVED", "PAID"] } },
    select: { periodYear: true, periodMonth: true, totalNet: true },
  });
  const payroll = runs.reduce((sum, r) => {
    const runDate = new Date(r.periodYear, r.periodMonth - 1, 1);
    return runDate >= from && runDate <= to ? sum + toNumber(r.totalNet) : sum;
  }, 0);

  const grossProfit = revenue - cogs;
  const operatingCost = expenses + payroll;
  const netProfit = grossProfit - operatingCost;

  return {
    from: from.toISOString(),
    to: to.toISOString(),
    revenue,
    cogs,
    grossProfit,
    expenses,
    payroll,
    operatingCost,
    netProfit,
  };
}

/** Helper: first day of the current month + now, and Jan 1 (YTD start). */
export function periodBounds(now = new Date()) {
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const yearStart = new Date(now.getFullYear(), 0, 1);
  return { now, monthStart, yearStart };
}
