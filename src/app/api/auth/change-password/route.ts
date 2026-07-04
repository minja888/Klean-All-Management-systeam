// POST /api/auth/change-password — signed-in user sets a new password.
import { z } from "zod";
import { handle, ok, ApiError } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { getSession, verifyPassword, hashPassword } from "@/lib/auth";
import { requireUser } from "@/lib/rbac";
import { writeAudit } from "@/lib/audit";

const schema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(6, "New password must be at least 6 characters"),
});

export const POST = handle(async (req) => {
  const session = await getSession();
  const actor = requireUser(session);
  const input = schema.parse(await req.json().catch(() => ({})));

  const user = await prisma.user.findUnique({ where: { id: actor.sub } });
  if (!user) throw new ApiError("Account not found.", 404);

  const okPw = await verifyPassword(input.currentPassword, user.passwordHash);
  if (!okPw) throw new ApiError("Current password is incorrect.", 401);

  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: await hashPassword(input.newPassword), mustChangePassword: false },
  });

  await writeAudit({
    action: "UPDATE",
    entity: "UserPassword",
    entityId: user.id,
    user: actor,
    after: { changedOwnPassword: true },
  });
  return ok({ changed: true });
});
