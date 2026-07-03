"use client";

// ---------------------------------------------------------------------------
// Small shared UI kit — reused across every module's pages.
// ---------------------------------------------------------------------------
import { formatTZS } from "@/lib/money";

export const inputClass =
  "w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none";
export const btnPrimary =
  "rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60";
export const btnSecondary =
  "rounded-md border border-slate-300 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50";

export function PageHeader({ title, action }: { title: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <h1 className="text-2xl font-semibold text-slate-800">{title}</h1>
      {action}
    </div>
  );
}

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-600 mb-1">{label}</label>
      {children}
    </div>
  );
}

export function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 bg-slate-900/40 flex items-center justify-center p-4 z-50" onMouseDown={onClose}>
      <div
        className="bg-white rounded-xl shadow-lg w-full max-w-lg max-h-[90vh] overflow-y-auto"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-800">{title}</h2>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

export function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={"bg-white rounded-xl border border-slate-200 " + className}>{children}</div>;
}

export function Money({ value }: { value: number | string | null | undefined }) {
  return <span>{formatTZS(value)}</span>;
}

export function Badge({ children, color = "slate" }: { children: React.ReactNode; color?: "slate" | "emerald" | "amber" | "red" | "blue" }) {
  const colors: Record<string, string> = {
    slate: "bg-slate-100 text-slate-600",
    emerald: "bg-emerald-100 text-emerald-700",
    amber: "bg-amber-100 text-amber-700",
    red: "bg-red-100 text-red-700",
    blue: "bg-blue-100 text-blue-700",
  };
  return <span className={"inline-flex rounded-full px-2 py-0.5 text-xs " + colors[color]}>{children}</span>;
}

export function EmptyRow({ colSpan, text }: { colSpan: number; text: string }) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-4 py-6 text-center text-slate-400">
        {text}
      </td>
    </tr>
  );
}
