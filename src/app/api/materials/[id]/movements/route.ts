// /api/materials/[id]/movements
// GET  — stock movement history for a material
// POST — record a manual movement: IN (received) or OUT (used) — updates stock.
//        ADMIN anywhere; WORKER only for materials in their own department.
import { z } from "zod";
import { handle, ok, NotFound, ApiError } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { requireView, requireWrite, enforceDepartment } from "@/lib/rbac";
import { writeAudit } from "@/lib/audit";
import { Role } from "@/generated/prisma/enums";

const postSchema = z.object({
  type: z.enum(["IN", "OUT"]),
  quantity: z.number().positive(),
  note: z.string().nullish(),
});

export const GET = handle(async (_req, ctx) => {
  const session = await getSession();
  requireView(session, "materials_inventory");
  const { id } = await ctx.params;
  const movements = await prisma.stockMovement.findMany({
    where: { materialId: id },
    orderBy: { createdAt: "desc" },
    take: 200,
  });
  return ok(movements);
});

export const POST = handle(async (req, ctx) => {
  const session = await getSession();
  const actor = requireWrite(session, "materials_inventory");
  const { id } = await ctx.params;
  const input = postSchema.parse(await req.json().catch(() => ({})));

  const result = await prisma.$transaction(async (tx) => {
    const material = await tx.material.findUnique({ where: { id } });
    if (!material) throw NotFound("Material not found");
    if (actor.role === Role.WORKER) enforceDepartment(actor, "materials_inventory", material.departmentId);

    // Don't allow using more than what is in stock.
    if (input.type === "OUT" && input.quantity > material.currentStock) {
      throw new ApiError(
        `Not enough stock: only ${material.currentStock} ${material.stockUnit} available.`,
        409,
      );
    }

    await tx.material.update({
      where: { id },
      data: {
        currentStock: input.type === "IN" ? { increment: input.quantity } : { decrement: input.quantity },
      },
    });

    return tx.stockMovement.create({
      data: {
        type: input.type,
        quantity: input.quantity,
        materialId: id,
        refType: "Manual",
        note: input.note ?? null,
        userId: actor.sub,
      },
    });
  });

  await writeAudit({
    action: "CREATE",
    entity: "StockMovement",
    entityId: result.id,
    user: actor,
    after: { materialId: id, type: input.type, quantity: input.quantity, note: input.note ?? null },
  });
  return ok(result, 201);
});
