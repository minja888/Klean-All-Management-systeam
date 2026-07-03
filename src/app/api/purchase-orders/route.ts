// /api/purchase-orders — list (with filters) & create a purchase order
// View: ADMIN/MANAGER/ACCOUNTING. Write: ADMIN/ACCOUNTING.
import { z } from "zod";
import { handle, ok, BadRequest } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { requireView, requireWrite } from "@/lib/rbac";
import { writeAudit } from "@/lib/audit";
import { toNumber } from "@/lib/money";
import { OrderStatus } from "@/generated/prisma/enums";

const createSchema = z.object({
  supplierId: z.string().min(1),
  orderDate: z.string().optional(),
  amountPaid: z.number().min(0).default(0),
  notes: z.string().nullish(),
  status: z.enum(["DRAFT", "ORDERED"]).default("DRAFT"),
  items: z
    .array(
      z.object({
        materialId: z.string().min(1),
        quantity: z.number().positive(),
        unitPrice: z.number().min(0),
      }),
    )
    .min(1, "Add at least one line item"),
});

export const GET = handle(async (req) => {
  const session = await getSession();
  requireView(session, "suppliers_purchases");

  const url = new URL(req.url);
  const status = url.searchParams.get("status");
  const supplierId = url.searchParams.get("supplierId");

  const orders = await prisma.purchaseOrder.findMany({
    where: {
      ...(status ? { status: status as OrderStatus } : {}),
      ...(supplierId ? { supplierId } : {}),
    },
    include: { supplier: { select: { id: true, name: true } }, _count: { select: { items: true } } },
    orderBy: { orderDate: "desc" },
  });

  const result = orders.map((o) => ({
    ...o,
    creditBalance: toNumber(o.totalAmount) - toNumber(o.amountPaid),
  }));
  return ok(result);
});

export const POST = handle(async (req) => {
  const session = await getSession();
  const actor = requireWrite(session, "suppliers_purchases");
  const input = createSchema.parse(await req.json().catch(() => ({})));

  const supplier = await prisma.supplier.findUnique({ where: { id: input.supplierId } });
  if (!supplier) throw BadRequest("Supplier not found");

  // Compute line totals + order total.
  const items = input.items.map((it) => ({
    materialId: it.materialId,
    quantity: it.quantity,
    unitPrice: it.unitPrice,
    lineTotal: it.quantity * it.unitPrice,
  }));
  const totalAmount = items.reduce((sum, it) => sum + it.lineTotal, 0);

  // Human-friendly sequential order number.
  const count = await prisma.purchaseOrder.count();
  const orderNumber = `PO-${String(count + 1).padStart(5, "0")}`;

  const order = await prisma.purchaseOrder.create({
    data: {
      orderNumber,
      supplierId: input.supplierId,
      status: input.status,
      orderDate: input.orderDate ? new Date(input.orderDate) : new Date(),
      totalAmount,
      amountPaid: input.amountPaid,
      notes: input.notes ?? null,
      createdById: actor.sub,
      items: { create: items },
    },
    include: { supplier: { select: { id: true, name: true } }, items: true },
  });

  await writeAudit({ action: "CREATE", entity: "PurchaseOrder", entityId: order.id, user: actor, after: order });
  return ok(order, 201);
});
