// GET /api/auth/me — return the current signed-in user + role + department.
import { handle, ok, Unauthorized } from "@/lib/api";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const GET = handle(async () => {
  const session = await getSession();
  if (!session) throw Unauthorized();

  const department = session.departmentId
    ? await prisma.department.findUnique({
        where: { id: session.departmentId },
        select: { id: true, name: true },
      })
    : null;

  return ok({
    id: session.sub,
    name: session.name,
    email: session.email,
    role: session.role,
    departmentId: session.departmentId,
    department,
  });
});
