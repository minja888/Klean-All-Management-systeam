// /api/employees/[id] — update & delete
import { z } from "zod";
import { handle, ok, NotFound, ApiError } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { requireWrite } from "@/lib/rbac";
import { writeAudit } from "@/lib/audit";

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  position: z.string().nullish(),
  departmentId: z.string().nullish(),
  baseSalary: z.number().min(0).optional(),
  phone: z.string().nullish(),
  isActive: z.boolean().optional(),
});

const include = { department: { select: { id: true, name: true } } } as const;

export const PUT = handle(async (req, ctx) => {
  const session = await getSession();
  const actor = requireWrite(session, "expenses_payroll");
  const { id } = await ctx.params;

  const before = await prisma.employee.findUnique({ where: { id }, include });
  if (!before) throw NotFound("Employee not found");

  const input = updateSchema.parse(await req.json().catch(() => ({})));
  const employee = await prisma.employee.update({
    where: { id },
    data: {
      name: input.name,
      position: input.position === undefined ? undefined : input.position,
      departmentId: input.departmentId === undefined ? undefined : input.departmentId,
      baseSalary: input.baseSalary,
      phone: input.phone === undefined ? undefined : input.phone,
      isActive: input.isActive,
    },
    include,
  });
  await writeAudit({ action: "UPDATE", entity: "Employee", entityId: id, user: actor, before, after: employee });
  return ok(employee);
});

export const DELETE = handle(async (_req, ctx) => {
  const session = await getSession();
  const actor = requireWrite(session, "expenses_payroll");
  const { id } = await ctx.params;

  const before = await prisma.employee.findUnique({ where: { id } });
  if (!before) throw NotFound("Employee not found");

  try {
    await prisma.employee.delete({ where: { id } });
  } catch {
    throw new ApiError("Cannot delete: this employee appears in payroll runs.", 409);
  }
  await writeAudit({ action: "DELETE", entity: "Employee", entityId: id, user: actor, before });
  return ok({ deleted: true });
});
