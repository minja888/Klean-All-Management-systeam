"use client";

import { useEffect, useState, useCallback } from "react";
import { useI18n } from "@/components/i18n-provider";
import { PageTips } from "@/components/page-tips";
import { useCanWrite } from "@/components/session-provider";
import { api } from "@/lib/client";
import { formatTZS } from "@/lib/money";
import { PageHeader, Card, Modal, Field, inputClass, btnPrimary, btnSecondary, Money, Badge, EmptyRow } from "@/components/ui";
import type { TranslationKey } from "@/lib/i18n";

type Tab = "payments" | "capital" | "ledger" | "balance";

export default function AccountingPage() {
  const { t } = useI18n();
  const canWrite = useCanWrite("payments_accounting");
  const [tab, setTab] = useState<Tab>("payments");

  return (
    <div className="space-y-4">
      <PageHeader title={t("accounting.title")} />
      <PageTips tipKey="tips.accounting" />

      <div className="flex gap-1 border-b border-slate-200 overflow-x-auto">
        {([
          ["payments", "accounting.tabPayments"],
          ["capital", "accounting.tabCapital"],
          ["ledger", "accounting.tabLedger"],
          ["balance", "accounting.tabBalance"],
        ] as [Tab, TranslationKey][]).map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)}
            className={"px-4 py-2 text-sm font-medium -mb-px border-b-2 whitespace-nowrap " +
              (tab === key ? "border-emerald-600 text-emerald-700" : "border-transparent text-slate-500 hover:text-slate-700")}>
            {t(label)}
          </button>
        ))}
      </div>

      {tab === "payments" && <PaymentsTab canWrite={canWrite} />}
      {tab === "capital" && <CapitalTab canWrite={canWrite} />}
      {tab === "ledger" && <LedgerTab />}
      {tab === "balance" && <BalanceSheetTab goTo={(tb) => setTab(tb)} />}
    </div>
  );
}

// --- Tab 4: Balance sheet (Mizania) — clickable lines --------------------------
interface BSData {
  asOf: string;
  assets: { cash: number; materialStock: number; productStock: number; receivables: number; total: number };
  liabilities: { payables: number; loansOutstanding: number; creditors: { name: string; info: string | null; outstanding: number }[]; total: number };
  equity: { capital: number; retainedProfit: number; total: number };
}

