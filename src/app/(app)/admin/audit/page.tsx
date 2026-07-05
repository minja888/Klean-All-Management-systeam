"use client";

import { useEffect, useState, useCallback } from "react";
import { useI18n } from "@/components/i18n-provider";
import { api } from "@/lib/client";
import { PageHeader, inputClass, btnSecondary, Badge, EmptyRow } from "@/components/ui";

interface Log {
  id: string; action: string; entity: string; entityId: string | null;
  userName: string; userEmail: string; createdAt: string;
}

const actionColor: Record<string, "emerald" | "blue" | "red" | "slate"> = {
  CREATE: "emerald", UPDATE: "blue", DELETE: "red",
};

export default function AuditPage() {
  const { t } = useI18n();
  const [logs, setLogs] = useState<Log[]>([]);
  const [entity, setEntity] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try { setLogs(await api.get<Log[]>(`/api/audit${entity ? `?entity=${encodeURIComponent(entity)}` : ""}`)); }
    catch (err) { setError(err instanceof Error ? err.message : "Failed"); }
    finally { setLoading(false); }
  }, [entity]);
  useEffect(() => { load(); }, [load]);

  return (
    <div className="space-y-4">
      <PageHeader title={t("audit.title")} />

      <div className="flex gap-2">
        <input value={entity} onChange={(e) => setEntity(e.target.value)} placeholder={t("audit.filterEntity")} className={inputClass + " max-w-xs"} />
        <button onClick={load} className={btnSecondary}>{t("action.search")}</button>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-[var(--brand-50)] text-emerald-900/70 text-left">
            <tr>
              <th className="px-4 py-3 font-medium">{t("audit.when")}</th>
              <th className="px-4 py-3 font-medium">{t("audit.action")}</th>
              <th className="px-4 py-3 font-medium">{t("audit.entity")}</th>
              <th className="px-4 py-3 font-medium">{t("audit.user")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? <EmptyRow colSpan={4} text={t("common.loading")} />
              : logs.length === 0 ? <EmptyRow colSpan={4} text={t("common.noData")} />
              : logs.map((l) => (
                <tr key={l.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{new Date(l.createdAt).toLocaleString()}</td>
                  <td className="px-4 py-3"><Badge color={actionColor[l.action] ?? "slate"}>{l.action}</Badge></td>
                  <td className="px-4 py-3 text-slate-700">{l.entity}{l.entityId ? <span className="text-slate-400 text-xs"> · {l.entityId.slice(0, 8)}</span> : null}</td>
                  <td className="px-4 py-3 text-slate-600">{l.userName} <span className="text-slate-400 text-xs">({l.userEmail})</span></td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
