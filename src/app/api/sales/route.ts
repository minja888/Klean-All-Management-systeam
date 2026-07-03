// /api/sales — list & create sales (POS)
// Access: ADMIN / MANAGER / ACCOUNTING (sales_pos).
import { z } from "zod";
import { handle, ok, BadRequest } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { requireView, requireWrite } from "@/lib/rbac";
import { writeAudit } from "@/lib/audit";
import { toNumber } from "@/lib/money";

const createSchema = z.object({
  customerId: z.string().nullish(),
  amountPaid: z.number().min(0).default(0),
  paymentMethod: z.string().nullish(),
  notes: z.string().nullish(),
  items: z
    .array(z.object({ productId: z.string().min(1), quantity: z.number().positive(), unitPrice: z.number().min(0) }))
    .min(1, "Add at least one item"),
});

export const GET = handle(async (req) => {
  const session = await getSession();
  requireView(session, "sales_pos");

  const url = new URL(req.url);
  const customerId = url.searchParams.get("customerId");

  const sales = await prisma.sale.findMany({
    where: customerId ? { customerId } : {},
    include: { customer: { select: { id: true, name: true } }, _count: { select: { items: true } } },
    orderBy: { saleDate: "desc" },
    take: 500,
  });

  const result = sales.map((s) => ({ ...s, debt: toNumber(s.totalAmount) - toNumber(s.amountPaid) }));
  return ok(result);
});

export const POST = handle(async (req) => {
  const session = await getSession();
  const actor = requireWrite(session, "sales_pos");
  const input = createSchema.parse(await req.json().catch(() => ({})));

  // Validate products exist and build line items.
  const productIds = input.items.map((i) => i.productId);
  const products = await prisma.product.findMany({ where: { id: { in: productIds } } });
  const byId = new Map(products.map((p) => [p.id, p]));
  for (const it of input.items) if (!byId.has(it.productId)) throw BadRequest("Product not found");

  const items = input.items.map((it) => ({
    productId: it.productId,
    quantity: it.quantity,
    unitPrice: it.unitPrice,
    lineTotal: it.quantity * it.unitPrice,
  }));
  const totalAmount = items.reduce((sum, it) => sum + it.lineTotal, 0);

  const sale = await prisma.$transaction(async (tx) => {
    const count = await tx.sale.count();
    const saleNumber = `SALE-${String(count + 1).padStart(5, "0")}`;

    const created = await tx.sale.create({
      data: {
        saleNumber,
        customerId: input.customerId ?? null,
        totalAmount,
        amountPaid: input.amountPaid,
        paymentMethod: input.paymentMethod ?? null,
        notes: input.notes ?? null,
        soldById: actor.sub,
        items: { create: items },
      },
      include: { items: true, customer: { select: { id: true, name: true } } },
    });

    // Decrement finished-goods stock + record OUT movements.
    for (const it of items) {
      await tx.product.update({ where: { id: it.productId }, data: { currentStock: { decrement: it.quantity } } });
      await tx.stockMovement.create({
        data: { type: "OUT", quantity: it.quantity, productId: it.productId, refType: "Sale", refId: created.id, note: created.saleNumber, userId: actor.sub },
      });
    }
    return created;
  });

  await writeAudit({ action: "CREATE", entity: "Sale", entityId: sale.id, user: actor, after: sale });
  return ok(sale, 201);
});
