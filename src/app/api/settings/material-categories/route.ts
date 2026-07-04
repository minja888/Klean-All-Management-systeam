// /api/settings/material-categories — list & create (ADMIN only)
import { z } from "zod";
import { handle, ok, ApiError } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { requireRole, requireUser } from "@/lib/rbac";
import { writeAudit } from "@/lib/audit";
import { Role } from "@/generated/prisma/enums";

const schema = z.object({ name: z.string().min(1, "Name is required") });

export const GET = handle(async () => {
  const session = await getSession();
  // Any signed-in user may read categories (needed by the material form);
  // create/edit/delete stays ADMIN-only.
  requireUser(session);
  const rows = await prisma.materialCategory.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { materials: true } } },
  });
  return ok(rows);
});

export const POST = handle(async (req) => {
  const session = await getSession();
  const actor = requireRole(session, [Role.ADMIN]);
  const { name } = schema.parse(await req.json().catch(() => ({})));

  const existing = await prisma.materialCategory.findUnique({ where: { name } });
  if (existing) throw new ApiError("This category already exists.", 409);

  const row = await prisma.materialCategory.create({ data: { name } });
  await writeAudit({ action: "CREATE", entity: "MaterialCategory", entityId: row.id, user: actor, after: row });
  return ok(row, 201);
});
