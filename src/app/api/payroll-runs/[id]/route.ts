// /api/payroll-runs/[id] — get, edit items, delete
import { z } from "zod";
import { handle, ok, NotFound, ApiError } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { requireView, requireWrite } from "@/lib/rbac";
import { writeAudit } from "@/lib/audit";
import { toNumber } from "@/lib/money";

const itemInclude = { items: { include: { employee: { select: { name: true, position: true } } } } } as const;

const putSchema = z.object({
  items: z.array(
    z.object({
      id: z.string().min(1),
      bonus: z.number().min(0).default(0),
      foodAllowance: z.number().min(0).default(0),
      transportAllowance: z.number().min(0).default(0),
      deductions: z.number().min(0).default(0),
    }),
  ),
});

export const GET = handle(async (_req, ctx) => {
  const session = await getSession();
  requireView(session, "expenses_payroll");
  const { id } = await ctx.params;
  const run = await prisma.payrollRun.findUnique({ where: { id }, include: itemInclude });
  if (!run) throw NotFound("Payroll run not found");
  return ok(run);
});

export const PUT = handle(async (req, ctx) => {
  const session = await getSession();
  const actor = requireWrite(session, "expenses_payroll");
  const { id } = await ctx.params;

  const run = await prisma.payrollRun.findUnique({ where: { id }, include: { items: true } });
  if (!run) throw NotFound("Payroll run not found");
  if (run.status !== "DRAFT") throw new ApiError("Only draft runs can be edited.", 409);

  const { items } = putSchema.parse(await req.json().catch(() => ({})));
  const byId = new Map(run.items.map((i) => [i.id, i]));

  const updated = await prisma.$transaction(async (tx) => {
    let totalNet = 0;
    for (const patch of items) {
      const item = byId.get(patch.id);
      if (!item) continue;
      const base = toNumber(item.baseSalary);
      const netPay = base + patch.bonus + patch.foodAllowance + patch.transportAllowance - patch.deductions;
      totalNet += netPay;
      await tx.payrollItem.update({
        where: { id: patch.id },
        data: {
          bonus: patch.bonus,
          foodAllowance: patch.foodAllowance,
          transportAllowance: patch.transportAllowance,
          deductions: patch.deductions,
          netPay,
        },
      });
    }
    return tx.payrollRun.update({ where: { id }, data: { totalNet }, include: itemInclude });
  });

  await writeAudit({ action: "UPDATE", entity: "PayrollRun", entityId: id, user: actor, after: { totalNet: updated.totalNet } });
  return ok(updated);
});

export const DELETE = handle(async (_req, ctx) => {
  const session = await getSession();
  const actor = requireWrite(session, "expenses_payroll");
  const { id } = await ctx.params;

  const before = await prisma.payrollRun.findUnique({ where: { id } });
  if (!before) throw NotFound("Payroll run not found");
  if (before.status === "PAID") throw new ApiError("A paid payroll run cannot be deleted.", 409);

  await prisma.payrollRun.delete({ where: { id } }); // items cascade
  await writeAudit({ action: "DELETE", entity: "PayrollRun", entityId: id, user: actor, before });
  return ok({ deleted: true });
});
