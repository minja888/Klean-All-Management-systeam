// /api/settings/app — company-wide key/value settings (ADMIN only)
import { z } from "zod";
import { handle, ok } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { requireRole } from "@/lib/rbac";
import { writeAudit } from "@/lib/audit";
import { Role } from "@/generated/prisma/enums";

// Sensible defaults used when a setting has never been saved.
const DEFAULTS: Record<string, string> = {
  companyName: "Klean All",
  currency: "TZS",
  lowStockDefault: "10",
  defaultLanguage: "en",
};

const schema = z.object({
  companyName: z.string().min(1).optional(),
  currency: z.string().min(1).optional(),
  lowStockDefault: z.string().optional(),
  defaultLanguage: z.enum(["en", "sw"]).optional(),
});

async function readSettings(): Promise<Record<string, string>> {
  const rows = await prisma.appSetting.findMany();
  const map: Record<string, string> = { ...DEFAULTS };
  for (const row of rows) map[row.key] = row.value;
  return map;
}

export const GET = handle(async () => {
  const session = await getSession();
  requireRole(session, [Role.ADMIN]);
  return ok(await readSettings());
});

export const PUT = handle(async (req) => {
  const session = await getSession();
  const actor = requireRole(session, [Role.ADMIN]);

  const input = schema.parse(await req.json().catch(() => ({})));
  const before = await readSettings();

  // Upsert only the keys that were provided.
  for (const [key, value] of Object.entries(input)) {
    if (value === undefined) continue;
    await prisma.appSetting.upsert({
      where: { key },
      create: { key, value: String(value) },
      update: { value: String(value) },
    });
  }

  const after = await readSettings();
  await writeAudit({ action: "UPDATE", entity: "AppSetting", user: actor, before, after });
  return ok(after);
});
