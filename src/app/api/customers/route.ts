// /api/customers — list (with outstanding debt) & create
// Access: ADMIN / MANAGER / ACCOUNTING (sales_pos).
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
  requireView(session, "sales_pos");

  const customers = await prisma.customer.findMany({
    orderBy: { name: "asc" },
    include: { sales: { select: { totalAmount: true, amountPaid: true } } },
  });

  const result = customers.map((c) => {
    const debt = c.sales.reduce((sum, s) => sum + (toNumber(s.totalAmount) - toNumber(s.amountPaid)), 0);
    const { sales, ...rest } = c;
    void sales;
    return { ...rest, debt };
  });
  return ok(result);
});

export const POST = handle(async (req) => {
  const session = await getSession();
  const actor = requireWrite(session, "sales_pos");
  const input = createSchema.parse(await req.json().catch(() => ({})));

  const customer = await prisma.customer.create({
    data: { name: input.name, phone: input.phone ?? null, email: input.email ?? null, address: input.address ?? null },
  });
  await writeAudit({ action: "CREATE", entity: "Customer", entityId: customer.id, user: actor, after: customer });
  return ok(customer, 201);
});
