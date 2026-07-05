"use client";

import { useEffect, useState, useCallback } from "react";
import { useI18n } from "@/components/i18n-provider";
import { PageTips } from "@/components/page-tips";
import { useCanWrite } from "@/components/session-provider";
import { api } from "@/lib/client";
import { PageHeader, Modal, Field, inputClass, btnPrimary, btnSecondary, Money, Badge, EmptyRow } from "@/components/ui";
import type { TranslationKey } from "@/lib/i18n";

type Status = "DRAFT" | "ORDERED" | "RECEIVED" | "CANCELLED";
interface Supplier { id: string; name: string }
interface Material { id: string; name: string; purchaseUnit: string }
interface Order {
  id: string; orderNumber: string; status: Status; orderDate: string;
  totalAmount: string | number; amountPaid: string | number; creditBalance: number;
  supplier: { id: string; name: string }; _count: { items: number };
}
interface LineItem { materialId: string; quantity: string; unitPrice: string }

const statusColor: Record<Status, "slate" | "blue" | "emerald" | "red"> = {
  DRAFT: "slate", ORDERED: "blue", RECEIVED: "emerald", CANCELLED: "red",
};

export default function PurchasesPage() {
  const { t } = useI18n();
  const canWrite = useCanWrite("suppliers_purchases");

  const [orders, setOrders] = useState<Order[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [open, setOpen] = useState(false);
  const [supplierId, setSupplierId] = useState("");
  const [amountPaid, setAmountPaid] = useState("0");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<LineItem[]>([{ materialId: "", quantity: "1", unitPrice: "0" }]);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setOrders(await api.get<Order[]>("/api/purchase-orders"));
      if (canWrite) {
        setSuppliers(await api.get<Supplier[]>("/api/suppliers"));
        setMaterials(await api.get<Material[]>("/api/materials"));
      }
    } catch (err) { setError(err instanceof Error ? err.message : "Failed to load"); }
    finally { setLoading(false); }
  }, [canWrite]);
  useEffect(() => { load(); }, [load]);

  function openCreate() {
    setFormError(null); setSupplierId(""); setAmountPaid("0"); setNotes("");
    setItems([{ materialId: "", quantity: "1", unitPrice: "0" }]);
    setOpen(true);
  }
  function updateItem(idx: number, patch: Partial<LineItem>) {
    setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, ...patch } : it)));
  }
  function addItem() { setItems((prev) => [...prev, { materialId: "", quantity: "1", unitPrice: "0" }]); }
  function removeItem(idx: number) { setItems((prev) => prev.filter((_, i) => i !== idx)); }

  const total = items.reduce((sum, it) => sum + Number(it.quantity || 0) * Number(it.unitPrice || 0), 0);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setFormError(null);
    try {
      await api.post("/api/purchase-orders", {
        supplierId,
        amountPaid: Number(amountPaid || 0),
        notes: notes || null,
        items: items
          .filter((it) => it.materialId)
          .map((it) => ({ materialId: it.materialId, quantity: Number(it.quantity), unitPrice: Number(it.unitPrice) })),
      });
      setOpen(false); await load();
    } catch (err) { setFormError(err instanceof Error ? err.message : "Failed to save"); }
    finally { setSaving(false); }
  }

  async function receive(o: Order) {
    if (!confirm(t("purchases.confirmReceive"))) return;
    try { await api.post(`/api/purchase-orders/${o.id}/receive`, {}); await load(); }
    catch (err) { alert(err instanceof Error ? err.message : "Failed"); }
  }
  async function remove(o: Order) {
    if (!confirm(t("common.confirmDelete"))) return;
    try { await api.del(`/api/purchase-orders/${o.id}`); await load(); }
    catch (err) { alert(err instanceof Error ? err.message : "Failed"); }
  }

  return (
    <div className="space-y-4">
      <PageHeader title={t("purchases.title")}
        action={canWrite && <button onClick={openCreate} className={btnPrimary}>+ {t("purchases.new")}</button>} />
      <PageTips tipKey="tips.purchases" />
      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-[var(--brand-50)] text-emerald-900/70 text-left">
            <tr>
              <th className="px-4 py-3 font-medium">{t("purchases.order")}</th>
              <th className="px-4 py-3 font-medium">{t("purchases.supplier")}</th>
              <th className="px-4 py-3 font-medium">{t("purchases.status")}</th>
              <th className="px-4 py-3 font-medium text-right">{t("purchases.total")}</th>
              <th className="px-4 py-3 font-medium text-right">{t("purchases.paid")}</th>
              <th className="px-4 py-3 font-medium text-right">{t("purchases.credit")}</th>
              {canWrite && <th className="px-4 py-3 font-medium text-right">{t("common.actions")}</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? <EmptyRow colSpan={canWrite ? 7 : 6} text={t("common.loading")} />
              : orders.length === 0 ? <EmptyRow colSpan={canWrite ? 7 : 6} text={t("common.noData")} />
              : orders.map((o) => (
                <tr key={o.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-800">{o.orderNumber}</td>
                  <td className="px-4 py-3 text-slate-600">{o.supplier.name}</td>
                  <td className="px-4 py-3"><Badge color={statusColor[o.status]}>{t(`status.${o.status}` as TranslationKey)}</Badge></td>
                  <td className="px-4 py-3 text-right text-slate-700"><Money value={o.totalAmount} /></td>
                  <td className="px-4 py-3 text-right text-slate-600"><Money value={o.amountPaid} /></td>
                  <td className={"px-4 py-3 text-right " + (o.creditBalance > 0 ? "text-red-600" : "text-slate-500")}><Money value={o.creditBalance} /></td>
                  {canWrite && (
                    <td className="px-4 py-3 text-right space-x-3 whitespace-nowrap">
                      {o.status !== "RECEIVED" && o.status !== "CANCELLED" && (
                        <button onClick={() => receive(o)} className="text-emerald-700 hover:underline">{t("purchases.receive")}</button>
                      )}
                      {o.status !== "RECEIVED" && (
                        <button onClick={() => remove(o)} className="text-red-600 hover:underline">{t("action.delete")}</button>
                      )}
                    </td>
                  )}
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {open && (
        <Modal title={t("purchases.new")} onClose={() => setOpen(false)}>
          <form onSubmit={save} className="space-y-4">
            <Field label={t("purchases.supplier")}>
              <select required value={supplierId} onChange={(e) => setSupplierId(e.target.value)} className={inputClass}>
                <option value="">—</option>
                {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </Field>

            <div>
              <div className="text-sm font-medium text-slate-600 mb-1">{t("purchases.items")}</div>
              <div className="space-y-2">
                {items.map((it, idx) => (
                  <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                    <select value={it.materialId} onChange={(e) => updateItem(idx, { materialId: e.target.value })} className={inputClass + " col-span-5"} required>
                      <option value="">{t("purchases.material")}</option>
                      {materials.map((m) => <option key={m.id} value={m.id}>{m.name} ({m.purchaseUnit})</option>)}
                    </select>
                    <input type="number" step="any" min="0" value={it.quantity} onChange={(e) => updateItem(idx, { quantity: e.target.value })}
                      className={inputClass + " col-span-2"} placeholder={t("purchases.qty")} />
                    <input type="number" step="any" min="0" value={it.unitPrice} onChange={(e) => updateItem(idx, { unitPrice: e.target.value })}
                      className={inputClass + " col-span-3"} placeholder={t("purchases.unitPrice")} />
                    <div className="col-span-1 text-right text-xs text-slate-500">
                      {(Number(it.quantity || 0) * Number(it.unitPrice || 0)).toLocaleString()}
                    </div>
                    <button type="button" onClick={() => removeItem(idx)} className="col-span-1 text-red-500 hover:text-red-700 text-lg leading-none">×</button>
                  </div>
                ))}
              </div>
              <button type="button" onClick={addItem} className="mt-2 text-sm text-emerald-700 hover:underline">+ {t("purchases.addItem")}</button>
            </div>

            <div className="flex items-center justify-between border-t border-slate-100 pt-3">
              <span className="text-sm text-slate-500">{t("purchases.total")}</span>
              <span className="text-lg font-semibold text-slate-800"><Money value={total} /></span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Field label={t("purchases.amountPaid")}>
                <input type="number" step="any" min="0" value={amountPaid} onChange={(e) => setAmountPaid(e.target.value)} className={inputClass} />
              </Field>
              <Field label={`${t("purchases.notes")} (${t("common.optional")})`}>
                <input value={notes} onChange={(e) => setNotes(e.target.value)} className={inputClass} />
              </Field>
            </div>

            {formError && <p className="text-sm text-red-600">{formError}</p>}
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setOpen(false)} className={btnSecondary}>{t("action.cancel")}</button>
              <button type="submit" disabled={saving} className={btnPrimary}>{saving ? t("common.loading") : t("action.save")}</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
