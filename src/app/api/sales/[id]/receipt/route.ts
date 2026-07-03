// GET /api/sales/[id]/receipt — printable receipt data
import { handle, ok, NotFound } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { requireView } from "@/lib/rbac";
import { toNumber } from "@/lib/money";

export const GET = handle(async (_req, ctx) => {
  const session = await getSession();
  requireView(session, "sales_pos");
  const { id } = await ctx.params;

  const sale = await prisma.sale.findUnique({
    where: { id },
    include: {
      customer: true,
      items: { include: { product: { select: { name: true, unit: true } } } },
    },
  });
  if (!sale) throw NotFound("Sale not found");

  const setting = await prisma.appSetting.findUnique({ where: { key: "companyName" } });

  return ok({
    companyName: setting?.value ?? "Klean All",
    saleNumber: sale.saleNumber,
    date: sale.saleDate,
    customer: sale.customer?.name ?? "Walk-in",
    paymentMethod: sale.paymentMethod,
    items: sale.items.map((it) => ({
      name: it.product?.name ?? "",
      unit: it.product?.unit ?? "",
      quantity: it.quantity,
      unitPrice: toNumber(it.unitPrice),
      lineTotal: toNumber(it.lineTotal),
    })),
    totalAmount: toNumber(sale.totalAmount),
    amountPaid: toNumber(sale.amountPaid),
    debt: toNumber(sale.totalAmount) - toNumber(sale.amountPaid),
  });
});
