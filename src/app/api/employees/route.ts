// /api/employees — list & create
// View: ADMIN/MANAGER/ACCOUNTING. Write: ADMIN/ACCOUNTING.
import { z } from "zod";
import { handle, ok } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { requireView, requireWrite } from "@/lib/rbac";
import { writeAudit } from "@/lib/audit";

const createSchema = z.object({
  name: z.string().min(1),
  position: z.string().nullish(),
  departmentId: z.string().nullish(),
  baseSalary: z.number().min(0).default(0),
  phone: z.string().nullish(),
  isActive: z.boolean().optional(),
});

const include = { department: { select: { id: true, name: true } } } as const;

export const GET = handle(async () => {
  const session = await getSession();
  requireView(session, "expenses_payroll");
  const employees = await prisma.employee.findMany({ include, orderBy: { name: "asc" } });
  return ok(employees);
});

export const POST = handle(async (req) => {
  const session = await getSession();
  const actor = requireWrite(session, "expenses_payroll");
  const input = createSchema.parse(await req.json().catch(() => ({})));

  const employee = await prisma.employee.create({
    data: {
      name: input.name,
      position: input.position ?? null,
      departmentId: input.departmentId ?? null,
      baseSalary: input.baseSalary,
      phone: input.phone ?? null,
      isActive: input.isActive ?? true,
    },
    include,
  });
  await writeAudit({ action: "CREATE", entity: "Employee", entityId: employee.id, user: actor, after: employee });
  return ok(employee, 201);
});
