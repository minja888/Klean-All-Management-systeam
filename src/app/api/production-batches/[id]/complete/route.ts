// POST /api/production-batches/[id]/complete
// Consumes materials (ProductionUsage) and produces finished goods.
// Material usage defaults from the product's BOM but can be overridden.
import { z } from "zod";
import { handle, ok, NotFound, ApiError } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { requireWrite, enforceDepartment } from "@/lib/rbac";
import { writeAudit } from "@/lib/audit";

const completeSchema = z.object({
  quantityProduced: z.number().positive().optional(),
  wasteQuantity: z.number().min(0).optional(),
  // Optional override of material usage; if omitted we compute from the BOM.
  usages: z.array(z.object({ materialId: z.string().min(1), quantityUsed: z.number().min(0) })).optional(),
});

export const POST = handle(async (req, ctx) => {
  const session = await getSession();
  const actor = requireWrite(session, "production_bom");
  const { id } = await ctx.params;
  const input = completeSchema.parse(await req.json().catch(() => ({})));

  const result = await prisma.$transaction(async (tx) => {
    const batch = await tx.productionBatch.findUnique({
      where: { id },
      include: { product: { include: { bomItems: true } } },
    });
    if (!batch) throw NotFound("Batch not found");
    enforceDepartment(actor, "production_bom", batch.departmentId);
    if (batch.status === "COMPLETED") throw new ApiError("This batch is already completed.", 409);
    if (batch.status === "CANCELLED") throw new ApiError("A cancelled batch cannot be completed.", 409);

    const quantityProduced = input.quantityProduced ?? batch.quantityPlanned;
    const waste = input.wasteQuantity ?? 0;

    // Decide material usage: explicit override, else BOM x quantityProduced.
    const usages =
      input.usages ??
      batch.product.bomItems.map((b) => ({
        materialId: b.materialId,
        quantityUsed: b.quantityPerUnit * quantityProduced,
      }));

    // Consume raw materials.
    for (const u of usages) {
      if (u.quantityUsed <= 0) continue;
      await tx.productionUsage.create({
        data: { productionBatchId: id, materialId: u.materialId, quantityUsed: u.quantityUsed },
      });
      await tx.material.update({
        where: { id: u.materialId },
        data: { currentStock: { decrement: u.quantityUsed } },
      });
      await tx.stockMovement.create({
        data: {
          type: "OUT",
          quantity: u.quantityUsed,
          materialId: u.materialId,
          refType: "ProductionBatch",
          refId: id,
          note: `Consumed by ${batch.batchNumber}`,
          userId: actor.sub,
        },
      });
    }

    // Produce finished goods.
    await tx.product.update({
      where: { id: batch.productId },
      data: { currentStock: { increment: quantityProduced } },
    });
    await tx.stockMovement.create({
      data: {
        type: "IN",
        quantity: quantityProduced,
        productId: batch.productId,
        refType: "ProductionBatch",
        refId: id,
        note: `Produced by ${batch.batchNumber}`,
        userId: actor.sub,
      },
    });

    // Record waste as a WASTE movement against the product (informational).
    if (waste > 0) {
      await tx.stockMovement.create({
        data: { type: "WASTE", quantity: waste, productId: batch.productId, refType: "ProductionBatch", refId: id, userId: actor.sub },
      });
    }

    return tx.productionBatch.update({
      where: { id },
      data: { status: "COMPLETED", quantityProduced, wasteQuantity: waste, completedAt: new Date() },
      include: { product: true, usages: true },
    });
  });

  await writeAudit({ action: "UPDATE", entity: "ProductionBatch", entityId: id, user: actor, after: { status: "COMPLETED" } });
  return ok(result);
});