function BalanceSheetTab({ goTo }: { goTo: (tab: Tab) => void }) {
  const { t } = useI18n();
  const [data, setData] = useState<BSData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.get<BSData>("/api/accounting/balance-sheet").then(setData)
      .catch((e) => setError(e instanceof Error ? e.message : "Failed"));
  }, []);

  if (error) return <p className="text-sm text-red-600">{error}</p>;
  if (!data) return <p className="text-sm text-slate-400">{t("common.loading")}</p>;

  const row = (label: string, value: number, onClick?: () => void, href?: string) => (
    <tr className={onClick || href ? "hover:bg-emerald-50 cursor-pointer" : ""}
      onClick={onClick ?? (href ? () => { window.location.href = href; } : undefined)}>
      <td className="py-2 text-slate-600">{(onClick || href) ? <span className="underline decoration-dotted">{label}</span> : label}</td>
      <td className="py-2 text-right text-slate-800">{formatTZS(value)}</td>
    </tr>
  );

  return (
    <>
      <p className="text-sm text-slate-500">{t("bs.asOf")}: {new Date(data.asOf).toLocaleDateString(undefined, { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Assets */}
        <Card className="p-4">
          <div className="font-semibold text-emerald-700 mb-2">💰 {t("bs.assets")}</div>
          <table className="w-full text-sm">
            <tbody className="divide-y divide-slate-100">
              {row(t("bs.cash"), data.assets.cash, () => goTo("ledger"))}
              {row(t("bs.materialStock"), data.assets.materialStock, undefined, "/inventory")}
              {row(t("bs.productStock"), data.assets.productStock, undefined, "/products")}
              {row(t("bs.receivables"), data.assets.receivables, () => goTo("payments"))}
              <tr className="font-semibold text-slate-900 border-t-2 border-slate-300">
                <td className="py-2">{t("bs.totalAssets")}</td>
                <td className="py-2 text-right">{formatTZS(data.assets.total)}</td>
              </tr>
            </tbody>
          </table>
        </Card>

        {/* Liabilities + Equity */}
        <Card className="p-4">
          <div className="font-semibold text-red-700 mb-2">📉 {t("bs.liabilities")}</div>
          <table className="w-full text-sm">
            <tbody className="divide-y divide-slate-100">
              {row(t("bs.payables"), data.liabilities.payables, () => goTo("payments"))}
              {row(t("bs.loans"), data.liabilities.loansOutstanding, () => goTo("capital"))}
              {data.liabilities.creditors.map((c) => (
                <tr key={c.name} className="text-xs text-slate-500 cursor-pointer hover:bg-emerald-50" onClick={() => goTo("capital")}>
                  <td className="py-1 pl-4">↳ {c.name}{c.info ? ` (${c.info})` : ""}</td>
                  <td className="py-1 text-right">{formatTZS(c.outstanding)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="font-semibold text-blue-700 mt-4 mb-2">🏛 {t("bs.equity")}</div>
          <table className="w-full text-sm">
            <tbody className="divide-y divide-slate-100">
              {row(t("bs.capital"), data.equity.capital, () => goTo("capital"))}
              {row(t("bs.retained"), data.equity.retainedProfit, undefined, "/reports")}
              <tr className="font-semibold text-slate-900 border-t-2 border-slate-300">
                <td className="py-2">{t("bs.totalLiabEquity")}</td>
                <td className="py-2 text-right">{formatTZS(data.liabilities.total + data.equity.total)}</td>
              </tr>
            </tbody>
          </table>
        </Card>
      </div>
    </>
  );
}

// --- Tab 1: Payables / Receivables (the original page) ------------------------
interface Payable { id: string; orderNumber: string; supplier: string; total: number; paid: number; balance: number }
interface Receivable { id: string; saleNumber: string; customer: string; total: number; paid: number; balance: number }
const METHODS = ["Cash", "M-Pesa", "Bank"];
interface PayForm { direction: "OUTGOING" | "INCOMING"; refId: string; label: string; amount: string; method: string }

function PaymentsTab({ canWrite }: { canWrite: boolean }) {
  const { t } = useI18n();
  const [payables, setPayables] = useState<{ items: Payable[]; totalPayable: number } | null>(null);
  const [receivables, setReceivables] = useState<{ items: Receivable[]; totalReceivable: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<PayForm | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      setPayables(await api.get("/api/accounting/payables"));
      setReceivables(await api.get("/api/accounting/receivables"));
    } catch (err) { setError(err instanceof Error ? err.message : "Failed"); }
  }, []);
  useEffect(() => { load(); }, [load]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form) return;
    setSaving(true);
    try {
      await api.post("/api/payments", {
        direction: form.direction,
        amount: Number(form.amount),
        method: form.method,
        ...(form.direction === "OUTGOING" ? { purchaseOrderId: form.refId } : { saleId: form.refId }),
      });
      setForm(null); await load();
    } catch (err) { alert(err instanceof Error ? err.message : "Failed"); }
    finally { setSaving(false); }
  }

  return (
    <>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="font-semibold text-slate-800">{t("accounting.payables")}</div>
            <span className="text-red-600 font-semibold"><Money value={payables?.totalPayable ?? 0} /></span>
          </div>
          <table className="w-full text-sm">
            <thead className="text-slate-500 text-left"><tr>
              <th className="py-1">{t("purchases.order")}</th><th className="py-1">{t("purchases.supplier")}</th>
              <th className="py-1 text-right">{t("accounting.balance")}</th>{canWrite && <th />}
            </tr></thead>
            <tbody className="divide-y divide-slate-100">
              {!payables ? <EmptyRow colSpan={4} text={t("common.loading")} />
                : payables.items.length === 0 ? <EmptyRow colSpan={4} text={t("common.noData")} />
                : payables.items.map((p) => (
                  <tr key={p.id}>
                    <td className="py-2 text-slate-700">{p.orderNumber}</td>
                    <td className="py-2 text-slate-600">{p.supplier}</td>
                    <td className="py-2 text-right text-red-600"><Money value={p.balance} /></td>
                    {canWrite && <td className="py-2 text-right">
                      <button onClick={() => setForm({ direction: "OUTGOING", refId: p.id, label: p.orderNumber, amount: String(p.balance), method: "Cash" })} className="text-emerald-700 hover:underline">{t("accounting.pay")}</button>
                    </td>}
                  </tr>
                ))}
            </tbody>
          </table>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="font-semibold text-slate-800">{t("accounting.receivables")}</div>
            <span className="text-red-600 font-semibold"><Money value={receivables?.totalReceivable ?? 0} /></span>
          </div>
          <table className="w-full text-sm">
            <thead className="text-slate-500 text-left"><tr>
              <th className="py-1">{t("sales.number")}</th><th className="py-1">{t("pos.customer")}</th>
              <th className="py-1 text-right">{t("accounting.balance")}</th>{canWrite && <th />}
            </tr></thead>
            <tbody className="divide-y divide-slate-100">
              {!receivables ? <EmptyRow colSpan={4} text={t("common.loading")} />
                : receivables.items.length === 0 ? <EmptyRow colSpan={4} text={t("common.noData")} />
                : receivables.items.map((r) => (
                  <tr key={r.id}>
                    <td className="py-2 text-slate-700">{r.saleNumber}</td>
                    <td className="py-2 text-slate-600">{r.customer}</td>
                    <td className="py-2 text-right text-red-600"><Money value={r.balance} /></td>
                    {canWrite && <td className="py-2 text-right">
                      <button onClick={() => setForm({ direction: "INCOMING", refId: r.id, label: r.saleNumber, amount: String(r.balance), method: "Cash" })} className="text-emerald-700 hover:underline">{t("accounting.receive")}</button>
                    </td>}
                  </tr>
                ))}
            </tbody>
          </table>
        </Card>
      </div>

      {form && (
        <Modal title={`${t("accounting.recordPayment")} — ${form.label}`} onClose={() => setForm(null)}>
          <form onSubmit={submit} className="space-y-4">
            <Field label={t("accounting.amount")}>
              <input type="number" step="any" min="0" required value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} className={inputClass} />
            </Field>
            <Field label={t("accounting.method")}>
              <select value={form.method} onChange={(e) => setForm({ ...form, method: e.target.value })} className={inputClass}>
                {METHODS.map((m) => <option key={m} value={m}>{t(`method.${m}` as TranslationKey)}</option>)}
              </select>
            </Field>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setForm(null)} className={btnSecondary}>{t("action.cancel")}</button>
              <button type="submit" disabled={saving} className={btnPrimary}>{saving ? t("common.loading") : t("action.save")}</button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}

// --- Tab 2: Capital / Loans / Drawings ----------------------------------------
type CapType = "CAPITAL" | "LOAN" | "LOAN_REPAYMENT" | "DRAWING";
interface CapEntry { id: string; type: CapType; amount: string | number; partyName: string | null; partyInfo: string | null; description: string | null; entryDate: string }
interface Creditor { name: string; info: string | null; outstanding: number }
interface CapData {
  entries: CapEntry[];
  creditors: Creditor[];
  summary: { capitalIn: number; drawings: number; capital: number; loansIn: number; loanRepayments: number; loansOutstanding: number };
}
const capColor: Record<CapType, "emerald" | "blue" | "amber" | "red"> = {
  CAPITAL: "emerald", LOAN: "blue", LOAN_REPAYMENT: "amber", DRAWING: "red",
};

function CapitalTab({ canWrite }: { canWrite: boolean }) {
  const { t } = useI18n();
  const [data, setData] = useState<CapData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<CapType>("CAPITAL");
  const [amount, setAmount] = useState("");
  const [partyName, setPartyName] = useState("");
  const [partyInfo, setPartyInfo] = useState("");
  const [description, setDescription] = useState("");
  const [entryDate, setEntryDate] = useState(new Date().toISOString().slice(0, 10));
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try { setData(await api.get<CapData>("/api/capital")); }
    catch (err) { setError(err instanceof Error ? err.message : "Failed"); }
  }, []);
  useEffect(() => { load(); }, [load]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post("/api/capital", {
        type, amount: Number(amount),
        partyName: partyName || null, partyInfo: partyInfo || null,
        description: description || null, entryDate,
      });
      setOpen(false); setAmount(""); setPartyName(""); setPartyInfo(""); setDescription("");
      await load();
    } catch (err) { alert(err instanceof Error ? err.message : "Failed"); }
    finally { setSaving(false); }
  }
  async function remove(x: CapEntry) {
    if (!confirm(t("common.confirmDelete"))) return;
    try { await api.del(`/api/capital/${x.id}`); await load(); }
    catch (err) { alert(err instanceof Error ? err.message : "Failed"); }
  }

  const s = data?.summary;
  return (
    <>
      <p className="text-sm text-slate-500">💼 {t("capital.hint")}</p>
      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="p-4">
          <div className="text-sm text-slate-500">{t("capital.summaryCapital")}</div>
          <div className="mt-1 text-2xl font-semibold text-emerald-600"><Money value={s?.capital ?? 0} /></div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-slate-500">{t("capital.summaryLoans")}</div>
          <div className="mt-1 text-2xl font-semibold text-blue-600"><Money value={s?.loansOutstanding ?? 0} /></div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-slate-500">{t("capital.summaryIn")}</div>
          <div className="mt-1 text-2xl font-semibold text-slate-800"><Money value={s?.capitalIn ?? 0} /></div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-slate-500">{t("capital.summaryDrawings")}</div>
          <div className="mt-1 text-2xl font-semibold text-red-600"><Money value={s?.drawings ?? 0} /></div>
        </Card>
      </div>

      {/* Creditors — everyone we owe, by name */}
      {data && data.creditors.length > 0 && (
        <Card className="p-4 border-blue-200">
          <div className="font-semibold text-slate-800 mb-2">🤝 {t("capital.creditors")}</div>
          <table className="w-full text-sm">
            <thead className="text-slate-500 text-left"><tr>
              <th className="py-1">{t("capital.partyName")}</th>
              <th className="py-1">{t("capital.partyInfo")}</th>
              <th className="py-1 text-right">{t("accounting.balance")}</th>
            </tr></thead>
            <tbody className="divide-y divide-slate-100">
              {data.creditors.map((c) => (
                <tr key={c.name}>
                  <td className="py-2 font-medium text-slate-800">{c.name}</td>
                  <td className="py-2 text-slate-600">{c.info ?? "—"}</td>
                  <td className="py-2 text-right text-blue-700 font-medium"><Money value={c.outstanding} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {canWrite && (
        <div className="flex justify-end">
          <button onClick={() => setOpen(true)} className={btnPrimary}>+ {t("capital.new")}</button>
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-[var(--brand-50)] text-emerald-900/70 text-left">
            <tr>
              <th className="px-4 py-3 font-medium">{t("ledger.date")}</th>
              <th className="px-4 py-3 font-medium">{t("capital.type")}</th>
              <th className="px-4 py-3 font-medium">{t("capital.partyName")}</th>
              <th className="px-4 py-3 font-medium">{t("ledger.description")}</th>
              <th className="px-4 py-3 font-medium text-right">{t("accounting.amount")}</th>
              {canWrite && <th className="px-4 py-3 font-medium text-right">{t("common.actions")}</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {!data ? <EmptyRow colSpan={6} text={t("common.loading")} />
              : data.entries.length === 0 ? <EmptyRow colSpan={6} text={t("common.noData")} />
              : data.entries.map((x) => (
                <tr key={x.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 text-slate-500">{new Date(x.entryDate).toLocaleDateString()}</td>
                  <td className="px-4 py-3"><Badge color={capColor[x.type]}>{t(`capital.${x.type}` as TranslationKey)}</Badge></td>
                  <td className="px-4 py-3 text-slate-700">{x.partyName ?? "—"}{x.partyInfo && <span className="text-xs text-slate-400"> · {x.partyInfo}</span>}</td>
                  <td className="px-4 py-3 text-slate-600">{x.description ?? "—"}</td>
                  <td className="px-4 py-3 text-right text-slate-800"><Money value={x.amount} /></td>
                  {canWrite && (
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => remove(x)} className="text-red-600 hover:underline">{t("action.delete")}</button>
                    </td>
                  )}
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {open && (
        <Modal title={t("capital.new")} onClose={() => setOpen(false)}>
          <form onSubmit={save} className="space-y-4">
            <Field label={t("capital.type")}>
              <select value={type} onChange={(e) => setType(e.target.value as CapType)} className={inputClass}>
                {(["CAPITAL", "LOAN", "LOAN_REPAYMENT", "DRAWING"] as CapType[]).map((k) => (
                  <option key={k} value={k}>{t(`capital.${k}` as TranslationKey)}</option>
                ))}
              </select>
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label={t("accounting.amount")}>
                <input type="number" step="any" min="0.01" required value={amount} onChange={(e) => setAmount(e.target.value)} className={inputClass} />
              </Field>
              <Field label={t("ledger.date")}>
                <input type="date" value={entryDate} onChange={(e) => setEntryDate(e.target.value)} className={inputClass} />
              </Field>
            </div>
            <Field label={t("capital.partyName")}>
              <input
                value={partyName}
                onChange={(e) => setPartyName(e.target.value)}
                className={inputClass}
                required={type === "LOAN" || type === "LOAN_REPAYMENT"}
              />
              {(type === "LOAN" || type === "LOAN_REPAYMENT") && (
                <p className="text-xs text-slate-400 mt-1">{t("capital.partyRequired")}</p>
              )}
            </Field>
            <Field label={`${t("capital.partyInfo")} (${t("common.optional")})`}>
              <input value={partyInfo} onChange={(e) => setPartyInfo(e.target.value)} className={inputClass} placeholder="07xx…, mtaa…" />
            </Field>
            <Field label={`${t("ledger.description")} (${t("common.optional")})`}>
              <input value={description} onChange={(e) => setDescription(e.target.value)} className={inputClass} />
            </Field>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setOpen(false)} className={btnSecondary}>{t("action.cancel")}</button>
              <button type="submit" disabled={saving} className={btnPrimary}>{saving ? t("common.loading") : t("action.save")}</button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}

// --- Tab 3: Cash ledger book ---------------------------------------------------
interface LedgerRow { date: string; type: string; description: string; moneyIn: number; moneyOut: number; balance: number }
interface LedgerData { openingBalance: number; closingBalance: number; totalIn: number; totalOut: number; rows: LedgerRow[] }

function firstOfMonth() { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10); }
function todayStr() { return new Date().toISOString().slice(0, 10); }

function LedgerTab() {
  const { t } = useI18n();
  const [from, setFrom] = useState(firstOfMonth());
  const [to, setTo] = useState(todayStr());
  const [data, setData] = useState<LedgerData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try { setData(await api.get<LedgerData>(`/api/accounting/ledger?from=${from}&to=${to}`)); }
    catch (err) { setError(err instanceof Error ? err.message : "Failed"); }
    finally { setLoading(false); }
  }, [from, to]);
  useEffect(() => { load(); }, [load]);

  function preset(kind: "today" | "week" | "month" | "year") {
    const now = new Date();
    if (kind === "today") { setFrom(todayStr()); setTo(todayStr()); }
    if (kind === "week") {
      const day = (now.getDay() + 6) % 7; // Monday start
      const monday = new Date(now); monday.setDate(now.getDate() - day);
      setFrom(monday.toISOString().slice(0, 10)); setTo(todayStr());
    }
    if (kind === "month") { setFrom(firstOfMonth()); setTo(todayStr()); }
    if (kind === "year") { setFrom(new Date(now.getFullYear(), 0, 1).toISOString().slice(0, 10)); setTo(todayStr()); }
  }

  return (
    <>
      <div className="flex flex-wrap items-end gap-2">
        <button onClick={() => preset("today")} className={btnSecondary}>{t("period.today")}</button>
        <button onClick={() => preset("week")} className={btnSecondary}>{t("period.thisWeek")}</button>
        <button onClick={() => preset("month")} className={btnSecondary}>{t("period.thisMonth")}</button>
        <button onClick={() => preset("year")} className={btnSecondary}>{t("period.thisYear")}</button>
        <Field label={t("reports.from")}><input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className={inputClass} /></Field>
        <Field label={t("reports.to")}><input type="date" value={to} onChange={(e) => setTo(e.target.value)} className={inputClass} /></Field>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="p-4">
          <div className="text-sm text-slate-500">{t("ledger.opening")}</div>
          <div className="mt-1 text-xl font-semibold text-slate-700"><Money value={data?.openingBalance ?? 0} /></div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-slate-500">{t("ledger.totalIn")}</div>
          <div className="mt-1 text-xl font-semibold text-emerald-600"><Money value={data?.totalIn ?? 0} /></div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-slate-500">{t("ledger.totalOut")}</div>
          <div className="mt-1 text-xl font-semibold text-red-600"><Money value={data?.totalOut ?? 0} /></div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-slate-500">{t("ledger.closing")}</div>
          <div className={"mt-1 text-xl font-semibold " + ((data?.closingBalance ?? 0) >= 0 ? "text-emerald-700" : "text-red-600")}>
            <Money value={data?.closingBalance ?? 0} />
          </div>
        </Card>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-[var(--brand-50)] text-emerald-900/70 text-left">
            <tr>
              <th className="px-4 py-3 font-medium">{t("ledger.date")}</th>
              <th className="px-4 py-3 font-medium">{t("ledger.type")}</th>
              <th className="px-4 py-3 font-medium">{t("ledger.description")}</th>
              <th className="px-4 py-3 font-medium text-right">{t("ledger.in")}</th>
              <th className="px-4 py-3 font-medium text-right">{t("ledger.out")}</th>
              <th className="px-4 py-3 font-medium text-right">{t("ledger.balance")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? <EmptyRow colSpan={6} text={t("common.loading")} />
              : !data || data.rows.length === 0 ? <EmptyRow colSpan={6} text={t("common.noData")} />
              : data.rows.map((r, i) => (
                <tr key={i} className="hover:bg-slate-50">
                  <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{new Date(r.date).toLocaleDateString()}</td>
                  <td className="px-4 py-3 text-slate-600">{t(`ledger.${r.type}` as TranslationKey)}</td>
                  <td className="px-4 py-3 text-slate-600">{r.description || "—"}</td>
                  <td className="px-4 py-3 text-right text-emerald-700">{r.moneyIn > 0 ? formatTZS(r.moneyIn) : ""}</td>
                  <td className="px-4 py-3 text-right text-red-600">{r.moneyOut > 0 ? formatTZS(r.moneyOut) : ""}</td>
                  <td className={"px-4 py-3 text-right font-medium " + (r.balance >= 0 ? "text-slate-800" : "text-red-600")}>{formatTZS(r.balance)}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
