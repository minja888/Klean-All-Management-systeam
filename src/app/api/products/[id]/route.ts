// /api/products/[id] — get, update, delete a product
import { z } from "zod";
import { handle, ok, NotFound, ApiError } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { requireView, requireRole } from "@/lib/rbac";
import { writeAudit } from "@/lib/audit";
import { Role } from "@/generated/prisma/enums";

const updateSchema = z.object({
  sku: z.string().min(1).optional(),
  name: z.string().min(1).optional(),
  unit: z.string().min(1).optional(),
  sellingPrice: z.number().min(0).optional(),
  reorderLevel: z.number().min(0).optional(),
});

export const GET = handle(async (_req, ctx) => {
  const session = await getSession();
  requireView(session, "production_bom");
  const { id } = await ctx.params;
  const product = await prisma.product.findUnique({
    where: { id },
    include: { bomItems: { include: { material: { select: { name: true, stockUnit: true } } } } },
  });
  if (!product) throw NotFound("Product not found");
  return ok(product);
});

export const PUT = handle(async (req, ctx) => {
  const session = await getSession();
  const actor = requireRole(session, [Role.ADMIN, Role.MANAGER]);
  const { id } = await ctx.params;

  const before = await prisma.product.findUnique({ where: { id } });
  if (!before) throw NotFound("Product not found");

  const input = updateSchema.parse(await req.json().catch(() => ({})));
  if (input.sku && input.sku !== before.sku) {
    const clash = await prisma.product.findUnique({ where: { sku: input.sku } });
    if (clash) throw new ApiError("A product with this SKU already exists.", 409);
  }

  const product = await prisma.product.update({ where: { id }, data: input });
  await writeAudit({ action: "UPDATE", entity: "Product", entityId: id, user: actor, before, after: product });
  return ok(product);
});

export const DELETE = handle(async (_req, ctx) => {
  const session = await getSession();
  const actor = requireRole(session, [Role.ADMIN, Role.MANAGER]);
  const { id } = await ctx.params;

  const before = await prisma.product.findUnique({ where: { id } });
  if (!before) throw NotFound("Product not found");

  try {
    await prisma.product.delete({ where: { id } }); // BOM cascades; batches/sales restrict
  } catch {
    throw new ApiError("Cannot delete: this product has production batches or sales.", 409);
  }
  await writeAudit({ action: "DELETE", entity: "Product", entityId: id, user: actor, before });
  return ok({ deleted: true });
});
