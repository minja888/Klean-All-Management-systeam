// POST /api/auth/logout — clear the session cookie.
import { handle, ok } from "@/lib/api";
import { clearSessionCookie } from "@/lib/auth";

export const POST = handle(async () => {
  await clearSessionCookie();
  return ok({ signedOut: true });
});
