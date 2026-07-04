// POST /api/auth/login — verify credentials and issue a session cookie.
// Two ways to sign in:
//   { userId, password } — role-portal flow: the user picked their role, then
//                          their name; the client sends their user id.
//   { email, password }  — classic email login (fallback).
// Pending accounts (registered but not yet approved) get a special message.
import { z } from "zod";
import { handle, ok, ApiError } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { verifyPassword, signSession, setSessionCookie, type SessionUser } from "@/lib/auth";

const loginSchema = z.union([
  z.object({ userId: z.string().min(1), password: z.string().min(1) }),
  z.object({ email: z.email(), password: z.string().min(1) }),
]);

export const POST = handle(async (req) => {
  const body = await req.json().catch(() => ({}));
  const input = loginSchema.parse(body);

  // Same generic message for bad credentials (don't reveal which accounts exist).
  const invalid = new ApiError("Invalid email or password.", 401);

  const user =
    "userId" in input
      ? await prisma.user.findUnique({ where: { id: input.userId } })
      : await prisma.user.findUnique({ where: { email: input.email.toLowerCase() } });
  if (!user) throw invalid;

  const passwordOk = await verifyPassword(input.password, user.passwordHash);
  if (!passwordOk) throw invalid;

  // Correct password but not yet approved by the Admin -> tell them to wait.
  if (!user.isActive) {
    throw new ApiError("PENDING_APPROVAL", 403);
  }

  const session: SessionUser = {
    sub: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    departmentId: user.departmentId,
  };
  await setSessionCookie(await signSession(session));

  return ok({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    departmentId: user.departmentId,
    mustChangePassword: user.mustChangePassword,
  });
});
