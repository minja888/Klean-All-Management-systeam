// Server-only helper: read the active language from the "lang" cookie.
import "server-only";
import { cookies } from "next/headers";
import type { Lang } from "@/lib/i18n";

export async function getServerLang(): Promise<Lang> {
  const store = await cookies();
  const value = store.get("lang")?.value;
  return value === "sw" ? "sw" : "en";
}
