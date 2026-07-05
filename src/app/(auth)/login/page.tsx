"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useI18n } from "@/components/i18n-provider";
import { LanguageToggle } from "@/components/language-toggle";
import { api } from "@/lib/client";
import type { TranslationKey } from "@/lib/i18n";

// useSearchParams() must sit under a Suspense boundary for the production build.
export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginPortal />
    </Suspense>
  );
}

const ROLES = ["ADMIN", "MANAGER", "ACCOUNTING", "WORKER"] as const;
type RoleKey = (typeof ROLES)[number];

// Job positions offered on the Register tab (access level is granted later by the Admin).
const POSITIONS = [
  "Director", "General Manager", "Operations Manager", "Production Supervisor",
  "Accountant", "Cashier", "Storekeeper", "Procurement Officer", "Sales Officer",
  "Marketing Officer", "Machine Operator", "Production Worker", "Quality Controller",
  "Driver", "Security", "Cleaner", "HR Officer", "IT Officer", "Other",
];

const inputClass =
  "w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none";

function LoginPortal() {
  const { t } = useI18n();
  const [tab, setTab] = useState<"login" | "register">("login");

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4">
      <div className="w-full max-w-md">
        <div className="flex justify-end mb-3"><LanguageToggle /></div>
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
          <div className="flex items-center justify-center gap-2.5">
            <span className="pad-glyph" aria-hidden />
            <h1 className="font-display text-2xl font-bold text-[var(--brand-900)]">Klean All</h1>
          </div>
          <p className="text-sm text-slate-500 text-center mt-1 mb-5">Factory ERP / POS</p>

          {/* Tabs */}
          <div className="grid grid-cols-2 gap-1 rounded-lg bg-slate-100 p-1 mb-6">
            <button onClick={() => setTab("login")}
              className={"rounded-md py-2 text-sm font-medium border-b-2 " + (tab === "login" ? "bg-white shadow text-emerald-800 border-[var(--sponge-400)]" : "text-slate-500 border-transparent")}>
              {t("auth.loginTab")}
            </button>
            <button onClick={() => setTab("register")}
              className={"rounded-md py-2 text-sm font-medium border-b-2 " + (tab === "register" ? "bg-white shadow text-emerald-800 border-[var(--sponge-400)]" : "text-slate-500 border-transparent")}>
              {t("auth.registerTab")}
            </button>
          </div>

          {tab === "login" ? <LoginForm /> : <RegisterForm onDone={() => setTab("login")} />}
        </div>
      </div>
    </div>
  );
}

