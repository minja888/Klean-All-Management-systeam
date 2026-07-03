"use client";

import { useEffect, useState } from "react";
import { useI18n } from "@/components/i18n-provider";
import { useSession } from "@/components/session-provider";
import { api } from "@/lib/client";
import { PageHeader, Card, Money, Badge } from "@/components/ui";

interface Dashboard {
  showFinancials: boolean;
  lowStockCount: number;
  lowStock: { name: string; currentStock: number; reorderLevel: number; stockUnit: string }[];
  productionOutput: number;
  stockValue: number;
  salesThisMonth?: number;
  purchasesThisMonth?: number;
  supplierCredit?: number;
  customerDebt?: number;
  netProfitMonth?: number;
  netProfitYTD?: number;
}

function Kpi({ label, children, accent }: { label: string; children: React.ReactNode; accent?: string }) {
  return (
    <Card className="p-4">
      <div className="text-sm text-slate-500">{label}</div>
      <div className={"mt-1 text-2xl font-semibold " + (accent ?? "text-slate-800")}>{children}</div>
    </Card>
  );
}

export default function DashboardPage() {
  const { t } = useI18n();
  const { name } = useSession();
  const [data, setData] = useState<Dashboard | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.get<Dashboard>("/api/dashboard").then(setData).catch((e) => setError(e instanceof Error ? e.message : "Failed"));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <PageHeader title={t("nav.dashboard")} />
        <p className="text-slate-500">{t("auth.welcome")}, <span className="font-medium">{name}</span></p>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}

      {data?.showFinancials && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Kpi label={t("dash.netProfitMonth")} accent={(data.netProfitMonth ?? 0) >= 0 ? "text-emerald-600" : "text-red-600"}><Money value={data.netProfitMonth ?? 0} /></Kpi>
          <Kpi label={t("dash.netProfitYTD")} accent={(data.netProfitYTD ?? 0) >= 0 ? "text-emerald-600" : "text-red-600"}><Money value={data.netProfitYTD ?? 0} /></Kpi>
          <Kpi label={t("dash.salesMonth")}><Money value={data.salesThisMonth ?? 0} /></Kpi>
          <Kpi label={t("dash.purchasesMonth")}><Money value={data.purchasesThisMonth ?? 0} /></Kpi>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {data?.showFinancials && (
          <>
            <Kpi label={t("dash.supplierCredit")} accent="text-red-600"><Money value={data.supplierCredit ?? 0} /></Kpi>
            <Kpi label={t("dash.customerDebt")} accent="text-red-600"><Money value={data.customerDebt ?? 0} /></Kpi>
          </>
        )}
        <Kpi label={t("dash.stockValue")}><Money value={data?.stockValue ?? 0} /></Kpi>
        <Kpi label={t("dash.production")}>{data?.productionOutput ?? 0}</Kpi>
      </div>

      <Card className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="font-semibold text-slate-800">{t("dash.lowStockAlerts")}</div>
          <Badge color={(data?.lowStockCount ?? 0) > 0 ? "amber" : "emerald"}>{data?.lowStockCount ?? 0}</Badge>
        </div>
        {(!data || data.lowStock.length === 0) ? (
          <p className="text-sm text-slate-400">{t("common.noData")}</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {data.lowStock.map((m, i) => (
              <li key={i} className="flex items-center justify-between py-2 text-sm">
                <span className="text-slate-700">{m.name}</span>
                <span className="text-amber-600">{m.currentStock} / {m.reorderLevel} {m.stockUnit}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
