// GET /api/reports/profit?from=&to= — profit for a period (ADMIN/ACCOUNTING)
import { handle, ok } from "@/lib/api";
import { getSession } from "@/lib/auth";
import { requireView } from "@/lib/rbac";
import { computeProfit } from "@/lib/profit";

export const GET = handle(async (req) => {
  const session = await getSession();
  requireView(session, "profit_dashboard");

  const url = new URL(req.url);
  const fromParam = url.searchParams.get("from");
  const toParam = url.searchParams.get("to");

  const now = new Date();
  const from = fromParam ? new Date(fromParam) : new Date(now.getFullYear(), now.getMonth(), 1);
  const to = toParam ? new Date(toParam + "T23:59:59") : now;

  return ok(await computeProfit(from, to));
});
