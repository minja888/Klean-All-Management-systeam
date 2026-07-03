// /api/suppliers — list (with credit owed) & create
// View: ADMIN/MANAGER/ACCOUNTING. Write: ADMIN/ACCOUNTING.
import { z } from "zod";
import { handle, ok } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { requireView, requireWrite } from "@/lib/rbac";
import { writeAudit } from "@/lib/audit";
import { toNumber } from "@/lib/money";

const createSchema = z.object({
  name: z.string().min(1),
  phone: z.string().nullish(),
  email: z.string().nullish(),
  address: z.string().nullish(),
});

export const GET = handle(async () => {
  const session = await getSession();
  requireView(session, "suppliers_purchases");

  const suppliers = await prisma.supplier.findMany({
    orderBy: { name: "asc" },
    include: { purchaseOrders: { select: { totalAmount: true, amountPaid: true, status: true } } },
  });

  // Credit owed = unpaid balance of all non-cancelled purchase orders.
  const result = suppliers.map((s) => {
    const creditOwed = s.purchaseOrders
      .filter((po) => po.status !== "CANCELLED")
      .reduce((sum, po) => sum + (toNumber(po.totalAmount) - toNumber(po.amountPaid)), 0);
    const { purchaseOrders, ...rest } = s;
    void purchaseOrders;
    return { ...rest, creditOwed };
  });

  return ok(result);
});

export const POST = handle(async (req) => {
  const session = await getSession();
  const actor = requireWrite(session, "suppliers_purchases");
  const input = createSchema.parse(await req.json().catch(() => ({})));

  const supplier = await prisma.supplier.create({
    data: {
      name: input.name,
      phone: input.phone ?? null,
      email: input.email ?? null,
      address: input.address ?? null,
    },
  });
  await writeAudit({ action: "CREATE", entity: "Supplier", entityId: supplier.id, user: actor, after: supplier });
  return ok(supplier, 201);
});
