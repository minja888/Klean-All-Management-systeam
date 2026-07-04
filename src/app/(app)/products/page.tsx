"use client";

import { useEffect, useState, useCallback } from "react";
import { useI18n } from "@/components/i18n-provider";
import { PageTips } from "@/components/page-tips";
import { useSession } from "@/components/session-provider";
import { api } from "@/lib/client";
import { PageHeader, Modal, Field, inputClass, btnPrimary, btnSecondary, Money, EmptyRow, Badge } from "@/components/ui";

interface Product {
  id: string; sku: string; name: string; unit: string;
  sellingPrice: string | number; currentStock: number; reorderLevel: number;
  _count: { bomItems: number };
}
interface Material { id: string; name: string; stockUnit: string }
interface BomRow { materialId: string; quantityPerUnit: string }

interface ProductForm { id?: string; sku: string; name: string; unit: string; sellingPrice: string; reorderLevel: string }
const emptyProduct: ProductForm = { sku: "", name: "", unit: "piece", sellingPrice: "0", reorderLevel: "0" };

export default function ProductsPage() {
  const { t } = useI18n();
  const { role } = useSession();
  const canManage = role === "ADMIN" || role === "MANAGER";

  const [products, setProducts] = useState<Product[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState<ProductForm | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // BOM editor state
  const [bomProduct, setBomProduct] = useState<Product | null>(null);
  const [bomRows, setBomRows] = useState<BomRow[]>([]);
  const [bomSaving, setBomSaving] = useState(false);
  const [bomError, setBomError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setProducts(await api.get<Product[]>("/api/products"));
      if (canManage) setMaterials(await api.get<Material[]>("/api/materials"));
    } catch (err) { setError(err instanceof Error ? err.message : "Failed to load"); }
    finally { setLoading(false); }
  }, [canManage]);
  useEffect(() => { load(); }, [load]);

  function openCreate() { setFormError(null); setForm({ ...emptyProduct }); }
  function openEdit(p: Product) {
    setFormError(null);
    setForm({ id: p.id, sku: p.sku, name: p.name, unit: p.unit, sellingPrice: String(p.sellingPrice), reorderLevel: String(p.reorderLevel) });
  }
  async function saveProduct(e: React.FormEvent) {
    e.preventDefault();
    if (!form) return;
    setSaving(true); setFormError(null);
    try {
      const payload = { sku: form.sku, name: form.name, unit: form.unit, sellingPrice: Number(form.sellingPrice), reorderLevel: Number(form.reorderLevel) };
      if (form.id) await api.put(`/api/products/${form.id}`, payload);
      else await api.post("/api/products", payload);
      setForm(null); await load();
    } catch (err) { setFormError(err instanceof Error ? err.message : "Failed to save"); }
    finally { setSaving(false); }
  }
  async function remove(p: Product) {
    if (!confirm(t("common.confirmDelete"))) return;
    try { await api.del(`/api/products/${p.id}`); await load(); }
    catch (err) { alert(err instanceof Error ? err.message : "Failed"); }
  }

  async function openBom(p: Product) {
    setBomError(null); setBomProduct(p);
    try {
      const items = await api.get<{ materialId: string; quantityPerUnit: number }[]>(`/api/products/${p.id}/bom`);
      setBomRows(items.map((i) => ({ materialId: i.materialId, quantityPerUnit: String(i.quantityPerUnit) })));
    } catch { setBomRows([]); }
  }
  async function saveBom(e: React.FormEvent) {
    e.preventDefault();
    if (!bomProduct) return;
    setBomSaving(true); setBomError(null);
    try {
      await api.put(`/api/products/${bomProduct.id}/bom`, {
        items: bomRows.filter((r) => r.materialId).map((r) => ({ materialId: r.materialId, quantityPerUnit: Number(r.quantityPerUnit) })),
      });
      setBomProduct(null); await load();
    } catch (err) { setBomError(err instanceof Error ? err.message : "Failed to save"); }
    finally { setBomSaving(false); }
  }

  return (
    <div className="space-y-4">
      <PageHeader title={t("products.title")}
        action={canManage && <button onClick={openCreate} className={btnPrimary}>+ {t("products.new")}</button>} />
      <PageTips tipKey="tips.products" />
      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500 text-left">
            <tr>
              <th className="px-4 py-3 font-medium">{t("products.sku")}</th>
              <th className="px-4 py-3 font-medium">{t("products.name")}</th>
              <th className="px-4 py-3 font-medium text-right">{t("products.sellingPrice")}</th>
              <th className="px-4 py-3 font-medium text-right">{t("products.currentStock")}</th>
              <th className="px-4 py-3 font-medium text-center">{t("products.bom")}</th>
              {canManage && <th className="px-4 py-3 font-medium text-right">{t("common.actions")}</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? <EmptyRow colSpan={canManage ? 6 : 5} text={t("common.loading")} />
              : products.length === 0 ? <EmptyRow colSpan={canManage ? 6 : 5} text={t("common.noData")} />
              : products.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 text-slate-600">{p.sku}</td>
                  <td className="px-4 py-3 font-medium text-slate-800">{p.name}</td>
                  <td className="px-4 py-3 text-right text-slate-700"><Money value={p.sellingPrice} /></td>
                  <td className="px-4 py-3 text-right text-slate-700">{p.currentStock} {p.unit}</td>
                  <td className="px-4 py-3 text-center"><Badge color={p._count.bomItems > 0 ? "emerald" : "slate"}>{p._count.bomItems}</Badge></td>
                  {canManage && (
                    <td className="px-4 py-3 text-right space-x-3 whitespace-nowrap">
                      <button onClick={() => openBom(p)} className="text-blue-600 hover:underline">{t("products.editBom")}</button>
                      <button onClick={() => openEdit(p)} className="text-emerald-700 hover:underline">{t("action.edit")}</button>
                      <button onClick={() => remove(p)} className="text-red-600 hover:underline">{t("action.delete")}</button>
                    </td>
                  )}
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {/* Product form */}
      {form && (
        <Modal title={form.id ? t("action.edit") : t("products.new")} onClose={() => setForm(null)}>
          <form onSubmit={saveProduct} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Field label={t("products.sku")}>
                <input required value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} className={inputClass} />
              </Field>
              <Field label={t("products.unit")}>
                <input required value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} className={inputClass} />
              </Field>
            </div>
            <Field label={t("products.name")}>
              <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputClass} />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label={t("products.sellingPrice")}>
                <input type="number" step="any" min="0" value={form.sellingPrice} onChange={(e) => setForm({ ...form, sellingPrice: e.target.value })} className={inputClass} />
              </Field>
              <Field label={t("products.reorderLevel")}>
                <input type="number" step="any" min="0" value={form.reorderLevel} onChange={(e) => setForm({ ...form, reorderLevel: e.target.value })} className={inputClass} />
              </Field>
            </div>
            {formError && <p className="text-sm text-red-600">{formError}</p>}
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setForm(null)} className={btnSecondary}>{t("action.cancel")}</button>
              <button type="submit" disabled={saving} className={btnPrimary}>{saving ? t("common.loading") : t("action.save")}</button>
            </div>
          </form>
        </Modal>
      )}

      {/* BOM editor */}
      {bomProduct && (
        <Modal title={`${t("products.bomFor")} — ${bomProduct.name}`} onClose={() => setBomProduct(null)}>
          <form onSubmit={saveBom} className="space-y-3">
            {bomRows.length === 0 && <p className="text-sm text-slate-400">{t("common.noData")}</p>}
            {bomRows.map((r, idx) => (
              <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                <select value={r.materialId} onChange={(e) => setBomRows((prev) => prev.map((x, i) => i === idx ? { ...x, materialId: e.target.value } : x))}
                  className={inputClass + " col-span-7"} required>
                  <option value="">{t("purchases.material")}</option>
                  {materials.map((m) => <option key={m.id} value={m.id}>{m.name} ({m.stockUnit})</option>)}
                </select>
                <input type="number" step="any" min="0" value={r.quantityPerUnit} placeholder={t("products.quantityPerUnit")}
                  onChange={(e) => setBomRows((prev) => prev.map((x, i) => i === idx ? { ...x, quantityPerUnit: e.target.value } : x))}
                  className={inputClass + " col-span-4"} required />
                <button type="button" onClick={() => setBomRows((prev) => prev.filter((_, i) => i !== idx))} className="col-span-1 text-red-500 hover:text-red-700 text-lg">×</button>
              </div>
            ))}
            <button type="button" onClick={() => setBomRows((prev) => [...prev, { materialId: "", quantityPerUnit: "1" }])}
              className="text-sm text-emerald-700 hover:underline">+ {t("products.addMaterial")}</button>

            {bomError && <p className="text-sm text-red-600">{bomError}</p>}
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setBomProduct(null)} className={btnSecondary}>{t("action.cancel")}</button>
              <button type="submit" disabled={bomSaving} className={btnPrimary}>{bomSaving ? t("common.loading") : t("products.saveBom")}</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
