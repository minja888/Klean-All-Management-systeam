// POST /api/auth/login — verify credentials and issue a session cookie.
import { z } from "zod";
import { handle, ok, ApiError } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { verifyPassword, signSession, setSessionCookie, type SessionUser } from "@/lib/auth";

const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(1, "Password is required"),
});

export const POST = handle(async (req) => {
  const body = await req.json().catch(() => ({}));
  const { email, password } = loginSchema.parse(body);

  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });

  // Same generic message whether the email is unknown or the password is wrong
  // (so we don't reveal which accounts exist).
  const invalid = new ApiError("Invalid email or password.", 401);
  if (!user || !user.isActive) throw invalid;

  const passwordOk = await verifyPassword(password, user.passwordHash);
  if (!passwordOk) throw invalid;

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
  });
});
