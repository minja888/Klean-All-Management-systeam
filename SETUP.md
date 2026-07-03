# Klean All Factory ERP — Setup & Progress

Bilingual (English + Kiswahili) ERP/POS for the Klean All scrub-pad factory.
Stack: **Next.js 16 (App Router) · TypeScript · Tailwind v4 · Prisma 7 + PostgreSQL (Supabase) · JWT (jose) · zod**.

---

## 1. One thing you must do before running

The app talks to your Supabase database, which needs a password only you can copy.

1. Open **Supabase Dashboard → project `klean-all-erp` → Project Settings → Database**.
2. Under **Connection string**, copy the password (or click **Reset database password**).
3. Open **`.env`** in this folder and replace `[YOUR-DB-PASSWORD]` in **both**
   `DATABASE_URL` and `DIRECT_URL` with that password.

Then start the app:

```bash
npm run dev
```

Open http://localhost:3000 and sign in.

### First login (ADMIN)

| Field | Value |
|---|---|
| Email | `tumainminja888@gmail.com` |
| Password | `KleanAll@2026` |

> **Change this password immediately** after logging in (Admin → Users → Edit).

---

## 2. Useful commands

| Command | What it does |
|---|---|
| `npm run dev` | Start the dev server |
| `npm run build` | Production build (type-checks everything) |
| `npm run db:generate` | Regenerate the Prisma client after editing the schema |
| `npm run db:migrate` | Apply migrations to the database |
| `npm run db:seed` | Re-create the ADMIN user if missing |

---

## 3. What exists (all 6 phases ✅)

- **Phase 1** — JWT auth (httpOnly cookie) + bcrypt; middleware guard; 4-role RBAC; EN/SW toggle; Settings (company, departments, material/expense categories); Users; audit logging.
- **Phase 2** — Materials (units + conversion + cost); Suppliers (credit owed); Purchase Orders with line items; **Receive** converts rolls→metres, adds stock, records movement; Inventory with low-stock alerts + value.
- **Phase 3** — Products; **BOM** editor; Production batches; **Complete** consumes materials (BOM × qty) and produces finished goods, all in one transaction; workers scoped to their department.
- **Phase 4** — Customers (debt); **POS** cart + checkout; printable receipts; sales history.
- **Phase 5** — Expenses; Employees; monthly **Payroll** runs (netPay = base + bonus + food + transport − deductions), DRAFT → APPROVED → PAID.
- **Phase 6** — **Profit engine** (revenue − COGS − expenses − payroll); Dashboard KPIs (net profit month + YTD, sales, purchases, credit, debt, stock value, production, low-stock); Accounting payables/receivables + payments; Reports with CSV export; Audit Log UI.

Every phase compiles with `npm run build`. Financial figures are visible only to ADMIN + ACCOUNTING.

> Reports: “Excel” export is CSV (opens in Excel). For PDF, use the browser’s Print → Save as PDF.

---

## 4. Security note — Row Level Security (RLS)

Supabase flagged that RLS is **disabled** on all tables. This app enforces access
in its own code (JWT + RBAC via Prisma), so it does not rely on RLS — but Supabase
also exposes a public REST API with the anon key. Enabling RLS **with no policies**
closes that public hole while leaving this app fully working. Ask me to enable it
and I will apply the change.

---

## 5. Key connection facts

- Supabase project: **klean-all-erp** · ref `oijrokkqokzsmivqmdvj` · region `eu-central-1`
- DB host: `db.oijrokkqokzsmivqmdvj.supabase.co` (Postgres 17)
