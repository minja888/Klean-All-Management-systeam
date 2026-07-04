// POST /api/auth/register — public self-registration.
// Creates a PENDING account (isActive=false). The person chooses their own
// password + job position; the ADMIN later approves and assigns the access
// role + department in Settings -> Users.
import { z } from "zod";
import { handle, ok, ApiError } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";
import { writeAudit } from "@/lib/audit";

const registerSchema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.email(),
  password: z.string().min(6, "Password must be at least 6 characters"),
  position: z.string().min(1, "Position is required"),
});

export const POST = handle(async (req) => {
  const body = await req.json().catch(() => ({}));
  const input = registerSchema.parse(body);
  const email = input.email.toLowerCase();

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw new ApiError("An account with this email already exists.", 409);

  const user = await prisma.user.create({
    data: {
      name: input.name,
      email,
      passwordHash: await hashPassword(input.password),
      position: input.position,
      role: "WORKER", // provisional; the Admin sets the real access role on approval
      isActive: false, // pending Admin approval
      mustChangePassword: false, // they chose their own password
    },
  });

  await writeAudit({
    action: "CREATE",
    entity: "RegistrationRequest",
    entityId: user.id,
    user: { sub: user.id, name: user.name, email: user.email },
    after: { name: user.name, position: input.position, status: "PENDING" },
  });

  return ok({ pending: true }, 201);
});
