"use client";

import { useEffect, useState, useCallback } from "react";
import { useI18n } from "@/components/i18n-provider";
import { PageTips } from "@/components/page-tips";
import { useCanWrite } from "@/components/session-provider";
import { api } from "@/lib/client";
import { PageHeader, Modal, Field, inputClass, btnPrimary, btnSecondary, Money, EmptyRow } from "@/components/ui";

interface Category { id: string; name: string }
interface Department { id: string; name: string }
interface Expense {
  id: string; amount: string | number; description: string | null; expenseDate: string;
  category: Category | null; department: Department | null; categoryId: string; departmentId: string | null;
}
interface FormState { id?: string; categoryId: string; amount: string; description: string; departmentId: string; expenseDate: string }

function today() { return new Date().toISOString().slice(0, 10); }
const empty = (): FormState => ({ categoryId: "", amount: "", description: "", departmentId: "", expenseDate: today() });

export default function ExpensesPage() {
  const { t } = useI18n();
  const canWrite = useCanWrite("expenses_payroll");
  const [rows, setRows] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<FormState | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setRows(await api.get<Expense[]>("/api/expenses"));
      if (canWrite) {
        setCategories(await api.get<Category[]>("/api/settings/expense-categories"));
        setDepartments(await api.get<Department[]>("/api/departments"));
      }
    } catch (err) { setError(err instanceof Error ? err.message : "Failed to load"); }
    finally { setLoading(false); }
  }, [canWrite]);
  useEffect(() => { load(); }, [load]);

  function openCreate() { setFormError(null); setForm(empty()); }
  function openEdit(x: Expense) {
    setFormError(null);
    setForm({ id: x.id, categoryId: x.categoryId, amount: String(x.amount), description: x.description ?? "", departmentId: x.departmentId ?? "", expenseDate: x.expenseDate.slice(0, 10) });
  }
  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!form) return;
    setSaving(true); setFormError(null);
    try {
      const payload = { categoryId: form.categoryId, amount: Number(form.amount), description: form.description || null, departmentId: form.departmentId || null, expenseDate: form.expenseDate };
      if (form.id) await api.put(`/api/expenses/${form.id}`, payload);
      else await api.post("/api/expenses", payload);
      setForm(null); await load();
    } catch (err) { setFormError(err instanceof Error ? err.message : "Failed to save"); }
    finally { setSaving(false); }
  }
  async function remove(x: Expense) {
    if (!confirm(t("common.confirmDelete"))) return;
    try { await api.del(`/api/expenses/${x.id}`); await load(); }
    catch (err) { alert(err instanceof Error ? err.message : "Failed"); }
  }

  const total = rows.reduce((s, x) => s + Number(x.amount), 0);

  return (
    <div className="space-y-4">
      <PageHeader title={t("expenses.title")}
        action={canWrite && <button onClick={openCreate} className={btnPrimary}>+ {t("expenses.new")}</button>} />
      <PageTips tipKey="tips.expenses" />
      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500 text-left">
            <tr>
              <th className="px-4 py-3 font-medium">{t("expenses.date")}</th>
              <th className="px-4 py-3 font-medium">{t("expenses.category")}</th>
              <th className="px-4 py-3 font-medium">{t("expenses.description")}</th>
              <th className="px-4 py-3 font-medium">{t("users.department")}</th>
              <th className="px-4 py-3 font-medium text-right">{t("expenses.amount")}</th>
              {canWrite && <th className="px-4 py-3 font-medium text-right">{t("common.actions")}</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? <EmptyRow colSpan={canWrite ? 6 : 5} text={t("common.loading")} />
              : rows.length === 0 ? <EmptyRow colSpan={canWrite ? 6 : 5} text={t("common.noData")} />
              : rows.map((x) => (
                <tr key={x.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 text-slate-500">{new Date(x.expenseDate).toLocaleDateString()}</td>
                  <td className="px-4 py-3 text-slate-700">{x.category?.name ?? "—"}</td>
                  <td className="px-4 py-3 text-slate-600">{x.description ?? "—"}</td>
                  <td className="px-4 py-3 text-slate-600">{x.department?.name ?? "—"}</td>
                  <td className="px-4 py-3 text-right text-slate-800"><Money value={x.amount} /></td>
                  {canWrite && (
                    <td className="px-4 py-3 text-right space-x-3 whitespace-nowrap">
                      <button onClick={() => openEdit(x)} className="text-emerald-700 hover:underline">{t("action.edit")}</button>
                      <button onClick={() => remove(x)} className="text-red-600 hover:underline">{t("action.delete")}</button>
                    </td>
                  )}
                </tr>
              ))}
          </tbody>
          {rows.length > 0 && (
            <tfoot>
              <tr className="border-t border-slate-200 font-medium text-slate-800">
                <td className="px-4 py-3" colSpan={4}>{t("common.total")}</td>
                <td className="px-4 py-3 text-right"><Money value={total} /></td>
                {canWrite && <td />}
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {form && (
        <Modal title={form.id ? t("action.edit") : t("expenses.new")} onClose={() => setForm(null)}>
          <form onSubmit={save} className="space-y-4">
            <Field label={t("expenses.category")}>
              <select required value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })} className={inputClass}>
                <option value="">—</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label={t("expenses.amount")}>
                <input type="number" step="any" min="0" required value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} className={inputClass} />
              </Field>
              <Field label={t("expenses.date")}>
                <input type="date" value={form.expenseDate} onChange={(e) => setForm({ ...form, expenseDate: e.target.value })} className={inputClass} />
              </Field>
            </div>
            <Field label={`${t("users.department")} (${t("common.optional")})`}>
              <select value={form.departmentId} onChange={(e) => setForm({ ...form, departmentId: e.target.value })} className={inputClass}>
                <option value="">—</option>
                {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </Field>
            <Field label={`${t("expenses.description")} (${t("common.optional")})`}>
              <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className={inputClass} />
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
