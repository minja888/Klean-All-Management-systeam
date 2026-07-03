"use client";

import { useEffect, useState, useCallback } from "react";
import { useI18n } from "@/components/i18n-provider";
import { useCanWrite } from "@/components/session-provider";
import { api } from "@/lib/client";
import { PageHeader, Modal, Field, inputClass, btnPrimary, btnSecondary, Money, EmptyRow } from "@/components/ui";

interface Category { id: string; name: string }
interface Department { id: string; name: string }
interface Material {
  id: string;
  name: string;
  purchaseUnit: string;
  stockUnit: string;
  conversionFactor: number;
  reorderLevel: number;
  costPrice: string | number;
  currentStock: number;
  categoryId: string;
  departmentId: string | null;
  category: Category | null;
  department: Department | null;
}

interface FormState {
  id?: string;
  name: string;
  categoryId: string;
  purchaseUnit: string;
  stockUnit: string;
  conversionFactor: string;
  reorderLevel: string;
  costPrice: string;
  currentStock: string;
  departmentId: string;
}

const empty: FormState = {
  name: "", categoryId: "", purchaseUnit: "roll", stockUnit: "metre",
  conversionFactor: "1", reorderLevel: "0", costPrice: "0", currentStock: "0", departmentId: "",
};

export default function MaterialsPage() {
  const { t } = useI18n();
  const canWrite = useCanWrite("materials_inventory");

  const [materials, setMaterials] = useState<Material[]>([]);
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
      setMaterials(await api.get<Material[]>("/api/materials"));
      if (canWrite) {
        // Only ADMIN can write; the category/department pickers are ADMIN-only endpoints.
        setCategories(await api.get<Category[]>("/api/settings/material-categories"));
        setDepartments(await api.get<Department[]>("/api/departments"));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [canWrite]);

  useEffect(() => { load(); }, [load]);

  function openCreate() { setFormError(null); setForm({ ...empty }); }
  function openEdit(m: Material) {
    setFormError(null);
    setForm({
      id: m.id, name: m.name, categoryId: m.categoryId, purchaseUnit: m.purchaseUnit, stockUnit: m.stockUnit,
      conversionFactor: String(m.conversionFactor), reorderLevel: String(m.reorderLevel),
      costPrice: String(m.costPrice), currentStock: String(m.currentStock), departmentId: m.departmentId ?? "",
    });
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!form) return;
    setSaving(true); setFormError(null);
    try {
      const payload = {
        name: form.name, categoryId: form.categoryId, purchaseUnit: form.purchaseUnit, stockUnit: form.stockUnit,
        conversionFactor: Number(form.conversionFactor), reorderLevel: Number(form.reorderLevel),
        costPrice: Number(form.costPrice), currentStock: Number(form.currentStock),
        departmentId: form.departmentId || null,
      };
      if (form.id) await api.put(`/api/materials/${form.id}`, payload);
      else await api.post("/api/materials", payload);
      setForm(null);
      await load();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to save");
    } finally { setSaving(false); }
  }

  async function remove(m: Material) {
    if (!confirm(t("common.confirmDelete"))) return;
    try { await api.del(`/api/materials/${m.id}`); await load(); }
    catch (err) { alert(err instanceof Error ? err.message : "Failed to delete"); }
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title={t("materials.title")}
        action={canWrite && <button onClick={openCreate} className={btnPrimary}>+ {t("materials.new")}</button>}
      />
      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500 text-left">
            <tr>
              <th className="px-4 py-3 font-medium">{t("materials.name")}</th>
              <th className="px-4 py-3 font-medium">{t("materials.category")}</th>
              <th className="px-4 py-3 font-medium">{t("materials.stockUnit")}</th>
              <th className="px-4 py-3 font-medium text-right">{t("materials.currentStock")}</th>
              <th className="px-4 py-3 font-medium text-right">{t("materials.reorderLevel")}</th>
              <th className="px-4 py-3 font-medium text-right">{t("materials.costPrice")}</th>
              {canWrite && <th className="px-4 py-3 font-medium text-right">{t("common.actions")}</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? <EmptyRow colSpan={canWrite ? 7 : 6} text={t("common.loading")} />
              : materials.length === 0 ? <EmptyRow colSpan={canWrite ? 7 : 6} text={t("common.noData")} />
              : materials.map((m) => (
                <tr key={m.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-800">{m.name}</td>
                  <td className="px-4 py-3 text-slate-600">{m.category?.name ?? "—"}</td>
                  <td className="px-4 py-3 text-slate-600">{m.stockUnit}</td>
                  <td className="px-4 py-3 text-right text-slate-700">{m.currentStock}</td>
                  <td className="px-4 py-3 text-right text-slate-500">{m.reorderLevel}</td>
                  <td className="px-4 py-3 text-right text-slate-700"><Money value={m.costPrice} /></td>
                  {canWrite && (
                    <td className="px-4 py-3 text-right space-x-3 whitespace-nowrap">
                      <button onClick={() => openEdit(m)} className="text-emerald-700 hover:underline">{t("action.edit")}</button>
                      <button onClick={() => remove(m)} className="text-red-600 hover:underline">{t("action.delete")}</button>
                    </td>
                  )}
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {form && (
        <Modal title={form.id ? t("action.edit") : t("materials.new")} onClose={() => setForm(null)}>
          <form onSubmit={save} className="space-y-4">
            <Field label={t("materials.name")}>
              <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputClass} />
            </Field>
            <Field label={t("materials.category")}>
              <select required value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })} className={inputClass}>
                <option value="">—</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label={t("materials.purchaseUnit")}>
                <input required value={form.purchaseUnit} onChange={(e) => setForm({ ...form, purchaseUnit: e.target.value })} className={inputClass} />
              </Field>
              <Field label={t("materials.stockUnit")}>
                <input required value={form.stockUnit} onChange={(e) => setForm({ ...form, stockUnit: e.target.value })} className={inputClass} />
              </Field>
            </div>
            <Field label={t("materials.conversionFactor")}>
              <input type="number" step="any" min="0.0001" required value={form.conversionFactor}
                onChange={(e) => setForm({ ...form, conversionFactor: e.target.value })} className={inputClass} />
              <p className="text-xs text-slate-400 mt-1">{t("materials.conversionHint")}</p>
            </Field>
            <div className="grid grid-cols-3 gap-3">
              <Field label={t("materials.reorderLevel")}>
                <input type="number" step="any" min="0" value={form.reorderLevel} onChange={(e) => setForm({ ...form, reorderLevel: e.target.value })} className={inputClass} />
              </Field>
              <Field label={t("materials.costPrice")}>
                <input type="number" step="any" min="0" value={form.costPrice} onChange={(e) => setForm({ ...form, costPrice: e.target.value })} className={inputClass} />
              </Field>
              <Field label={t("materials.currentStock")}>
                <input type="number" step="any" min="0" value={form.currentStock} onChange={(e) => setForm({ ...form, currentStock: e.target.value })} className={inputClass} />
              </Field>
            </div>
            <Field label={`${t("users.department")} (${t("common.optional")})`}>
              <select value={form.departmentId} onChange={(e) => setForm({ ...form, departmentId: e.target.value })} className={inputClass}>
                <option value="">—</option>
                {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
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
