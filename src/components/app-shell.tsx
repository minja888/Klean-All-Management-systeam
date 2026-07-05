"use client";

// ---------------------------------------------------------------------------
// AppShell — sidebar + top bar for every authenticated page
// ---------------------------------------------------------------------------
// The navigation is filtered by the signed-in user's role using the shared
// access matrix (lib/access.ts). Pages not yet built (later phases) show as
// disabled "soon" items so the whole system map is visible.
// ---------------------------------------------------------------------------

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import { useI18n } from "@/components/i18n-provider";
import { LanguageToggle } from "@/components/language-toggle";
import { api } from "@/lib/client";
import { canView, type Module } from "@/lib/access";
import type { TranslationKey } from "@/lib/i18n";
import type { Role } from "@/generated/prisma/enums";

interface NavItem {
  key: TranslationKey;
  href: string;
  module: Module | null; // null = visible to everyone
  ready: boolean; // built yet?
}

const MAIN_NAV: NavItem[] = [
  { key: "nav.dashboard", href: "/dashboard", module: null, ready: true },
  { key: "nav.materials", href: "/materials", module: "materials_inventory", ready: true },
  { key: "nav.inventory", href: "/inventory", module: "materials_inventory", ready: true },
  { key: "nav.suppliers", href: "/suppliers", module: "suppliers_purchases", ready: true },
  { key: "nav.purchases", href: "/purchases", module: "suppliers_purchases", ready: true },
  { key: "nav.products", href: "/products", module: "production_bom", ready: true },
  { key: "nav.production", href: "/production", module: "production_bom", ready: true },
  { key: "nav.customers", href: "/customers", module: "sales_pos", ready: true },
  { key: "nav.pos", href: "/pos", module: "sales_pos", ready: true },
  { key: "nav.sales", href: "/sales", module: "sales_pos", ready: true },
  { key: "nav.expenses", href: "/expenses", module: "expenses_payroll", ready: true },
  { key: "nav.payroll", href: "/payroll", module: "expenses_payroll", ready: true },
  { key: "nav.accounting", href: "/accounting", module: "payments_accounting", ready: true },
  { key: "nav.reports", href: "/reports", module: "profit_dashboard", ready: true },
];

const ADMIN_NAV: NavItem[] = [
  { key: "nav.users", href: "/admin/users", module: "users_settings", ready: true },
  { key: "nav.settings", href: "/admin/settings", module: "users_settings", ready: true },
  { key: "nav.audit", href: "/admin/audit", module: "audit_log", ready: true },
];

export interface ShellUser {
  name: string;
  email: string;
  role: Role;
}

export function AppShell({
  user,
  companyName,
  children,
}: {
  user: ShellUser;
  companyName: string;
  children: React.ReactNode;
}) {
  const { t } = useI18n();
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    try {
      await api.post("/api/auth/logout", {});
    } finally {
      router.replace("/login");
      router.refresh();
    }
  }

  const visible = (items: NavItem[]) => items.filter((i) => i.module === null || canView(user.role, i.module));

  function renderNav(items: NavItem[]) {
    return items.map((item) => {
      const active = pathname === item.href || pathname.startsWith(item.href + "/");
      if (!item.ready) {
        return (
          <span
            key={item.href}
            className="flex items-center justify-between px-3 py-2 rounded-md text-sm text-slate-400 cursor-not-allowed"
            title="Coming in a later phase"
          >
            {t(item.key)}
            <span className="text-[10px] uppercase tracking-wide bg-slate-100 text-slate-400 rounded px-1.5 py-0.5">
              soon
            </span>
          </span>
        );
      }
      return (
        <Link
          key={item.href}
          href={item.href}
          className={
            "relative block px-3 py-2 rounded-md text-sm transition-colors " +
            (active
              ? "bg-white/10 text-white font-medium before:content-[''] before:absolute before:left-0 before:top-1.5 before:bottom-1.5 before:w-1 before:rounded-full before:bg-[var(--sponge-400)]"
              : "text-emerald-100/80 hover:bg-white/5 hover:text-white")
          }
        >
          {t(item.key)}
        </Link>
      );
    });
  }

  const adminItems = visible(ADMIN_NAV);

  return (
    <div className="min-h-screen flex">
      {/* Sidebar — deep leaf green; active item carries the sponge-yellow bar */}
      <aside className="w-60 shrink-0 bg-[var(--brand-950)] flex flex-col">
        <div className="px-3 py-4 border-b border-white/10">
          {/* The official logo sits on a white plate so it reads on deep green. */}
          <div className="bg-white rounded-lg px-2 flex items-center justify-center overflow-hidden h-[64px]">
            <Image src="/brand/logo.png" alt={companyName} width={170} height={170} className="w-[170px] h-auto" />
          </div>
          <div className="text-xs text-emerald-200/70 mt-2 text-center">{t("app.tagline")}</div>
        </div>

        <nav className="flex-1 overflow-y-auto p-2 space-y-1">
          {renderNav(visible(MAIN_NAV))}

          {adminItems.length > 0 && (
            <>
              <div className="px-3 pt-4 pb-1 text-[11px] font-semibold uppercase tracking-wide text-emerald-200/50">
                {t("nav.admin")}
              </div>
              {renderNav(adminItems)}
            </>
          )}
        </nav>
      </aside>

      {/* Main column */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-4 gap-4">
          <div className="text-sm text-slate-500 min-w-0 truncate">
            <span className="hidden md:inline">{t("app.tagline")} · </span>
            <span className="font-medium text-slate-700">📅 {new Date().toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</span>
          </div>
          <div className="flex items-center gap-4">
            <LanguageToggle />
            <div className="text-right leading-tight hidden sm:block">
              <div className="text-sm font-medium text-slate-800">{user.name}</div>
              <div className="text-xs text-slate-500">{t(`role.${user.role}` as TranslationKey)}</div>
            </div>
            <a
              href="/change-password?forced=0"
              title={t("auth.changePassword")}
              className="text-sm rounded-md border border-slate-300 px-2.5 py-1.5 text-slate-600 hover:bg-slate-50"
            >
              🔑
            </a>
            <button
              onClick={logout}
              className="text-sm rounded-md border border-slate-300 px-3 py-1.5 text-slate-600 hover:bg-slate-50"
            >
              {t("auth.logout")}
            </button>
          </div>
        </header>

        <main className="flex-1 p-6 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
