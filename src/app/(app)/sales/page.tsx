"use client";

import { useEffect, useState } from "react";
import { useI18n } from "@/components/i18n-provider";
import { PageTips } from "@/components/page-tips";
import { api } from "@/lib/client";
import { PageHeader, Money, EmptyRow } from "@/components/ui";
import { ReceiptModal } from "@/components/receipt";

interface Sale {
  id: string; saleNumber: string; saleDate: string;
  totalAmount: string | number; amountPaid: string | number; debt: number;
  customer: { id: string; name: string } | null;
  _count: { items: number };
}

export default function SalesPage() {
  const { t } = useI18n();
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [receiptId, setReceiptId] = useState<string | null>(null);

  useEffect(() => {
    api.get<Sale[]>("/api/sales")
      .then(setSales)
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-4">
      <PageHeader title={t("sales.title")} />
      <PageTips tipKey="tips.sales" />
      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500 text-left">
            <tr>
              <th className="px-4 py-3 font-medium">{t("sales.number")}</th>
              <th className="px-4 py-3 font-medium">{t("pos.customer")}</th>
              <th className="px-4 py-3 font-medium">{t("sales.date")}</th>
              <th className="px-4 py-3 font-medium text-right">{t("pos.total")}</th>
              <th className="px-4 py-3 font-medium text-right">{t("purchases.paid")}</th>
              <th className="px-4 py-3 font-medium text-right">{t("customers.debt")}</th>
              <th className="px-4 py-3 font-medium text-right">{t("common.actions")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? <EmptyRow colSpan={7} text={t("common.loading")} />
              : sales.length === 0 ? <EmptyRow colSpan={7} text={t("common.noData")} />
              : sales.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-800">{s.saleNumber}</td>
                  <td className="px-4 py-3 text-slate-600">{s.customer?.name ?? t("pos.walkIn")}</td>
                  <td className="px-4 py-3 text-slate-500">{new Date(s.saleDate).toLocaleDateString()}</td>
                  <td className="px-4 py-3 text-right text-slate-700"><Money value={s.totalAmount} /></td>
                  <td className="px-4 py-3 text-right text-slate-600"><Money value={s.amountPaid} /></td>
                  <td className={"px-4 py-3 text-right " + (s.debt > 0 ? "text-red-600" : "text-slate-500")}><Money value={s.debt} /></td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => setReceiptId(s.id)} className="text-emerald-700 hover:underline">{t("sales.receipt")}</button>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {receiptId && <ReceiptModal saleId={receiptId} onClose={() => setReceiptId(null)} />}
    </div>
  );
}
