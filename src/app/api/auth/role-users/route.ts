// GET /api/auth/role-users?role=WORKER — public: active users for the login
// screen's role picker. The email is shown (read-only) once a name is chosen,
// so people can confirm they picked the right account.
import { z } from "zod";
import { handle, ok } from "@/lib/api";
import { prisma } from "@/lib/prisma";

const schema = z.enum(["ADMIN", "MANAGER", "ACCOUNTING", "WORKER"]);

export const GET = handle(async (req) => {
  const url = new URL(req.url);
  const parsed = schema.safeParse(url.searchParams.get("role"));
  if (!parsed.success) return ok([]);

  const users = await prisma.user.findMany({
    where: { role: parsed.data, isActive: true },
    select: { id: true, name: true, email: true },
    orderBy: { name: "asc" },
  });
  return ok(users);
});
