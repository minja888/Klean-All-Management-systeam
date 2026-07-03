// ---------------------------------------------------------------------------
// Client-side fetch helper — unwraps the { ok, data, error } envelope
// ---------------------------------------------------------------------------
// Throws on failure so callers can use try/catch. Always sends/expects JSON.
// ---------------------------------------------------------------------------

export interface ApiEnvelope<T> {
  ok: boolean;
  data: T | null;
  error: string | null;
}

export async function apiFetch<T>(url: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json", ...(options.headers ?? {}) },
    ...options,
  });

  let body: ApiEnvelope<T>;
  try {
    body = (await res.json()) as ApiEnvelope<T>;
  } catch {
    throw new Error(`Unexpected server response (${res.status}).`);
  }

  if (!res.ok || !body.ok) {
    throw new Error(body.error ?? `Request failed (${res.status}).`);
  }
  return body.data as T;
}

export const api = {
  get: <T>(url: string) => apiFetch<T>(url),
  post: <T>(url: string, data: unknown) => apiFetch<T>(url, { method: "POST", body: JSON.stringify(data) }),
  put: <T>(url: string, data: unknown) => apiFetch<T>(url, { method: "PUT", body: JSON.stringify(data) }),
  del: <T>(url: string) => apiFetch<T>(url, { method: "DELETE" }),
};
