// GET /api/accounting/payables — outstanding supplier balances (unpaid POs)
import { handle, ok } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { requireView } from "@/lib/rbac";
import { toNumber } from "@/lib/money";

export const GET = handle(async () => {
  const session = await getSession();
  requireView(session, "payments_accounting");

  const orders = await prisma.purchaseOrder.findMany({
    where: { status: { not: "CANCELLED" } },
    include: { supplier: { select: { name: true } } },
    orderBy: { orderDate: "desc" },
  });

  const items = orders
    .map((o) => ({
      id: o.id,
      orderNumber: o.orderNumber,
      supplier: o.supplier.name,
      total: toNumber(o.totalAmount),
      paid: toNumber(o.amountPaid),
      balance: toNumber(o.totalAmount) - toNumber(o.amountPaid),
    }))
    .filter((o) => o.balance > 0.0001);

  const totalPayable = items.reduce((s, o) => s + o.balance, 0);
  return ok({ items, totalPayable });
});
