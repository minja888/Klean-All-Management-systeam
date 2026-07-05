"use client";

import { useEffect, useState, useCallback } from "react";
import { useI18n } from "@/components/i18n-provider";
import { PageTips } from "@/components/page-tips";
import { useCanWrite } from "@/components/session-provider";
import { api } from "@/lib/client";
import { formatTZS } from "@/lib/money";
import { PageHeader, Modal, Field, inputClass, btnPrimary, btnSecondary, Money, Badge, EmptyRow } from "@/components/ui";
import type { TranslationKey } from "@/lib/i18n";

type Tab = "employees" | "runs";
type PStatus = "DRAFT" | "APPROVED" | "PAID";
interface Department { id: string; name: string }
interface Employee { id: string; name: string; position: string | null; baseSalary: string | number; phone: string | null; isActive: boolean; departmentId: string | null; department: Department | null }
interface Run { id: string; periodYear: number; periodMonth: number; status: PStatus; totalNet: string | number; _count: { items: number } }

const statusColor: Record<PStatus, "slate" | "blue" | "emerald"> = { DRAFT: "slate", APPROVED: "blue", PAID: "emerald" };

export default function PayrollPage() {
  const { t } = useI18n();
  const canWrite = useCanWrite("expenses_payroll");
  const [tab, setTab] = useState<Tab>("employees");

  return (
    <div className="space-y-4">
      <PageHeader title={t("payroll.title")} />
      <PageTips tipKey="tips.payroll" />
      <div className="flex gap-1 border-b border-slate-200">
        {(["employees", "runs"] as Tab[]).map((tb) => (
          <button key={tb} onClick={() => setTab(tb)}
            className={"px-4 py-2 text-sm font-medium -mb-px border-b-2 " + (tab === tb ? "border-emerald-600 text-emerald-700" : "border-transparent text-slate-500 hover:text-slate-700")}>
            {t(tb === "employees" ? "payroll.employees" : "payroll.runs")}
          </button>
        ))}
      </div>
      {tab === "employees" ? <Employees canWrite={canWrite} /> : <Runs canWrite={canWrite} />}
    </div>
  );
}

// --- Employees ---------------------------------------------------------------
interface EmpForm { id?: string; name: string; position: string; departmentId: string; baseSalary: string; phone: string; isActive: boolean }
const emptyEmp = (): EmpForm => ({ name: "", position: "", departmentId: "", baseSalary: "0", phone: "", isActive: true });

