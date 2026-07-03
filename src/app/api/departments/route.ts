// /api/departments — list & create departments (ADMIN only)
import { z } from "zod";
import { handle, ok, ApiError } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { requireRole, requireUser } from "@/lib/rbac";
import { writeAudit } from "@/lib/audit";
import { Role } from "@/generated/prisma/enums";

const schema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().nullish(),
});

export const GET = handle(async () => {
  const session = await getSession();
  // Any signed-in user may read the department list (needed by many forms);
  // creating/editing/deleting departments stays ADMIN-only.
  requireUser(session);
  const departments = await prisma.department.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { users: true, employees: true } } },
  });
  return ok(departments);
});

export const POST = handle(async (req) => {
  const session = await getSession();
  const actor = requireRole(session, [Role.ADMIN]);
  const input = schema.parse(await req.json().catch(() => ({})));

  const existing = await prisma.department.findUnique({ where: { name: input.name } });
  if (existing) throw new ApiError("A department with this name already exists.", 409);

  const department = await prisma.department.create({
    data: { name: input.name, description: input.description ?? null },
  });
  await writeAudit({ action: "CREATE", entity: "Department", entityId: department.id, user: actor, after: department });
  return ok(department, 201);
});
