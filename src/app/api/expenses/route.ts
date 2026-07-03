// /api/expenses — list & create expenses
// View: ADMIN/MANAGER/ACCOUNTING. Write: ADMIN/ACCOUNTING.
import { z } from "zod";
import { handle, ok } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { requireView, requireWrite } from "@/lib/rbac";
import { writeAudit } from "@/lib/audit";

const createSchema = z.object({
  categoryId: z.string().min(1),
  amount: z.number().positive(),
  description: z.string().nullish(),
  departmentId: z.string().nullish(),
  expenseDate: z.string().optional(),
});

const include = { category: { select: { id: true, name: true } }, department: { select: { id: true, name: true } } } as const;

export const GET = handle(async () => {
  const session = await getSession();
  requireView(session, "expenses_payroll");
  const expenses = await prisma.expense.findMany({ include, orderBy: { expenseDate: "desc" }, take: 500 });
  return ok(expenses);
});

export const POST = handle(async (req) => {
  const session = await getSession();
  const actor = requireWrite(session, "expenses_payroll");
  const input = createSchema.parse(await req.json().catch(() => ({})));

  const expense = await prisma.expense.create({
    data: {
      categoryId: input.categoryId,
      amount: input.amount,
      description: input.description ?? null,
      departmentId: input.departmentId ?? null,
      expenseDate: input.expenseDate ? new Date(input.expenseDate) : new Date(),
      createdById: actor.sub,
    },
    include,
  });
  await writeAudit({ action: "CREATE", entity: "Expense", entityId: expense.id, user: actor, after: expense });
  return ok(expense, 201);
});
