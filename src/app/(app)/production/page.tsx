"use client";

import { useEffect, useState, useCallback } from "react";
import { useI18n } from "@/components/i18n-provider";
import { PageTips } from "@/components/page-tips";
import { useSession, useCanWrite } from "@/components/session-provider";
import { api } from "@/lib/client";
import { PageHeader, Modal, Field, inputClass, btnPrimary, btnSecondary, Badge, EmptyRow } from "@/components/ui";
import type { TranslationKey } from "@/lib/i18n";

type BStatus = "PLANNED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
interface Product { id: string; name: string; unit: string }
interface Department { id: string; name: string }
interface Batch {
  id: string; batchNumber: string; status: BStatus;
  quantityPlanned: number; quantityProduced: number; wasteQuantity: number;
  product: { id: string; name: string; unit: string };
  department: { id: string; name: string } | null;
}

const statusColor: Record<BStatus, "slate" | "blue" | "emerald" | "red"> = {
  PLANNED: "slate", IN_PROGRESS: "blue", COMPLETED: "emerald", CANCELLED: "red",
};

export default function ProductionPage() {
  const { t } = useI18n();
  const { role } = useSession();
  const canWrite = useCanWrite("production_bom");
  const isWorker = role === "WORKER";

  const [batches, setBatches] = useState<Batch[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Create batch form
  const [open, setOpen] = useState(false);
  const [productId, setProductId] = useState("");
  const [quantityPlanned, setQuantityPlanned] = useState("1");
  const [departmentId, setDepartmentId] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Complete form
  const [completing, setCompleting] = useState<Batch | null>(null);
  const [quantityProduced, setQuantityProduced] = useState("");
  const [wasteQuantity, setWasteQuantity] = useState("0");
  const [completeError, setCompleteError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setBatches(await api.get<Batch[]>("/api/production-batches"));
      if (canWrite) {
        setProducts(await api.get<Product[]>("/api/products"));
        if (!isWorker) setDepartments(await api.get<Department[]>("/api/departments"));
      }
    } catch (err) { setError(err instanceof Error ? err.message : "Failed to load"); }
    finally { setLoading(false); }
  }, [canWrite, isWorker]);
  useEffect(() => { load(); }, [load]);

  function openCreate() { setFormError(null); setProductId(""); setQuantityPlanned("1"); setDepartmentId(""); setNotes(""); setOpen(true); }
  async function createBatch(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setFormError(null);
    try {
      await api.post("/api/production-batches", {
        productId, quantityPlanned: Number(quantityPlanned),
        departmentId: isWorker ? undefined : departmentId || null,
        notes: notes || null,
      });
      setOpen(false); await load();
    } catch (err) { setFormError(err instanceof Error ? err.message : "Failed to save"); }
    finally { setSaving(false); }
  }

  function openComplete(b: Batch) { setCompleteError(null); setCompleting(b); setQuantityProduced(String(b.quantityPlanned)); setWasteQuantity("0"); }
  async function completeBatch(e: React.FormEvent) {
    e.preventDefault();
    if (!completing) return;
    setCompleteError(null);
    try {
      await api.post(`/api/production-batches/${completing.id}/complete`, {
        quantityProduced: Number(quantityProduced),
        wasteQuantity: Number(wasteQuantity),
      });
      setCompleting(null); await load();
    } catch (err) { setCompleteError(err instanceof Error ? err.message : "Failed"); }
  }
  async function remove(b: Batch) {
    if (!confirm(t("common.confirmDelete"))) return;
    try { await api.del(`/api/production-batches/${b.id}`); await load(); }
    catch (err) { alert(err instanceof Error ? err.message : "Failed"); }
  }

  return (
    <div className="space-y-4">
      <PageHeader title={t("production.title")}
        action={canWrite && <button onClick={openCreate} className={btnPrimary}>+ {t("production.new")}</button>} />
      <PageTips tipKey="tips.production" />
      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-[var(--brand-50)] text-emerald-900/70 text-left">
            <tr>
              <th className="px-4 py-3 font-medium">{t("production.batch")}</th>
              <th className="px-4 py-3 font-medium">{t("production.product")}</th>
              <th className="px-4 py-3 font-medium">{t("users.department")}</th>
              <th className="px-4 py-3 font-medium text-right">{t("production.planned")}</th>
              <th className="px-4 py-3 font-medium text-right">{t("production.produced")}</th>
              <th className="px-4 py-3 font-medium">{t("production.status")}</th>
              {canWrite && <th className="px-4 py-3 font-medium text-right">{t("common.actions")}</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? <EmptyRow colSpan={canWrite ? 7 : 6} text={t("common.loading")} />
              : batches.length === 0 ? <EmptyRow colSpan={canWrite ? 7 : 6} text={t("common.noData")} />
              : batches.map((b) => (
                <tr key={b.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-800">{b.batchNumber}</td>
                  <td className="px-4 py-3 text-slate-600">{b.product.name}</td>
                  <td className="px-4 py-3 text-slate-600">{b.department?.name ?? "—"}</td>
                  <td className="px-4 py-3 text-right text-slate-600">{b.quantityPlanned}</td>
                  <td className="px-4 py-3 text-right text-slate-700">{b.status === "COMPLETED" ? b.quantityProduced : "—"}</td>
                  <td className="px-4 py-3"><Badge color={statusColor[b.status]}>{t(`bstatus.${b.status}` as TranslationKey)}</Badge></td>
                  {canWrite && (
                    <td className="px-4 py-3 text-right space-x-3 whitespace-nowrap">
                      {b.status !== "COMPLETED" && b.status !== "CANCELLED" && (
                        <button onClick={() => openComplete(b)} className="text-emerald-700 hover:underline">{t("production.complete")}</button>
                      )}
                      {b.status !== "COMPLETED" && (
                        <button onClick={() => remove(b)} className="text-red-600 hover:underline">{t("action.delete")}</button>
                      )}
                    </td>
                  )}
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {open && (
        <Modal title={t("production.new")} onClose={() => setOpen(false)}>
          <form onSubmit={createBatch} className="space-y-4">
            <Field label={t("production.product")}>
              <select required value={productId} onChange={(e) => setProductId(e.target.value)} className={inputClass}>
                <option value="">—</option>
                {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </Field>
            <Field label={t("production.planned")}>
              <input type="number" step="any" min="0.0001" required value={quantityPlanned} onChange={(e) => setQuantityPlanned(e.target.value)} className={inputClass} />
            </Field>
            {!isWorker && (
              <Field label={`${t("users.department")} (${t("common.optional")})`}>
                <select value={departmentId} onChange={(e) => setDepartmentId(e.target.value)} className={inputClass}>
                  <option value="">—</option>
                  {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </Field>
            )}
            <Field label={`${t("purchases.notes")} (${t("common.optional")})`}>
              <input value={notes} onChange={(e) => setNotes(e.target.value)} className={inputClass} />
            </Field>
            {formError && <p className="text-sm text-red-600">{formError}</p>}
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setOpen(false)} className={btnSecondary}>{t("action.cancel")}</button>
              <button type="submit" disabled={saving} className={btnPrimary}>{saving ? t("common.loading") : t("action.save")}</button>
            </div>
          </form>
        </Modal>
      )}

      {completing && (
        <Modal title={`${t("production.completeTitle")} — ${completing.batchNumber}`} onClose={() => setCompleting(null)}>
          <form onSubmit={completeBatch} className="space-y-4">
            <p className="text-sm text-slate-500">{t("production.usageHint")}</p>
            <div className="grid grid-cols-2 gap-3">
              <Field label={t("production.quantityProduced")}>
                <input type="number" step="any" min="0" required value={quantityProduced} onChange={(e) => setQuantityProduced(e.target.value)} className={inputClass} />
              </Field>
              <Field label={t("production.wasteQuantity")}>
                <input type="number" step="any" min="0" value={wasteQuantity} onChange={(e) => setWasteQuantity(e.target.value)} className={inputClass} />
              </Field>
            </div>
            {completeError && <p className="text-sm text-red-600">{completeError}</p>}
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setCompleting(null)} className={btnSecondary}>{t("action.cancel")}</button>
              <button type="submit" className={btnPrimary}>{t("production.complete")}</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
