// /api/expenses/[id] — update & delete
import { z } from "zod";
import { handle, ok, NotFound } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { requireWrite } from "@/lib/rbac";
import { writeAudit } from "@/lib/audit";

const updateSchema = z.object({
  categoryId: z.string().min(1).optional(),
  amount: z.number().positive().optional(),
  description: z.string().nullish(),
  departmentId: z.string().nullish(),
  expenseDate: z.string().optional(),
});

const include = { category: { select: { id: true, name: true } }, department: { select: { id: true, name: true } } } as const;

export const PUT = handle(async (req, ctx) => {
  const session = await getSession();
  const actor = requireWrite(session, "expenses_payroll");
  const { id } = await ctx.params;

  const before = await prisma.expense.findUnique({ where: { id }, include });
  if (!before) throw NotFound("Expense not found");

  const input = updateSchema.parse(await req.json().catch(() => ({})));
  const expense = await prisma.expense.update({
    where: { id },
    data: {
      categoryId: input.categoryId,
      amount: input.amount,
      description: input.description === undefined ? undefined : input.description,
      departmentId: input.departmentId === undefined ? undefined : input.departmentId,
      expenseDate: input.expenseDate ? new Date(input.expenseDate) : undefined,
    },
    include,
  });
  await writeAudit({ action: "UPDATE", entity: "Expense", entityId: id, user: actor, before, after: expense });
  return ok(expense);
});

export const DELETE = handle(async (_req, ctx) => {
  const session = await getSession();
  const actor = requireWrite(session, "expenses_payroll");
  const { id } = await ctx.params;

  const before = await prisma.expense.findUnique({ where: { id } });
  if (!before) throw NotFound("Expense not found");

  await prisma.expense.delete({ where: { id } });
  await writeAudit({ action: "DELETE", entity: "Expense", entityId: id, user: actor, before });
  return ok({ deleted: true });
});
