"use client";

import { useEffect, useState, useCallback } from "react";
import { useI18n } from "@/components/i18n-provider";
import { PageTips } from "@/components/page-tips";
import { useSession } from "@/components/session-provider";
import { api } from "@/lib/client";
import { PageHeader, Card, Money, Badge, EmptyRow, Field, inputClass, btnSecondary, Modal } from "@/components/ui";
import type { TranslationKey } from "@/lib/i18n";

type Tab = "stock" | "report";

interface InventoryItem {
  id: string; name: string; category: string; stockUnit: string;
  currentStock: number; reorderLevel: number; costPrice: number; value: number; lowStock: boolean;
}
interface InventoryResponse { items: InventoryItem[]; totalValue: number; lowStockCount: number }

interface ReportRow {
  id: string; name: string; stockUnit: string;
  quantityIn: number; quantityOut: number; waste: number; currentStock: number; lowStock: boolean;
}
interface Movement { id: string; type: "IN" | "OUT" | "WASTE" | "ADJUST"; quantity: number; note: string | null; refType: string | null; createdAt: string }

function firstOfMonth() { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10); }
function todayStr() { return new Date().toISOString().slice(0, 10); }

export default function InventoryPage() {
  const { t } = useI18n();
  const { role } = useSession();
  const showValue = role !== "WORKER"; // prices/values are hidden from workers
  const [tab, setTab] = useState<Tab>("stock");

  // History modal (shared by both tabs)
  const [historyFor, setHistoryFor] = useState<{ id: string; name: string; unit: string } | null>(null);
  const [movements, setMovements] = useState<Movement[] | null>(null);

  async function openHistory(id: string, name: string, unit: string) {
    setHistoryFor({ id, name, unit }); setMovements(null);
    try { setMovements(await api.get<Movement[]>(`/api/materials/${id}/movements`)); }
    catch { setMovements([]); }
  }

  return (
    <div className="space-y-4">
      <PageHeader title={t("inventory.title")} />
      <PageTips tipKey="tips.inventory" />

      <div className="flex gap-1 border-b border-slate-200">
        {([["stock", "matreport.stockTab"], ["report", "matreport.tab"]] as [Tab, TranslationKey][]).map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)}
            className={"px-4 py-2 text-sm font-medium -mb-px border-b-2 " +
              (tab === key ? "border-emerald-600 text-emerald-700" : "border-transparent text-slate-500 hover:text-slate-700")}>
            {t(label)}
          </button>
        ))}
      </div>
      <p className="text-xs text-slate-400">👆 {t("matreport.clickHint")}</p>

      {tab === "stock" ? <StockTab showValue={showValue} onOpen={openHistory} /> : <ReportTab onOpen={openHistory} />}

      {/* Movement history modal */}
      {historyFor && (
        <Modal title={`${t("matreport.history")} — ${historyFor.name}`} onClose={() => setHistoryFor(null)}>
          {!movements ? (
            <p className="text-sm text-slate-400">{t("common.loading")}</p>
          ) : movements.length === 0 ? (
            <p className="text-sm text-slate-400">{t("common.noData")}</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="text-slate-500 text-left"><tr>
                <th className="py-1">{t("ledger.date")}</th>
                <th className="py-1">{t("ledger.type")}</th>
                <th className="py-1 text-right">{t("materials.quantity")}</th>
                <th className="py-1">{t("materials.note")}</th>
              </tr></thead>
              <tbody className="divide-y divide-slate-100">
                {movements.map((m) => (
                  <tr key={m.id}>
                    <td className="py-2 text-slate-500 whitespace-nowrap">{new Date(m.createdAt).toLocaleString()}</td>
                    <td className="py-2">
                      <Badge color={m.type === "IN" ? "emerald" : m.type === "WASTE" ? "amber" : "red"}>
                        {m.type === "IN" ? t("materials.stockIn") : m.type === "WASTE" ? t("matreport.waste") : t("materials.stockOut")}
                      </Badge>
                    </td>
                    <td className={"py-2 text-right font-medium " + (m.type === "IN" ? "text-emerald-700" : "text-red-600")}>
                      {m.type === "IN" ? "+" : "−"}{m.quantity} {historyFor.unit}
                    </td>
                    <td className="py-2 text-slate-600">{m.note ?? m.refType ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Modal>
      )}
    </div>
  );
}

// --- Tab 1: current stock levels ------------------------------------------------
function StockTab({ showValue, onOpen }: { showValue: boolean; onOpen: (id: string, name: string, unit: string) => void }) {
  const { t } = useI18n();
  const [data, setData] = useState<InventoryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.get<InventoryResponse>("/api/inventory")
      .then(setData)
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="grid gap-4 sm:grid-cols-2">
        {showValue && (
          <Card className="p-4">
            <div className="text-sm text-slate-500">{t("inventory.totalValue")}</div>
            <div className="mt-1 text-2xl font-semibold text-slate-800"><Money value={data?.totalValue ?? 0} /></div>
          </Card>
        )}
        <Card className="p-4">
          <div className="text-sm text-slate-500">{t("inventory.lowStockItems")}</div>
          <div className="mt-1 text-2xl font-semibold text-amber-600">{data?.lowStockCount ?? 0}</div>
        </Card>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-[var(--brand-50)] text-emerald-900/70 text-left">
            <tr>
              <th className="px-4 py-3 font-medium">{t("materials.name")}</th>
              <th className="px-4 py-3 font-medium">{t("materials.category")}</th>
              <th className="px-4 py-3 font-medium text-right">{t("inventory.level")}</th>
              <th className="px-4 py-3 font-medium text-right">{t("materials.reorderLevel")}</th>
              {showValue && <th className="px-4 py-3 font-medium text-right">{t("inventory.value")}</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? <EmptyRow colSpan={showValue ? 5 : 4} text={t("common.loading")} />
              : !data || data.items.length === 0 ? <EmptyRow colSpan={showValue ? 5 : 4} text={t("common.noData")} />
              : data.items.map((i) => (
                <tr key={i.id} className={i.lowStock ? "bg-amber-50" : "hover:bg-slate-50"}>
                  <td className="px-4 py-3 font-medium text-slate-800">
                    <button onClick={() => onOpen(i.id, i.name, i.stockUnit)} className="hover:text-emerald-700 underline decoration-dotted">
                      {i.name}
                    </button>
                    {i.lowStock && <span className="ml-2"><Badge color="amber">{t("inventory.lowBadge")}</Badge></span>}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{i.category}</td>
                  <td className="px-4 py-3 text-right text-slate-700">{i.currentStock} {i.stockUnit}</td>
                  <td className="px-4 py-3 text-right text-slate-500">{i.reorderLevel}</td>
                  {showValue && <td className="px-4 py-3 text-right text-slate-700"><Money value={i.value} /></td>}
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

// --- Tab 2: in/out report for a period --------------------------------------------
function ReportTab({ onOpen }: { onOpen: (id: string, name: string, unit: string) => void }) {
  const { t } = useI18n();
  const [from, setFrom] = useState(firstOfMonth());
  const [to, setTo] = useState(todayStr());
  const [rows, setRows] = useState<ReportRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setRows(null); setError(null);
    try {
      const res = await api.get<{ rows: ReportRow[] }>(`/api/materials/report?from=${from}&to=${to}`);
      setRows(res.rows);
    } catch (err) { setError(err instanceof Error ? err.message : "Failed"); }
  }, [from, to]);
  useEffect(() => { load(); }, [load]);

  function preset(kind: "today" | "week" | "month" | "year") {
    const now = new Date();
    if (kind === "today") { setFrom(todayStr()); setTo(todayStr()); }
    if (kind === "week") {
      const day = (now.getDay() + 6) % 7;
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

      <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-[var(--brand-50)] text-emerald-900/70 text-left">
            <tr>
              <th className="px-4 py-3 font-medium">{t("materials.name")}</th>
              <th className="px-4 py-3 font-medium text-right">⬇ {t("matreport.in")}</th>
              <th className="px-4 py-3 font-medium text-right">⬆ {t("matreport.out")}</th>
              <th className="px-4 py-3 font-medium text-right">{t("matreport.waste")}</th>
              <th className="px-4 py-3 font-medium text-right">{t("matreport.remaining")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {!rows ? <EmptyRow colSpan={5} text={t("common.loading")} />
              : rows.length === 0 ? <EmptyRow colSpan={5} text={t("common.noData")} />
              : rows.map((r) => (
                <tr key={r.id} className={r.lowStock ? "bg-amber-50" : "hover:bg-slate-50"}>
                  <td className="px-4 py-3 font-medium text-slate-800">
                    <button onClick={() => onOpen(r.id, r.name, r.stockUnit)} className="hover:text-emerald-700 underline decoration-dotted">
                      {r.name}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-right text-emerald-700">{r.quantityIn > 0 ? `+${r.quantityIn} ${r.stockUnit}` : "—"}</td>
                  <td className="px-4 py-3 text-right text-red-600">{r.quantityOut > 0 ? `−${r.quantityOut} ${r.stockUnit}` : "—"}</td>
                  <td className="px-4 py-3 text-right text-amber-600">{r.waste > 0 ? r.waste : "—"}</td>
                  <td className="px-4 py-3 text-right font-medium text-slate-800">{r.currentStock} {r.stockUnit}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
