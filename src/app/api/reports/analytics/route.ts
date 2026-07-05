// GET /api/reports/analytics?from=&to=
// Data for the report charts (ADMIN + ACCOUNTING):
//   monthly  — last 6 months: revenue, total costs (COGS+expenses+payroll), net
//   byCategory — expense totals per category within the selected period
import { handle, ok } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { requireView } from "@/lib/rbac";
import { toNumber } from "@/lib/money";
import { computeProfit } from "@/lib/profit";

export const GET = handle(async (req) => {
  const session = await getSession();
  requireView(session, "profit_dashboard");

  const url = new URL(req.url);
  const fromParam = url.searchParams.get("from");
  const toParam = url.searchParams.get("to");
  const now = new Date();
  const from = fromParam ? new Date(fromParam) : new Date(now.getFullYear(), now.getMonth(), 1);
  const to = toParam ? new Date(toParam + "T23:59:59") : now;

  // --- Monthly trend: the last 6 calendar months (including this one) -------
  const monthly: { month: string; revenue: number; costs: number; net: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);
    const p = await computeProfit(start, end > now ? now : end);
    monthly.push({
      month: start.toLocaleDateString("en-GB", { month: "short" }),
      revenue: p.revenue,
      costs: p.cogs + p.operatingCost,
      net: p.netProfit,
    });
  }

  // --- Expense breakdown by category for the chosen period ------------------
  const grouped = await prisma.expense.groupBy({
    by: ["categoryId"],
    where: { expenseDate: { gte: from, lte: to } },
    _sum: { amount: true },
  });
  const cats = await prisma.expenseCategory.findMany({
    where: { id: { in: grouped.map((g) => g.categoryId) } },
    select: { id: true, name: true },
  });
  const nameById = new Map(cats.map((c) => [c.id, c.name]));
  const byCategory = grouped
    .map((g) => ({ name: nameById.get(g.categoryId) ?? "—", amount: toNumber(g._sum.amount) }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 8);

  return ok({ monthly, byCategory });
});
