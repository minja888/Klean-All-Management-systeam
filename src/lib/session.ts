// ---------------------------------------------------------------------------
// Session tokens — EDGE-SAFE (jose only, no Node APIs)
// ---------------------------------------------------------------------------
// This file is imported by BOTH the Node route handlers and the Edge
// middleware, so it must not import bcryptjs or next/headers.
// ---------------------------------------------------------------------------

import { SignJWT, jwtVerify } from "jose";
import type { Role } from "@/generated/prisma/enums";

export const SESSION_COOKIE = "klean_session";
export const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days

/** The compact user identity we keep inside the JWT. */
export interface SessionUser {
  sub: string; // user id
  email: string;
  name: string;
  role: Role;
  departmentId: string | null;
}

function getSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET is not set. Add it to your .env file.");
  return new TextEncoder().encode(secret);
}

export async function signSession(user: SessionUser): Promise<string> {
  return new SignJWT({
    email: user.email,
    name: user.name,
    role: user.role,
    departmentId: user.departmentId,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user.sub)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_TTL_SECONDS}s`)
    .sign(getSecret());
}

/** Verify a raw token string. Returns the session user or null if invalid/expired. */
export async function verifySessionToken(token: string): Promise<SessionUser | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    return {
      sub: String(payload.sub),
      email: String(payload.email ?? ""),
      name: String(payload.name ?? ""),
      role: payload.role as Role,
      departmentId: (payload.departmentId as string | null) ?? null,
    };
  } catch {
    return null;
  }
}
