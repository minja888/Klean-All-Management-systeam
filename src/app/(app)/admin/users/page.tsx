"use client";

// Admin → Users. Create / edit / delete users and assign role + department.
import { useEffect, useState, useCallback } from "react";
import { useI18n } from "@/components/i18n-provider";
import { api } from "@/lib/client";
import type { TranslationKey } from "@/lib/i18n";

type RoleValue = "ADMIN" | "MANAGER" | "ACCOUNTING" | "WORKER";
const ROLES: RoleValue[] = ["ADMIN", "MANAGER", "ACCOUNTING", "WORKER"];

interface Department {
  id: string;
  name: string;
}
interface UserRow {
  id: string;
  name: string;
  email: string;
  role: RoleValue;
  isActive: boolean;
  departmentId: string | null;
  department: Department | null;
}

interface FormState {
  id?: string;
  name: string;
  email: string;
  password: string;
  role: RoleValue;
  departmentId: string;
  isActive: boolean;
}

const emptyForm: FormState = {
  name: "",
  email: "",
  password: "",
  role: "WORKER",
  departmentId: "",
  isActive: true,
};

export default function UsersPage() {
  const { t } = useI18n();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState<FormState | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [u, d] = await Promise.all([
        api.get<UserRow[]>("/api/users"),
        api.get<Department[]>("/api/departments"),
      ]);
      setUsers(u);
      setDepartments(d);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function openCreate() {
    setFormError(null);
    setForm({ ...emptyForm });
  }
  function openEdit(u: UserRow) {
    setFormError(null);
    setForm({
      id: u.id,
      name: u.name,
      email: u.email,
      password: "",
      role: u.role,
      departmentId: u.departmentId ?? "",
      isActive: u.isActive,
    });
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!form) return;
    setSaving(true);
    setFormError(null);
    try {
      const payload = {
        name: form.name,
        email: form.email,
        role: form.role,
        departmentId: form.departmentId || null,
        isActive: form.isActive,
        ...(form.password ? { password: form.password } : {}),
      };
      if (form.id) {
        await api.put(`/api/users/${form.id}`, payload);
      } else {
        await api.post("/api/users", { ...payload, password: form.password });
      }
      setForm(null);
      await load();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  async function remove(u: UserRow) {
    if (!confirm(t("common.confirmDelete"))) return;
    try {
      await api.del(`/api/users/${u.id}`);
      await load();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete");
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-800">{t("users.title")}</h1>
        <button
          onClick={openCreate}
          className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
        >
          + {t("users.new")}
        </button>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500 text-left">
            <tr>
              <th className="px-4 py-3 font-medium">{t("users.name")}</th>
              <th className="px-4 py-3 font-medium">{t("auth.email")}</th>
              <th className="px-4 py-3 font-medium">{t("users.role")}</th>
              <th className="px-4 py-3 font-medium">{t("users.department")}</th>
              <th className="px-4 py-3 font-medium">{t("users.status")}</th>
              <th className="px-4 py-3 font-medium text-right">{t("common.actions")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-slate-400">
                  {t("common.loading")}
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-slate-400">
                  {t("common.noData")}
                </td>
              </tr>
            ) : (
              users.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-800">{u.name}</td>
                  <td className="px-4 py-3 text-slate-600">{u.email}</td>
                  <td className="px-4 py-3 text-slate-600">{t(`role.${u.role}` as TranslationKey)}</td>
                  <td className="px-4 py-3 text-slate-600">{u.department?.name ?? "—"}</td>
                  <td className="px-4 py-3">
                    <span
                      className={
                        "inline-flex rounded-full px-2 py-0.5 text-xs " +
                        (u.isActive ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500")
                      }
                    >
                      {u.isActive ? t("users.active") : t("users.inactive")}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right space-x-3 whitespace-nowrap">
                    <button onClick={() => openEdit(u)} className="text-emerald-700 hover:underline">
                      {t("action.edit")}
                    </button>
                    <button onClick={() => remove(u)} className="text-red-600 hover:underline">
                      {t("action.delete")}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Create / edit modal */}
      {form && (
        <div className="fixed inset-0 bg-slate-900/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md">
            <form onSubmit={save} className="p-6 space-y-4">
              <h2 className="text-lg font-semibold text-slate-800">
                {form.id ? t("action.edit") : t("users.new")}
              </h2>

              <Field label={t("users.name")}>
                <input
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className={inputClass}
                />
              </Field>

              <Field label={t("auth.email")}>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className={inputClass}
                />
              </Field>

              <Field label={t("auth.password")}>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={form.password}
                    required={!form.id}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    className={inputClass + " pr-16"}
                    placeholder={form.id ? "••••••" : ""}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    className="absolute inset-y-0 right-2 my-auto h-6 px-2 text-xs font-medium text-emerald-700 hover:text-emerald-800"
                    tabIndex={-1}
                  >
                    {showPassword ? t("auth.hide") : t("auth.show")}
                  </button>
                </div>
                {form.id && <p className="text-xs text-slate-400 mt-1">{t("users.passwordHint")}</p>}
              </Field>

              <Field label={t("users.role")}>
                <select
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value as RoleValue })}
                  className={inputClass}
                >
                  {ROLES.map((r) => (
                    <option key={r} value={r}>
                      {t(`role.${r}` as TranslationKey)}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label={t("users.department")}>
                <select
                  value={form.departmentId}
                  onChange={(e) => setForm({ ...form, departmentId: e.target.value })}
                  className={inputClass}
                  required={form.role === "WORKER"}
                >
                  <option value="">—</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </Field>

              <label className="flex items-center gap-2 text-sm text-slate-600">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                />
                {t("users.active")}
              </label>

              {formError && <p className="text-sm text-red-600">{formError}</p>}

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setForm(null)} className={btnSecondary}>
                  {t("action.cancel")}
                </button>
                <button type="submit" disabled={saving} className={btnPrimary}>
                  {saving ? t("common.loading") : t("action.save")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// Small shared bits (kept local to the page for clarity).
const inputClass =
  "w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none";
const btnPrimary = "rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60";
const btnSecondary = "rounded-md border border-slate-300 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-600 mb-1">{label}</label>
      {children}
    </div>
  );
}
