"use client";

// Provides the signed-in user's identity + role to every client page,
// so pages can show/hide write actions without an extra /me request.
import { createContext, useContext } from "react";
import type { Role } from "@/generated/prisma/enums";
import { canView, canWrite, type Module } from "@/lib/access";

export interface ClientSession {
  id: string;
  name: string;
  email: string;
  role: Role;
  departmentId: string | null;
}

const SessionContext = createContext<ClientSession | null>(null);

export function SessionProvider({ value, children }: { value: ClientSession; children: React.ReactNode }) {
  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): ClientSession {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSession must be used inside <SessionProvider>");
  return ctx;
}

/** Convenience hooks for permission-gating UI. */
export function useCanView(module: Module): boolean {
  return canView(useSession().role, module);
}
export function useCanWrite(module: Module): boolean {
  return canWrite(useSession().role, module);
}
