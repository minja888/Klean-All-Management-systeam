// /api/products/[id]/bom — read & replace a product's Bill of Materials
import { z } from "zod";
import { handle, ok, NotFound, BadRequest } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { requireView, requireRole } from "@/lib/rbac";
import { writeAudit } from "@/lib/audit";
import { Role } from "@/generated/prisma/enums";

const putSchema = z.object({
  items: z.array(
    z.object({
      materialId: z.string().min(1),
      quantityPerUnit: z.number().positive(),
    }),
  ),
});

export const GET = handle(async (_req, ctx) => {
  const session = await getSession();
  requireView(session, "production_bom");
  const { id } = await ctx.params;
  const items = await prisma.bomItem.findMany({
    where: { productId: id },
    include: { material: { select: { id: true, name: true, stockUnit: true } } },
  });
  return ok(items);
});

export const PUT = handle(async (req, ctx) => {
  const session = await getSession();
  const actor = requireRole(session, [Role.ADMIN, Role.MANAGER]);
  const { id } = await ctx.params;

  const product = await prisma.product.findUnique({ where: { id } });
  if (!product) throw NotFound("Product not found");

  const { items } = putSchema.parse(await req.json().catch(() => ({})));

  // Reject duplicate materials in the same BOM.
  const seen = new Set<string>();
  for (const it of items) {
    if (seen.has(it.materialId)) throw BadRequest("A material appears twice in the BOM.");
    seen.add(it.materialId);
  }

  // Replace the whole BOM atomically.
  const result = await prisma.$transaction(async (tx) => {
    await tx.bomItem.deleteMany({ where: { productId: id } });
    if (items.length > 0) {
      await tx.bomItem.createMany({
        data: items.map((it) => ({ productId: id, materialId: it.materialId, quantityPerUnit: it.quantityPerUnit })),
      });
    }
    return tx.bomItem.findMany({
      where: { productId: id },
      include: { material: { select: { id: true, name: true, stockUnit: true } } },
    });
  });

  await writeAudit({ action: "UPDATE", entity: "ProductBOM", entityId: id, user: actor, after: { count: result.length } });
  return ok(result);
});
