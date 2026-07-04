// POST /api/auth/forgot-password — public.
// Records a reset request that the ADMIN sees (as a pending banner on the
// Users page). The Admin then sets a temporary password for the person, who is
// forced to create their own on next login. No emails are sent.
import { z } from "zod";
import { handle, ok } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { writeAudit } from "@/lib/audit";

const schema = z.object({ email: z.email() });

export const POST = handle(async (req) => {
  const { email } = schema.parse(await req.json().catch(() => ({})));
  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });

  // Always answer the same way (don't reveal whether the email exists) —
  // but only record a request for real accounts.
  if (user) {
    await writeAudit({
      action: "CREATE",
      entity: "PasswordResetRequest",
      entityId: user.id,
      user: { sub: user.id, name: user.name, email: user.email },
      after: { requestedAt: new Date().toISOString() },
    });
  }
  return ok({ received: true });
});
