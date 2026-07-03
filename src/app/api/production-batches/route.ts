// /api/production-batches — list & create batches
// View: production_bom viewers (WORKER own-dept only). Write: ADMIN/MANAGER/WORKER(own dept).
import { z } from "zod";
import { handle, ok, BadRequest, ApiError } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { requireView, requireWrite } from "@/lib/rbac";
import { writeAudit } from "@/lib/audit";
import { Role } from "@/generated/prisma/enums";

const createSchema = z.object({
  productId: z.string().min(1),
  quantityPlanned: z.number().positive(),
  departmentId: z.string().nullish(),
  notes: z.string().nullish(),
});

export const GET = handle(async () => {
  const session = await getSession();
  const user = requireView(session, "production_bom");
  const where = user.role === Role.WORKER ? { departmentId: user.departmentId } : {};
  const batches = await prisma.productionBatch.findMany({
    where,
    include: {
      product: { select: { id: true, name: true, unit: true } },
      department: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
  });
  return ok(batches);
});

export const POST = handle(async (req) => {
  const session = await getSession();
  const actor = requireWrite(session, "production_bom");
  const input = createSchema.parse(await req.json().catch(() => ({})));

  const product = await prisma.product.findUnique({ where: { id: input.productId } });
  if (!product) throw BadRequest("Product not found");

  // WORKERS may only create batches for their own department.
  let departmentId = input.departmentId ?? null;
  if (actor.role === Role.WORKER) {
    if (!actor.departmentId) throw new ApiError("Your account is not assigned to a department.", 403);
    departmentId = actor.departmentId;
  }

  const count = await prisma.productionBatch.count();
  const batchNumber = `BATCH-${String(count + 1).padStart(5, "0")}`;

  const batch = await prisma.productionBatch.create({
    data: {
      batchNumber,
      productId: input.productId,
      quantityPlanned: input.quantityPlanned,
      departmentId,
      notes: input.notes ?? null,
      status: "PLANNED",
      createdById: actor.sub,
    },
    include: { product: { select: { id: true, name: true, unit: true } }, department: { select: { id: true, name: true } } },
  });
  await writeAudit({ action: "CREATE", entity: "ProductionBatch", entityId: batch.id, user: actor, after: batch });
  return ok(batch, 201);
});
