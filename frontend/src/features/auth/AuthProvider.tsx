"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { getMe, logout as logoutApi, type AuthUser } from "@/lib/auth";
import { STORAGE_KEYS } from "@/lib/constants";
import { decodeJwtPayload } from "@/lib/jwt-client";

export type AuthContextValue = {
  user: AuthUser | null;
  loading: boolean;
  isAuthenticated: boolean;
  jwtPreview: { sub?: string; role?: string } | null;
  refreshUser: () => Promise<void>;
  logout: () => Promise<void>;
  setSessionFromStorage: () => Promise<void>;
};

const AuthContext = React.createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = React.useState<AuthUser | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [jwtPreview, setJwtPreview] = React.useState<{ sub?: string; role?: string } | null>(null);

  const syncJwtPreview = React.useCallback(() => {
    if (typeof window === "undefined") return;
    const t = localStorage.getItem(STORAGE_KEYS.accessToken);
    if (!t) {
      setJwtPreview(null);
      return;
    }
    const p = decodeJwtPayload(t);
    setJwtPreview(p ? { sub: p.sub, role: p.role } : null);
  }, []);

  const refreshUser = React.useCallback(async () => {
  if (typeof window === "undefined") return;

  try {
    const { user: u } = await getMe();
    setUser(u);
  } catch {
    setUser(null);
  } finally {
    setLoading(false);
  }
}, []);

  const setSessionFromStorage = React.useCallback(async () => {
    await refreshUser();
  }, [refreshUser]);

  React.useEffect(() => {
    void refreshUser();
  }, [refreshUser]);

  const logout = React.useCallback(async () => {
    await logoutApi();
    setUser(null);
    setJwtPreview(null);
    router.push("/login");
    router.refresh();
  }, [router]);

  const value = React.useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      isAuthenticated: !loading && !!user,
      jwtPreview,
      refreshUser,
      logout,
      setSessionFromStorage,
    }),
    [user, loading, jwtPreview, refreshUser, logout, setSessionFromStorage]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = React.useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
