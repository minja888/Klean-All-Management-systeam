// ---------------------------------------------------------------------------
// Middleware — protects every page/route behind a valid session
// ---------------------------------------------------------------------------
// Runs in the Edge runtime on each request. It only checks that a valid JWT
// cookie exists; fine-grained RBAC (who can do what) is enforced inside each
// API route and page using lib/rbac.ts.
// ---------------------------------------------------------------------------

import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/session";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Public auth APIs: login, self-registration, role list, forgot-password.
  if (
    pathname === "/api/auth/login" ||
    pathname === "/api/auth/register" ||
    pathname === "/api/auth/role-users" ||
    pathname === "/api/auth/forgot-password"
  ) {
    return NextResponse.next();
  }

  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const session = token ? await verifySessionToken(token) : null;

  // Already signed in and visiting /login -> send to the dashboard.
  if (pathname === "/login") {
    if (session) return NextResponse.redirect(new URL("/dashboard", req.url));
    return NextResponse.next();
  }

  // Everything else requires a session.
  if (!session) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ ok: false, data: null, error: "Not signed in" }, { status: 401 });
    }
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  // Run on all paths except Next internals and static assets.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
};
