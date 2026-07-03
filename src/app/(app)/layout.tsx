// Authenticated layout — guards every page inside the (app) group.
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AppShell } from "@/components/app-shell";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/login");

  // Company name drives the sidebar header (falls back if unset / DB unreachable).
  let companyName = "Klean All";
  try {
    const setting = await prisma.appSetting.findUnique({ where: { key: "companyName" } });
    if (setting?.value) companyName = setting.value;
  } catch {
    // ignore — show the default until settings/DB are available
  }

  return (
    <AppShell
      user={{ name: session.name, email: session.email, role: session.role }}
      companyName={companyName}
    >
      {children}
    </AppShell>
  );
}
