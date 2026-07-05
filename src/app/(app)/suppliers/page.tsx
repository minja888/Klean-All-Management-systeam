"use client";

import { useEffect, useState, useCallback } from "react";
import { useI18n } from "@/components/i18n-provider";
import { PageTips } from "@/components/page-tips";
import { useCanWrite } from "@/components/session-provider";
import { api } from "@/lib/client";
import { PageHeader, Modal, Field, inputClass, btnPrimary, btnSecondary, Money, EmptyRow } from "@/components/ui";

interface Supplier {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  creditOwed: number;
}
interface FormState { id?: string; name: string; phone: string; email: string; address: string }
const empty: FormState = { name: "", phone: "", email: "", address: "" };

export default function SuppliersPage() {
  const { t } = useI18n();
  const canWrite = useCanWrite("suppliers_purchases");
  const [rows, setRows] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<FormState | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try { setRows(await api.get<Supplier[]>("/api/suppliers")); }
    catch (err) { setError(err instanceof Error ? err.message : "Failed to load"); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  function openCreate() { setFormError(null); setForm({ ...empty }); }
  function openEdit(s: Supplier) {
    setFormError(null);
    setForm({ id: s.id, name: s.name, phone: s.phone ?? "", email: s.email ?? "", address: s.address ?? "" });
  }
  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!form) return;
    setSaving(true); setFormError(null);
    try {
      const payload = { name: form.name, phone: form.phone || null, email: form.email || null, address: form.address || null };
      if (form.id) await api.put(`/api/suppliers/${form.id}`, payload);
      else await api.post("/api/suppliers", payload);
      setForm(null); await load();
    } catch (err) { setFormError(err instanceof Error ? err.message : "Failed to save"); }
    finally { setSaving(false); }
  }
  async function remove(s: Supplier) {
    if (!confirm(t("common.confirmDelete"))) return;
    try { await api.del(`/api/suppliers/${s.id}`); await load(); }
    catch (err) { alert(err instanceof Error ? err.message : "Failed to delete"); }
  }

  return (
    <div className="space-y-4">
      <PageHeader title={t("suppliers.title")}
        action={canWrite && <button onClick={openCreate} className={btnPrimary}>+ {t("suppliers.new")}</button>} />
      <PageTips tipKey="tips.suppliers" />
      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-[var(--brand-50)] text-emerald-900/70 text-left">
            <tr>
              <th className="px-4 py-3 font-medium">{t("suppliers.name")}</th>
              <th className="px-4 py-3 font-medium">{t("suppliers.phone")}</th>
              <th className="px-4 py-3 font-medium">{t("suppliers.email")}</th>
              <th className="px-4 py-3 font-medium text-right">{t("suppliers.creditOwed")}</th>
              {canWrite && <th className="px-4 py-3 font-medium text-right">{t("common.actions")}</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? <EmptyRow colSpan={canWrite ? 5 : 4} text={t("common.loading")} />
              : rows.length === 0 ? <EmptyRow colSpan={canWrite ? 5 : 4} text={t("common.noData")} />
              : rows.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-800">{s.name}</td>
                  <td className="px-4 py-3 text-slate-600">{s.phone ?? "—"}</td>
                  <td className="px-4 py-3 text-slate-600">{s.email ?? "—"}</td>
                  <td className={"px-4 py-3 text-right font-medium " + (s.creditOwed > 0 ? "text-red-600" : "text-slate-500")}>
                    <Money value={s.creditOwed} />
                  </td>
                  {canWrite && (
                    <td className="px-4 py-3 text-right space-x-3 whitespace-nowrap">
                      <button onClick={() => openEdit(s)} className="text-emerald-700 hover:underline">{t("action.edit")}</button>
                      <button onClick={() => remove(s)} className="text-red-600 hover:underline">{t("action.delete")}</button>
                    </td>
                  )}
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {form && (
        <Modal title={form.id ? t("action.edit") : t("suppliers.new")} onClose={() => setForm(null)}>
          <form onSubmit={save} className="space-y-4">
            <Field label={t("suppliers.name")}>
              <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputClass} />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label={t("suppliers.phone")}>
                <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className={inputClass} />
              </Field>
              <Field label={t("suppliers.email")}>
                <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={inputClass} />
              </Field>
            </div>
            <Field label={t("suppliers.address")}>
              <input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className={inputClass} />
            </Field>
            {formError && <p className="text-sm text-red-600">{formError}</p>}
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
