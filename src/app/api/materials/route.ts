// /api/materials — list & create raw materials
// View: ADMIN/MANAGER/ACCOUNTING (all), WORKER (own department only).
// Write: ADMIN only.
import { z } from "zod";
import { handle, ok } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { requireView, requireRole } from "@/lib/rbac";
import { writeAudit } from "@/lib/audit";
import { Role } from "@/generated/prisma/enums";

const materialInclude = { category: { select: { id: true, name: true } }, department: { select: { id: true, name: true } } } as const;

const createSchema = z.object({
  name: z.string().min(1),
  categoryId: z.string().min(1),
  purchaseUnit: z.string().min(1),
  stockUnit: z.string().min(1),
  conversionFactor: z.number().positive(),
  reorderLevel: z.number().min(0).default(0),
  costPrice: z.number().min(0).default(0),
  currentStock: z.number().min(0).optional(),
  departmentId: z.string().nullish(),
});

export const GET = handle(async () => {
  const session = await getSession();
  const user = requireView(session, "materials_inventory");
  // WORKER sees only their own department's materials.
  const where = user.role === Role.WORKER ? { departmentId: user.departmentId } : {};
  const materials = await prisma.material.findMany({ where, include: materialInclude, orderBy: { name: "asc" } });
  return ok(materials);
});

export const POST = handle(async (req) => {
  const session = await getSession();
  const actor = requireRole(session, [Role.ADMIN]);
  const input = createSchema.parse(await req.json().catch(() => ({})));

  const material = await prisma.material.create({
    data: {
      name: input.name,
      categoryId: input.categoryId,
      purchaseUnit: input.purchaseUnit,
      stockUnit: input.stockUnit,
      conversionFactor: input.conversionFactor,
      reorderLevel: input.reorderLevel,
      costPrice: input.costPrice,
      currentStock: input.currentStock ?? 0,
      departmentId: input.departmentId ?? null,
    },
    include: materialInclude,
  });
  await writeAudit({ action: "CREATE", entity: "Material", entityId: material.id, user: actor, after: material });
  return ok(material, 201);
});
