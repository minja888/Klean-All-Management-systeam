"use client";

import { useEffect, useState, useCallback } from "react";
import { useI18n } from "@/components/i18n-provider";
import { PageTips } from "@/components/page-tips";
import { useCanWrite } from "@/components/session-provider";
import { api } from "@/lib/client";
import { PageHeader, Card, Modal, Field, inputClass, btnPrimary, btnSecondary, Money, EmptyRow } from "@/components/ui";
import type { TranslationKey } from "@/lib/i18n";

interface Payable { id: string; orderNumber: string; supplier: string; total: number; paid: number; balance: number }
interface Receivable { id: string; saleNumber: string; customer: string; total: number; paid: number; balance: number }

const METHODS = ["Cash", "M-Pesa", "Bank"];

interface PayForm { direction: "OUTGOING" | "INCOMING"; refId: string; label: string; amount: string; method: string }

export default function AccountingPage() {
  const { t } = useI18n();
  const canWrite = useCanWrite("payments_accounting");
  const [payables, setPayables] = useState<{ items: Payable[]; totalPayable: number } | null>(null);
  const [receivables, setReceivables] = useState<{ items: Receivable[]; totalReceivable: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<PayForm | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      setPayables(await api.get("/api/accounting/payables"));
      setReceivables(await api.get("/api/accounting/receivables"));
    } catch (err) { setError(err instanceof Error ? err.message : "Failed"); }
  }, []);
  useEffect(() => { load(); }, [load]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form) return;
    setSaving(true);
    try {
      await api.post("/api/payments", {
        direction: form.direction,
        amount: Number(form.amount),
        method: form.method,
        ...(form.direction === "OUTGOING" ? { purchaseOrderId: form.refId } : { saleId: form.refId }),
      });
      setForm(null); await load();
    } catch (err) { alert(err instanceof Error ? err.message : "Failed"); }
    finally { setSaving(false); }
  }

  return (
    <div className="space-y-4">
      <PageHeader title={t("accounting.title")} />
      <PageTips tipKey="tips.accounting" />
      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Payables */}
        <Card className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="font-semibold text-slate-800">{t("accounting.payables")}</div>
            <span className="text-red-600 font-semibold"><Money value={payables?.totalPayable ?? 0} /></span>
          </div>
          <table className="w-full text-sm">
            <thead className="text-slate-500 text-left"><tr>
              <th className="py-1">{t("purchases.order")}</th><th className="py-1">{t("purchases.supplier")}</th>
              <th className="py-1 text-right">{t("accounting.balance")}</th>{canWrite && <th />}
            </tr></thead>
            <tbody className="divide-y divide-slate-100">
              {!payables ? <EmptyRow colSpan={4} text={t("common.loading")} />
                : payables.items.length === 0 ? <EmptyRow colSpan={4} text={t("common.noData")} />
                : payables.items.map((p) => (
                  <tr key={p.id}>
                    <td className="py-2 text-slate-700">{p.orderNumber}</td>
                    <td className="py-2 text-slate-600">{p.supplier}</td>
                    <td className="py-2 text-right text-red-600"><Money value={p.balance} /></td>
                    {canWrite && <td className="py-2 text-right">
                      <button onClick={() => setForm({ direction: "OUTGOING", refId: p.id, label: p.orderNumber, amount: String(p.balance), method: "Cash" })} className="text-emerald-700 hover:underline">{t("accounting.pay")}</button>
                    </td>}
                  </tr>
                ))}
            </tbody>
          </table>
        </Card>

        {/* Receivables */}
        <Card className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="font-semibold text-slate-800">{t("accounting.receivables")}</div>
            <span className="text-red-600 font-semibold"><Money value={receivables?.totalReceivable ?? 0} /></span>
          </div>
          <table className="w-full text-sm">
            <thead className="text-slate-500 text-left"><tr>
              <th className="py-1">{t("sales.number")}</th><th className="py-1">{t("pos.customer")}</th>
              <th className="py-1 text-right">{t("accounting.balance")}</th>{canWrite && <th />}
            </tr></thead>
            <tbody className="divide-y divide-slate-100">
              {!receivables ? <EmptyRow colSpan={4} text={t("common.loading")} />
                : receivables.items.length === 0 ? <EmptyRow colSpan={4} text={t("common.noData")} />
                : receivables.items.map((r) => (
                  <tr key={r.id}>
                    <td className="py-2 text-slate-700">{r.saleNumber}</td>
                    <td className="py-2 text-slate-600">{r.customer}</td>
                    <td className="py-2 text-right text-red-600"><Money value={r.balance} /></td>
                    {canWrite && <td className="py-2 text-right">
                      <button onClick={() => setForm({ direction: "INCOMING", refId: r.id, label: r.saleNumber, amount: String(r.balance), method: "Cash" })} className="text-emerald-700 hover:underline">{t("accounting.receive")}</button>
                    </td>}
                  </tr>
                ))}
            </tbody>
          </table>
        </Card>
      </div>

      {form && (
        <Modal title={`${t("accounting.recordPayment")} — ${form.label}`} onClose={() => setForm(null)}>
          <form onSubmit={submit} className="space-y-4">
            <Field label={t("accounting.amount")}>
              <input type="number" step="any" min="0" required value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} className={inputClass} />
            </Field>
            <Field label={t("accounting.method")}>
              <select value={form.method} onChange={(e) => setForm({ ...form, method: e.target.value })} className={inputClass}>
                {METHODS.map((m) => <option key={m} value={m}>{t(`method.${m}` as TranslationKey)}</option>)}
              </select>
            </Field>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setForm(null)} className={btnSecondary}>{t("action.cancel")}</button>
              <button type="submit" disabled={saving} className={btnPrimary}>{saving ? t("common.loading") : t("action.save")}</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
