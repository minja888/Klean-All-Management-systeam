// ---------------------------------------------------------------------------
// API helpers — a single, consistent JSON envelope: { ok, data, error }
// ---------------------------------------------------------------------------
// Every route handler returns the same shape so the frontend can treat all
// responses identically. `handle()` wraps a handler and turns thrown errors
// (our ApiError, Zod validation errors, or anything unexpected) into a clean
// JSON response with the right HTTP status.
// ---------------------------------------------------------------------------

import { NextResponse } from "next/server";
import { ZodError } from "zod";

/** A predictable error we throw on purpose (auth, permission, not-found, …). */
export class ApiError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export const Unauthorized = (msg = "Not signed in") => new ApiError(msg, 401);
export const Forbidden = (msg = "You do not have access") => new ApiError(msg, 403);
export const NotFound = (msg = "Not found") => new ApiError(msg, 404);
export const BadRequest = (msg = "Invalid request") => new ApiError(msg, 400);

/** Success envelope. */
export function ok<T>(data: T, status = 200) {
  return NextResponse.json({ ok: true, data, error: null }, { status });
}

/** Error envelope. */
export function fail(error: string, status = 400) {
  return NextResponse.json({ ok: false, data: null, error }, { status });
}

/**
 * Wrap an async route handler so we never leak raw exceptions.
 * Usage:  export const GET = handle(async (req) => { ... return ok(data) })
 */
export function handle(
  fn: (req: Request, ctx: { params: Promise<Record<string, string>> }) => Promise<NextResponse>,
) {
  return async (req: Request, ctx: { params: Promise<Record<string, string>> }) => {
    try {
      return await fn(req, ctx);
    } catch (err) {
      if (err instanceof ApiError) {
        return fail(err.message, err.status);
      }
      if (err instanceof ZodError) {
        // Surface the first validation problem in a readable way.
        const first = err.issues[0];
        const path = first?.path?.join(".");
        return fail(path ? `${path}: ${first.message}` : first.message, 422);
      }
      console.error("Unhandled API error:", err);
      return fail("Something went wrong. Please try again.", 500);
    }
  };
}