function Employees({ canWrite }: { canWrite: boolean }) {
  const { t } = useI18n();
  const [rows, setRows] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<EmpForm | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setRows(await api.get<Employee[]>("/api/employees"));
      if (canWrite) setDepartments(await api.get<Department[]>("/api/departments"));
    } catch (err) { setError(err instanceof Error ? err.message : "Failed"); }
    finally { setLoading(false); }
  }, [canWrite]);
  useEffect(() => { load(); }, [load]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!form) return;
    setSaving(true); setError(null);
    try {
      const payload = { name: form.name, position: form.position || null, departmentId: form.departmentId || null, baseSalary: Number(form.baseSalary), phone: form.phone || null, isActive: form.isActive };
      if (form.id) await api.put(`/api/employees/${form.id}`, payload);
      else await api.post("/api/employees", payload);
      setForm(null); await load();
    } catch (err) { setError(err instanceof Error ? err.message : "Failed"); }
    finally { setSaving(false); }
  }
  async function remove(x: Employee) {
    if (!confirm(t("common.confirmDelete"))) return;
    try { await api.del(`/api/employees/${x.id}`); await load(); } catch (err) { alert(err instanceof Error ? err.message : "Failed"); }
  }

  return (
    <div className="space-y-3">
      {canWrite && <div className="flex justify-end"><button onClick={() => setForm(emptyEmp())} className={btnPrimary}>+ {t("payroll.newEmployee")}</button></div>}
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-[var(--brand-50)] text-emerald-900/70 text-left">
            <tr>
              <th className="px-4 py-3 font-medium">{t("payroll.employee")}</th>
              <th className="px-4 py-3 font-medium">{t("payroll.position")}</th>
              <th className="px-4 py-3 font-medium">{t("users.department")}</th>
              <th className="px-4 py-3 font-medium text-right">{t("payroll.baseSalary")}</th>
              <th className="px-4 py-3 font-medium">{t("payroll.active")}</th>
              {canWrite && <th className="px-4 py-3 font-medium text-right">{t("common.actions")}</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? <EmptyRow colSpan={canWrite ? 6 : 5} text={t("common.loading")} />
              : rows.length === 0 ? <EmptyRow colSpan={canWrite ? 6 : 5} text={t("common.noData")} />
              : rows.map((x) => (
                <tr key={x.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-800">{x.name}</td>
                  <td className="px-4 py-3 text-slate-600">{x.position ?? "—"}</td>
                  <td className="px-4 py-3 text-slate-600">{x.department?.name ?? "—"}</td>
                  <td className="px-4 py-3 text-right text-slate-700"><Money value={x.baseSalary} /></td>
                  <td className="px-4 py-3">{x.isActive ? <Badge color="emerald">{t("users.active")}</Badge> : <Badge>{t("users.inactive")}</Badge>}</td>
                  {canWrite && (
                    <td className="px-4 py-3 text-right space-x-3 whitespace-nowrap">
                      <button onClick={() => setForm({ id: x.id, name: x.name, position: x.position ?? "", departmentId: x.departmentId ?? "", baseSalary: String(x.baseSalary), phone: x.phone ?? "", isActive: x.isActive })} className="text-emerald-700 hover:underline">{t("action.edit")}</button>
                      <button onClick={() => remove(x)} className="text-red-600 hover:underline">{t("action.delete")}</button>
                    </td>
                  )}
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {form && (
        <Modal title={form.id ? t("action.edit") : t("payroll.newEmployee")} onClose={() => setForm(null)}>
          <form onSubmit={save} className="space-y-4">
            <Field label={t("payroll.employee")}><input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputClass} /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label={t("payroll.position")}><input value={form.position} onChange={(e) => setForm({ ...form, position: e.target.value })} className={inputClass} /></Field>
              <Field label={t("payroll.baseSalary")}><input type="number" step="any" min="0" value={form.baseSalary} onChange={(e) => setForm({ ...form, baseSalary: e.target.value })} className={inputClass} /></Field>
            </div>
            <Field label={`${t("users.department")} (${t("common.optional")})`}>
              <select value={form.departmentId} onChange={(e) => setForm({ ...form, departmentId: e.target.value })} className={inputClass}>
                <option value="">—</option>
                {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </Field>
            <Field label={t("payroll.phone")}><input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className={inputClass} /></Field>
            <label className="flex items-center gap-2 text-sm text-slate-600">
              <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} /> {t("payroll.active")}
            </label>
            {error && <p className="text-sm text-red-600">{error}</p>}
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

// --- Payroll runs ------------------------------------------------------------
function Runs({ canWrite }: { canWrite: boolean }) {
  const { t } = useI18n();
  const [rows, setRows] = useState<Run[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openRunId, setOpenRunId] = useState<string | null>(null);
  const now = new Date();
  const [year, setYear] = useState(String(now.getFullYear()));
  const [month, setMonth] = useState(String(now.getMonth() + 1));
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try { setRows(await api.get<Run[]>("/api/payroll-runs")); }
    catch (err) { setError(err instanceof Error ? err.message : "Failed"); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  async function createRun() {
    setCreating(true); setError(null);
    try { await api.post("/api/payroll-runs", { periodYear: Number(year), periodMonth: Number(month) }); await load(); }
    catch (err) { setError(err instanceof Error ? err.message : "Failed"); }
    finally { setCreating(false); }
  }

  return (
    <div className="space-y-3">
      {canWrite && (
        <div className="flex items-end gap-2 flex-wrap">
          <Field label={t("payroll.year")}><input type="number" value={year} onChange={(e) => setYear(e.target.value)} className={inputClass + " w-28"} /></Field>
          <Field label={t("payroll.month")}><input type="number" min="1" max="12" value={month} onChange={(e) => setMonth(e.target.value)} className={inputClass + " w-24"} /></Field>
          <button onClick={createRun} disabled={creating} className={btnPrimary}>+ {t("payroll.newRun")}</button>
        </div>
      )}
      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-[var(--brand-50)] text-emerald-900/70 text-left">
            <tr>
              <th className="px-4 py-3 font-medium">{t("payroll.period")}</th>
              <th className="px-4 py-3 font-medium">{t("payroll.status")}</th>
              <th className="px-4 py-3 font-medium text-right">{t("payroll.employees")}</th>
              <th className="px-4 py-3 font-medium text-right">{t("payroll.totalNet")}</th>
              <th className="px-4 py-3 font-medium text-right">{t("common.actions")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? <EmptyRow colSpan={5} text={t("common.loading")} />
              : rows.length === 0 ? <EmptyRow colSpan={5} text={t("common.noData")} />
              : rows.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-800">{r.periodYear}-{String(r.periodMonth).padStart(2, "0")}</td>
                  <td className="px-4 py-3"><Badge color={statusColor[r.status]}>{t(`pstatus.${r.status}` as TranslationKey)}</Badge></td>
                  <td className="px-4 py-3 text-right text-slate-600">{r._count.items}</td>
                  <td className="px-4 py-3 text-right text-slate-800"><Money value={r.totalNet} /></td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => setOpenRunId(r.id)} className="text-emerald-700 hover:underline">{t("payroll.openRun")}</button>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {openRunId && <RunDetail runId={openRunId} canWrite={canWrite} onClose={() => setOpenRunId(null)} onChanged={load} />}
    </div>
  );
}

interface RunItem {
  id: string; baseSalary: string | number; bonus: string | number; foodAllowance: string | number;
  transportAllowance: string | number; deductions: string | number; netPay: string | number;
  employee: { name: string; position: string | null };
}
interface RunFull { id: string; periodYear: number; periodMonth: number; status: PStatus; totalNet: string | number; items: RunItem[] }

function RunDetail({ runId, canWrite, onClose, onChanged }: { runId: string; canWrite: boolean; onClose: () => void; onChanged: () => void }) {
  const { t } = useI18n();
  const [run, setRun] = useState<RunFull | null>(null);
  const [items, setItems] = useState<Record<string, { bonus: string; food: string; transport: string; deductions: string; base: number }>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const data = await api.get<RunFull>(`/api/payroll-runs/${runId}`);
    setRun(data);
    const map: Record<string, { bonus: string; food: string; transport: string; deductions: string; base: number }> = {};
    for (const it of data.items) {
      map[it.id] = { bonus: String(it.bonus), food: String(it.foodAllowance), transport: String(it.transportAllowance), deductions: String(it.deductions), base: Number(it.baseSalary) };
    }
    setItems(map);
  }, [runId]);
  useEffect(() => { load(); }, [load]);

  const editable = run?.status === "DRAFT";
  const netFor = (id: string) => {
    const it = items[id]; if (!it) return 0;
    return it.base + Number(it.bonus || 0) + Number(it.food || 0) + Number(it.transport || 0) - Number(it.deductions || 0);
  };
  const totalNet = run ? run.items.reduce((s, it) => s + netFor(it.id), 0) : 0;

  async function save() {
    if (!run) return;
    setBusy(true); setError(null);
    try {
      await api.put(`/api/payroll-runs/${run.id}`, {
        items: run.items.map((it) => ({ id: it.id, bonus: Number(items[it.id].bonus || 0), foodAllowance: Number(items[it.id].food || 0), transportAllowance: Number(items[it.id].transport || 0), deductions: Number(items[it.id].deductions || 0) })),
      });
      await load(); onChanged();
    } catch (err) { setError(err instanceof Error ? err.message : "Failed"); }
    finally { setBusy(false); }
  }
  async function action(path: string) {
    if (!run) return;
    setBusy(true); setError(null);
    try { await api.post(`/api/payroll-runs/${run.id}/${path}`, {}); await load(); onChanged(); }
    catch (err) { setError(err instanceof Error ? err.message : "Failed"); }
    finally { setBusy(false); }
  }

  return (
    <div className="fixed inset-0 bg-slate-900/40 flex items-center justify-center p-4 z-50" onMouseDown={onClose}>
      <div className="bg-white rounded-xl shadow-lg w-full max-w-3xl max-h-[90vh] overflow-y-auto" onMouseDown={(e) => e.stopPropagation()}>
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-800">
            {run ? `${run.periodYear}-${String(run.periodMonth).padStart(2, "0")}` : t("common.loading")}
          </h2>
          {run && <Badge color={statusColor[run.status]}>{t(`pstatus.${run.status}` as TranslationKey)}</Badge>}
        </div>

        <div className="p-6 space-y-4">
          {error && <p className="text-sm text-red-600">{error}</p>}
          {!run ? <p className="text-slate-400">{t("common.loading")}</p> : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-slate-500 text-left">
                    <tr>
                      <th className="py-2 pr-2">{t("payroll.employee")}</th>
                      <th className="py-2 px-2 text-right">{t("payroll.baseSalary")}</th>
                      <th className="py-2 px-2 text-right">{t("payroll.bonus")}</th>
                      <th className="py-2 px-2 text-right">{t("payroll.foodAllowance")}</th>
                      <th className="py-2 px-2 text-right">{t("payroll.transportAllowance")}</th>
                      <th className="py-2 px-2 text-right">{t("payroll.deductions")}</th>
                      <th className="py-2 pl-2 text-right">{t("payroll.netPay")}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {run.items.map((it) => (
                      <tr key={it.id}>
                        <td className="py-2 pr-2 text-slate-800">{it.employee.name}</td>
                        <td className="py-2 px-2 text-right text-slate-600">{formatTZS(it.baseSalary)}</td>
                        {(["bonus", "food", "transport", "deductions"] as const).map((k) => (
                          <td key={k} className="py-2 px-2">
                            <input type="number" step="any" min="0" disabled={!editable}
                              value={items[it.id]?.[k] ?? "0"}
                              onChange={(e) => setItems((prev) => ({ ...prev, [it.id]: { ...prev[it.id], [k]: e.target.value } }))}
                              className="w-24 rounded border border-slate-300 px-2 py-1 text-right text-sm disabled:bg-slate-50" />
                          </td>
                        ))}
                        <td className="py-2 pl-2 text-right font-medium text-slate-800">{formatTZS(netFor(it.id))}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex items-center justify-between border-t border-slate-100 pt-3">
                <span className="text-sm text-slate-500">{t("payroll.totalNet")}</span>
                <span className="text-lg font-semibold text-slate-800">{formatTZS(totalNet)}</span>
              </div>

              {canWrite && (
                <div className="flex justify-end gap-2">
                  {editable && <button onClick={save} disabled={busy} className={btnSecondary}>{t("action.save")}</button>}
                  {run.status === "DRAFT" && <button onClick={() => action("approve")} disabled={busy} className={btnPrimary}>{t("payroll.approve")}</button>}
                  {run.status === "APPROVED" && <button onClick={() => action("pay")} disabled={busy} className={btnPrimary}>{t("payroll.pay")}</button>}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
