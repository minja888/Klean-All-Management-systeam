"use client";

import { useEffect, useState, useCallback } from "react";
import { useI18n } from "@/components/i18n-provider";
import { PageTips } from "@/components/page-tips";
import { api } from "@/lib/client";
import { PageHeader, Card, Field, inputClass, btnPrimary, btnSecondary, Money } from "@/components/ui";
import { TrendChart, CategoryChart, type MonthPoint } from "@/components/charts";

interface Profit {
  revenue: number; cogs: number; grossProfit: number;
  expenses: number; payroll: number; operatingCost: number; netProfit: number;
}
interface Analytics { monthly: MonthPoint[]; byCategory: { name: string; amount: number }[] }

function firstOfMonth() { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10); }
function today() { return new Date().toISOString().slice(0, 10); }

export default function ReportsPage() {
  const { t } = useI18n();
  const [from, setFrom] = useState(firstOfMonth());
  const [to, setTo] = useState(today());
  const [data, setData] = useState<Profit | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [analytics, setAnalytics] = useState<Analytics | null>(null);

  const generate = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      setData(await api.get<Profit>(`/api/reports/profit?from=${from}&to=${to}`));
      setAnalytics(await api.get<Analytics>(`/api/reports/analytics?from=${from}&to=${to}`));
    }
    catch (err) { setError(err instanceof Error ? err.message : "Failed"); }
    finally { setLoading(false); }
  }, [from, to]);
  useEffect(() => { generate(); }, [generate]);

  const hasTrendData = analytics?.monthly.some((m) => m.revenue !== 0 || m.costs !== 0) ?? false;

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
      <PageTips tipKey="tips.reports" />

      <Card className="p-4">
        <div className="flex flex-wrap items-end gap-2 mb-3">
          <button onClick={() => { setFrom(today()); setTo(today()); }} className={btnSecondary}>{t("period.today")}</button>
          <button onClick={() => {
            const now = new Date(); const day = (now.getDay() + 6) % 7;
            const monday = new Date(now); monday.setDate(now.getDate() - day);
            setFrom(monday.toISOString().slice(0, 10)); setTo(today());
          }} className={btnSecondary}>{t("period.thisWeek")}</button>
          <button onClick={() => { setFrom(firstOfMonth()); setTo(today()); }} className={btnSecondary}>{t("period.thisMonth")}</button>
          <button onClick={() => {
            setFrom(new Date(new Date().getFullYear(), 0, 1).toISOString().slice(0, 10)); setTo(today());
          }} className={btnSecondary}>{t("period.thisYear")}</button>
        </div>
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

      {/* Charts — data analysis */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-4">
          <div className="font-semibold text-slate-800 mb-2">📊 {t("charts.trend")}</div>
          {analytics && hasTrendData ? (
            <TrendChart
              data={analytics.monthly}
              labels={{ revenue: t("charts.revenue"), costs: t("charts.costs"), net: t("charts.net") }}
            />
          ) : (
            <p className="text-sm text-slate-400 py-8 text-center">{t("charts.noData")}</p>
          )}
        </Card>
        <Card className="p-4">
          <div className="font-semibold text-slate-800 mb-3">🧾 {t("charts.byCategory")}</div>
          {analytics && analytics.byCategory.length > 0 ? (
            <CategoryChart data={analytics.byCategory} />
          ) : (
            <p className="text-sm text-slate-400 py-8 text-center">{t("charts.noData")}</p>
          )}
        </Card>
      </div>

      <div className="flex flex-wrap gap-2">
        <a href={exportUrl("sales")} className={btnSecondary}>{t("reports.exportSales")}</a>
        <a href={exportUrl("expenses")} className={btnSecondary}>{t("reports.exportExpenses")}</a>
        <a href={exportUrl("profit")} className={btnSecondary}>{t("reports.exportProfit")}</a>
      </div>
    </div>
  );
}
