// /api/suppliers/[id] — update & delete
import { z } from "zod";
import { handle, ok, NotFound, ApiError } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { requireWrite } from "@/lib/rbac";
import { writeAudit } from "@/lib/audit";

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  phone: z.string().nullish(),
  email: z.string().nullish(),
  address: z.string().nullish(),
});

export const PUT = handle(async (req, ctx) => {
  const session = await getSession();
  const actor = requireWrite(session, "suppliers_purchases");
  const { id } = await ctx.params;

  const before = await prisma.supplier.findUnique({ where: { id } });
  if (!before) throw NotFound("Supplier not found");

  const input = updateSchema.parse(await req.json().catch(() => ({})));
  const supplier = await prisma.supplier.update({
    where: { id },
    data: {
      name: input.name,
      phone: input.phone === undefined ? undefined : input.phone,
      email: input.email === undefined ? undefined : input.email,
      address: input.address === undefined ? undefined : input.address,
    },
  });
  await writeAudit({ action: "UPDATE", entity: "Supplier", entityId: id, user: actor, before, after: supplier });
  return ok(supplier);
});

export const DELETE = handle(async (_req, ctx) => {
  const session = await getSession();
  const actor = requireWrite(session, "suppliers_purchases");
  const { id } = await ctx.params;

  const before = await prisma.supplier.findUnique({ where: { id } });
  if (!before) throw NotFound("Supplier not found");

  try {
    await prisma.supplier.delete({ where: { id } });
  } catch {
    throw new ApiError("Cannot delete: this supplier has purchase orders.", 409);
  }
  await writeAudit({ action: "DELETE", entity: "Supplier", entityId: id, user: actor, before });
  return ok({ deleted: true });
});
