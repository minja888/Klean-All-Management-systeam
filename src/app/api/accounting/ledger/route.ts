// GET /api/accounting/ledger?from=&to=
// Unified CASH ledger book — every shilling in/out, chronologically, with a
// running balance. Sources:
//   IN : capital & loans in, cash taken at sale time, incoming payments
//   OUT: drawings & loan repayments, cash paid on purchase, outgoing payments,
//        expenses, payroll runs marked PAID
// Access: ADMIN + ACCOUNTING.
import { handle, ok } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { requireView } from "@/lib/rbac";
import { toNumber } from "@/lib/money";

interface LedgerEntry {
  date: string;
  type: string; // translation key suffix
  description: string;
  moneyIn: number;
  moneyOut: number;
}

export const GET = handle(async (req) => {
  const session = await getSession();
  requireView(session, "payments_accounting");

  const url = new URL(req.url);
  const fromParam = url.searchParams.get("from");
  const toParam = url.searchParams.get("to");
  const from = fromParam ? new Date(fromParam) : new Date(0); // ledger starts at the beginning
  const to = toParam ? new Date(toParam + "T23:59:59") : new Date();

  const entries: LedgerEntry[] = [];

  // Capital / loans / drawings
  const capital = await prisma.capitalEntry.findMany({ where: { entryDate: { lte: to } } });
  for (const c of capital) {
    const amt = toNumber(c.amount);
    const isIn = c.type === "CAPITAL" || c.type === "LOAN";
    entries.push({
      date: c.entryDate.toISOString(),
      type: c.type,
      description: c.description ?? "",
      moneyIn: isIn ? amt : 0,
      moneyOut: isIn ? 0 : amt,
    });
  }

  // Cash received when a sale was made
  const sales = await prisma.sale.findMany({
    where: { saleDate: { lte: to }, amountPaid: { gt: 0 } },
    include: { customer: { select: { name: true } } },
  });
  for (const s of sales) {
    entries.push({
      date: s.saleDate.toISOString(),
      type: "SALE",
      description: `${s.saleNumber} — ${s.customer?.name ?? "Walk-in"}`,
      moneyIn: toNumber(s.amountPaid),
      moneyOut: 0,
    });
  }

  // Later payments (customer debts in / supplier payments out)
  const payments = await prisma.payment.findMany({
    where: { paymentDate: { lte: to } },
    include: { customer: { select: { name: true } }, supplier: { select: { name: true } } },
  });
  for (const p of payments) {
    const amt = toNumber(p.amount);
    if (p.direction === "INCOMING") {
      entries.push({ date: p.paymentDate.toISOString(), type: "PAYMENT_IN", description: p.customer?.name ?? p.note ?? "", moneyIn: amt, moneyOut: 0 });
    } else {
      entries.push({ date: p.paymentDate.toISOString(), type: "PAYMENT_OUT", description: p.supplier?.name ?? p.note ?? "", moneyIn: 0, moneyOut: amt });
    }
  }

  // Cash paid up-front on purchase orders
  const pos = await prisma.purchaseOrder.findMany({
    where: { orderDate: { lte: to }, amountPaid: { gt: 0 }, status: { not: "CANCELLED" } },
    include: { supplier: { select: { name: true } } },
  });
  for (const po of pos) {
    entries.push({
      date: po.orderDate.toISOString(),
      type: "PURCHASE",
      description: `${po.orderNumber} — ${po.supplier.name}`,
      moneyIn: 0,
      moneyOut: toNumber(po.amountPaid),
    });
  }

  // Expenses
  const expenses = await prisma.expense.findMany({
    where: { expenseDate: { lte: to } },
    include: { category: { select: { name: true } } },
  });
  for (const e of expenses) {
    entries.push({
      date: e.expenseDate.toISOString(),
      type: "EXPENSE",
      description: `${e.category?.name ?? ""}${e.description ? " — " + e.description : ""}`,
      moneyIn: 0,
      moneyOut: toNumber(e.amount),
    });
  }

  // Payroll runs that were actually paid
  const runs = await prisma.payrollRun.findMany({ where: { status: "PAID", paidAt: { not: null, lte: to } } });
  for (const r of runs) {
    entries.push({
      date: (r.paidAt as Date).toISOString(),
      type: "PAYROLL",
      description: `${r.periodYear}-${String(r.periodMonth).padStart(2, "0")}`,
      moneyIn: 0,
      moneyOut: toNumber(r.totalNet),
    });
  }

  // Chronological order, then compute the running balance from day one.
  entries.sort((a, b) => a.date.localeCompare(b.date));
  let balance = 0;
  const rows = entries.map((e) => {
    balance += e.moneyIn - e.moneyOut;
    return { ...e, balance };
  });

  // Opening balance = everything before `from`; return only the visible window.
  const visible = rows.filter((r) => new Date(r.date) >= from);
  const openingBalance = visible.length > 0 ? visible[0].balance - (visible[0].moneyIn - visible[0].moneyOut) : balance;
  const totalIn = visible.reduce((s, r) => s + r.moneyIn, 0);
  const totalOut = visible.reduce((s, r) => s + r.moneyOut, 0);

  return ok({ openingBalance, closingBalance: balance, totalIn, totalOut, rows: visible });
});
