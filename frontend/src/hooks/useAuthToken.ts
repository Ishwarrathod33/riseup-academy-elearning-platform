"use client";

import * as React from "react";
import { STORAGE_KEYS } from "@/lib/constants";

/** Client-only: read JWT from localStorage (same key as `apiFetch`). */
export function useAuthToken(): string | null {
  const [token, setToken] = React.useState<string | null>(null);

  React.useEffect(() => {
    setToken(localStorage.getItem(STORAGE_KEYS.accessToken));
  }, []);

  return token;
}
