// /api/materials/[id] — get, update, delete a material
import { z } from "zod";
import { handle, ok, NotFound, ApiError } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { requireView, requireRole } from "@/lib/rbac";
import { writeAudit } from "@/lib/audit";
import { Role } from "@/generated/prisma/enums";

const materialInclude = { category: { select: { id: true, name: true } }, department: { select: { id: true, name: true } } } as const;

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  categoryId: z.string().min(1).optional(),
  purchaseUnit: z.string().min(1).optional(),
  stockUnit: z.string().min(1).optional(),
  conversionFactor: z.number().positive().optional(),
  reorderLevel: z.number().min(0).optional(),
  costPrice: z.number().min(0).optional(),
  currentStock: z.number().min(0).optional(),
  departmentId: z.string().nullish(),
});

export const GET = handle(async (_req, ctx) => {
  const session = await getSession();
  requireView(session, "materials_inventory");
  const { id } = await ctx.params;
  const material = await prisma.material.findUnique({ where: { id }, include: materialInclude });
  if (!material) throw NotFound("Material not found");
  return ok(material);
});

export const PUT = handle(async (req, ctx) => {
  const session = await getSession();
  const actor = requireRole(session, [Role.ADMIN]);
  const { id } = await ctx.params;

  const before = await prisma.material.findUnique({ where: { id }, include: materialInclude });
  if (!before) throw NotFound("Material not found");

  const input = updateSchema.parse(await req.json().catch(() => ({})));
  const material = await prisma.material.update({
    where: { id },
    data: {
      name: input.name,
      categoryId: input.categoryId,
      purchaseUnit: input.purchaseUnit,
      stockUnit: input.stockUnit,
      conversionFactor: input.conversionFactor,
      reorderLevel: input.reorderLevel,
      costPrice: input.costPrice,
      currentStock: input.currentStock,
      departmentId: input.departmentId === undefined ? undefined : input.departmentId,
    },
    include: materialInclude,
  });
  await writeAudit({ action: "UPDATE", entity: "Material", entityId: id, user: actor, before, after: material });
  return ok(material);
});

export const DELETE = handle(async (_req, ctx) => {
  const session = await getSession();
  const actor = requireRole(session, [Role.ADMIN]);
  const { id } = await ctx.params;

  const before = await prisma.material.findUnique({ where: { id } });
  if (!before) throw NotFound("Material not found");

  try {
    await prisma.material.delete({ where: { id } });
  } catch {
    // Restrict relations (purchase items, BOM, usage) block deletion.
    throw new ApiError("Cannot delete: this material is used in purchases, BOM or production.", 409);
  }
  await writeAudit({ action: "DELETE", entity: "Material", entityId: id, user: actor, before });
  return ok({ deleted: true });
});
