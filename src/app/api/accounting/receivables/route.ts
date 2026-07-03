// GET /api/accounting/receivables — outstanding customer debts (unpaid sales)
import { handle, ok } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { requireView } from "@/lib/rbac";
import { toNumber } from "@/lib/money";

export const GET = handle(async () => {
  const session = await getSession();
  requireView(session, "payments_accounting");

  const sales = await prisma.sale.findMany({
    include: { customer: { select: { name: true } } },
    orderBy: { saleDate: "desc" },
  });

  const items = sales
    .map((s) => ({
      id: s.id,
      saleNumber: s.saleNumber,
      customer: s.customer?.name ?? "Walk-in",
      total: toNumber(s.totalAmount),
      paid: toNumber(s.amountPaid),
      balance: toNumber(s.totalAmount) - toNumber(s.amountPaid),
    }))
    .filter((s) => s.balance > 0.0001);

  const totalReceivable = items.reduce((s, x) => s + x.balance, 0);
  return ok({ items, totalReceivable });
});
