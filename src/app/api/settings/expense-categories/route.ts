// /api/settings/expense-categories — list & create (ADMIN only)
import { z } from "zod";
import { handle, ok, ApiError } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { requireRole } from "@/lib/rbac";
import { writeAudit } from "@/lib/audit";
import { Role } from "@/generated/prisma/enums";

const schema = z.object({ name: z.string().min(1, "Name is required") });

export const GET = handle(async () => {
  const session = await getSession();
  requireRole(session, [Role.ADMIN]);
  const rows = await prisma.expenseCategory.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { expenses: true } } },
  });
  return ok(rows);
});

export const POST = handle(async (req) => {
  const session = await getSession();
  const actor = requireRole(session, [Role.ADMIN]);
  const { name } = schema.parse(await req.json().catch(() => ({})));

  const existing = await prisma.expenseCategory.findUnique({ where: { name } });
  if (existing) throw new ApiError("This category already exists.", 409);

  const row = await prisma.expenseCategory.create({ data: { name } });
  await writeAudit({ action: "CREATE", entity: "ExpenseCategory", entityId: row.id, user: actor, after: row });
  return ok(row, 201);
});
