// /api/products — list & create finished goods
// View: everyone with production_bom access. Write: ADMIN / MANAGER.
import { z } from "zod";
import { handle, ok, ApiError } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { requireView, requireRole } from "@/lib/rbac";
import { writeAudit } from "@/lib/audit";
import { Role } from "@/generated/prisma/enums";

const createSchema = z.object({
  sku: z.string().min(1),
  name: z.string().min(1),
  unit: z.string().min(1).default("piece"),
  sellingPrice: z.number().min(0).default(0),
  reorderLevel: z.number().min(0).default(0),
});

export const GET = handle(async () => {
  const session = await getSession();
  requireView(session, "production_bom");
  const products = await prisma.product.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { bomItems: true } } },
  });
  return ok(products);
});

export const POST = handle(async (req) => {
  const session = await getSession();
  const actor = requireRole(session, [Role.ADMIN, Role.MANAGER]);
  const input = createSchema.parse(await req.json().catch(() => ({})));

  const existing = await prisma.product.findUnique({ where: { sku: input.sku } });
  if (existing) throw new ApiError("A product with this SKU already exists.", 409);

  const product = await prisma.product.create({
    data: {
      sku: input.sku,
      name: input.name,
      unit: input.unit,
      sellingPrice: input.sellingPrice,
      reorderLevel: input.reorderLevel,
    },
  });
  await writeAudit({ action: "CREATE", entity: "Product", entityId: product.id, user: actor, after: product });
  return ok(product, 201);
});
