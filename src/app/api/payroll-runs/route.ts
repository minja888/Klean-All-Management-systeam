// /api/payroll-runs — list & create a monthly payroll run
// View: ADMIN/MANAGER/ACCOUNTING. Write: ADMIN/ACCOUNTING.
import { z } from "zod";
import { handle, ok, ApiError } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { requireView, requireWrite } from "@/lib/rbac";
import { writeAudit } from "@/lib/audit";
import { toNumber } from "@/lib/money";

const createSchema = z.object({
  periodYear: z.number().int().min(2000).max(2100),
  periodMonth: z.number().int().min(1).max(12),
});

export const GET = handle(async () => {
  const session = await getSession();
  requireView(session, "expenses_payroll");
  const runs = await prisma.payrollRun.findMany({
    orderBy: [{ periodYear: "desc" }, { periodMonth: "desc" }],
    include: { _count: { select: { items: true } } },
  });
  return ok(runs);
});

export const POST = handle(async (req) => {
  const session = await getSession();
  const actor = requireWrite(session, "expenses_payroll");
  const input = createSchema.parse(await req.json().catch(() => ({})));

  const existing = await prisma.payrollRun.findUnique({
    where: { periodYear_periodMonth: { periodYear: input.periodYear, periodMonth: input.periodMonth } },
  });
  if (existing) throw new ApiError("A payroll run for this month already exists.", 409);

  // Seed one item per active employee (netPay starts at base salary).
  const employees = await prisma.employee.findMany({ where: { isActive: true } });
  const totalNet = employees.reduce((sum, e) => sum + toNumber(e.baseSalary), 0);

  const run = await prisma.payrollRun.create({
    data: {
      periodYear: input.periodYear,
      periodMonth: input.periodMonth,
      status: "DRAFT",
      totalNet,
      createdById: actor.sub,
      items: {
        create: employees.map((e) => ({
          employeeId: e.id,
          baseSalary: e.baseSalary,
          netPay: e.baseSalary, // = base + 0 bonuses - 0 deductions
        })),
      },
    },
    include: { _count: { select: { items: true } } },
  });

  await writeAudit({ action: "CREATE", entity: "PayrollRun", entityId: run.id, user: actor, after: run });
  return ok(run, 201);
});
