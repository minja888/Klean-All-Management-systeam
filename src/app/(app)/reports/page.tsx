"use client";

import { useEffect, useState, useCallback } from "react";
import { useI18n } from "@/components/i18n-provider";
import { api } from "@/lib/client";
import { PageHeader, Card, Field, inputClass, btnPrimary, btnSecondary, Money } from "@/components/ui";

interface Profit {
  revenue: number; cogs: number; grossProfit: number;
  expenses: number; payroll: number; operatingCost: number; netProfit: number;
}

function firstOfMonth() { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10); }
function today() { return new Date().toISOString().slice(0, 10); }

export default function ReportsPage() {
  const { t } = useI18n();
  const [from, setFrom] = useState(firstOfMonth());
  const [to, setTo] = useState(today());
  const [data, setData] = useState<Profit | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generate = useCallback(async () => {
    setLoading(true); setError(null);
    try { setData(await api.get<Profit>(`/api/reports/profit?from=${from}&to=${to}`)); }
    catch (err) { setError(err instanceof Error ? err.message : "Failed"); }
    finally { setLoading(false); }
  }, [from, to]);
  useEffect(() => { generate(); }, [generate]);

  const rows: { key: string; value: number; strong?: boolean }[] = data ? [
    { key: "reports.revenue", value: data.revenue },
    { key: "reports.cogs", value: -data.cogs },
    { key: "reports.grossProfit", value: data.grossProfit, strong: true },
    { key: "reports.expenses", value: -data.expenses },
    { key: "reports.payroll", value: -data.payroll },
    { key: "reports.operatingCost", value: -data.operatingCost, strong: true },
    { key: "reports.netProfit", value: data.netProfit, strong: true },
  ] : [];

  const exportUrl = (type: string) => `/api/reports/export?type=${type}&from=${from}&to=${to}`;

  return (
    <div className="space-y-4">
      <PageHeader title={t("reports.title")} />

      <Card className="p-4">
        <div className="flex flex-wrap items-end gap-3">
          <Field label={t("reports.from")}><input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className={inputClass} /></Field>
          <Field label={t("reports.to")}><input type="date" value={to} onChange={(e) => setTo(e.target.value)} className={inputClass} /></Field>
          <button onClick={generate} disabled={loading} className={btnPrimary}>{loading ? t("common.loading") : t("reports.generate")}</button>
        </div>
      </Card>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <Card className="p-6 max-w-lg">
        <table className="w-full text-sm">
          <tbody>
            {rows.map((r) => (
              <tr key={r.key} className={"border-b border-slate-100 " + (r.strong ? "font-semibold text-slate-800" : "text-slate-600")}>
                <td className="py-2">{t(r.key as Parameters<typeof t>[0])}</td>
                <td className={"py-2 text-right " + (r.value < 0 ? "text-red-600" : "")}><Money value={r.value} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <div className="flex flex-wrap gap-2">
        <a href={exportUrl("sales")} className={btnSecondary}>{t("reports.exportSales")}</a>
        <a href={exportUrl("expenses")} className={btnSecondary}>{t("reports.exportExpenses")}</a>
        <a href={exportUrl("profit")} className={btnSecondary}>{t("reports.exportProfit")}</a>
      </div>
    </div>
  );
}
