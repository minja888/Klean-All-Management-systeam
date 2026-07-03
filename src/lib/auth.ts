// ---------------------------------------------------------------------------
// Authentication (Node runtime) — passwords + session cookie helpers
// ---------------------------------------------------------------------------
// JWT signing/verifying lives in the edge-safe lib/session.ts. This file adds
// bcrypt password hashing and the httpOnly cookie read/write helpers that use
// next/headers (server components & route handlers only).
// ---------------------------------------------------------------------------

import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import {
  SESSION_COOKIE,
  SESSION_TTL_SECONDS,
  signSession,
  verifySessionToken,
  type SessionUser,
} from "@/lib/session";

export { SESSION_COOKIE, signSession, verifySessionToken };
export type { SessionUser };

// --- Passwords ----------------------------------------------------------------

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 10);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

// --- Cookie helpers -----------------------------------------------------------

/** Read + verify the current session from the cookie (or null). */
export async function getSession(): Promise<SessionUser | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

export async function setSessionCookie(token: string): Promise<void> {
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
}

export async function clearSessionCookie(): Promise<void> {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}
