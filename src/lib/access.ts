// ---------------------------------------------------------------------------
// Access matrix — PURE data + helpers (safe to import anywhere)
// ---------------------------------------------------------------------------
// No next/server, no DB — so the Edge middleware, Node route handlers, AND
// client components can all read the same permission rules (spec §5).
//
//   F = full (create/edit/delete)   V = view only
//   O = own department only         "-" = no access
// ---------------------------------------------------------------------------

import type { Role } from "@/generated/prisma/enums";

export type AccessLevel = "F" | "V" | "O" | "-";

export type Module =
  | "users_settings"
  | "materials_inventory"
  | "suppliers_purchases"
  | "production_bom"
  | "sales_pos"
  | "expenses_payroll"
  | "payments_accounting"
  | "profit_dashboard"
  | "audit_log";

export const ACCESS_MATRIX: Record<Module, Record<Role, AccessLevel>> = {
  users_settings:      { ADMIN: "F", MANAGER: "-", ACCOUNTING: "-", WORKER: "-" },
  materials_inventory: { ADMIN: "F", MANAGER: "V", ACCOUNTING: "V", WORKER: "O" },
  suppliers_purchases: { ADMIN: "F", MANAGER: "V", ACCOUNTING: "F", WORKER: "-" },
  production_bom:      { ADMIN: "F", MANAGER: "F", ACCOUNTING: "V", WORKER: "O" },
  sales_pos:           { ADMIN: "F", MANAGER: "F", ACCOUNTING: "F", WORKER: "-" },
  expenses_payroll:    { ADMIN: "F", MANAGER: "V", ACCOUNTING: "F", WORKER: "-" },
  payments_accounting: { ADMIN: "F", MANAGER: "V", ACCOUNTING: "F", WORKER: "-" },
  profit_dashboard:    { ADMIN: "F", MANAGER: "-", ACCOUNTING: "V", WORKER: "-" },
  audit_log:           { ADMIN: "F", MANAGER: "-", ACCOUNTING: "-", WORKER: "-" },
};

export function accessLevel(role: Role, module: Module): AccessLevel {
  return ACCESS_MATRIX[module][role];
}

/** Can this role at least SEE the module? (F, V or O all count as visible.) */
export function canView(role: Role, module: Module): boolean {
  return accessLevel(role, module) !== "-";
}

/** Can this role CREATE / EDIT / DELETE? (F, or O for its own department.) */
export function canWrite(role: Role, module: Module): boolean {
  const level = accessLevel(role, module);
  return level === "F" || level === "O";
}

/** Is this role restricted to its own department for the module? */
export function isOwnDepartmentOnly(role: Role, module: Module): boolean {
  return accessLevel(role, module) === "O";
}
