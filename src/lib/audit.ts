// ---------------------------------------------------------------------------
// Audit trail — record every create / update / delete
// ---------------------------------------------------------------------------
// The AuditLog stores DENORMALISED user info (name + email) so the history
// survives even if the user is later deleted. `before`/`after` snapshots let an
// ADMIN see exactly what changed.
// ---------------------------------------------------------------------------

import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";
import type { SessionUser } from "@/lib/auth";

export type AuditAction = "CREATE" | "UPDATE" | "DELETE";

/** Make any value safe to store in a JSON column (Decimals -> numbers, Dates -> ISO). */
function toJson(value: unknown): Prisma.InputJsonValue | undefined {
  if (value === null || value === undefined) return undefined;
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

export async function writeAudit(params: {
  action: AuditAction;
  entity: string;
  entityId?: string | null;
  user: Pick<SessionUser, "sub" | "name" | "email">;
  before?: unknown;
  after?: unknown;
}): Promise<void> {
  await prisma.auditLog.create({
    data: {
      action: params.action,
      entity: params.entity,
      entityId: params.entityId ?? null,
      userId: params.user.sub,
      userName: params.user.name,
      userEmail: params.user.email,
      before: toJson(params.before),
      after: toJson(params.after),
    },
  });
}
