// GET /api/audit — searchable change history (ADMIN only)
import { handle, ok } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { requireRole } from "@/lib/rbac";
import { Role } from "@/generated/prisma/enums";

export const GET = handle(async (req) => {
  const session = await getSession();
  requireRole(session, [Role.ADMIN]);

  const url = new URL(req.url);
  const entity = url.searchParams.get("entity");
  const userId = url.searchParams.get("userId");
  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");

  const logs = await prisma.auditLog.findMany({
    where: {
      ...(entity ? { entity } : {}),
      ...(userId ? { userId } : {}),
      ...(from || to
        ? { createdAt: { ...(from ? { gte: new Date(from) } : {}), ...(to ? { lte: new Date(to + "T23:59:59") } : {}) } }
        : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 300,
  });
  return ok(logs);
});
