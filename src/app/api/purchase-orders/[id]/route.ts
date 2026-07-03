// /api/purchase-orders/[id] — get, update header, delete
import { z } from "zod";
import { handle, ok, NotFound, ApiError } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { requireView, requireWrite } from "@/lib/rbac";
import { writeAudit } from "@/lib/audit";
import { toNumber } from "@/lib/money";

const updateSchema = z.object({
  amountPaid: z.number().min(0).optional(),
  notes: z.string().nullish(),
  status: z.enum(["DRAFT", "ORDERED", "CANCELLED"]).optional(),
});

export const GET = handle(async (_req, ctx) => {
  const session = await getSession();
  requireView(session, "suppliers_purchases");
  const { id } = await ctx.params;

  const order = await prisma.purchaseOrder.findUnique({
    where: { id },
    include: {
      supplier: true,
      items: { include: { material: { select: { name: true, purchaseUnit: true, stockUnit: true, conversionFactor: true } } } },
    },
  });
  if (!order) throw NotFound("Purchase order not found");
  return ok({ ...order, creditBalance: toNumber(order.totalAmount) - toNumber(order.amountPaid) });
});

export const PUT = handle(async (req, ctx) => {
  const session = await getSession();
  const actor = requireWrite(session, "suppliers_purchases");
  const { id } = await ctx.params;

  const before = await prisma.purchaseOrder.findUnique({ where: { id } });
  if (!before) throw NotFound("Purchase order not found");
  if (before.status === "RECEIVED") throw new ApiError("A received order can no longer be edited.", 409);

  const input = updateSchema.parse(await req.json().catch(() => ({})));
  const order = await prisma.purchaseOrder.update({
    where: { id },
    data: {
      amountPaid: input.amountPaid,
      notes: input.notes === undefined ? undefined : input.notes,
      status: input.status,
    },
  });
  await writeAudit({ action: "UPDATE", entity: "PurchaseOrder", entityId: id, user: actor, before, after: order });
  return ok(order);
});

export const DELETE = handle(async (_req, ctx) => {
  const session = await getSession();
  const actor = requireWrite(session, "suppliers_purchases");
  const { id } = await ctx.params;

  const before = await prisma.purchaseOrder.findUnique({ where: { id } });
  if (!before) throw NotFound("Purchase order not found");
  // Deleting a received order would leave the added stock orphaned.
  if (before.status === "RECEIVED") throw new ApiError("Cannot delete a received order.", 409);

  await prisma.purchaseOrder.delete({ where: { id } }); // items cascade
  await writeAudit({ action: "DELETE", entity: "PurchaseOrder", entityId: id, user: actor, before });
  return ok({ deleted: true });
});
