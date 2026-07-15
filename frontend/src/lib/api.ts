/**
 * Empty string = same origin (`/api/...` on the Next dev server), which uses `rewrites` in `next.config.mjs`
 * to reach the backend — avoids CORS and many "Failed to fetch" cases.
 * Set `NEXT_PUBLIC_API_BASE_URL=http://localhost:8080` only if you need to call the API directly.
 */
import { STORAGE_KEYS } from "./constants";
export const API_BASE_URL = (process.env.NEXT_PUBLIC_API_BASE_URL ?? "").replace(/\/$/, "");

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly body: unknown = null
  ) {
    super(message);
    this.name = "ApiError";
  }

  get isUnauthorized() {
    return this.status === 401;
  }
}

async function tryRefreshSession(): Promise<boolean> {
  const refreshUrl = `${API_BASE_URL}/api/auth/refresh`;
  try {
    const res = await fetch(refreshUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
      credentials: "include",
    });
    return res.ok;
  } catch {
    return false;
  }
}

/** Best-effort message from backend zod `flatten()` shape. */
function messageFromZodFlatten(error: unknown): string | null {
  if (!error || typeof error !== "object") return null;
  const e = error as { formErrors?: unknown; fieldErrors?: Record<string, unknown> };
  const parts: string[] = [];
  if (Array.isArray(e.formErrors)) {
    for (const x of e.formErrors) {
      if (typeof x === "string" && x.trim()) parts.push(x.trim());
    }
  }
  if (e.fieldErrors && typeof e.fieldErrors === "object") {
    for (const msgs of Object.values(e.fieldErrors)) {
      if (Array.isArray(msgs)) {
        for (const m of msgs) {
          if (typeof m === "string" && m.trim()) parts.push(m.trim());
        }
      }
    }
  }
  return parts.length ? parts.join(" ") : null;
}

export function getErrorMessage(e: unknown, fallback = "Something went wrong. Please try again.") {
  if (e instanceof ApiError) return e.message;
  if (e instanceof Error) return e.message;
  return fallback;
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit & { auth?: boolean; json?: unknown } = {}
): Promise<T> {
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> | undefined),
  };

  const auth = options.auth ?? true;

if (auth && typeof window !== "undefined") {
  const token = localStorage.getItem(STORAGE_KEYS.accessToken);

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
}

  if (options.json !== undefined) {
    headers["Content-Type"] = "application/json";
    options.body = JSON.stringify(options.json);
  }

  const url = `${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;

  const requestInit: RequestInit = {
    ...options,
    headers,
    credentials: "include",
  };

  let res: Response;
  try {
    res = await fetch(url, requestInit);
  } catch (e: unknown) {
    const isNetwork =
      e instanceof TypeError ||
      (e instanceof Error && (e.message.includes("fetch") || e.message.includes("Failed to fetch")));
    if (isNetwork) {
      throw new ApiError(
        API_BASE_URL
          ? `Cannot reach API at ${API_BASE_URL}. Start the backend (cd backend && npm run dev) and check the URL.`
          : "Cannot reach the API. Start the backend on port 8080 (cd backend && npm run dev), then refresh this page.",
        0,
        e
      );
    }
    throw e;
  }

  const text = await res.text();
  let data: unknown = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { raw: text };
  }

  
  const canAutoRefresh = auth && !path.startsWith("/api/auth/refresh");
  if (res.status === 401 && canAutoRefresh) {
    const refreshed = await tryRefreshSession();
    if (refreshed) {
      const retryRes = await fetch(url, requestInit);
      const retryText = await retryRes.text();
      let retryData: unknown = null;
      try {
        retryData = retryText ? JSON.parse(retryText) : null;
      } catch {
        retryData = { raw: retryText };
      }

      if (!retryRes.ok) {
        const rawErr =
          retryData && typeof retryData === "object" && retryData !== null && "error" in retryData
            ? (retryData as { error: unknown }).error
            : undefined;
        const fromZod = typeof rawErr === "object" && rawErr !== null ? messageFromZodFlatten(rawErr) : null;
        const msg =
          (typeof rawErr === "string" ? rawErr : null) ??
          fromZod ??
          (retryData &&
          typeof retryData === "object" &&
          retryData !== null &&
          "message" in retryData &&
          typeof (retryData as { message: unknown }).message === "string"
            ? (retryData as { message: string }).message
            : null) ??
          `Request failed (${retryRes.status})`;
        throw new ApiError(msg, retryRes.status, retryData);
      }

      return retryData as T;
    }
  }

  if (!res.ok) {
    const rawErr =
      data && typeof data === "object" && data !== null && "error" in data
        ? (data as { error: unknown }).error
        : undefined;
    const fromZod = typeof rawErr === "object" && rawErr !== null ? messageFromZodFlatten(rawErr) : null;
    const msg =
      (typeof rawErr === "string" ? rawErr : null) ??
      fromZod ??
      (data && typeof data === "object" && data !== null && "message" in data && typeof (data as { message: unknown }).message === "string"
        ? (data as { message: string }).message
        : null) ??
      `Request failed (${res.status})`;
    throw new ApiError(msg, res.status, data);
  }

  return data as T;
}
