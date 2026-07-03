// /api/payments — list & record payments (in/out)
// View: ADMIN/MANAGER/ACCOUNTING. Write: ADMIN/ACCOUNTING.
// A payment updates the linked PO/Sale amountPaid so balances stay derived.
import { z } from "zod";
import { handle, ok, BadRequest } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { requireView, requireWrite } from "@/lib/rbac";
import { writeAudit } from "@/lib/audit";

const createSchema = z.object({
  direction: z.enum(["INCOMING", "OUTGOING"]),
  amount: z.number().positive(),
  method: z.string().min(1),
  purchaseOrderId: z.string().nullish(), // for OUTGOING (supplier)
  saleId: z.string().nullish(), // for INCOMING (customer)
  note: z.string().nullish(),
});

export const GET = handle(async () => {
  const session = await getSession();
  requireView(session, "payments_accounting");
  const payments = await prisma.payment.findMany({
    include: {
      supplier: { select: { name: true } },
      customer: { select: { name: true } },
      purchaseOrder: { select: { orderNumber: true } },
      sale: { select: { saleNumber: true } },
    },
    orderBy: { paymentDate: "desc" },
    take: 500,
  });
  return ok(payments);
});

export const POST = handle(async (req) => {
  const session = await getSession();
  const actor = requireWrite(session, "payments_accounting");
  const input = createSchema.parse(await req.json().catch(() => ({})));

  const payment = await prisma.$transaction(async (tx) => {
    if (input.direction === "OUTGOING") {
      if (!input.purchaseOrderId) throw BadRequest("Select a purchase order to pay.");
      const po = await tx.purchaseOrder.findUnique({ where: { id: input.purchaseOrderId } });
      if (!po) throw BadRequest("Purchase order not found");
      await tx.purchaseOrder.update({ where: { id: po.id }, data: { amountPaid: { increment: input.amount } } });
      return tx.payment.create({
        data: {
          direction: "OUTGOING", amount: input.amount, method: input.method,
          supplierId: po.supplierId, purchaseOrderId: po.id, note: input.note ?? null, createdById: actor.sub,
        },
      });
    } else {
      if (!input.saleId) throw BadRequest("Select a sale to receive against.");
      const sale = await tx.sale.findUnique({ where: { id: input.saleId } });
      if (!sale) throw BadRequest("Sale not found");
      await tx.sale.update({ where: { id: sale.id }, data: { amountPaid: { increment: input.amount } } });
      return tx.payment.create({
        data: {
          direction: "INCOMING", amount: input.amount, method: input.method,
          customerId: sale.customerId, saleId: sale.id, note: input.note ?? null, createdById: actor.sub,
        },
      });
    }
  });

  await writeAudit({ action: "CREATE", entity: "Payment", entityId: payment.id, user: actor, after: payment });
  return ok(payment, 201);
});