// --- Sign in -----------------------------------------------------------------
function LoginForm() {
  const { t } = useI18n();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [mode, setMode] = useState<"role" | "email">("role");
  const [role, setRole] = useState<RoleKey | "">("");
  const [users, setUsers] = useState<{ id: string; name: string }[]>([]);
  const [userId, setUserId] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [forgot, setForgot] = useState(false);

  // When a role is picked, fetch its people; auto-select if there is only one.
  useEffect(() => {
    setUsers([]); setUserId("");
    if (!role) return;
    api.get<{ id: string; name: string }[]>(`/api/auth/role-users?role=${role}`)
      .then((list) => {
        setUsers(list);
        if (list.length === 1) setUserId(list[0].id);
      })
      .catch(() => setUsers([]));
  }, [role]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError(null);
    try {
      const payload = mode === "role" ? { userId, password } : { email, password };
      const me = await api.post<{ mustChangePassword?: boolean }>("/api/auth/login", payload);
      if (me.mustChangePassword) {
        router.replace("/change-password");
      } else {
        router.replace(searchParams.get("next") ?? "/dashboard");
      }
      router.refresh();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      setError(msg === "PENDING_APPROVAL" ? t("auth.pendingApproval") : t("auth.invalid"));
      setLoading(false);
    }
  }

  if (forgot) return <ForgotForm onBack={() => setForgot(false)} />;

  return (
    <form onSubmit={submit} className="space-y-4">
      {mode === "role" ? (
        <>
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">{t("auth.chooseRole")}</label>
            <select required value={role} onChange={(e) => setRole(e.target.value as RoleKey)} className={inputClass}>
              <option value="">—</option>
              {ROLES.map((r) => <option key={r} value={r}>{t(`auth.role${r}` as TranslationKey)}</option>)}
            </select>
          </div>
          {role && (
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">{t("auth.chooseName")}</label>
              <select required value={userId} onChange={(e) => setUserId(e.target.value)} className={inputClass}>
                <option value="">—</option>
                {users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
            </div>
          )}
        </>
      ) : (
        <div>
          <label className="block text-sm font-medium text-slate-600 mb-1">{t("auth.email")}</label>
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} autoComplete="email" />
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-slate-600 mb-1">{t("auth.password")}</label>
        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            required value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={inputClass + " pr-16"}
            autoComplete="current-password"
          />
          <button type="button" onClick={() => setShowPassword((s) => !s)} tabIndex={-1}
            className="absolute inset-y-0 right-2 my-auto h-6 px-2 text-xs font-medium text-emerald-700 hover:text-emerald-800">
            {showPassword ? t("auth.hide") : t("auth.show")}
          </button>
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button type="submit" disabled={loading || (mode === "role" && !userId)}
        className="w-full rounded-md bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60">
        {loading ? t("common.loading") : t("auth.login")}
      </button>

      <div className="flex items-center justify-between text-xs">
        <button type="button" onClick={() => setMode(mode === "role" ? "email" : "role")} className="text-slate-500 hover:text-emerald-700 hover:underline">
          {mode === "role" ? t("auth.useEmailInstead") : t("auth.useRoleInstead")}
        </button>
        <button type="button" onClick={() => setForgot(true)} className="text-slate-500 hover:text-emerald-700 hover:underline">
          {t("auth.forgot")}
        </button>
      </div>
    </form>
  );
}

// --- Forgot password ----------------------------------------------------------
function ForgotForm({ onBack }: { onBack: () => void }) {
  const { t } = useI18n();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try { await api.post("/api/auth/forgot-password", { email }); } catch { /* generic */ }
    setSent(true); setLoading(false);
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <p className="text-sm text-slate-500">{t("auth.forgotHint")}</p>
      {sent ? (
        <p className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-md px-3 py-2">{t("auth.forgotSent")}</p>
      ) : (
        <div>
          <label className="block text-sm font-medium text-slate-600 mb-1">{t("auth.email")}</label>
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} />
        </div>
      )}
      <div className="flex gap-2">
        <button type="button" onClick={onBack} className="flex-1 rounded-md border border-slate-300 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50">
          {t("common.back")}
        </button>
        {!sent && (
          <button type="submit" disabled={loading}
            className="flex-1 rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60">
            {loading ? t("common.loading") : t("action.save")}
          </button>
        )}
      </div>
    </form>
  );
}

// --- Register -----------------------------------------------------------------
function RegisterForm({ onDone }: { onDone: () => void }) {
  const { t } = useI18n();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [position, setPosition] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password !== confirm) { setError(t("auth.passwordMismatch")); return; }
    setLoading(true);
    try {
      await api.post("/api/auth/register", { name, email, password, position });
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally { setLoading(false); }
  }

  if (done) {
    return (
      <div className="space-y-4 text-center">
        <p className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-md px-3 py-3">✅ {t("auth.registered")}</p>
        <button onClick={onDone} className="w-full rounded-md bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-700">
          {t("auth.loginTab")}
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-600 mb-1">{t("auth.fullName")}</label>
        <input required minLength={2} value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-600 mb-1">{t("auth.email")}</label>
        <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-600 mb-1">{t("auth.position")}</label>
        <select required value={position} onChange={(e) => setPosition(e.target.value)} className={inputClass}>
          <option value="">—</option>
          {POSITIONS.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-slate-600 mb-1">{t("auth.password")}</label>
          <div className="relative">
            <input type={showPassword ? "text" : "password"} required minLength={6} value={password}
              onChange={(e) => setPassword(e.target.value)} className={inputClass + " pr-12"} autoComplete="new-password" />
            <button type="button" onClick={() => setShowPassword((s) => !s)} tabIndex={-1}
              className="absolute inset-y-0 right-1 my-auto h-6 px-1.5 text-xs font-medium text-emerald-700">
              {showPassword ? t("auth.hide") : t("auth.show")}
            </button>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-600 mb-1">{t("auth.confirmPassword")}</label>
          <input type={showPassword ? "text" : "password"} required minLength={6} value={confirm}
            onChange={(e) => setConfirm(e.target.value)} className={inputClass} autoComplete="new-password" />
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button type="submit" disabled={loading}
        className="w-full rounded-md bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60">
        {loading ? t("common.loading") : t("auth.registerTab")}
      </button>
    </form>
  );
}
