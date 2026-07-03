// POST /api/payroll-runs/[id]/pay — APPROVED -> PAID
import { handle, ok, NotFound, ApiError } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { requireWrite } from "@/lib/rbac";
import { writeAudit } from "@/lib/audit";

export const POST = handle(async (_req, ctx) => {
  const session = await getSession();
  const actor = requireWrite(session, "expenses_payroll");
  const { id } = await ctx.params;

  const run = await prisma.payrollRun.findUnique({ where: { id } });
  if (!run) throw NotFound("Payroll run not found");
  if (run.status !== "APPROVED") throw new ApiError("Only an approved run can be marked paid.", 409);

  const updated = await prisma.payrollRun.update({ where: { id }, data: { status: "PAID", paidAt: new Date() } });
  await writeAudit({ action: "UPDATE", entity: "PayrollRun", entityId: id, user: actor, after: { status: "PAID" } });
  return ok(updated);
});
