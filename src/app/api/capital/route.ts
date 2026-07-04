// /api/capital — capital, loans and drawings (QuickBooks-style equity tracking)
// Access: ADMIN + ACCOUNTING (payments_accounting).
//
// Summary:
//   capital        = SUM(CAPITAL) - SUM(DRAWING)         (owner's money in the business)
//   loansOutstanding = SUM(LOAN) - SUM(LOAN_REPAYMENT)   (money owed to outsiders)
import { z } from "zod";
import { handle, ok } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { requireView, requireWrite } from "@/lib/rbac";
import { writeAudit } from "@/lib/audit";
import { toNumber } from "@/lib/money";

const createSchema = z.object({
  type: z.enum(["CAPITAL", "LOAN", "LOAN_REPAYMENT", "DRAWING"]),
  amount: z.number().positive(),
  partyName: z.string().nullish(),
  partyInfo: z.string().nullish(),
  description: z.string().nullish(),
  entryDate: z.string().optional(),
});

export const GET = handle(async () => {
  const session = await getSession();
  requireView(session, "payments_accounting");

  const entries = await prisma.capitalEntry.findMany({ orderBy: { entryDate: "desc" }, take: 500 });

  let capitalIn = 0, drawings = 0, loansIn = 0, loanRepayments = 0;
  // Creditors — outstanding balance per lender name.
  const creditors = new Map<string, { name: string; info: string | null; outstanding: number }>();
  for (const e of entries) {
    const amt = toNumber(e.amount);
    if (e.type === "CAPITAL") capitalIn += amt;
    else if (e.type === "DRAWING") drawings += amt;
    else if (e.type === "LOAN" || e.type === "LOAN_REPAYMENT") {
      if (e.type === "LOAN") loansIn += amt; else loanRepayments += amt;
      const key = (e.partyName ?? "").trim() || "—";
      const c = creditors.get(key) ?? { name: key, info: e.partyInfo ?? null, outstanding: 0 };
      c.outstanding += e.type === "LOAN" ? amt : -amt;
      if (!c.info && e.partyInfo) c.info = e.partyInfo;
      creditors.set(key, c);
    }
  }

  return ok({
    entries,
    creditors: [...creditors.values()].filter((c) => Math.abs(c.outstanding) > 0.0001),
    summary: {
      capitalIn,
      drawings,
      capital: capitalIn - drawings,
      loansIn,
      loanRepayments,
      loansOutstanding: loansIn - loanRepayments,
    },
  });
});

export const POST = handle(async (req) => {
  const session = await getSession();
  const actor = requireWrite(session, "payments_accounting");
  const input = createSchema.parse(await req.json().catch(() => ({})));

  const entry = await prisma.capitalEntry.create({
    data: {
      type: input.type,
      amount: input.amount,
      partyName: input.partyName ?? null,
      partyInfo: input.partyInfo ?? null,
      description: input.description ?? null,
      entryDate: input.entryDate ? new Date(input.entryDate) : new Date(),
      createdById: actor.sub,
    },
  });
  await writeAudit({ action: "CREATE", entity: "CapitalEntry", entityId: entry.id, user: actor, after: entry });
  return ok(entry, 201);
});
