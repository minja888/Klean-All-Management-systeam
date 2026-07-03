// POST /api/purchase-orders/[id]/receive
// Marks a PO RECEIVED and adds stock — converting purchaseUnit -> stockUnit.
import { handle, ok, NotFound, ApiError } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { requireWrite } from "@/lib/rbac";
import { writeAudit } from "@/lib/audit";
import { toNumber } from "@/lib/money";

export const POST = handle(async (_req, ctx) => {
  const session = await getSession();
  const actor = requireWrite(session, "suppliers_purchases");
  const { id } = await ctx.params;

  const result = await prisma.$transaction(async (tx) => {
    const order = await tx.purchaseOrder.findUnique({
      where: { id },
      include: { items: { include: { material: true } } },
    });
    if (!order) throw NotFound("Purchase order not found");
    if (order.status === "RECEIVED") throw new ApiError("This order has already been received.", 409);
    if (order.status === "CANCELLED") throw new ApiError("A cancelled order cannot be received.", 409);

    for (const item of order.items) {
      const factor = item.material.conversionFactor || 1;
      const stockQty = item.quantity * factor; // purchaseUnit -> stockUnit
      const unitCostPerStock = toNumber(item.unitPrice) / factor; // cost per stockUnit

      await tx.material.update({
        where: { id: item.materialId },
        data: {
          currentStock: { increment: stockQty },
          costPrice: unitCostPerStock, // keep latest known cost for COGS
        },
      });

      await tx.stockMovement.create({
        data: {
          type: "IN",
          quantity: stockQty,
          materialId: item.materialId,
          refType: "PurchaseOrder",
          refId: order.id,
          note: `Received ${item.quantity} ${item.material.purchaseUnit} of ${item.material.name}`,
          userId: actor.sub,
        },
      });
    }

    return tx.purchaseOrder.update({
      where: { id },
      data: { status: "RECEIVED", receivedDate: new Date() },
      include: { items: true },
    });
  });

  await writeAudit({
    action: "UPDATE",
    entity: "PurchaseOrder",
    entityId: id,
    user: actor,
    after: { status: "RECEIVED" },
  });
  return ok(result);
});
