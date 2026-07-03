"use client";

import { useEffect, useState } from "react";
import { useI18n } from "@/components/i18n-provider";
import { api } from "@/lib/client";
import { PageHeader, Card, Money, Badge, EmptyRow } from "@/components/ui";

interface InventoryItem {
  id: string;
  name: string;
  category: string;
  stockUnit: string;
  currentStock: number;
  reorderLevel: number;
  costPrice: number;
  value: number;
  lowStock: boolean;
}
interface InventoryResponse {
  items: InventoryItem[];
  totalValue: number;
  lowStockCount: number;
}

export default function InventoryPage() {
  const { t } = useI18n();
  const [data, setData] = useState<InventoryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.get<InventoryResponse>("/api/inventory")
      .then(setData)
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-4">
      <PageHeader title={t("inventory.title")} />
      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="p-4">
          <div className="text-sm text-slate-500">{t("inventory.totalValue")}</div>
          <div className="mt-1 text-2xl font-semibold text-slate-800"><Money value={data?.totalValue ?? 0} /></div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-slate-500">{t("inventory.lowStockItems")}</div>
          <div className="mt-1 text-2xl font-semibold text-amber-600">{data?.lowStockCount ?? 0}</div>
        </Card>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500 text-left">
            <tr>
              <th className="px-4 py-3 font-medium">{t("materials.name")}</th>
              <th className="px-4 py-3 font-medium">{t("materials.category")}</th>
              <th className="px-4 py-3 font-medium text-right">{t("inventory.level")}</th>
              <th className="px-4 py-3 font-medium text-right">{t("materials.reorderLevel")}</th>
              <th className="px-4 py-3 font-medium text-right">{t("inventory.value")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? <EmptyRow colSpan={5} text={t("common.loading")} />
              : !data || data.items.length === 0 ? <EmptyRow colSpan={5} text={t("common.noData")} />
              : data.items.map((i) => (
                <tr key={i.id} className={i.lowStock ? "bg-amber-50" : "hover:bg-slate-50"}>
                  <td className="px-4 py-3 font-medium text-slate-800">
                    {i.name}
                    {i.lowStock && <span className="ml-2"><Badge color="amber">{t("inventory.lowBadge")}</Badge></span>}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{i.category}</td>
                  <td className="px-4 py-3 text-right text-slate-700">{i.currentStock} {i.stockUnit}</td>
                  <td className="px-4 py-3 text-right text-slate-500">{i.reorderLevel}</td>
                  <td className="px-4 py-3 text-right text-slate-700"><Money value={i.value} /></td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
