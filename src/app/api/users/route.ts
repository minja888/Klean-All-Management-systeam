// /api/users — list & create users (ADMIN only)
import { z } from "zod";
import { handle, ok, ApiError } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { getSession, hashPassword } from "@/lib/auth";
import { requireRole } from "@/lib/rbac";
import { writeAudit } from "@/lib/audit";
import { Role } from "@/generated/prisma/enums";

// Fields we ever expose (never the passwordHash).
const publicUser = {
  id: true,
  name: true,
  email: true,
  role: true,
  position: true,
  mustChangePassword: true,
  isActive: true,
  departmentId: true,
  department: { select: { id: true, name: true } },
  createdAt: true,
} as const;

const createSchema = z
  .object({
    name: z.string().min(1, "Name is required"),
    email: z.email(),
    password: z.string().min(6, "Password must be at least 6 characters"),
    role: z.enum(["ADMIN", "MANAGER", "ACCOUNTING", "WORKER"]),
    position: z.string().nullish(),
    departmentId: z.string().nullish(),
    isActive: z.boolean().optional(),
  })
  .refine((d) => d.role !== "WORKER" || !!d.departmentId, {
    message: "Workers must belong to a department",
    path: ["departmentId"],
  });

export const GET = handle(async () => {
  const session = await getSession();
  requireRole(session, [Role.ADMIN]);

  // Pending (unapproved) registrations first, then newest.
  const users = await prisma.user.findMany({
    select: publicUser,
    orderBy: [{ isActive: "asc" }, { createdAt: "desc" }],
  });
  return ok(users);
});

export const POST = handle(async (req) => {
  const session = await getSession();
  const actor = requireRole(session, [Role.ADMIN]);

  const input = createSchema.parse(await req.json().catch(() => ({})));
  const email = input.email.toLowerCase();

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw new ApiError("A user with this email already exists.", 409);

  const user = await prisma.user.create({
    data: {
      name: input.name,
      email,
      passwordHash: await hashPassword(input.password),
      role: input.role,
      position: input.position ?? null,
      departmentId: input.departmentId ?? null,
      isActive: input.isActive ?? true,
      // Admin set this password -> the person must create their own on first login.
      mustChangePassword: true,
    },
    select: publicUser,
  });

  await writeAudit({ action: "CREATE", entity: "User", entityId: user.id, user: actor, after: user });
  return ok(user, 201);
});
