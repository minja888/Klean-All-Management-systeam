// ---------------------------------------------------------------------------
// i18n — bilingual dictionary (English + Kiswahili)
// ---------------------------------------------------------------------------
// Every user-facing label lives here as a key with an `en` and `sw` value.
// Business DATA (names, amounts) stays neutral — we only translate the chrome.
// The active language is remembered in a cookie ("lang") and provided to the
// React tree by <I18nProvider> (see components/i18n-provider.tsx).
// ---------------------------------------------------------------------------

export type Lang = "en" | "sw";

export const LANGUAGES: { code: Lang; label: string }[] = [
  { code: "en", label: "English" },
  { code: "sw", label: "Kiswahili" },
];

/** dictionary[key] = { en, sw } */
export const dictionary = {
  // Brand / generic
  "app.name": { en: "Klean All", sw: "Klean All" },
  "app.tagline": { en: "Factory ERP / POS", sw: "Mfumo wa Kiwanda / POS" },

  // Common actions
  "action.save": { en: "Save", sw: "Hifadhi" },
  "action.cancel": { en: "Cancel", sw: "Ghairi" },
  "action.create": { en: "Create", sw: "Tengeneza" },
  "action.edit": { en: "Edit", sw: "Hariri" },
  "action.delete": { en: "Delete", sw: "Futa" },
  "action.search": { en: "Search", sw: "Tafuta" },
  "action.add": { en: "Add", sw: "Ongeza" },
  "action.close": { en: "Close", sw: "Funga" },
  "common.loading": { en: "Loading…", sw: "Inapakia…" },
  "common.noData": { en: "No records yet.", sw: "Hakuna kumbukumbu bado." },
  "common.actions": { en: "Actions", sw: "Vitendo" },
  "common.confirmDelete": { en: "Are you sure you want to delete this?", sw: "Una uhakika unataka kufuta hii?" },
  "common.saved": { en: "Saved.", sw: "Imehifadhiwa." },

  // Auth
  "auth.login": { en: "Sign in", sw: "Ingia" },
  "auth.logout": { en: "Sign out", sw: "Toka" },
  "auth.email": { en: "Email", sw: "Barua pepe" },
  "auth.password": { en: "Password", sw: "Nywila" },
  "auth.signingIn": { en: "Signing in…", sw: "Inaingia…" },
  "auth.welcome": { en: "Welcome back", sw: "Karibu tena" },
  "auth.invalid": { en: "Invalid email or password.", sw: "Barua pepe au nywila si sahihi." },

  // Navigation / modules
  "nav.dashboard": { en: "Dashboard", sw: "Dashibodi" },
  "nav.materials": { en: "Materials", sw: "Malighafi" },
  "nav.inventory": { en: "Inventory", sw: "Bohari" },
  "nav.suppliers": { en: "Suppliers", sw: "Wasambazaji" },
  "nav.purchases": { en: "Purchases", sw: "Manunuzi" },
  "nav.products": { en: "Products", sw: "Bidhaa" },
  "nav.production": { en: "Production", sw: "Uzalishaji" },
  "nav.customers": { en: "Customers", sw: "Wateja" },
  "nav.pos": { en: "Point of Sale", sw: "Mauzo (POS)" },
  "nav.sales": { en: "Sales", sw: "Mauzo" },
  "nav.expenses": { en: "Expenses", sw: "Matumizi" },
  "nav.payroll": { en: "Payroll", sw: "Mishahara" },
  "nav.accounting": { en: "Accounting", sw: "Uhasibu" },
  "nav.reports": { en: "Reports", sw: "Ripoti" },
  "nav.users": { en: "Users", sw: "Watumiaji" },
  "nav.settings": { en: "Settings", sw: "Mipangilio" },
  "nav.audit": { en: "Audit Log", sw: "Kumbukumbu za Mabadiliko" },
  "nav.admin": { en: "Administration", sw: "Utawala" },

  // Roles
  "role.ADMIN": { en: "Administrator", sw: "Msimamizi" },
  "role.MANAGER": { en: "Manager", sw: "Meneja" },
  "role.ACCOUNTING": { en: "Accounting", sw: "Uhasibu" },
  "role.WORKER": { en: "Worker", sw: "Mfanyakazi" },

  // Users page
  "users.title": { en: "Users", sw: "Watumiaji" },
  "users.new": { en: "New user", sw: "Mtumiaji mpya" },
  "users.name": { en: "Full name", sw: "Jina kamili" },
  "users.role": { en: "Role", sw: "Wajibu" },
  "users.department": { en: "Department", sw: "Idara" },
  "users.status": { en: "Status", sw: "Hali" },
  "users.active": { en: "Active", sw: "Anatumika" },
  "users.inactive": { en: "Inactive", sw: "Hatumiki" },
  "users.passwordHint": { en: "Leave blank to keep the current password.", sw: "Acha wazi kubaki na nywila ya sasa." },

  // Settings page
  "settings.title": { en: "Settings", sw: "Mipangilio" },
  "settings.departments": { en: "Departments", sw: "Idara" },
  "settings.materialCategories": { en: "Material Categories", sw: "Aina za Malighafi" },
  "settings.expenseCategories": { en: "Expense Categories", sw: "Aina za Matumizi" },
  "settings.app": { en: "Company", sw: "Kampuni" },
  "settings.companyName": { en: "Company name", sw: "Jina la kampuni" },
  "settings.currency": { en: "Currency", sw: "Sarafu" },
  "settings.lowStockDefault": { en: "Default low-stock level", sw: "Kiwango cha chini cha bidhaa" },
  "settings.defaultLanguage": { en: "Default language", sw: "Lugha ya msingi" },
  "settings.categoryName": { en: "Name", sw: "Jina" },
  "settings.departmentName": { en: "Department name", sw: "Jina la idara" },
  "settings.description": { en: "Description", sw: "Maelezo" },
} as const;

export type TranslationKey = keyof typeof dictionary;

/** Translate a key into the chosen language, falling back to English then the key. */
export function translate(lang: Lang, key: TranslationKey): string {
  const entry = dictionary[key];
  if (!entry) return key;
  return entry[lang] ?? entry.en ?? key;
}
