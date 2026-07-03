// Dashboard (server component). KPIs + profit engine arrive in Phase 6;
// for now it confirms the signed-in user and shows the period placeholder.
import { getSession } from "@/lib/auth";
import { getServerLang } from "@/lib/server-i18n";
import { translate } from "@/lib/i18n";
import { canView } from "@/lib/access";

export default async function DashboardPage() {
  const session = await getSession();
  const lang = await getServerLang();
  const t = (k: Parameters<typeof translate>[1]) => translate(lang, k);

  const showFinancials = session ? canView(session.role, "profit_dashboard") : false;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-800">{t("nav.dashboard")}</h1>
        <p className="text-slate-500">
          {t("auth.welcome")}, <span className="font-medium">{session?.name}</span>
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          "nav.sales",
          "nav.purchases",
          "nav.inventory",
          "nav.production",
        ].map((key) => (
          <div key={key} className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="text-sm text-slate-500">{t(key as Parameters<typeof translate>[1])}</div>
            <div className="mt-2 text-2xl font-semibold text-slate-300">—</div>
          </div>
        ))}
      </div>

      {showFinancials && (
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="text-sm text-slate-500">Net Profit (Month / YTD)</div>
          <div className="mt-2 text-3xl font-semibold text-slate-300">TZS —</div>
          <p className="mt-2 text-sm text-slate-400">
            The profit engine and charts are implemented in Phase 6.
          </p>
        </div>
      )}
    </div>
  );
}
