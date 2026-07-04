// GET /api/accounting/balance-sheet — simple balance sheet (Mizania)
//   ASSETS      : cash (ledger), material stock value, product stock value, receivables
//   LIABILITIES : supplier payables, loans outstanding (per lender)
//   EQUITY      : owner's capital − drawings + retained profit (all-time net)
// Access: ADMIN + ACCOUNTING.
import { handle, ok } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { requireView } from "@/lib/rbac";
import { toNumber } from "@/lib/money";
import { computeProfit } from "@/lib/profit";

export const GET = handle(async () => {
  const session = await getSession();
  requireView(session, "payments_accounting");

  // --- Assets ---------------------------------------------------------------
  const materials = await prisma.material.findMany({ select: { currentStock: true, costPrice: true } });
  const materialStock = materials.reduce((s, m) => s + m.currentStock * toNumber(m.costPrice), 0);

  const products = await prisma.product.findMany({ select: { currentStock: true, sellingPrice: true } });
  const productStock = products.reduce((s, p) => s + p.currentStock * toNumber(p.sellingPrice), 0);

  const sales = await prisma.sale.findMany({ select: { totalAmount: true, amountPaid: true } });
  const receivables = sales.reduce((s, x) => s + (toNumber(x.totalAmount) - toNumber(x.amountPaid)), 0);

  // Cash — replicate the ledger's closing balance (all time).
  const capitalEntries = await prisma.capitalEntry.findMany();
  let cash = 0;
  let capitalIn = 0, drawings = 0, loansIn = 0, loanRepayments = 0;
  const creditors = new Map<string, { name: string; info: string | null; outstanding: number }>();
  for (const c of capitalEntries) {
    const amt = toNumber(c.amount);
    if (c.type === "CAPITAL") { cash += amt; capitalIn += amt; }
    else if (c.type === "LOAN") { cash += amt; loansIn += amt; }
    else if (c.type === "LOAN_REPAYMENT") { cash -= amt; loanRepayments += amt; }
    else if (c.type === "DRAWING") { cash -= amt; drawings += amt; }
    if (c.type === "LOAN" || c.type === "LOAN_REPAYMENT") {
      const key = (c.partyName ?? "").trim() || "—";
      const row = creditors.get(key) ?? { name: key, info: c.partyInfo ?? null, outstanding: 0 };
      row.outstanding += c.type === "LOAN" ? amt : -amt;
      if (!row.info && c.partyInfo) row.info = c.partyInfo;
      creditors.set(key, row);
    }
  }
  cash += sales.reduce((s, x) => s + toNumber(x.amountPaid), 0);
  const payments = await prisma.payment.findMany({ select: { direction: true, amount: true } });
  for (const p of payments) cash += p.direction === "INCOMING" ? toNumber(p.amount) : -toNumber(p.amount);
  const pos = await prisma.purchaseOrder.findMany({ where: { status: { not: "CANCELLED" } }, select: { amountPaid: true, totalAmount: true } });
  cash -= pos.reduce((s, o) => s + toNumber(o.amountPaid), 0);
  const expensesAgg = await prisma.expense.aggregate({ _sum: { amount: true } });
  cash -= toNumber(expensesAgg._sum.amount);
  const paidRuns = await prisma.payrollRun.findMany({ where: { status: "PAID" }, select: { totalNet: true } });
  cash -= paidRuns.reduce((s, r) => s + toNumber(r.totalNet), 0);

  // --- Liabilities ------------------------------------------------------------
  const payables = pos.reduce((s, o) => s + (toNumber(o.totalAmount) - toNumber(o.amountPaid)), 0);
  const loansOutstanding = loansIn - loanRepayments;

  // --- Equity -------------------------------------------------------------------
  const allTime = await computeProfit(new Date(0), new Date());
  const capital = capitalIn - drawings;
  const equity = capital + allTime.netProfit;

  const totalAssets = cash + materialStock + productStock + receivables;
  const totalLiabilities = payables + loansOutstanding;

  return ok({
    asOf: new Date().toISOString(),
    assets: { cash, materialStock, productStock, receivables, total: totalAssets },
    liabilities: {
      payables,
      loansOutstanding,
      creditors: [...creditors.values()].filter((c) => Math.abs(c.outstanding) > 0.0001),
      total: totalLiabilities,
    },
    equity: { capital, retainedProfit: allTime.netProfit, total: equity },
    balances: Math.abs(totalAssets - (totalLiabilities + equity)) < 1,
  });
});
