"use client";

import { useEffect, useState, useCallback } from "react";
import { useI18n } from "@/components/i18n-provider";
import { useCanWrite } from "@/components/session-provider";
import { api } from "@/lib/client";
import { PageHeader, Modal, Field, inputClass, btnPrimary, btnSecondary, Money, EmptyRow } from "@/components/ui";

interface Customer { id: string; name: string; phone: string | null; email: string | null; address: string | null; debt: number }
interface FormState { id?: string; name: string; phone: string; email: string; address: string }
const empty: FormState = { name: "", phone: "", email: "", address: "" };

export default function CustomersPage() {
  const { t } = useI18n();
  const canWrite = useCanWrite("sales_pos");
  const [rows, setRows] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<FormState | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try { setRows(await api.get<Customer[]>("/api/customers")); }
    catch (err) { setError(err instanceof Error ? err.message : "Failed to load"); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  function openCreate() { setFormError(null); setForm({ ...empty }); }
  function openEdit(c: Customer) { setFormError(null); setForm({ id: c.id, name: c.name, phone: c.phone ?? "", email: c.email ?? "", address: c.address ?? "" }); }
  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!form) return;
    setSaving(true); setFormError(null);
    try {
      const payload = { name: form.name, phone: form.phone || null, email: form.email || null, address: form.address || null };
      if (form.id) await api.put(`/api/customers/${form.id}`, payload);
      else await api.post("/api/customers", payload);
      setForm(null); await load();
    } catch (err) { setFormError(err instanceof Error ? err.message : "Failed to save"); }
    finally { setSaving(false); }
  }
  async function remove(c: Customer) {
    if (!confirm(t("common.confirmDelete"))) return;
    try { await api.del(`/api/customers/${c.id}`); await load(); }
    catch (err) { alert(err instanceof Error ? err.message : "Failed"); }
  }

  return (
    <div className="space-y-4">
      <PageHeader title={t("customers.title")}
        action={canWrite && <button onClick={openCreate} className={btnPrimary}>+ {t("customers.new")}</button>} />
      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500 text-left">
            <tr>
              <th className="px-4 py-3 font-medium">{t("customers.name")}</th>
              <th className="px-4 py-3 font-medium">{t("customers.phone")}</th>
              <th className="px-4 py-3 font-medium">{t("customers.email")}</th>
              <th className="px-4 py-3 font-medium text-right">{t("customers.debt")}</th>
              {canWrite && <th className="px-4 py-3 font-medium text-right">{t("common.actions")}</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? <EmptyRow colSpan={canWrite ? 5 : 4} text={t("common.loading")} />
              : rows.length === 0 ? <EmptyRow colSpan={canWrite ? 5 : 4} text={t("common.noData")} />
              : rows.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-800">{c.name}</td>
                  <td className="px-4 py-3 text-slate-600">{c.phone ?? "—"}</td>
                  <td className="px-4 py-3 text-slate-600">{c.email ?? "—"}</td>
                  <td className={"px-4 py-3 text-right font-medium " + (c.debt > 0 ? "text-red-600" : "text-slate-500")}><Money value={c.debt} /></td>
                  {canWrite && (
                    <td className="px-4 py-3 text-right space-x-3 whitespace-nowrap">
                      <button onClick={() => openEdit(c)} className="text-emerald-700 hover:underline">{t("action.edit")}</button>
                      <button onClick={() => remove(c)} className="text-red-600 hover:underline">{t("action.delete")}</button>
                    </td>
                  )}
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {form && (
        <Modal title={form.id ? t("action.edit") : t("customers.new")} onClose={() => setForm(null)}>
          <form onSubmit={save} className="space-y-4">
            <Field label={t("customers.name")}>
              <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputClass} />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label={t("customers.phone")}><input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className={inputClass} /></Field>
              <Field label={t("customers.email")}><input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={inputClass} /></Field>
            </div>
            <Field label={t("customers.address")}><input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className={inputClass} /></Field>
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
