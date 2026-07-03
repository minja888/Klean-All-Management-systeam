"use client";

// Admin → Settings. Tabbed: Company | Departments | Material Categories | Expense Categories.
import { useEffect, useState, useCallback } from "react";
import { useI18n } from "@/components/i18n-provider";
import { api } from "@/lib/client";
import type { TranslationKey } from "@/lib/i18n";

type Tab = "app" | "departments" | "material" | "expense";

const inputClass =
  "w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none";
const btnPrimary = "rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60";
const btnSecondary = "rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50";

export default function SettingsPage() {
  const { t } = useI18n();
  const [tab, setTab] = useState<Tab>("app");

  const tabs: { key: Tab; label: TranslationKey }[] = [
    { key: "app", label: "settings.app" },
    { key: "departments", label: "settings.departments" },
    { key: "material", label: "settings.materialCategories" },
    { key: "expense", label: "settings.expenseCategories" },
  ];

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-slate-800">{t("settings.title")}</h1>

      <div className="flex gap-1 border-b border-slate-200">
        {tabs.map((tb) => (
          <button
            key={tb.key}
            onClick={() => setTab(tb.key)}
            className={
              "px-4 py-2 text-sm font-medium -mb-px border-b-2 " +
              (tab === tb.key
                ? "border-emerald-600 text-emerald-700"
                : "border-transparent text-slate-500 hover:text-slate-700")
            }
          >
            {t(tb.label)}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6">
        {tab === "app" && <CompanyForm />}
        {tab === "departments" && <CrudList endpoint="/api/departments" withDescription usageKeys={["users", "employees"]} />}
        {tab === "material" && <CrudList endpoint="/api/settings/material-categories" usageKeys={["materials"]} />}
        {tab === "expense" && <CrudList endpoint="/api/settings/expense-categories" usageKeys={["expenses"]} />}
      </div>
    </div>
  );
}

// --- Company (app settings) ---------------------------------------------------

interface AppSettings {
  companyName: string;
  currency: string;
  lowStockDefault: string;
  defaultLanguage: string;
}

function CompanyForm() {
  const { t } = useI18n();
  const [data, setData] = useState<AppSettings | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<AppSettings>("/api/settings/app")
      .then(setData)
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load"));
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!data) return;
    setSaving(true);
    setMessage(null);
    setError(null);
    try {
      await api.put("/api/settings/app", data);
      setMessage(t("common.saved"));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  if (error) return <p className="text-sm text-red-600">{error}</p>;
  if (!data) return <p className="text-sm text-slate-400">{t("common.loading")}</p>;

  return (
    <form onSubmit={save} className="max-w-md space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-600 mb-1">{t("settings.companyName")}</label>
        <input value={data.companyName} onChange={(e) => setData({ ...data, companyName: e.target.value })} className={inputClass} />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-600 mb-1">{t("settings.currency")}</label>
        <input value={data.currency} onChange={(e) => setData({ ...data, currency: e.target.value })} className={inputClass} />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-600 mb-1">{t("settings.lowStockDefault")}</label>
        <input
          type="number"
          value={data.lowStockDefault}
          onChange={(e) => setData({ ...data, lowStockDefault: e.target.value })}
          className={inputClass}
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-600 mb-1">{t("settings.defaultLanguage")}</label>
        <select
          value={data.defaultLanguage}
          onChange={(e) => setData({ ...data, defaultLanguage: e.target.value })}
          className={inputClass}
        >
          <option value="en">English</option>
          <option value="sw">Kiswahili</option>
        </select>
      </div>

      {message && <p className="text-sm text-emerald-600">{message}</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}

      <button type="submit" disabled={saving} className={btnPrimary}>
        {saving ? t("common.loading") : t("action.save")}
      </button>
    </form>
  );
}

// --- Generic name(+description) list manager ---------------------------------

interface CrudItem {
  id: string;
  name: string;
  description?: string | null;
  _count?: Record<string, number>;
}

function CrudList({
  endpoint,
  withDescription = false,
  usageKeys = [],
}: {
  endpoint: string;
  withDescription?: boolean;
  usageKeys?: string[];
}) {
  const { t } = useI18n();
  const [items, setItems] = useState<CrudItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setItems(await api.get<CrudItem[]>(endpoint));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [endpoint]);

  useEffect(() => {
    load();
  }, [load]);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    try {
      await api.post(endpoint, withDescription ? { name, description } : { name });
      setName("");
      setDescription("");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add");
    }
  }

  function startEdit(item: CrudItem) {
    setEditingId(item.id);
    setEditName(item.name);
    setEditDescription(item.description ?? "");
  }

  async function saveEdit(id: string) {
    try {
      await api.put(`${endpoint}/${id}`, withDescription ? { name: editName, description: editDescription } : { name: editName });
      setEditingId(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    }
  }

  async function remove(id: string) {
    if (!confirm(t("common.confirmDelete"))) return;
    try {
      await api.del(`${endpoint}/${id}`);
      await load();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete");
    }
  }

  const usageCount = (item: CrudItem) => usageKeys.reduce((sum, k) => sum + (item._count?.[k] ?? 0), 0);

  return (
    <div className="space-y-4">
      {/* Add row */}
      <form onSubmit={add} className="flex flex-wrap gap-2 items-end">
        <div className="flex-1 min-w-[10rem]">
          <label className="block text-sm font-medium text-slate-600 mb-1">{t("settings.categoryName")}</label>
          <input value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
        </div>
        {withDescription && (
          <div className="flex-1 min-w-[10rem]">
            <label className="block text-sm font-medium text-slate-600 mb-1">{t("settings.description")}</label>
            <input value={description} onChange={(e) => setDescription(e.target.value)} className={inputClass} />
          </div>
        )}
        <button type="submit" className={btnPrimary}>
          + {t("action.add")}
        </button>
      </form>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="border border-slate-200 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500 text-left">
            <tr>
              <th className="px-4 py-2 font-medium">{t("settings.categoryName")}</th>
              {withDescription && <th className="px-4 py-2 font-medium">{t("settings.description")}</th>}
              <th className="px-4 py-2 font-medium text-right">{t("common.actions")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={3} className="px-4 py-6 text-center text-slate-400">
                  {t("common.loading")}
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-4 py-6 text-center text-slate-400">
                  {t("common.noData")}
                </td>
              </tr>
            ) : (
              items.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50">
                  <td className="px-4 py-2">
                    {editingId === item.id ? (
                      <input value={editName} onChange={(e) => setEditName(e.target.value)} className={inputClass} />
                    ) : (
                      <span className="text-slate-800">
                        {item.name}
                        {usageKeys.length > 0 && (
                          <span className="ml-2 text-xs text-slate-400">({usageCount(item)})</span>
                        )}
                      </span>
                    )}
                  </td>
                  {withDescription && (
                    <td className="px-4 py-2 text-slate-600">
                      {editingId === item.id ? (
                        <input value={editDescription} onChange={(e) => setEditDescription(e.target.value)} className={inputClass} />
                      ) : (
                        item.description || "—"
                      )}
                    </td>
                  )}
                  <td className="px-4 py-2 text-right space-x-2 whitespace-nowrap">
                    {editingId === item.id ? (
                      <>
                        <button onClick={() => saveEdit(item.id)} className={btnPrimary}>
                          {t("action.save")}
                        </button>
                        <button onClick={() => setEditingId(null)} className={btnSecondary}>
                          {t("action.cancel")}
                        </button>
                      </>
                    ) : (
                      <>
                        <button onClick={() => startEdit(item)} className="text-emerald-700 hover:underline">
                          {t("action.edit")}
                        </button>
                        <button onClick={() => remove(item.id)} className="text-red-600 hover:underline">
                          {t("action.delete")}
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
