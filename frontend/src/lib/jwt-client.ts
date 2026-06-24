/** Client-side JWT payload decode (display only — not verified). */
export function decodeJwtPayload(token: string): { sub?: string; role?: string; exp?: number } | null {
  try {
    const part = token.split(".")[1];
    if (!part) return null;
    const json = atob(part.replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(json) as { sub?: string; role?: string; exp?: number };
  } catch {
    return null;
  }
}
