"use client";

// Change-password page. Reached (a) voluntarily from the sidebar, or
// (b) forcibly right after login when mustChangePassword is set.
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { useI18n } from "@/components/i18n-provider";
import { LanguageToggle } from "@/components/language-toggle";
import { api } from "@/lib/client";

const inputClass =
  "w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none";

export default function ChangePasswordPage() {
  return (
    <Suspense fallback={null}>
      <ChangePasswordForm />
    </Suspense>
  );
}

function ChangePasswordForm() {
  const { t } = useI18n();
  const router = useRouter();
  const searchParams = useSearchParams();
  const forced = searchParams.get("forced") !== "0"; // default: show the notice

  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (next !== confirm) { setError(t("auth.passwordMismatch")); return; }
    setLoading(true);
    try {
      await api.post("/api/auth/change-password", { currentPassword: current, newPassword: next });
      router.replace("/dashboard");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4">
      <div className="w-full max-w-md">
        <div className="flex justify-end mb-3"><LanguageToggle /></div>
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
          <h1 className="text-xl font-bold text-slate-800 text-center mb-1">{t("auth.changePassword")}</h1>
          {forced && (
            <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-3 py-2 mt-3 mb-2">
              🔐 {t("auth.mustChange")}
            </p>
          )}
          <form onSubmit={submit} className="space-y-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">{t("auth.currentPassword")}</label>
              <input type={show ? "text" : "password"} required value={current} onChange={(e) => setCurrent(e.target.value)} className={inputClass} autoComplete="current-password" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">{t("auth.newPassword")}</label>
              <div className="relative">
                <input type={show ? "text" : "password"} required minLength={6} value={next} onChange={(e) => setNext(e.target.value)} className={inputClass + " pr-16"} autoComplete="new-password" />
                <button type="button" onClick={() => setShow((s) => !s)} tabIndex={-1}
                  className="absolute inset-y-0 right-2 my-auto h-6 px-2 text-xs font-medium text-emerald-700">
                  {show ? t("auth.hide") : t("auth.show")}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">{t("auth.confirmPassword")}</label>
              <input type={show ? "text" : "password"} required minLength={6} value={confirm} onChange={(e) => setConfirm(e.target.value)} className={inputClass} autoComplete="new-password" />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button type="submit" disabled={loading}
              className="w-full rounded-md bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60">
              {loading ? t("common.loading") : t("action.save")}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
