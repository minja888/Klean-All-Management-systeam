"use client";

// Printable receipt. Uses the @media print rules in globals.css so that only
// the .receipt-print block is sent to the printer.
import { useEffect, useState } from "react";
import { api } from "@/lib/client";
import { useI18n } from "@/components/i18n-provider";
import { formatTZS } from "@/lib/money";
import { btnPrimary, btnSecondary } from "@/components/ui";

interface ReceiptData {
  companyName: string;
  saleNumber: string;
  date: string;
  customer: string;
  paymentMethod: string | null;
  items: { name: string; unit: string; quantity: number; unitPrice: number; lineTotal: number }[];
  totalAmount: number;
  amountPaid: number;
  debt: number;
}

export function ReceiptModal({ saleId, onClose }: { saleId: string; onClose: () => void }) {
  const { t } = useI18n();
  const [data, setData] = useState<ReceiptData | null>(null);

  useEffect(() => {
    api.get<ReceiptData>(`/api/sales/${saleId}/receipt`).then(setData).catch(() => setData(null));
  }, [saleId]);

  return (
    <div className="fixed inset-0 bg-slate-900/40 flex items-center justify-center p-4 z-50 no-print" onMouseDown={onClose}>
      <div className="bg-white rounded-xl shadow-lg w-full max-w-sm" onMouseDown={(e) => e.stopPropagation()}>
        <div className="receipt-print p-6 text-sm">
          {!data ? (
            <p className="text-slate-400">{t("common.loading")}</p>
          ) : (
            <>
              <div className="text-center mb-3">
                <div className="text-lg font-bold">{data.companyName}</div>
                <div className="text-xs text-slate-500">{t("receipt.title")}</div>
              </div>
              <div className="flex justify-between text-xs text-slate-500 mb-2">
                <span>{data.saleNumber}</span>
                <span>{new Date(data.date).toLocaleString()}</span>
              </div>
              <div className="text-xs text-slate-500 mb-2">{t("pos.customer")}: {data.customer}</div>
              <table className="w-full mb-3">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-slate-500">
                    <th className="py-1">{t("pos.product")}</th>
                    <th className="py-1 text-right">{t("pos.qty")}</th>
                    <th className="py-1 text-right">{t("pos.total")}</th>
                  </tr>
                </thead>
                <tbody>
                  {data.items.map((it, i) => (
                    <tr key={i} className="border-b border-slate-100">
                      <td className="py-1">{it.name}</td>
                      <td className="py-1 text-right">{it.quantity}</td>
                      <td className="py-1 text-right">{formatTZS(it.lineTotal)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="space-y-1 text-right">
                <div className="font-semibold">{t("pos.total")}: {formatTZS(data.totalAmount)}</div>
                <div className="text-slate-600">{t("pos.amountPaid")}: {formatTZS(data.amountPaid)}</div>
                {data.debt > 0 && <div className="text-red-600">{t("customers.debt")}: {formatTZS(data.debt)}</div>}
              </div>
              <p className="text-center text-xs text-slate-400 mt-4">{t("receipt.thankYou")}</p>
            </>
          )}
        </div>

        <div className="flex justify-end gap-2 p-4 border-t border-slate-200 no-print">
          <button onClick={onClose} className={btnSecondary}>{t("action.close")}</button>
          <button onClick={() => window.print()} className={btnPrimary}>{t("common.print")}</button>
        </div>
      </div>
    </div>
  );
}
